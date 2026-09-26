/** 价格台账状态:生效中 / 待确认 / 已回退 */
export type PriceStatus = "生效中" | "待确认" | "已回退";

/** 价格台账记录:挂牌价与成本价按生效日期生效 */
export interface PriceRecord {
  id: string;
  fuel: string;
  listPrice: number; // 挂牌价(元/升)
  costPrice: number; // 成本价(元/升)
  operator: string;
  effectiveDate: string; // YYYY-MM-DD
  status: PriceStatus;
  notes: string;
  createdAt: string;
}

/** 价格维护表单 */
export interface PriceInput {
  fuel: string;
  listPrice: number;
  costPrice: number;
  operator: string;
  effectiveDate: string;
  notes: string;
}

/** 券状态:生效中 / 待审 / 已作废 / 已核销 */
export type CouponStatus = "生效中" | "待审" | "已作废" | "已核销";

/** 券登记信息(表单提交内容) */
export interface CouponDraft {
  code: string; // 券码,唯一
  enterprise: string; // 企业
  fuel: string; // 油品
  discountPerLiter: number; // 每升优惠(元/升)
  stations: string[]; // 适用站点,含「全部站点」表示通用
  batch: string; // 发放批次
  validFrom: string; // 有效时段起 YYYY-MM-DD
  validTo: string; // 有效时段止 YYYY-MM-DD
}

/** 企业券 */
export interface Coupon extends CouponDraft {
  id: string;
  status: CouponStatus;
  conflictNote: string; // 待审时的冲突说明
  createdAt: string;
}

/** 入场预占单:按入场时的挂牌价与优惠快照,之后调价不追溯 */
export interface EntryOrder {
  id: string;
  couponCode: string;
  enterprise: string;
  fuel: string;
  plate: string; // 车牌号
  station: string; // 入场站点
  enteredAt: string;
  listPrice: number; // 预占挂牌价快照
  costPrice: number; // 预占成本价快照
  discountPerLiter: number; // 预占每升优惠快照
}

/** 核销记录:结算后生成,金额按预占快照计算 */
export interface Redemption {
  id: string;
  couponCode: string;
  enterprise: string;
  fuel: string;
  batch: string;
  plate: string;
  station: string;
  enteredAt: string;
  settledAt: string;
  liters: number; // 加油升数
  listPrice: number; // 结算挂牌价(=入场快照)
  discountPerLiter: number;
  receivable: number; // 挂牌金额
  discountTotal: number; // 优惠总额
  received: number; // 实收
  costPrice: number; // 成本价(=入场快照)
  costTotal: number; // 成本合计
  grossProfit: number; // 门店毛利
}
