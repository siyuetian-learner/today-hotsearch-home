import type { HotItem, HotPlatform } from "../types/hot";
import { getMetricText, getSourceName } from "../components/config";

export type LeadCategory = {
  code: string;
  className: string;
  title: string;
  desc: string;
  sourceCount: number;
};

export type RankedHot = {
  board: HotPlatform;
  item: HotItem;
  score: number;
  sourceCount: number;
  reason: string;
};

const categoryConfig = [
  {
    code: "AI",
    className: "is-ai",
    sources: ["huggingface", "aihot", "github", "hackernews", "zhihu"],
    fallbackTitle: "AI 工具进入日常开发与企业落地",
    fallbackDesc: "知乎、AI HOT、Hugging Face、GitHub 同时出现高热话题。",
  },
  {
    code: "NEWS",
    className: "is-news",
    sources: ["weibo", "baidu", "toutiao"],
    fallbackTitle: "考试、出行、政策类信息持续升温",
    fallbackDesc: "微博、百度、今日头条集中出现高考、出行、消费补贴等议题。",
  },
  {
    code: "SOCIAL",
    className: "is-social",
    sources: ["bilibili", "douyin", "weibo", "zhihu"],
    fallbackTitle: "视频与社交平台承接生活化热点",
    fallbackDesc: "B站、抖音更偏校园、娱乐、科普和实用教程内容。",
  },
  {
    code: "TECH",
    className: "is-tech",
    sources: ["36kr", "ithome", "github", "hackernews", "aihot"],
    fallbackTitle: "科技与开发者社区关注工具效率",
    fallbackDesc: "36氪、IT之家、Hacker News 更集中在硬件、开源和工程实践。",
  },
];

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^\p{Script=Han}a-z0-9]+/gu, "");
}

function titleBigrams(value: string) {
  const chars = Array.from(normalizeTitle(value));
  const grams = new Set<string>();

  for (let index = 0; index < chars.length - 1; index += 1) {
    grams.add(`${chars[index]}${chars[index + 1]}`);
  }

  return grams;
}

function sameTopic(a: string, b: string) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);

  if (left.length < 4 || right.length < 4) return false;
  if ((left.includes(right) || right.includes(left)) && Math.min(left.length, right.length) >= 6) return true;

  const leftGrams = titleBigrams(left);
  const rightGrams = titleBigrams(right);
  if (!leftGrams.size || !rightGrams.size) return false;

  let hits = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) hits += 1;
  }

  return hits >= 3 && hits / Math.min(leftGrams.size, rightGrams.size) >= 0.38;
}

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

function getSourceScore(board: HotPlatform) {
  if (board.dataState === "live") return 12;
  if (board.dataState === "cached") return 8;
  if (board.degraded || board.dataState === "offline" || board.dataState === "stale") return 4;
  if (board.error || board.dataState === "error") return -10;
  return 6;
}

function getSourceCount(board: HotPlatform, item: HotItem, boards: HotPlatform[]) {
  const matched = new Set<string>([board.source]);

  for (const nextBoard of boards) {
    if (nextBoard.source === board.source) continue;
    if (nextBoard.items?.some((nextItem) => sameTopic(item.title, nextItem.title))) {
      matched.add(nextBoard.source);
    }
  }

  return matched.size;
}

function getScore(board: HotPlatform, item: HotItem, sourceCount: number) {
  const rankScore = Math.max(0, 100 - (item.rank || 10) * 7);
  const heat = parseHeat(item.heat);
  const heatScore = heat > 0 ? Math.min(42, Math.log10(heat + 1) * 7) : 8;
  const crossScore = (sourceCount - 1) * 12;
  return Math.round(rankScore + heatScore + crossScore + getSourceScore(board));
}

function getReason(board: HotPlatform, item: HotItem, sourceCount: number) {
  const metric = getMetricText(board, item);
  const parts = [`${getSourceName(board)} 第 ${item.rank || "-"} 名`];
  if (metric) parts.push(metric);
  if (sourceCount > 1) parts.push(`${sourceCount} 个来源出现相似信号`);
  if (board.strategy?.noPublicApi) parts.push("无公开 API，已启用兜底策略");
  if (item.cnUrl || item.originalUrl) parts.push("提供国内入口");
  return parts.join(" · ");
}

export function buildCompositeRanking(boards: HotPlatform[], limit = 20): RankedHot[] {
  return boards
    .flatMap((board) =>
      (board.items || []).map((item) => {
        const sourceCount = getSourceCount(board, item, boards);
        return {
          board,
          item,
          sourceCount,
          score: getScore(board, item, sourceCount),
          reason: getReason(board, item, sourceCount),
        };
      }),
    )
    .sort((a, b) => b.score - a.score || a.item.rank - b.item.rank)
    .slice(0, limit);
}

export function buildLeadCategories(boards: HotPlatform[]): LeadCategory[] {
  return categoryConfig.map((category) => {
    const categoryBoards = boards.filter((board) => category.sources.includes(board.source) && board.items?.length);
    const ranking = buildCompositeRanking(categoryBoards, 1);
    const top = ranking[0];
    const sourceNames = categoryBoards.slice(0, 4).map(getSourceName).join("、");

    if (!top) {
      return {
        code: category.code,
        className: category.className,
        title: category.fallbackTitle,
        desc: category.fallbackDesc,
        sourceCount: categoryBoards.length,
      };
    }

    return {
      code: category.code,
      className: category.className,
      title: top.item.title,
      desc: `${sourceNames || "相关平台"} 正在升温。${top.reason}`,
      sourceCount: categoryBoards.length,
    };
  });
}

export function buildShareDigest(ranking: RankedHot[], leads: LeadCategory[]) {
  const leadText = leads.map((lead) => `${lead.code}: ${lead.title}`).join("\n");
  const topText = ranking
    .slice(0, 8)
    .map((entry, index) => `${index + 1}. ${entry.item.title}（${getSourceName(entry.board)}，${entry.score}分）`)
    .join("\n");

  return `今日热搜快报\n\n今日主线：\n${leadText}\n\n全网综合 Top 8：\n${topText}\n\n查看完整榜单：${window.location.href}`;
}
