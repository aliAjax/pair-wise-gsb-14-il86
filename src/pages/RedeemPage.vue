<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { EntryOrder } from "../data/types";
import { fmtMoney, fmtTime } from "../domain/format";
import { round2 } from "../domain/pricing";
import { enter, settle, state } from "../storage/store";

const form = reactive({ code: "", plate: "" });
const litersMap = reactive<Record<string, number>>({});
const entryMessage = ref<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
const settleMessage = ref<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);

const totals = computed(() => ({
  count: state.redemptions.length,
  received: round2(state.redemptions.reduce((sum, r) => sum + r.received, 0)),
  grossProfit: round2(state.redemptions.reduce((sum, r) => sum + r.grossProfit, 0)),
}));

const unitPrice = (entry: EntryOrder) => round2(entry.listPrice - entry.discountPerLiter);

function submitEntry() {
  const result = enter(form.code, form.plate);
  entryMessage.value = { tone: result.tone, text: result.message };
  if (result.ok) {
    form.code = "";
    form.plate = "";
  }
}

function submitSettle(entryId: string) {
  const result = settle(entryId, Number(litersMap[entryId]));
  settleMessage.value = { tone: result.tone, text: result.message };
  if (result.ok) delete litersMap[entryId];
}
</script>

<template>
  <section class="workspace">
    <form class="panel" @submit.prevent="submitEntry">
      <h2>入场预占</h2>
      <div class="form-grid">
        <p class="hint">
          当前站点:<strong>{{ state.station }}</strong>(页面顶部可切换)。按入场时的挂牌价与券优惠预占,之后调价不追溯。
        </p>
        <label>
          券码
          <input v-model="form.code" placeholder="扫描或输入券码,如 QY-2026-0901" required />
        </label>
        <label>
          车牌号
          <input v-model="form.plate" placeholder="如 鲁B12345" required />
        </label>
        <button type="submit">入场预占</button>
        <p v-if="entryMessage" class="message" :class="entryMessage.tone">{{ entryMessage.text }}</p>
      </div>
    </form>

    <section class="list-panel">
      <div class="toolbar">
        <h2>待结算车辆({{ state.entries.length }})</h2>
      </div>
      <p v-if="settleMessage" class="message" :class="settleMessage.tone">{{ settleMessage.text }}</p>
      <div class="record-grid">
        <div v-if="state.entries.length === 0" class="empty">暂无预占车辆</div>
        <article v-for="entry in state.entries" :key="entry.id" class="record">
          <div class="record-head">
            <p class="record-title">{{ entry.plate }} / {{ entry.enterprise }}</p>
            <span class="status">待结算</span>
          </div>
          <div class="details">
            <span>券码: {{ entry.couponCode }}</span>
            <span>油品: {{ entry.fuel }}</span>
            <span>预占挂牌价: ¥{{ fmtMoney(entry.listPrice) }}/升</span>
            <span>每升优惠: ¥{{ fmtMoney(entry.discountPerLiter) }}</span>
            <span>预占单价: ¥{{ fmtMoney(unitPrice(entry)) }}/升</span>
            <span>入场时间: {{ fmtTime(entry.enteredAt) }}</span>
          </div>
          <div class="settle-row">
            <input v-model.number="litersMap[entry.id]" type="number" min="0.01" step="0.01" placeholder="加油升数" />
            <button type="button" @click="submitSettle(entry.id)">结算核销</button>
          </div>
        </article>
      </div>
    </section>
  </section>

  <section class="list-panel redemption-panel">
    <div class="toolbar">
      <h2>核销记录</h2>
      <span class="hint">
        共 {{ totals.count }} 笔 · 实收 ¥{{ fmtMoney(totals.received) }} · 毛利 ¥{{ fmtMoney(totals.grossProfit) }}
      </span>
    </div>
    <div class="record-grid">
      <div v-if="state.redemptions.length === 0" class="empty">暂无核销记录</div>
      <article v-for="r in state.redemptions" :key="r.id" class="record">
        <div class="record-head">
          <p class="record-title">{{ r.couponCode }} / {{ r.enterprise }}</p>
          <span class="status redeemed">已核销</span>
        </div>
        <div class="details">
          <span>油品: {{ r.fuel }}</span>
          <span>升数: {{ r.liters }} 升</span>
          <span>结算挂牌价: ¥{{ fmtMoney(r.listPrice) }}/升</span>
          <span>每升优惠: ¥{{ fmtMoney(r.discountPerLiter) }}</span>
          <span>优惠总额: ¥{{ fmtMoney(r.discountTotal) }}</span>
          <span>实收: ¥{{ fmtMoney(r.received) }}</span>
          <span>成本价: ¥{{ fmtMoney(r.costPrice) }}/升</span>
          <span>门店毛利: ¥{{ fmtMoney(r.grossProfit) }}</span>
          <span>车牌: {{ r.plate }}</span>
          <span>站点: {{ r.station }}</span>
          <span>批次: {{ r.batch }}</span>
          <span>结算时间: {{ fmtTime(r.settledAt) }}</span>
        </div>
      </article>
    </div>
  </section>
</template>
