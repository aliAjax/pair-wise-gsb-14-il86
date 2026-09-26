<script setup lang="ts">
import { computed, ref } from "vue";
import { STATIONS } from "./data/basics";
import { fmtMoney } from "./domain/format";
import { round2 } from "./domain/pricing";
import { setStation, state } from "./storage/store";
import CouponsPage from "./pages/CouponsPage.vue";
import PricePage from "./pages/PricePage.vue";
import RedeemPage from "./pages/RedeemPage.vue";

const project = {
  industry: "石油",
  title: "企业券包核销台",
  subtitle:
    "企业券登记、冲突待审、入场按当时挂牌价与每升优惠预占、结算生成核销记录;调价不追溯已入场车辆,同一券码重复提交只保留首次。",
  stack: ["Vue3", "Vite", "TypeScript", "Pinia", "Naive UI"],
};

const tabs = [
  { key: "redeem", label: "核销台", component: RedeemPage },
  { key: "coupons", label: "券包管理", component: CouponsPage },
  { key: "price", label: "价格维护", component: PricePage },
] as const;

const active = ref<(typeof tabs)[number]["key"]>("redeem");
const activePage = computed(() => tabs.find((t) => t.key === active.value)?.component ?? RedeemPage);

const metrics = computed(() => {
  const received = round2(state.redemptions.reduce((sum, r) => sum + r.received, 0));
  const grossProfit = round2(state.redemptions.reduce((sum, r) => sum + r.grossProfit, 0));
  return [
    { label: "生效中券", value: state.coupons.filter((c) => c.status === "生效中").length, compact: false },
    { label: "待审券", value: state.coupons.filter((c) => c.status === "待审").length, compact: false },
    { label: "预占中车辆", value: state.entries.length, compact: false },
    { label: "累计实收 / 毛利", value: `¥${fmtMoney(received)} / ¥${fmtMoney(grossProfit)}`, compact: true },
  ];
});

function onStationChange(event: Event) {
  setStation((event.target as HTMLSelectElement).value);
}
</script>

<template>
  <main class="app">
    <div class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">{{ project.industry }}行业前端最小闭环</p>
          <h1>{{ project.title }}</h1>
          <p class="subtitle">{{ project.subtitle }}</p>
        </div>
        <div class="topbar-side">
          <label class="station-switch">
            当前站点
            <select :value="state.station" @change="onStationChange">
              <option v-for="name in STATIONS" :key="name">{{ name }}</option>
            </select>
          </label>
          <div class="stack">
            <span v-for="item in project.stack" :key="item" class="tag">{{ item }}</span>
          </div>
        </div>
      </header>

      <section class="metrics">
        <article v-for="m in metrics" :key="m.label" class="metric">
          <span>{{ m.label }}</span>
          <strong :class="{ compact: m.compact }">{{ m.value }}</strong>
        </article>
      </section>

      <nav class="tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          :class="{ active: active === t.key }"
          @click="active = t.key"
        >
          {{ t.label }}
        </button>
      </nav>

      <keep-alive>
        <component :is="activePage" />
      </keep-alive>
    </div>
  </main>
</template>
