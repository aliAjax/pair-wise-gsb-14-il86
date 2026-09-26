<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { FUELS, PRICE_STATUSES } from "../data/basics";
import { fmtMoney } from "../domain/format";
import { priceAt, toDateStr } from "../domain/pricing";
import { addPrice, flowPrice, removePrice, state } from "../storage/store";

const filters = ["全部油品", ...FUELS];
const filter = ref<string>(filters[0]);

const blank = () => ({ fuel: "", listPrice: 0, costPrice: 0, operator: "", effectiveDate: "", notes: "" });
const form = reactive(blank());

const filtered = computed(() =>
  filter.value === "全部油品" ? state.prices : state.prices.filter((p) => p.fuel === filter.value)
);

/** 各油品当前生效挂牌价,方便柜台核对 */
const currentPrices = computed(() => {
  const today = toDateStr(new Date());
  return FUELS.map((fuel) => ({ fuel, price: priceAt(state.prices, fuel, today) }));
});

const chartRows = computed(() =>
  PRICE_STATUSES.map((status) => ({
    status,
    value: state.prices.filter((p) => p.status === status).length,
  }))
);
const maxChart = computed(() => Math.max(1, ...chartRows.value.map((row) => row.value)));

const statusClass: Record<string, string> = { 生效中: "", 待确认: "pending", 已回退: "void" };

function submit() {
  addPrice({ ...form });
  Object.assign(form, blank());
}
</script>

<template>
  <section class="workspace">
    <form class="panel" @submit.prevent="submit">
      <h2>调整油品价格</h2>
      <div class="form-grid">
        <label>
          油品
          <select v-model="form.fuel" required>
            <option value="">请选择</option>
            <option v-for="fuel in FUELS" :key="fuel">{{ fuel }}</option>
          </select>
        </label>
        <label>
          挂牌价(元/升)
          <input v-model.number="form.listPrice" type="number" min="0.01" step="0.01" required />
        </label>
        <label>
          成本价(元/升)
          <input v-model.number="form.costPrice" type="number" min="0" step="0.01" required />
        </label>
        <label>
          操作员
          <input v-model="form.operator" required />
        </label>
        <label>
          生效日期
          <input v-model="form.effectiveDate" type="date" required />
        </label>
        <label>
          备注
          <textarea v-model="form.notes" placeholder="填写调价说明" />
        </label>
        <button type="submit">保存价格</button>
        <p class="hint">已入场车辆按入场时的快照价结算,调价不追溯。</p>
      </div>
    </form>

    <section class="list-panel">
      <div class="toolbar">
        <h2>价格台账</h2>
        <select v-model="filter">
          <option v-for="item in filters" :key="item">{{ item }}</option>
        </select>
      </div>

      <div class="chips">
        <span v-for="item in currentPrices" :key="item.fuel" class="chip">
          {{ item.fuel }} ¥{{ item.price ? fmtMoney(item.price.listPrice) : "--" }}/升
        </span>
      </div>

      <div class="record-grid">
        <div v-if="filtered.length === 0" class="empty">暂无匹配数据</div>
        <article v-for="record in filtered" :key="record.id" class="record">
          <div class="record-head">
            <p class="record-title">{{ record.fuel }} / ¥{{ fmtMoney(record.listPrice) }}</p>
            <span class="status" :class="statusClass[record.status]">{{ record.status }}</span>
          </div>
          <div class="details">
            <span>成本价: ¥{{ fmtMoney(record.costPrice) }}/升</span>
            <span>操作员: {{ record.operator }}</span>
            <span>生效日期: {{ record.effectiveDate }}</span>
          </div>
          <p class="note">{{ record.notes }}</p>
          <div class="actions">
            <button type="button" @click="flowPrice(record.id)">流转状态</button>
            <button class="danger" type="button" @click="removePrice(record.id)">删除</button>
          </div>
        </article>
      </div>

      <div class="mini-chart">
        <div v-for="row in chartRows" :key="row.status" class="bar">
          <span>{{ row.status }}</span>
          <div class="bar-track"><div class="bar-fill" :style="{ width: `${(row.value / maxChart) * 100}%` }" /></div>
          <strong>{{ row.value }}</strong>
        </div>
      </div>
    </section>
  </section>
</template>
