<script setup lang="ts">
import { reactive, ref } from "vue";
import type { PriceRecord } from "../data/types";

const props = defineProps<{
  records: PriceRecord[];
  fuels: readonly string[];
  currentPrices: Array<{ fuel: string; price: number | null }>;
}>();

const emit = defineEmits<{
  add: [draft: { fuel: string; price: number; operator: string; effectiveDate: string; notes: string }];
  flow: [id: string];
  remove: [id: string];
}>();

const blank = () => ({ fuel: "", price: 0, operator: "", effectiveDate: "" });
const form = reactive(blank());
const note = ref("");

function submit() {
  emit("add", { ...form, price: Number(form.price), notes: note.value || "正常调价" });
  Object.assign(form, blank());
  note.value = "";
}
</script>

<template>
  <section class="panel">
    <h2>价格维护</h2>
    <div class="price-chips">
      <span v-for="row in props.currentPrices" :key="row.fuel" class="tag">
        {{ row.fuel }} {{ row.price === null ? "暂无价" : `${row.price.toFixed(2)} 元/升` }}
      </span>
    </div>
    <form class="form-grid" @submit.prevent="submit">
      <label>
        油品
        <select v-model="form.fuel" required>
          <option value="">请选择</option>
          <option v-for="fuel in props.fuels" :key="fuel">{{ fuel }}</option>
        </select>
      </label>
      <label>
        挂牌价（元/升）
        <input v-model="form.price" type="number" step="0.01" min="0.01" required />
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
        <textarea v-model="note" placeholder="调价说明" />
      </label>
      <button type="submit">保存价格</button>
    </form>

    <div class="record-grid compact-list">
      <div v-if="props.records.length === 0" class="empty">暂无调价记录</div>
      <article v-for="record in props.records" :key="record.id" class="record">
        <div class="record-head">
          <p class="record-title">{{ record.fuel }} / {{ record.price }} 元</p>
          <span class="status">{{ record.status }}</span>
        </div>
        <div class="details">
          <span>操作员: {{ record.operator }}</span>
          <span>生效日期: {{ record.effectiveDate }}</span>
        </div>
        <p class="note">{{ record.notes }}</p>
        <div class="actions">
          <button type="button" @click="emit('flow', record.id)">流转状态</button>
          <button class="danger" type="button" @click="emit('remove', record.id)">删除</button>
        </div>
      </article>
    </div>
  </section>
</template>
