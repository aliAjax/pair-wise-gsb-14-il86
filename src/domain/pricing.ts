import type { PriceRecord } from "../data/types";

/** 取某油品在指定日期（含）之前已生效的最新挂牌价；无生效记录时回退到最新一条 */
export function currentPrice(records: PriceRecord[], fuel: string, date: string): number | null {
  const sameFuel = records.filter((record) => record.fuel === fuel);
  if (sameFuel.length === 0) return null;

  const pick = (rows: PriceRecord[]) =>
    [...rows].sort((a, b) =>
      a.effectiveDate === b.effectiveDate
        ? b.createdAt.localeCompare(a.createdAt)
        : b.effectiveDate.localeCompare(a.effectiveDate)
    )[0];

  const effective = sameFuel.filter(
    (record) => record.status === "生效中" && record.effectiveDate <= date
  );
  if (effective.length > 0) return pick(effective).price;

  const fallback = sameFuel.filter((record) => record.effectiveDate <= date);
  return fallback.length > 0 ? pick(fallback).price : pick(sameFuel).price;
}
