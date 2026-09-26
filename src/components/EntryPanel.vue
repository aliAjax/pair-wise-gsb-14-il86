<script setup lang="ts">
import { reactive, ref } from "vue";
import type { Entry } from "../data/types";

const props = defineProps<{
  activeEntries: Entry[];
  stations: readonly string[];
  feedback: { kind: "ok" | "error"; text: string } | null;
}>();

const emit = defineEmits<{
  enter: [draft: { code: string; plate: string; station: string }];
  settle: [entryId: string, liters: number];
}>();

const form = reactive({ code: "", plate: "", station: "" });
const litersMap = reactive<Record<string, number>>({});

function submit() {
  emit("enter", { ...form, code: form.code.trim() });
  form.code = "";
  form.plate = "";
}

function settle(entryId: string) {
  const liters = Number(litersMap[entryId]);
  if (!(liters > 0)) return;
  emit("settle", entryId, liters);
  delete litersMap[entryId];
}
</script>

<template>
  <section class="panel">
    <h2>入场核销台</h2>
    <form class="form-grid entry-form" @submit.prevent="submit">
      <label>
        券码
        <input v-model="form.code" placeholder="扫描或输入券码" required />
      </label>
      <label>
        车牌号
        <input v-model="form.plate" placeholder="如 苏A12345" required />
      </label>
      <label>
        本站
        <select v-model="form.station" required>
          <option value="">请选择</option>
          <option v-for="station in props.stations" :key="station">{{ station }}</option>
        </select>
      </label>
      <button type="submit">入场预占</button>
      <p v-if="props.feedback" class="feedback" :class="props.feedback.kind">{{ props.feedback.text }}</p>
    </form>

    <div class="record-grid compact-list">
      <div v-if="props.activeEntries.length === 0" class="empty">当前无在场车辆</div>
      <article v-for="entry in props.activeEntries" :key="entry.id" class="record">
        <div class="record-head">
          <p class="record-title">{{ entry.plate }} / {{ entry.fuel }}</p>
          <span class="status" data-kind="已入场">已入场</span>
        </div>
        <div class="details">
          <span>企业: {{ entry.enterprise }}</span>
          <span>券码: {{ entry.couponCode }}</span>
          <span>锁定挂牌价: {{ entry.lockedPrice.toFixed(2) }} 元/升</span>
          <span>锁定优惠: {{ entry.lockedDiscount.toFixed(2) }} 元/升</span>
          <span>入场时间: {{ new Date(entry.enteredAt).toLocaleString() }}</span>
        </div>
        <p class="note">已按入场时价格预占，调价不影响本车结算。</p>
        <div class="actions settle-row">
          <input
            v-model="litersMap[entry.id]"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="加油升数"
          />
          <button type="button" @click="settle(entry.id)">结算核销</button>
        </div>
      </article>
    </div>
  </section>
</template>
