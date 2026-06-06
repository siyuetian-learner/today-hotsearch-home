const { fetchJsonWithRetry } = require("./http");

const apiBase = "https://hacker-news.firebaseio.com/v0";

const fallbackStories = [
  ["Show HN: A small local-first notes database", "326 points · 118 comments", "Show HN 内容常代表开发者社区的新工具试验。"],
  ["SQLite on the edge: practical lessons", "284 points · 86 comments", "基础设施和数据库工程经验在 HN 上持续受欢迎。"],
  ["Why good developer tools feel invisible", "251 points · 72 comments", "工具体验和生产力话题容易引发高质量讨论。"],
  ["A deep dive into browser rendering performance", "219 points · 54 comments", "前端性能和浏览器内部机制仍是开发者关注重点。"],
  ["Ask HN: How are you using local AI models?", "198 points · 143 comments", "本地模型和隐私计算是近年高频议题。"],
  ["Open source maintainers and sustainable funding", "176 points · 49 comments", "开源治理和商业化讨论具备长期价值。"],
  ["Building reliable cron jobs in serverless apps", "153 points · 37 comments", "Serverless 运维经验和故障复盘常进入热门。"],
  ["The quiet return of personal websites", "141 points · 62 comments", "独立网站和内容发布工具获得社区关注。"],
  ["Lessons from rewriting a compiler in Rust", "128 points · 31 comments", "系统语言和编译器实践保持固定受众。"],
  ["A visual guide to database indexes", "113 points · 25 comments", "高质量技术解释类文章容易获得收藏。"],
];

function fallbackItems(q) {
  const keyword = q.trim().toLowerCase();

  return fallbackStories
    .map(([title, heat, summary], index) => ({
      rank: index + 1,
      title,
      url: "#",
      heat,
      summary,
      sourceType: "技术社区",
      trend: index < 4 ? "up" : "steady",
      why: "Hacker News 离线样例，用于上游不可用时保持开发者榜单可读。",
    }))
    .filter((item) => !keyword || `${item.title} ${item.summary}`.toLowerCase().includes(keyword));
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchHackerNews({ q = "" } = {}) {
  let stories = [];
  let degraded = false;
  let message;

  try {
    const ids = await fetchJsonWithRetry(`${apiBase}/topstories.json`, { timeoutMs: 6000, retries: 1 });
    const storyIds = Array.isArray(ids) ? ids.slice(0, 12) : [];
    const details = await Promise.allSettled(
      storyIds.map((id) => fetchJsonWithRetry(`${apiBase}/item/${id}.json`, { timeoutMs: 4500, retries: 0 })),
    );

    stories = details
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((item) => item && item.type === "story" && item.title);

    if (!stories.length) {
      degraded = true;
      message = "Hacker News 返回为空，已切换为内置离线快照。";
    }
  } catch (error) {
    degraded = true;
    message = "Hacker News 官方 API 暂不可用，已切换为内置离线快照。";
  }

  if (degraded) {
    return {
      source: "hackernews",
      sourceName: "Hacker News",
      listName: "技术社区 Top Stories（离线快照）",
      updatedAt: new Date().toISOString(),
      items: fallbackItems(q).slice(0, 10),
      degraded: true,
      dataState: "offline",
      message,
    };
  }

  const keyword = q.trim().toLowerCase();
  const items = stories
    .map((story, index) => {
      const comments = Number(story.descendants || 0);
      const score = Number(story.score || 0);
      const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;

      return {
        rank: index + 1,
        title: decodeHtml(story.title),
        url,
        heat: `${score} points · ${comments} comments`,
        summary: `作者 ${story.by || "unknown"}，讨论入口保留在 HN 原帖。`,
        originalUrl: `https://news.ycombinator.com/item?id=${story.id}`,
        sourceType: "技术社区",
        trend: index < 3 ? "up" : index < 8 ? "steady" : "down",
        why: "分数和评论数共同偏高，说明开发者社区正在集中讨论。",
      };
    })
    .filter((item) => !keyword || `${item.title} ${item.summary}`.toLowerCase().includes(keyword))
    .slice(0, 10)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    source: "hackernews",
    sourceName: "Hacker News",
    listName: "Top Stories",
    updatedAt: new Date().toISOString(),
    items,
    dataState: "live",
  };
}

module.exports = {
  fetchHackerNews,
};
