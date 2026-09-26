/** 金额保留两位展示 */
export function fmtMoney(n: number): string {
  return n.toFixed(2);
}

/** ISO 时间转成本地「YYYY-MM-DD HH:mm」 */
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
