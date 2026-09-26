import type { Coupon, PriceRecord } from "./types";

export const FUELS = ["92号汽油", "95号汽油", "98号汽油", "柴油"] as const;

export const STATIONS = ["中心站", "东环站", "港区站"] as const;

export function seedPrices(): PriceRecord[] {
  const base = Date.now();
  const rows: Array<Omit<PriceRecord, "id" | "createdAt">> = [
    { fuel: "92号汽油", price: 7.62, operator: "站长", effectiveDate: "2026-09-01", status: "生效中", notes: "正常调价" },
    { fuel: "95号汽油", price: 8.08, operator: "站长", effectiveDate: "2026-09-01", status: "生效中", notes: "正常调价" },
    { fuel: "98号汽油", price: 8.96, operator: "站长", effectiveDate: "2026-09-01", status: "生效中", notes: "正常调价" },
    { fuel: "柴油", price: 7.18, operator: "值班经理", effectiveDate: "2026-09-01", status: "生效中", notes: "正常调价" },
    { fuel: "柴油", price: 7.26, operator: "值班经理", effectiveDate: "2026-10-01", status: "待确认", notes: "等待复核" }
  ];
  return rows.map((row, index) => ({
    ...row,
    id: `seed-price-${index + 1}`,
    createdAt: new Date(base - index * 86400000).toISOString()
  }));
}

export function seedCoupons(): Coupon[] {
  const base = Date.now();
  const rows: Array<Omit<Coupon, "id" | "createdAt">> = [
    {
      code: "SD-2026-0901",
      enterprise: "顺达物流",
      fuel: "92号汽油",
      discountPerLiter: 0.5,
      stations: ["中心站", "东环站"],
      batch: "2026-09A",
      validFrom: "2026-09-01",
      validTo: "2026-10-31",
      status: "生效中",
      conflictNote: ""
    },
    {
      code: "SD-2026-0915",
      enterprise: "顺达物流",
      fuel: "92号汽油",
      discountPerLiter: 0.6,
      stations: ["中心站"],
      batch: "2026-09B",
      validFrom: "2026-09-15",
      validTo: "2026-11-15",
      status: "待审",
      conflictNote: "与券 SD-2026-0901 冲突：同企业同油品，有效时段重叠（2026-09-15 ~ 2026-10-31）"
    },
    {
      code: "GC-2026-0901",
      enterprise: "港城客运",
      fuel: "柴油",
      discountPerLiter: 0.4,
      stations: ["港区站"],
      batch: "2026-09A",
      validFrom: "2026-09-01",
      validTo: "2026-12-31",
      status: "生效中",
      conflictNote: ""
    }
  ];
  return rows.map((row, index) => ({
    ...row,
    id: `seed-coupon-${index + 1}`,
    createdAt: new Date(base - index * 3600000).toISOString()
  }));
}
