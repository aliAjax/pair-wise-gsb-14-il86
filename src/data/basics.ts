import type { PriceStatus } from "./types";

/** 基础资料:油品、站点与状态字典 */
export const FUELS = ["92号汽油", "95号汽油", "98号汽油", "柴油"] as const;

export const STATIONS = ["中心站", "东城站", "港区站"] as const;

/** 券的适用站点选它表示全部站点通用 */
export const ALL_STATIONS = "全部站点";

export const PRICE_STATUSES: PriceStatus[] = ["生效中", "待确认", "已回退"];
