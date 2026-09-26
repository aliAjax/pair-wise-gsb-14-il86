<script setup lang="ts">
import { computed, ref } from "vue";
import { FUELS, STATIONS, seedCoupons, seedPrices } from "./data/seed";
import { PRICE_STATUSES } from "./data/types";
import type { Coupon, Entry, PriceRecord, Redemption } from "./data/types";
import { currentPrice } from "./domain/pricing";
import { judgeEntry, registerCoupon } from "./domain/coupons";
import type { CouponDraft } from "./domain/coupons";
import { quoteEntry, settleEntry } from "./domain/settlement";
import { STORAGE_KEYS, loadCollection, saveCollection } from "./storage/local";
import PricePanel from "./components/PricePanel.vue";
import CouponPanel from "./components/CouponPanel.vue";
import EntryPanel from "./components/EntryPanel.vue";
import RedemptionPanel from "./components/RedemptionPanel.vue";

type Feedback = { kind: "ok" | "error"; text: string } | null;

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

// 本机保存的四类资料
const prices = ref<PriceRecord[]>(loadCollection(STORAGE_KEYS.prices, seedPrices));
const coupons = ref<Coupon[]>(loadCollection(STORAGE_KEYS.coupons, seedCoupons));
const entries = ref<Entry[]>(loadCollection(STORAGE_KEYS.entries, () => []));
const redemptions = ref<Redemption[]>(loadCollection(STORAGE_KEYS.redemptions, () => []));

const couponFeedback = ref<Feedback>(null);
const entryFeedback = ref<Feedback>(null);

const persistPrices = () => saveCollection(STORAGE_KEYS.prices, prices.value);
const persistCoupons = () => saveCollection(STORAGE_KEYS.coupons, coupons.value);
const persistEntries = () => saveCollection(STORAGE_KEYS.entries, entries.value);
const persistRedemptions = () => saveCollection(STORAGE_KEYS.redemptions, redemptions.value);

const currentPrices = computed(() =>
  FUELS.map((fuel) => ({ fuel, price: currentPrice(prices.value, fuel, today()) }))
);

const activeEntries = computed(() => entries.value.filter((entry) => entry.status === "已入场"));

const metrics = computed(() => [
  coupons.value.filter((coupon) => coupon.status === "生效中").length,
  coupons.value.filter((coupon) => coupon.status === "待审").length,
  activeEntries.value.length,
  redemptions.value.reduce((sum, record) => sum + record.netAmount, 0).toFixed(2)
]);

// 价格维护
function addPrice(draft: { fuel: string; price: number; operator: string; effectiveDate: string; notes: string }) {
  prices.value = [
    { ...draft, id: crypto.randomUUID(), status: "生效中", createdAt: now() },
    ...prices.value
  ];
  persistPrices();
}

function flowPrice(id: string) {
  const record = prices.value.find((item) => item.id === id);
  if (!record) return;
  const index = PRICE_STATUSES.indexOf(record.status);
  record.status = PRICE_STATUSES[(index + 1) % PRICE_STATUSES.length];
  persistPrices();
}

function removePrice(id: string) {
  prices.value = prices.value.filter((item) => item.id !== id);
  persistPrices();
}

// 券包登记：重复券码只保留首次，冲突留在待审
function onRegisterCoupon(draft: CouponDraft) {
  const result = registerCoupon(coupons.value, draft, now());
  if (!result.ok) {
    couponFeedback.value = { kind: "error", text: result.reason };
    return;
  }
  coupons.value = [result.coupon, ...coupons.value];
  persistCoupons();
  couponFeedback.value = result.coupon.status === "待审"
    ? { kind: "error", text: `已登记但留在待审：${result.coupon.conflictNote}` }
    : { kind: "ok", text: `券 ${result.coupon.code} 登记成功，已生效` };
}

