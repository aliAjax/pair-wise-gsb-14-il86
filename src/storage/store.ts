import { reactive } from "vue";
import { PRICE_STATUSES, STATIONS } from "../data/basics";
import { seedCoupons, seedPrices, seedRedemptions } from "../data/seed";
import type { Coupon, CouponDraft, EntryOrder, PriceInput, PriceRecord, Redemption } from "../data/types";
import { buildCoupon, findConflict } from "../domain/coupons";
import { buildEntry, buildRedemption, checkEntry } from "../domain/redeem";
import { load, save } from "./local";

const KEYS = {
  prices: "dfwlfront-9-prices",
  coupons: "dfwlfront-9-coupons",
  entries: "dfwlfront-9-entries",
  redemptions: "dfwlfront-9-redemptions",
  station: "dfwlfront-9-station",
} as const;

/** 全局响应式状态,首次打开时写入示例资料 */
export const state = reactive({
  prices: load<PriceRecord[]>(KEYS.prices, seedPrices),
  coupons: load<Coupon[]>(KEYS.coupons, seedCoupons),
  entries: load<EntryOrder[]>(KEYS.entries, () => []),
  redemptions: load<Redemption[]>(KEYS.redemptions, seedRedemptions),
  station: load<string>(KEYS.station, () => STATIONS[0]),
});

function persist() {
  save(KEYS.prices, state.prices);
  save(KEYS.coupons, state.coupons);
  save(KEYS.entries, state.entries);
  save(KEYS.redemptions, state.redemptions);
}

export interface ActionResult {
  ok: boolean;
  message: string;
  tone: "ok" | "warn" | "error";
}

const pass = (message: string, tone: ActionResult["tone"] = "ok"): ActionResult => ({ ok: true, message, tone });
const fail = (message: string): ActionResult => ({ ok: false, message, tone: "error" });

/* ---------- 价格维护 ---------- */

export function addPrice(input: PriceInput): void {
  if (!input.fuel || !(input.listPrice > 0) || !input.effectiveDate) return;
  state.prices.unshift({
    ...input,
    notes: input.notes || "正常调价",
    id: crypto.randomUUID(),
    status: "生效中",
    createdAt: new Date().toISOString(),
  });
  persist();
}

export function flowPrice(id: string): void {
  const record = state.prices.find((p) => p.id === id);
  if (!record) return;
  const index = PRICE_STATUSES.indexOf(record.status);
  record.status = PRICE_STATUSES[(index + 1) % PRICE_STATUSES.length];
  persist();
}

export function removePrice(id: string): void {
  state.prices = state.prices.filter((p) => p.id !== id);
  persist();
}

/* ---------- 券包管理 ---------- */

export function registerCoupon(draft: CouponDraft): ActionResult {
  const result = buildCoupon(state.coupons, draft, new Date());
  if (!result.ok) return fail(result.message);
  state.coupons.unshift(result.coupon);
  persist();
  return pass(result.message, result.pending ? "warn" : "ok");
}

/** 待审券处理:通过前复查冲突,仍有冲突则不允许生效 */
export function reviewCoupon(id: string, approve: boolean): ActionResult {
  const coupon = state.coupons.find((c) => c.id === id);
  if (!coupon || coupon.status !== "待审") return fail("该券不在待审状态");
  if (!approve) {
    coupon.status = "已作废";
    persist();
    return pass(`券「${coupon.code}」已作废`);
  }
  const conflict = findConflict(state.coupons, coupon, coupon.id);
  if (conflict) {
    return fail(`仍与券「${conflict.code}」(${conflict.enterprise}/${conflict.fuel})时段重叠,请先作废其中一张`);
  }
  coupon.status = "生效中";
  coupon.conflictNote = "";
  persist();
  return pass(`券「${coupon.code}」已审核通过并生效`);
}

export function voidCoupon(id: string): void {
  const coupon = state.coupons.find((c) => c.id === id);
  if (!coupon || (coupon.status !== "生效中" && coupon.status !== "待审")) return;
  coupon.status = "已作废";
  persist();
}

/* ---------- 核销台 ---------- */

export function setStation(name: string): void {
  state.station = name;
  save(KEYS.station, name);
}

/** 入场预占:判定通过后按当时挂牌价与券优惠快照 */
export function enter(code: string, plate: string): ActionResult {
  if (!plate.trim()) return fail("请填写车牌号");
  const now = new Date();
  const check = checkEntry(state.coupons, state.entries, state.prices, code, state.station, now);
  if (!check.ok) return fail(check.reasons.join(";"));
  const entry = buildEntry(check.coupon, check.price, plate, state.station, now);
  state.entries.unshift(entry);
  persist();
  return pass(
    `已按当前挂牌价预占:${entry.enterprise} ${entry.fuel},挂牌价 ¥${entry.listPrice.toFixed(2)}/升,每升优惠 ¥${entry.discountPerLiter.toFixed(2)}`
  );
}

/** 结算:按入场快照生成核销记录,券转为已核销 */
export function settle(entryId: string, liters: number): ActionResult {
  const entry = state.entries.find((e) => e.id === entryId);
  if (!entry) return fail("预占单不存在或已结算");
  if (!Number.isFinite(liters) || liters <= 0) return fail("请填写大于 0 的加油升数");
  const coupon = state.coupons.find((c) => c.code === entry.couponCode);
  if (!coupon) return fail("券不存在,无法结算");
  const redemption = buildRedemption(entry, coupon, liters, new Date());
  state.redemptions.unshift(redemption);
  state.entries = state.entries.filter((e) => e.id !== entryId);
  coupon.status = "已核销";
  persist();
  return pass(
    `已核销:${entry.plate} ${redemption.liters} 升,实收 ¥${redemption.received.toFixed(2)},毛利 ¥${redemption.grossProfit.toFixed(2)}`
  );
}
