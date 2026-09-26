import type { Coupon, EntryOrder, PriceRecord, Redemption } from "../data/types";
import { couponBlockReasons } from "./coupons";
import { fmtTime } from "./format";
import { priceAt, quote, round2, toDateStr } from "./pricing";

export type EntryCheck =
  | { ok: true; coupon: Coupon; price: PriceRecord }
  | { ok: false; reasons: string[] };

/**
 * 入场判定:券本身可用(状态/有效时段/适用站点)、本站有生效挂牌价,
 * 且同一券码没有已预占的入场单(重复提交只保留首次)。
 */
export function checkEntry(
  coupons: Coupon[],
  entries: EntryOrder[],
  prices: PriceRecord[],
  code: string,
  station: string,
  now: Date
): EntryCheck {
  const coupon = coupons.find((c) => c.code === code.trim());
  if (!coupon) return { ok: false, reasons: [`券码「${code.trim()}」不存在,请核对后再试`] };

  const today = toDateStr(now);
  const reasons = couponBlockReasons(coupon, station, today);

  const held = entries.find((e) => e.couponCode === coupon.code);
  if (held) {
    reasons.push(`该券已于 ${fmtTime(held.enteredAt)} 预占(车牌 ${held.plate}),同一券码只保留首次`);
  }

  const price = priceAt(prices, coupon.fuel, today);
  if (!price) reasons.push(`「${coupon.fuel}」暂无生效挂牌价,请先在价格维护中确认`);

  if (reasons.length || !price) return { ok: false, reasons };
  return { ok: true, coupon, price };
}

/** 入场预占:把当时的挂牌价、成本价、每升优惠快照进预占单,之后调价不追溯 */
export function buildEntry(coupon: Coupon, price: PriceRecord, plate: string, station: string, now: Date): EntryOrder {
  return {
    id: crypto.randomUUID(),
    couponCode: coupon.code,
    enterprise: coupon.enterprise,
    fuel: coupon.fuel,
    plate: plate.trim(),
    station,
    enteredAt: now.toISOString(),
    listPrice: price.listPrice,
    costPrice: price.costPrice,
    discountPerLiter: coupon.discountPerLiter,
  };
}

/** 结算:按入场快照价与优惠生成核销记录 */
export function buildRedemption(entry: EntryOrder, coupon: Coupon, liters: number, now: Date): Redemption {
  const amounts = quote(entry.listPrice, entry.discountPerLiter, liters, entry.costPrice);
  return {
    id: crypto.randomUUID(),
    couponCode: entry.couponCode,
    enterprise: entry.enterprise,
    fuel: entry.fuel,
    batch: coupon.batch,
    plate: entry.plate,
    station: entry.station,
    enteredAt: entry.enteredAt,
    settledAt: now.toISOString(),
    liters: round2(liters),
    listPrice: entry.listPrice,
    discountPerLiter: entry.discountPerLiter,
    costPrice: entry.costPrice,
    ...amounts,
  };
}
