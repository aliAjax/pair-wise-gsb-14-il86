/** 领域资料类型：价格、券包、入场预占、核销记录 */

export type PriceStatus = "生效中" | "待确认" | "已回退";

export interface PriceRecord {
  id: string;
  fuel: string;
  price: number;
  operator: string;
  effectiveDate: string; // YYYY-MM-DD
  status: PriceStatus;
  notes: string;
  createdAt: string;
}

export type CouponStatus = "生效中" | "待审" | "已作废";

export interface Coupon {
  id: string;
  code: string; // 券码，全局唯一，重复提交只保留首次
  enterprise: string; // 企业名称
  fuel: string; // 油品
  discountPerLiter: number; // 每升优惠（元）
  stations: string[]; // 适用站点
  batch: string; // 发放批次
  validFrom: string; // 有效时段起 YYYY-MM-DD
  validTo: string; // 有效时段止 YYYY-MM-DD
  status: CouponStatus;
  conflictNote: string; // 待审原因（同企业同油品时段重叠）
  createdAt: string;
}

export type EntryStatus = "已入场" | "已结算";

/** 入场预占：按入场当时的挂牌价与券优惠锁价，调价不追溯 */
export interface Entry {
  id: string;
  couponId: string;
  couponCode: string;
  enterprise: string;
  fuel: string;
  plate: string; // 车牌号
  station: string;
  lockedPrice: number; // 入场时挂牌价
  lockedDiscount: number; // 入场时每升优惠
  enteredAt: string;
  status: EntryStatus;
}

/** 核销记录：结算后生成，金额全部来自预占快照 */
export interface Redemption {
  id: string;
  entryId: string;
  couponCode: string;
  enterprise: string;
  fuel: string;
  station: string;
  plate: string;
  liters: number;
  lockedPrice: number;
  discountPerLiter: number;
  grossAmount: number; // 挂牌金额 = 锁定挂牌价 × 升数
  discountAmount: number; // 优惠让利 = 每升优惠 × 升数
  netAmount: number; // 门店实收 = 挂牌金额 - 优惠让利
  settledAt: string;
}

export const PRICE_STATUSES: readonly PriceStatus[] = ["生效中", "待确认", "已回退"];
