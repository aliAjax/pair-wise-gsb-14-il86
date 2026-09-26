import type { Coupon, Entry, Redemption } from "../data/types";

export interface CouponDraft {
  code: string;
  enterprise: string;
  fuel: string;
  discountPerLiter: number;
  stations: string[];
  batch: string;
  validFrom: string;
  validTo: string;
}

export type RegisterResult =
  | { ok: true; coupon: Coupon }
  | { ok: false; reason: string };

function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

/** 同企业、同油品、有效时段重叠的未作废券视为冲突 */
export function findConflicts(draft: CouponDraft, existing: Coupon[]): Coupon[] {
  return existing.filter(
    (coupon) =>
      coupon.status !== "已作废" &&
      coupon.enterprise === draft.enterprise &&
      coupon.fuel === draft.fuel &&
      overlaps(draft.validFrom, draft.validTo, coupon.validFrom, coupon.validTo)
  );
}

/** 登记券：同一券码重复提交只保留首次；有冲突则留在待审并写明冲突 */
export function registerCoupon(existing: Coupon[], draft: CouponDraft, now: string): RegisterResult {
  const code = draft.code.trim();
  if (!code) return { ok: false, reason: "券码不能为空" };
  if (existing.some((coupon) => coupon.code === code)) {
    return { ok: false, reason: `券码 ${code} 已存在，重复提交已忽略，保留首次登记` };
  }
  if (draft.validFrom > draft.validTo) {
    return { ok: false, reason: "生效日期不能晚于失效日期" };
  }
  if (draft.stations.length === 0) {
    return { ok: false, reason: "请至少选择一个适用站点" };
  }
  if (!(draft.discountPerLiter > 0)) {
    return { ok: false, reason: "每升优惠必须大于 0" };
  }

  const conflicts = findConflicts({ ...draft, code }, existing);
  const coupon: Coupon = {
    ...draft,
    code,
    id: crypto.randomUUID(),
    status: conflicts.length > 0 ? "待审" : "生效中",
    conflictNote:
      conflicts.length > 0
        ? `与券 ${conflicts.map((item) => item.code).join("、")} 冲突：同企业同油品，有效时段重叠`
        : "",
    createdAt: now
  };
  return { ok: true, coupon };
}

export type EntryJudgment = { ok: true } | { ok: false; reason: string };

/** 入场判定：券存在、生效中、在有效时段内、站点适用、未占用未核销 */
export function judgeEntry(
  coupon: Coupon | undefined,
  code: string,
  station: string,
  today: string,
  entries: Entry[],
  redemptions: Redemption[]
): EntryJudgment {
  if (!coupon) return { ok: false, reason: `券码 ${code} 不存在，请先登记券包` };
  if (coupon.status === "已作废") return { ok: false, reason: `券 ${code} 已作废，不能使用` };
  if (coupon.status === "待审") {
    return { ok: false, reason: `券 ${code} 待审中（${coupon.conflictNote || "存在冲突"}），暂不能使用` };
  }
  if (today < coupon.validFrom) return { ok: false, reason: `券 ${code} ${coupon.validFrom} 起才能使用` };
  if (today > coupon.validTo) return { ok: false, reason: `券 ${code} 已于 ${coupon.validTo} 过期` };
  if (!coupon.stations.includes(station)) {
    return { ok: false, reason: `券 ${code} 不适用于本站（限：${coupon.stations.join("、")}）` };
  }
  if (entries.some((entry) => entry.couponId === coupon.id && entry.status === "已入场")) {
    return { ok: false, reason: `券 ${code} 已有车辆在场，未结算` };
  }
  if (redemptions.some((record) => record.couponCode === coupon.code)) {
    return { ok: false, reason: `券 ${code} 已核销过，不能重复使用` };
  }
  return { ok: true };
}
