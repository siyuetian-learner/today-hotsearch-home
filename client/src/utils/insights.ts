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
  summary: string;
  reason: string;
};

type CompositeCandidate = {
  board: HotPlatform;
  item: HotItem;
};

type CompositeCluster = {
  entries: CompositeCandidate[];
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

const geoTokens = [
  "北京",
  "上海",
  "天津",
  "重庆",
  "河北",
  "山西",
  "辽宁",
  "吉林",
  "黑龙江",
  "江苏",
  "浙江",
  "安徽",
  "福建",
  "江西",
  "山东",
  "河南",
  "湖北",
  "湖南",
  "广东",
  "海南",
  "四川",
  "贵州",
  "云南",
  "陕西",
  "甘肃",
  "青海",
  "台湾",
  "内蒙古",
  "广西",
  "西藏",
  "宁夏",
  "新疆",
  "香港",
  "澳门",
];

function extractGeoTokens(value: string) {
  const normalized = normalizeTitle(value);
  return geoTokens.filter((token) => normalized.includes(token));
}

function hasConflictingGeo(a: string, b: string) {
  const left = extractGeoTokens(a);
  const right = extractGeoTokens(b);

  if (!left.length || !right.length) return false;
  return !left.some((token) => right.includes(token));
}

function sameTopic(a: string, b: string) {
  if (hasConflictingGeo(a, b)) return false;

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

  const overlap = hits / Math.min(leftGrams.size, rightGrams.size);
  return hits >= 4 && overlap >= 0.52;
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

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = 72) {
  const chars = Array.from(cleanText(value));
  if (chars.length <= max) return chars.join("");
  return `${chars.slice(0, max).join("")}...`;
}

function hasMostlyEnglish(value = "") {
  const letters = value.match(/[a-z]/gi)?.length || 0;
  const han = value.match(/\p{Script=Han}/gu)?.length || 0;
  return letters > 18 && letters > han * 2;
}

function inferEnglishTopic(title = "", summary = "") {
  const text = `${title} ${summary}`.toLowerCase();
  const topics = [];

  if (/medical|health|clinic|doctor|patient/.test(text)) topics.push("医疗健康");
  if (/agent|copilot|assistant|ai|llm|model|midjourney/.test(text)) topics.push("AI 工具或模型能力");
  if (/code|developer|github|repo|open source|api|sdk/.test(text)) topics.push("开发者工具和开源项目");
  if (/database|sqlite|search|retrieval|rag|index/.test(text)) topics.push("数据检索或知识库");
  if (/design|ui|image|video|browser|web/.test(text)) topics.push("内容生成、视觉设计或 Web 技术");
  if (/startup|funding|company|business|pricing/.test(text)) topics.push("创业、商业模式或产品策略");

  return topics.length ? topics.slice(0, 2).join("、") : "相关技术或产品方向";
}

function getUseCase(board: HotPlatform, item: HotItem) {
  const title = item.title.toLowerCase();
  const summary = cleanText(item.summary || "").toLowerCase();
  const text = `${title} ${summary}`;

  if (board.source === "huggingface") {
    if (/embedding|reranker|retrieval|检索|向量|重排序/.test(text)) return "可用于搜索、知识库、RAG 检索和语义匹配。";
    if (/image|vision|video|图像|视觉|多模态/.test(text)) return "可用于图像理解、视觉问答、多模态内容处理。";
    if (/speech|audio|voice|语音|音频/.test(text)) return "可用于语音识别、音频理解或语音交互。";
    if (/text-generation|llm|chat|agent|推理|生成/.test(text)) return "可用于文本生成、智能问答、Agent 或研究验证。";
    return "可用于 AI 模型选型、能力验证或应用原型开发。";
  }

  if (board.source === "github") {
    if (/agent|codex|claude|cursor|copilot|ai/.test(text)) return "可用于 AI 开发工作流、代码辅助或自动化工具搭建。";
    if (/ui|design|ppt|slide|animation|html/.test(text)) return "可用于界面设计、演示材料或前端原型制作。";
    if (/security|guard|test|quality|lint/.test(text)) return "可用于代码质量、安全检查或工程流程治理。";
    return "可用于开源项目调研、工程复用或技术选型。";
  }

  if (["aihot", "hackernews", "36kr", "ithome"].includes(board.source)) {
    return "适合判断技术趋势、产品机会和后续跟进优先级。";
  }

  if (["weibo", "douyin", "bilibili", "zhihu"].includes(board.source)) {
    return "适合判断大众讨论、内容选题和传播热度。";
  }

  if (["baidu", "toutiao"].includes(board.source)) {
    return "适合快速了解新闻、民生和搜索趋势。";
  }

  return "适合快速判断这个热点是否值得继续打开查看。";
}

function getSummary(board: HotPlatform, item: HotItem) {
  const rawSummary = cleanText(item.summary || "");
  const sourceType = item.sourceType || board.listName || "";

  if (board.source === "huggingface") {
    const modelMeta =
      rawSummary && !hasMostlyEnglish(rawSummary)
        ? `AI 模型：${truncate(rawSummary, 46)}`
        : `AI 模型：主题与${inferEnglishTopic(item.title, rawSummary)}有关。`;
    return `${modelMeta} ${getUseCase(board, item)}`;
  }

  if (board.source === "github") {
    const repoDesc =
      rawSummary && !hasMostlyEnglish(rawSummary)
        ? `开源项目：${truncate(rawSummary, 52)}`
        : `开源项目：主题与${inferEnglishTopic(item.title, rawSummary)}有关。`;
    return `${repoDesc} ${getUseCase(board, item)}`;
  }

  if (["aihot", "hackernews", "36kr", "ithome"].includes(board.source)) {
    if (rawSummary && !hasMostlyEnglish(rawSummary)) return `${truncate(rawSummary, 72)} ${getUseCase(board, item)}`;
    if (rawSummary && hasMostlyEnglish(rawSummary)) return `这条内容与${inferEnglishTopic(item.title, rawSummary)}有关。${getUseCase(board, item)}`;
    return getUseCase(board, item);
  }

  if (rawSummary) return truncate(rawSummary, 76);
  if (sourceType) return `${sourceType}热点，${getUseCase(board, item)}`;
  return getUseCase(board, item);
}

function getReason(board: HotPlatform, item: HotItem, sourceCount: number) {
  const metric = getMetricText(board, item);
  const parts = [`${getSourceName(board)}第 ${item.rank || "-"} 名`];

  if (metric) parts.push(metric);
  if (sourceCount > 1) parts.push(`${sourceCount} 个来源出现相似信号`);
  if (item.cnUrl || item.originalUrl) parts.push("有国内入口 / 原站链接");

  return parts.join(" · ");
}

function getLeadDescription(code: string, top: RankedHot) {
  const sourceName = getSourceName(top.board);
  const metric = getMetricText(top.board, top.item);
  const signal = metric ? `${sourceName}第 ${top.item.rank || "-"} 名，${metric}` : `${sourceName}第 ${top.item.rank || "-"} 名`;

  if (code === "AI") {
    return `AI 工具、模型和开源项目仍是今天的主要增量。当前信号来自${signal}，适合优先判断是否影响工作流和工具选型。`;
  }

  if (code === "NEWS") {
    return `公共事件、民生服务和搜索趋势构成今天的新闻背景。当前信号来自${signal}，适合快速了解大众关注点。`;
  }

  if (code === "SOCIAL") {
    return `社交与视频平台正在放大大众情绪和内容选题。当前信号来自${signal}，适合判断传播热度和内容方向。`;
  }

  if (code === "TECH") {
    return `科技和开发者社区更关注工具效率、产品采购和开源实践。当前信号来自${signal}，适合继续做技术跟进。`;
  }

  return `${sourceName}出现新的高热信号，适合继续打开详情确认背景和影响。`;
}

function buildCandidateClusters(candidates: CompositeCandidate[]) {
  const clusters: CompositeCluster[] = [];

  for (const candidate of candidates) {
    const found = clusters.find((cluster) =>
      cluster.entries.some((entry) => sameTopic(candidate.item.title, entry.item.title)),
    );

    if (found) {
      found.entries.push(candidate);
    } else {
      clusters.push({ entries: [candidate] });
    }
  }

  return clusters;
}

function getClusterSourceCount(cluster: CompositeCluster) {
  return new Set(cluster.entries.map((entry) => entry.board.source)).size;
}

function getClusterRepresentative(cluster: CompositeCluster): RankedHot {
  const sourceCount = getClusterSourceCount(cluster);
  const ranked = cluster.entries
    .map(({ board, item }) => ({
      board,
      item,
      sourceCount,
      score: getScore(board, item, sourceCount),
      summary: getSummary(board, item),
      reason: getReason(board, item, sourceCount),
    }))
    .sort((a, b) => b.score - a.score || a.item.rank - b.item.rank);

  return ranked[0];
}

export function buildCompositeRanking(boards: HotPlatform[], limit = 20): RankedHot[] {
  const candidates = boards.flatMap((board) => (board.items || []).map((item) => ({ board, item })));

  return buildCandidateClusters(candidates)
    .map((cluster) => getClusterRepresentative(cluster))
    .sort((a, b) => b.score - a.score || a.item.rank - b.item.rank)
    .slice(0, limit);
}

export function buildLeadCategories(boards: HotPlatform[]): LeadCategory[] {
  return categoryConfig.map((category) => {
    const categoryBoards = boards.filter((board) => category.sources.includes(board.source) && board.items?.length);
    const ranking = buildCompositeRanking(categoryBoards, 1);
    const top = ranking[0];

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
      desc: getLeadDescription(category.code, top),
      sourceCount: categoryBoards.length,
    };
  });
}

export function buildShareDigest(ranking: RankedHot[], leads: LeadCategory[]) {
  const leadText = leads.map((lead) => `${lead.code}: ${lead.title}`).join("\n");
  const topText = ranking
    .slice(0, 8)
    .map((entry, index) => `${index + 1}. ${entry.item.title}（${getSourceName(entry.board)}，综合分 ${entry.score}）`)
    .join("\n");

  return `今日热搜快报\n\n今日主线：\n${leadText}\n\n全网综合 Top 8：\n${topText}\n\n查看完整榜单：${window.location.href}`;
}
