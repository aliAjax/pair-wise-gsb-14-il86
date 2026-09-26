/** 本机保存：localStorage 读写，键名集中管理 */

const PREFIX = "dfwlfront-9";

export const STORAGE_KEYS = {
  prices: `${PREFIX}-prices`,
  coupons: `${PREFIX}-coupons`,
  entries: `${PREFIX}-entries`,
  redemptions: `${PREFIX}-redemptions`
} as const;

export function loadCollection<T>(key: string, seed: () => T[]): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return seed();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : seed();
  } catch {
    return seed();
  }
}

export function saveCollection<T>(key: string, rows: T[]): void {
  localStorage.setItem(key, JSON.stringify(rows));
}
