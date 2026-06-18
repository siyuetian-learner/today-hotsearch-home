import type { HotItem } from "../types/hot";

export type HotStatus = {
  label: "新" | "热" | "火热" | "上升" | "观察";
  tone: "new" | "hot" | "boiling" | "up" | "watch";
};

function parseHeat(value: HotItem["heat"]) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const text = String(value).replace(/,/g, "");
  const first = text.match(/\d+(?:\.\d+)?/);
  if (!first) return 0;

  const num = Number(first[0]);
  if (Number.isNaN(num)) return 0;
  if (text.includes("万")) return num * 10000;
  return num;
}

export function getHotStatus(item: HotItem, score = 0): HotStatus {
  if (item.trend === "new") return { label: "新", tone: "new" };
  if (item.trend === "up") return { label: "上升", tone: "up" };

  const heat = parseHeat(item.heat);

  if ((item.rank || 99) <= 2 || score >= 118 || heat >= 3000000) {
    return { label: "火热", tone: "boiling" };
  }

  if ((item.rank || 99) <= 5 || score >= 96 || heat >= 500000) {
    return { label: "热", tone: "hot" };
  }

  return { label: "观察", tone: "watch" };
}
