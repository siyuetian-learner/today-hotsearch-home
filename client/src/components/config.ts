import type { HotItem, HotPlatform } from "../types/hot";

export const platformColors: Record<string, string> = {
  weibo: "#e93b2f",
  zhihu: "#2563eb",
  bilibili: "#fb7299",
  huggingface: "#f59e0b",
  aihot: "#10b981",
  github: "#24292f",
};

export const categorySources: Record<string, string[]> = {
  all: ["weibo", "zhihu", "bilibili", "huggingface", "aihot", "github"],
  general: ["weibo", "zhihu", "bilibili"],
  ai: ["huggingface", "aihot"],
  dev: ["github", "huggingface"],
};

export const categories = [
  { key: "all", label: "全部" },
  { key: "general", label: "综合热点" },
  { key: "ai", label: "AI 热点" },
  { key: "dev", label: "开源项目" },
];

export const exampleSources = new Set(["weibo", "zhihu", "bilibili"]);

export const sourceLabels: Record<string, { name: string; listName: string }> = {
  weibo: { name: "微博热搜", listName: "全站热搜榜" },
  zhihu: { name: "知乎热榜", listName: "讨论热度榜" },
  bilibili: { name: "B站热搜", listName: "站内搜索榜" },
  huggingface: { name: "AI 模型榜", listName: "Hugging Face 趋势模型" },
  aihot: { name: "AI 资讯榜", listName: "AI HOT 精选动态" },
  github: { name: "开源项目榜", listName: "GitHub 近 14 天热门仓库" },
};

export function getSourceName(board: HotPlatform) {
  return sourceLabels[board.source]?.name || board.sourceName || board.source;
}

export function getListName(board: HotPlatform) {
  return sourceLabels[board.source]?.listName || board.listName || "";
}

export function getSourceType(board: HotPlatform) {
  return exampleSources.has(board.source) ? "示例数据" : "实时数据";
}

export function formatHeat(value: HotItem["heat"]) {
  if (typeof value === "number") {
    return `${value.toFixed(1)}万`;
  }

  return value || "";
}

export function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (Number.isNaN(date.getTime()) || minutes < 1) {
    return "刚刚";
  }

  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  return `${Math.floor(minutes / 60)} 小时前`;
}

export function getMetricText(board: HotPlatform, item: HotItem) {
  const heat = formatHeat(item.heat);

  if (!heat) return "";
  if (["weibo", "zhihu", "bilibili"].includes(board.source)) return `热度 ${heat}`;
  if (board.source === "github") return heat.replace(/\bstars\b/i, "星标");
  if (board.source === "huggingface") {
    return heat.replace(/\blikes\b/i, "点赞").replace(/\bdownloads\b/i, "下载");
  }

  return heat;
}