function approveCoupon(id: string) {
  const coupon = coupons.value.find((item) => item.id === id);
  if (!coupon) return;
  coupon.status = "生效中";
  persistCoupons();
}

function voidCoupon(id: string) {
  const coupon = coupons.value.find((item) => item.id === id);
  if (!coupon) return;
  coupon.status = "已作废";
  persistCoupons();
}

// 入场预占：按当时挂牌价与优惠锁价
function onEnter(draft: { code: string; plate: string; station: string }) {
  const coupon = coupons.value.find((item) => item.code === draft.code);
  const judgment = judgeEntry(coupon, draft.code, draft.station, today(), entries.value, redemptions.value);
  if (!judgment.ok) {
    entryFeedback.value = { kind: "error", text: judgment.reason };
    return;
  }
  const price = currentPrice(prices.value, coupon!.fuel, today());
  if (price === null) {
    entryFeedback.value = { kind: "error", text: `油品 ${coupon!.fuel} 暂无挂牌价，请先维护价格` };
    return;
  }
  const entry = quoteEntry(coupon!, price, draft.plate, draft.station, now());
  entries.value = [entry, ...entries.value];
  persistEntries();
  entryFeedback.value = {
    kind: "ok",
    text: `${draft.plate} 已入场：锁定挂牌价 ${price.toFixed(2)} 元/升，每升优惠 ${entry.lockedDiscount.toFixed(2)} 元`
  };
}

// 结算：用预占快照生成核销记录，调价不追溯
function onSettle(entryId: string, liters: number) {
  const entry = entries.value.find((item) => item.id === entryId);
  if (!entry || entry.status !== "已入场") return;
  const redemption = settleEntry(entry, liters, now());
  entry.status = "已结算";
  redemptions.value = [redemption, ...redemptions.value];
  persistEntries();
  persistRedemptions();
  entryFeedback.value = {
    kind: "ok",
    text: `${entry.plate} 已结算：${liters} 升，门店实收 ${redemption.netAmount.toFixed(2)} 元`
  };
}
</script>

<template>
  <main class="app">
    <div class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">石油行业前端最小闭环</p>
          <h1>企业券包核销台</h1>
          <p class="subtitle">
            维护挂牌价、登记企业券包（企业 / 油品 / 每升优惠 / 适用站点 / 批次 / 有效时段），
            同企业同油品时段重叠自动留待审；入场按当时价格预占，结算生成核销记录，调价不追溯。
          </p>
        </div>
        <div class="stack">
          <span class="tag">Vue3</span>
          <span class="tag">Vite</span>
          <span class="tag">TypeScript</span>
        </div>
      </header>

      <section class="metrics">
        <article class="metric">
          <span>生效券</span>
          <strong>{{ metrics[0] }}</strong>
        </article>
        <article class="metric">
          <span>待审券</span>
          <strong>{{ metrics[1] }}</strong>
        </article>
        <article class="metric">
          <span>在场车辆</span>
          <strong>{{ metrics[2] }}</strong>
        </article>
        <article class="metric">
          <span>累计实收（元）</span>
          <strong>{{ metrics[3] }}</strong>
        </article>
      </section>

      <section class="workspace">
        <PricePanel
          :records="prices"
          :fuels="FUELS"
          :current-prices="currentPrices"
          @add="addPrice"
          @flow="flowPrice"
          @remove="removePrice"
        />
        <CouponPanel
          :coupons="coupons"
          :fuels="FUELS"
          :stations="STATIONS"
          :feedback="couponFeedback"
          @register="onRegisterCoupon"
          @approve="approveCoupon"
          @void="voidCoupon"
        />
      </section>

      <section class="workspace lower">
        <EntryPanel
          :active-entries="activeEntries"
          :stations="STATIONS"
          :feedback="entryFeedback"
          @enter="onEnter"
          @settle="onSettle"
        />
        <RedemptionPanel :redemptions="redemptions" />
      </section>
    </div>
  </main>
</template>
