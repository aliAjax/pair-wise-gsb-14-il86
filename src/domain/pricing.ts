import type { PriceRecord } from "../data/types";

/** 金额保留两位小数 */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** 本地日期转 YYYY-MM-DD,用于与生效日期、有效时段比较 */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 某油品在某天(含)之前已生效的最新「生效中」价格记录;
 * 没有则取最早一条生效中的兜底;完全没有返回 null。
 */
export function priceAt(prices: PriceRecord[], fuel: string, date: string): PriceRecord | null {
  const actives = prices.filter((p) => p.fuel === fuel && p.status === "生效中");
  if (!actives.length) return null;
  const due = actives
    .filter((p) => p.effectiveDate <= date)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  if (due.length) return due[0];
  return [...actives].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))[0];
}

export interface Quote {
  receivable: number; // 挂牌金额
  discountTotal: number; // 优惠总额
  received: number; // 实收
  costTotal: number; // 成本合计
  grossProfit: number; // 门店毛利
}

/** 按(快照)挂牌价、每升优惠、升数、成本价计算结算金额 */
export function quote(listPrice: number, discountPerLiter: number, liters: number, costPrice: number): Quote {
  const receivable = round2(listPrice * liters);
  const discountTotal = round2(discountPerLiter * liters);
  const received = round2(receivable - discountTotal);
  const costTotal = round2(costPrice * liters);
  return { receivable, discountTotal, received, costTotal, grossProfit: round2(received - costTotal) };
}
