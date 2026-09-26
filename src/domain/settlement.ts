import type { Coupon, Entry, Redemption } from "../data/types";

const round2 = (value: number) => Math.round(value * 100) / 100;

/** 入场预占：把当时的挂牌价与券优惠锁进快照，之后调价不追溯 */
export function quoteEntry(
  coupon: Coupon,
  price: number,
  plate: string,
  station: string,
  now: string
): Entry {
  return {
    id: crypto.randomUUID(),
    couponId: coupon.id,
    couponCode: coupon.code,
    enterprise: coupon.enterprise,
    fuel: coupon.fuel,
    plate,
    station,
    lockedPrice: price,
    lockedDiscount: coupon.discountPerLiter,
    enteredAt: now,
    status: "已入场"
  };
}

/** 结算：金额全部取自预占快照，与当前挂牌价无关 */
export function settleEntry(entry: Entry, liters: number, now: string): Redemption {
  const grossAmount = round2(entry.lockedPrice * liters);
  const discountAmount = round2(entry.lockedDiscount * liters);
  return {
    id: crypto.randomUUID(),
    entryId: entry.id,
    couponCode: entry.couponCode,
    enterprise: entry.enterprise,
    fuel: entry.fuel,
    station: entry.station,
    plate: entry.plate,
    liters,
    lockedPrice: entry.lockedPrice,
    discountPerLiter: entry.lockedDiscount,
    grossAmount,
    discountAmount,
    netAmount: round2(grossAmount - discountAmount),
    settledAt: now
  };
}
