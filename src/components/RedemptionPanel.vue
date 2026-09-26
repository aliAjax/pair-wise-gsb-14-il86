<script setup lang="ts">
import type { Redemption } from "../data/types";

defineProps<{
  redemptions: Redemption[];
}>();
</script>

<template>
  <section class="panel">
    <h2>核销记录</h2>
    <div v-if="redemptions.length === 0" class="empty">暂无核销记录</div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>结算时间</th>
            <th>券码</th>
            <th>企业</th>
            <th>车牌</th>
            <th>油品</th>
            <th>站点</th>
            <th>升数</th>
            <th>锁定价</th>
            <th>每升优惠</th>
            <th>挂牌金额</th>
            <th>优惠让利</th>
            <th>门店实收</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in redemptions" :key="row.id">
            <td>{{ new Date(row.settledAt).toLocaleString() }}</td>
            <td>{{ row.couponCode }}</td>
            <td>{{ row.enterprise }}</td>
            <td>{{ row.plate }}</td>
            <td>{{ row.fuel }}</td>
            <td>{{ row.station }}</td>
            <td>{{ row.liters }}</td>
            <td>{{ row.lockedPrice.toFixed(2) }}</td>
            <td>{{ row.discountPerLiter.toFixed(2) }}</td>
            <td>{{ row.grossAmount.toFixed(2) }}</td>
            <td>{{ row.discountAmount.toFixed(2) }}</td>
            <td>{{ row.netAmount.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
