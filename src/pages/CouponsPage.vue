<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ALL_STATIONS, FUELS, STATIONS } from "../data/basics";
import type { Coupon } from "../data/types";
import { fmtMoney, fmtTime } from "../domain/format";
import { toDateStr } from "../domain/pricing";
import { registerCoupon, reviewCoupon, state, voidCoupon } from "../storage/store";

const stationOptions = [ALL_STATIONS, ...STATIONS];
const statusFilters = ["全部状态", "生效中", "待审", "已核销", "已作废", "已过期"];
const filter = ref(statusFilters[0]);
const message = ref<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);

const blank = () => ({
  code: "",
  enterprise: "",
  fuel: "",
  discountPerLiter: 0.5,
  stations: [] as string[],
  batch: "",
  validFrom: "",
  validTo: "",
});
const form = reactive(blank());

const today = toDateStr(new Date());
const isExpired = (c: Coupon) => c.status === "生效中" && c.validTo < today;

const filtered = computed(() => {
  if (filter.value === "全部状态") return state.coupons;
  if (filter.value === "已过期") return state.coupons.filter(isExpired);
  return state.coupons.filter((c) => c.status === filter.value);
});

const statusClass: Record<string, string> = {
  生效中: "",
  待审: "pending",
  已作废: "void",
  已核销: "redeemed",
};

function toggleStation(name: string) {
  if (name === ALL_STATIONS) {
    form.stations = form.stations.includes(ALL_STATIONS) ? [] : [ALL_STATIONS];
    return;
  }
  const rest = form.stations.filter((s) => s !== ALL_STATIONS);
  form.stations = rest.includes(name) ? rest.filter((s) => s !== name) : [...rest, name];
}

function submit() {
  const result = registerCoupon({ ...form, stations: [...form.stations] });
  message.value = { tone: result.tone, text: result.message };
  if (result.ok) Object.assign(form, blank());
}

function review(id: string, approve: boolean) {
  const result = reviewCoupon(id, approve);
  message.value = { tone: result.tone, text: result.message };
}
</script>

<template>
  <section class="workspace">
    <form class="panel" @submit.prevent="submit">
      <h2>登记企业券</h2>
      <div class="form-grid">
        <label>
          券码
          <input v-model="form.code" placeholder="如 QY-2026-1001" required />
        </label>
        <label>
          企业
          <input v-model="form.enterprise" placeholder="如 顺达物流" required />
        </label>
        <label>
          油品
          <select v-model="form.fuel" required>
            <option value="">请选择</option>
            <option v-for="fuel in FUELS" :key="fuel">{{ fuel }}</option>
          </select>
        </label>
        <label>
          每升优惠(元/升)
          <input v-model.number="form.discountPerLiter" type="number" min="0.01" step="0.01" required />
        </label>
        <div class="check-group">
          <span class="check-label">适用站点</span>
          <div class="check-row">
            <label v-for="name in stationOptions" :key="name">
              <input type="checkbox" :checked="form.stations.includes(name)" @change="toggleStation(name)" />
              {{ name }}
            </label>
          </div>
        </div>
        <label>
          发放批次
          <input v-model="form.batch" placeholder="如 2026-10-A" required />
        </label>
        <label>
          有效期起
          <input v-model="form.validFrom" type="date" required />
        </label>
        <label>
          有效期止
          <input v-model="form.validTo" type="date" required />
        </label>
        <button type="submit">登记券</button>
        <p class="hint">同企业同油品且有效时段重叠的券会留在待审并指出冲突;同一券码重复提交只保留首次。</p>
        <p v-if="message" class="message" :class="message.tone">{{ message.text }}</p>
      </div>
    </form>

    <section class="list-panel">
      <div class="toolbar">
        <h2>券包列表({{ filtered.length }})</h2>
        <select v-model="filter">
          <option v-for="item in statusFilters" :key="item">{{ item }}</option>
        </select>
      </div>
      <div class="record-grid">
        <div v-if="filtered.length === 0" class="empty">暂无匹配数据</div>
        <article v-for="c in filtered" :key="c.id" class="record">
          <div class="record-head">
            <p class="record-title">{{ c.code }} / {{ c.enterprise }}</p>
            <div class="badges">
              <span class="status" :class="statusClass[c.status]">{{ c.status }}</span>
              <span v-if="isExpired(c)" class="status expired">已过期</span>
            </div>
          </div>
          <div class="details">
            <span>油品: {{ c.fuel }}</span>
            <span>每升优惠: ¥{{ fmtMoney(c.discountPerLiter) }}</span>
            <span>适用站点: {{ c.stations.join("、") }}</span>
            <span>发放批次: {{ c.batch }}</span>
            <span>有效时段: {{ c.validFrom }} ~ {{ c.validTo }}</span>
            <span>登记时间: {{ fmtTime(c.createdAt) }}</span>
          </div>
          <p v-if="c.status === '待审' && c.conflictNote" class="note">冲突:{{ c.conflictNote }}</p>
          <div class="actions">
            <template v-if="c.status === '待审'">
              <button type="button" @click="review(c.id, true)">审核通过</button>
              <button class="danger" type="button" @click="review(c.id, false)">作废</button>
            </template>
            <button v-else-if="c.status === '生效中'" class="danger" type="button" @click="voidCoupon(c.id)">作废</button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
