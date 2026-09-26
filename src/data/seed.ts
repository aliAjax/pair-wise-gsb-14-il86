import type { Coupon, PriceRecord, Redemption } from "./types";
import { ALL_STATIONS } from "./basics";

/** 示例价格台账:四种油品 9 月生效价 + 一条待确认的 10 月调价 */
export function seedPrices(): PriceRecord[] {
  return [
    { id: "seed-price-92", fuel: "92号汽油", listPrice: 7.62, costPrice: 6.9, operator: "站长", effectiveDate: "2026-09-01", status: "生效中", notes: "正常调价", createdAt: "2026-09-01T00:10:00.000Z" },
    { id: "seed-price-95", fuel: "95号汽油", listPrice: 8.1, costPrice: 7.35, operator: "站长", effectiveDate: "2026-09-01", status: "生效中", notes: "正常调价", createdAt: "2026-09-01T00:10:00.000Z" },
    { id: "seed-price-98", fuel: "98号汽油", listPrice: 8.85, costPrice: 8.05, operator: "站长", effectiveDate: "2026-09-01", status: "生效中", notes: "正常调价", createdAt: "2026-09-01T00:10:00.000Z" },
    { id: "seed-price-diesel", fuel: "柴油", listPrice: 7.18, costPrice: 6.5, operator: "值班经理", effectiveDate: "2026-09-01", status: "生效中", notes: "正常调价", createdAt: "2026-09-01T00:10:00.000Z" },
    { id: "seed-price-92-next", fuel: "92号汽油", listPrice: 7.7, costPrice: 6.95, operator: "值班经理", effectiveDate: "2026-10-01", status: "待确认", notes: "待复核,确认后 10 月起生效", createdAt: "2026-09-25T02:30:00.000Z" },
  ];
}

/** 示例券包:含生效、待审(冲突)、已过期、已核销各种状态 */
export function seedCoupons(): Coupon[] {
  return [
    {
      id: "seed-coupon-1",
      code: "QY-2026-0901",
      enterprise: "顺达物流",
      fuel: "92号汽油",
      discountPerLiter: 0.5,
      stations: [ALL_STATIONS],
      batch: "2026-09-A",
      validFrom: "2026-09-01",
      validTo: "2026-12-31",
      status: "生效中",
      conflictNote: "",
      createdAt: "2026-08-28T01:00:00.000Z",
    },
    {
      id: "seed-coupon-2",
      code: "QY-2026-0902",
      enterprise: "港城客运",
      fuel: "柴油",
      discountPerLiter: 0.4,
      stations: ["中心站", "港区站"],
      batch: "2026-09-B",
      validFrom: "2026-09-01",
      validTo: "2026-10-31",
      status: "生效中",
      conflictNote: "",
      createdAt: "2026-08-28T01:05:00.000Z",
    },
    {
      id: "seed-coupon-3",
      code: "QY-2026-0903",
      enterprise: "顺达物流",
      fuel: "92号汽油",
      discountPerLiter: 0.6,
      stations: ["东城站"],
      batch: "2026-09-C",
      validFrom: "2026-10-01",
      validTo: "2026-12-31",
      status: "待审",
      conflictNote: "与券「QY-2026-0901」(批次 2026-09-A,2026-09-01 ~ 2026-12-31)同企业同油品且有效时段重叠",
      createdAt: "2026-09-10T06:20:00.000Z",
    },
    {
      id: "seed-coupon-4",
      code: "QY-2026-0601",
      enterprise: "顺达物流",
      fuel: "95号汽油",
      discountPerLiter: 0.45,
      stations: [ALL_STATIONS],
      batch: "2026-06-A",
      validFrom: "2026-06-01",
      validTo: "2026-08-31",
      status: "生效中",
      conflictNote: "",
      createdAt: "2026-05-28T01:00:00.000Z",
    },
    {
      id: "seed-coupon-5",
      code: "QY-2026-0904",
      enterprise: "港城客运",
      fuel: "柴油",
      discountPerLiter: 0.4,
      stations: ["中心站"],
      batch: "2026-09-B",
      validFrom: "2026-09-01",
      validTo: "2026-10-31",
      status: "已核销",
      conflictNote: "",
      createdAt: "2026-08-28T01:06:00.000Z",
    },
  ];
}

/** 示例核销记录:与券 QY-2026-0904 对应 */
export function seedRedemptions(): Redemption[] {
  return [
    {
      id: "seed-redemption-1",
      couponCode: "QY-2026-0904",
      enterprise: "港城客运",
      fuel: "柴油",
      batch: "2026-09-B",
      plate: "鲁B12345",
      station: "中心站",
      enteredAt: "2026-09-20T01:12:00.000Z",
      settledAt: "2026-09-20T01:40:00.000Z",
      liters: 180,
      listPrice: 7.18,
      discountPerLiter: 0.4,
      receivable: 1292.4,
      discountTotal: 72,
      received: 1220.4,
      costPrice: 6.5,
      costTotal: 1170,
      grossProfit: 50.4,
    },
  ];
}
