<script setup lang="ts">
import { reactive } from "vue";
import type { Coupon } from "../data/types";
import type { CouponDraft } from "../domain/coupons";

const props = defineProps<{
  coupons: Coupon[];
  fuels: readonly string[];
  stations: readonly string[];
  feedback: { kind: "ok" | "error"; text: string } | null;
}>();

const emit = defineEmits<{
  register: [draft: CouponDraft];
  approve: [id: string];
  void: [id: string];
}>();

const blank = (): CouponDraft => ({
  code: "",
  enterprise: "",
  fuel: "",
  discountPerLiter: 0,
  stations: [],
  batch: "",
  validFrom: "",
  validTo: ""
});
const form = reactive<CouponDraft>(blank());

function submit() {
  emit("register", { ...form, discountPerLiter: Number(form.discountPerLiter), stations: [...form.stations] });
  Object.assign(form, blank());
}

function toggleStation(station: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  form.stations = checked
    ? [...form.stations, station]
    : form.stations.filter((item) => item !== station);
}
</script>

<template>
  <section class="panel">
    <h2>券包登记</h2>
    <form class="form-grid" @submit.prevent="submit">
      <label>
        券码
        <input v-model="form.code" placeholder="唯一券码，重复提交只保留首次" required />
      </label>
      <label>
        企业
        <input v-model="form.enterprise" placeholder="企业客户名称" required />
      </label>
      <label>
        油品
        <select v-model="form.fuel" required>
          <option value="">请选择</option>
          <option v-for="fuel in props.fuels" :key="fuel">{{ fuel }}</option>
        </select>
      </label>
      <label>
        每升优惠（元）
        <input v-model="form.discountPerLiter" type="number" step="0.01" min="0.01" required />
      </label>
      <fieldset class="station-picker">
        <legend>适用站点</legend>
        <label v-for="station in props.stations" :key="station" class="check">
          <input
            type="checkbox"
            :checked="form.stations.includes(station)"
            @change="toggleStation(station, $event)"
          />
          {{ station }}
        </label>
      </fieldset>
      <label>
        发放批次
        <input v-model="form.batch" placeholder="如 2026-09A" required />
      </label>
      <div class="date-pair">
        <label>
          生效日期
          <input v-model="form.validFrom" type="date" required />
        </label>
        <label>
          失效日期
          <input v-model="form.validTo" type="date" required />
        </label>
      </div>
      <button type="submit">登记券</button>
      <p v-if="props.feedback" class="feedback" :class="props.feedback.kind">{{ props.feedback.text }}</p>
    </form>

    <div class="record-grid compact-list">
      <div v-if="props.coupons.length === 0" class="empty">暂无券包</div>
      <article v-for="coupon in props.coupons" :key="coupon.id" class="record">
        <div class="record-head">
          <p class="record-title">{{ coupon.enterprise }} / {{ coupon.fuel }}</p>
          <span class="status" :data-kind="coupon.status">{{ coupon.status }}</span>
        </div>
        <div class="details">
          <span>券码: {{ coupon.code }}</span>
          <span>每升优惠: {{ coupon.discountPerLiter }} 元</span>
          <span>站点: {{ coupon.stations.join("、") }}</span>
          <span>批次: {{ coupon.batch }}</span>
          <span>有效时段: {{ coupon.validFrom }} ~ {{ coupon.validTo }}</span>
        </div>
        <p v-if="coupon.conflictNote" class="note warn">{{ coupon.conflictNote }}</p>
        <div class="actions">
          <button v-if="coupon.status === '待审'" type="button" @click="emit('approve', coupon.id)">审核通过</button>
          <button v-if="coupon.status !== '已作废'" class="danger" type="button" @click="emit('void', coupon.id)">作废</button>
        </div>
      </article>
    </div>
  </section>
</template>
