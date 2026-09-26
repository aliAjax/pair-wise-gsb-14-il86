import { ALL_STATIONS } from "../data/basics";
import type { Coupon, CouponDraft } from "../data/types";
import { round2 } from "./pricing";

/** 两个时段是否重叠(日期字符串按字典序比较即可) */
export function overlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

/** 同企业、同油品且有效时段重叠的券(只看仍占名额的「生效中 / 待审」) */
export function findConflict(coupons: Coupon[], target: CouponDraft, excludeId?: string): Coupon | null {
  return (
    coupons.find(
      (c) =>
        c.id !== excludeId &&
        (c.status === "生效中" || c.status === "待审") &&
        c.enterprise === target.enterprise &&
        c.fuel === target.fuel &&
        overlap(c.validFrom, c.validTo, target.validFrom, target.validTo)
    ) ?? null
  );
}

export function validateDraft(draft: CouponDraft): string[] {
  const errors: string[] = [];
  if (!draft.code.trim()) errors.push("请填写券码");
  if (!draft.enterprise.trim()) errors.push("请填写企业");
  if (!draft.fuel) errors.push("请选择油品");
  if (!(draft.discountPerLiter > 0)) errors.push("每升优惠需大于 0");
  if (!draft.batch.trim()) errors.push("请填写发放批次");
  if (!draft.validFrom || !draft.validTo) errors.push("请填写有效时段");
  else if (draft.validFrom > draft.validTo) errors.push("有效期开始不能晚于结束");
  if (!draft.stations.length) errors.push("请选择适用站点");
  return errors;
}

export type RegisterResult =
  | { ok: true; pending: boolean; coupon: Coupon; message: string }
  | { ok: false; message: string };

/**
 * 登记券:
 * - 券码重复提交只保留首次,直接拒绝;
 * - 同企业同油品有效时段重叠的,留在待审并写明冲突。
 */
export function buildCoupon(coupons: Coupon[], draft: CouponDraft, now: Date): RegisterResult {
  const errors = validateDraft(draft);
  if (errors.length) return { ok: false, message: errors.join(";") };

  const code = draft.code.trim();
  if (coupons.some((c) => c.code === code)) {
    return { ok: false, message: `券码「${code}」已存在,重复提交已忽略,只保留首次` };
  }

  const coupon: Coupon = {
    id: crypto.randomUUID(),
    code,
    enterprise: draft.enterprise.trim(),
    fuel: draft.fuel,
    discountPerLiter: round2(draft.discountPerLiter),
    stations: [...draft.stations],
    batch: draft.batch.trim(),
    validFrom: draft.validFrom,
    validTo: draft.validTo,
    status: "生效中",
    conflictNote: "",
    createdAt: now.toISOString(),
  };

  const conflict = findConflict(coupons, coupon);
  if (conflict) {
    coupon.status = "待审";
    coupon.conflictNote = `与券「${conflict.code}」(批次 ${conflict.batch},${conflict.validFrom} ~ ${conflict.validTo})同企业同油品且有效时段重叠`;
    return { ok: true, pending: true, coupon, message: `已登记,留在待审:${coupon.conflictNote}` };
  }
  return { ok: true, pending: false, coupon, message: `券「${code}」已登记并生效` };
}

/** 柜台判定:券在某站点某天能否使用,返回全部不满足的原因(空数组=可用) */
export function couponBlockReasons(coupon: Coupon, station: string, date: string): string[] {
  const reasons: string[] = [];
  if (coupon.status !== "生效中") reasons.push(`券状态为「${coupon.status}」`);
  if (date < coupon.validFrom || date > coupon.validTo) {
    reasons.push(`不在有效时段(${coupon.validFrom} ~ ${coupon.validTo})`);
  }
  if (!coupon.stations.includes(ALL_STATIONS) && !coupon.stations.includes(station)) {
    reasons.push(`本站「${station}」不在适用站点(${coupon.stations.join("、")})`);
  }
  return reasons;
}
