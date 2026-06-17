import type { HotItem, HotPlatform } from "../types/hot";

export const platformColors: Record<string, string> = {
  weibo: "#d8342a",
  baidu: "#2f6fe4",
  zhihu: "#1f64d6",
  bilibili: "#e96b94",
  douyin: "#111827",
  toutiao: "#d83a31",
  "36kr": "#1888ff",
  ithome: "#c9342c",
  huggingface: "#7a55d7",
  aihot: "#0fa778",
  github: "#2459d6",
  hackernews: "#d98a15",
};

export const categorySources: Record<string, string[]> = {
  all: [
    "weibo",
    "baidu",
    "zhihu",
    "bilibili",
    "douyin",
    "toutiao",
    "36kr",
    "ithome",
    "huggingface",
    "aihot",
    "github",
    "hackernews",
  ],
  general: ["weibo", "baidu", "zhihu", "bilibili", "douyin"],
  news: ["baidu", "toutiao", "weibo"],
  social: ["weibo", "douyin", "bilibili", "zhihu"],
  tech: ["36kr", "ithome", "aihot", "hackernews"],
  ai: ["huggingface", "aihot", "github", "hackernews"],
  dev: ["github", "hackernews", "huggingface", "ithome"],
};

export const categories = [
  { key: "all", label: "全部" },
  { key: "general", label: "综合热点" },
  { key: "news", label: "新闻资讯" },
  { key: "social", label: "社交媒体" },
  { key: "tech", label: "科技数码" },
  { key: "ai", label: "AI 热点" },
  { key: "dev", label: "开发者" },
];

export const sourceLabels: Record<string, { name: string; listName: string; type: string }> = {
  weibo: { name: "微博热搜", listName: "全站热搜榜", type: "社交媒体" },
  baidu: { name: "百度热搜", listName: "实时热搜榜", type: "搜索趋势" },
  zhihu: { name: "知乎热榜", listName: "讨论热度榜", type: "问答社区" },
  bilibili: { name: "B站热搜", listName: "站内搜索榜", type: "视频社区" },
  douyin: { name: "抖音热榜", listName: "热点榜", type: "短视频平台" },
  toutiao: { name: "今日头条", listName: "头条热榜", type: "新闻资讯" },
  "36kr": { name: "36氪", listName: "创投与商业热榜", type: "商业科技" },
  ithome: { name: "IT之家", listName: "科技数码热榜", type: "科技媒体" },
  huggingface: { name: "Hugging Face", listName: "Trending Models", type: "AI 模型社区" },
  aihot: { name: "AI HOT", listName: "AI 精选动态", type: "AI 资讯" },
  github: { name: "GitHub", listName: "近 14 天热门仓库", type: "开源社区" },
  hackernews: { name: "Hacker News", listName: "Top Stories", type: "技术社区" },
};

export const sourceOrder = categorySources.all;

export function getSourceName(board: HotPlatform) {
  return sourceLabels[board.source]?.name || board.sourceName || board.source;
}

export function getListName(board: HotPlatform) {
  return sourceLabels[board.source]?.listName || board.listName || "";
}

export function getSourceType(board: HotPlatform) {
  if (board.dataState === "live") return "实时";
  if (board.dataState === "cached") return "缓存";
  if (board.dataState === "stale") return "历史快照";
  if (board.dataState === "offline" || board.degraded) return "降级";
  if (board.dataState === "error" || board.error) return "失败";
  return sourceLabels[board.source]?.type || "数据源";
}

export function getStateTone(board: HotPlatform) {
  if (board.error || board.dataState === "error") return "is-error";
  if (board.dataState === "offline" || board.dataState === "stale" || board.degraded) return "is-degraded";
  if (board.dataState === "cached") return "is-cached";
  return "is-live";
}

export function getTrendText(item: HotItem) {
  if (item.trend === "new") return "新上榜";
  if (item.trend === "up") return "重点";
  if (item.trend === "down") return "观察";
  return "热榜";
}

export function safeHref(value?: string) {
  const href = String(value || "").trim();

  if (!href || href === "#") return "#";

  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? href : "#";
  } catch {
    return "#";
  }
}

export function formatHeat(value: HotItem["heat"]) {
  if (typeof value === "number") {
    return `${value.toFixed(1)}万`;
  }

  return value || "";
}

export function formatRelativeTime(value = "") {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (!value || Number.isNaN(date.getTime()) || minutes < 1) {
    return "刚刚";
  }

  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  if (minutes < 1440) {
    return `${Math.floor(minutes / 60)} 小时前`;
  }

  return `${Math.floor(minutes / 1440)} 天前`;
}

export function getMetricText(board: HotPlatform, item: HotItem) {
  const heat = formatHeat(item.heat);

  if (!heat) return "";
  if (["weibo", "baidu", "zhihu", "bilibili", "douyin", "toutiao"].includes(board.source)) return `热度 ${heat}`;
  if (board.source === "github") return heat.replace(/\bstars\b/i, "stars");
  if (board.source === "hackernews") return heat.replace(/\bpoints\b/i, "points").replace(/\bcomments\b/i, "comments");
  if (board.source === "huggingface") {
    return heat.replace(/\blikes\b/i, "likes").replace(/\bdownloads\b/i, "downloads");
  }

  return heat;
}
