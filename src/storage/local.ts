/** localStorage 安全读写:解析失败或没有数据时回退到默认值 */
export function load<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback();
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

export function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
