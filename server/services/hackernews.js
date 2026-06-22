const { fetchJsonWithRetry } = require("./http");

const apiBase = "https://hacker-news.firebaseio.com/v0";

const fallbackStories = [
  ["Show HN: A small local-first notes database", "326 points · 118 comments", "这是开发者展示的本地优先笔记数据库，重点看它如何在离线、同步和个人知识管理之间取舍。"],
  ["SQLite on the edge: practical lessons", "284 points · 86 comments", "这是关于边缘环境中使用 SQLite 的工程经验，适合关注轻量数据库、部署成本和可靠性的人。"],
  ["Why good developer tools feel invisible", "251 points · 72 comments", "这是开发者工具体验讨论，核心是好工具如何减少打断、降低操作成本并提升编码效率。"],
  ["A deep dive into browser rendering performance", "219 points · 54 comments", "这是浏览器渲染性能解析，适合前端开发者理解页面卡顿、布局和绘制瓶颈。"],
  ["Ask HN: How are you using local AI models?", "198 points · 143 comments", "这是社区问答，讨论本地 AI 模型在隐私、成本、离线使用和个人工作流中的真实用法。"],
  ["Open source maintainers and sustainable funding", "176 points · 49 comments", "这是开源维护者可持续收入讨论，重点看开源项目如何在社区价值和商业化之间平衡。"],
  ["Building reliable cron jobs in serverless apps", "153 points · 37 comments", "这是 Serverless 定时任务实践，适合关注任务重试、监控告警和线上稳定性的开发者。"],
  ["The quiet return of personal websites", "141 points · 62 comments", "这是个人网站和独立发布回潮的讨论，适合内容创作者和开发者观察发布工具趋势。"],
  ["Lessons from rewriting a compiler in Rust", "128 points · 31 comments", "这是用 Rust 重写编译器的复盘，重点看系统语言、性能和工程维护性的取舍。"],
  ["A visual guide to database indexes", "113 points · 25 comments", "这是数据库索引可视化教程，适合快速理解查询加速、索引结构和性能优化。"],
];

function fallbackItems(q) {
  const keyword = q.trim().toLowerCase();

  return fallbackStories
    .map(([title, heat, summary], index) => ({
      rank: index + 1,
      title,
      url: "#",
      heat: "示例热度",
      summary,
      sample: true,
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

function inferStoryTopic(title = "") {
  const text = title.toLowerCase();
  const tags = [];

  if (/medical|health|clinic|patient|doctor/.test(text)) tags.push("医疗健康");
  if (/ai|llm|agent|midjourney|model|neural/.test(text)) tags.push("AI 工具或模型");
  if (/code|developer|github|open source|compiler|rust|python|javascript|api|sdk/.test(text)) tags.push("开发者工具或开源技术");
  if (/database|sqlite|postgres|search|index|retrieval|rag/.test(text)) tags.push("数据存储、检索或知识库");
  if (/browser|web|css|html|ui|design|image|video/.test(text)) tags.push("Web、设计或内容生成");
  if (/startup|funding|business|pricing|company/.test(text)) tags.push("创业、商业模式或产品策略");

  return tags.length ? tags.slice(0, 2).join("、") : "技术产品、工程实践或社区观点";
}

function buildStorySummary(story) {
  const title = decodeHtml(story.title || "");
  const topic = inferStoryTopic(title);

  if (/^ask hn/i.test(title)) {
    return `这是 Hacker News 的社区问答，讨论重点与${topic}有关。适合快速了解海外开发者正在遇到的问题、采用的工具和真实反馈。`;
  }

  if (/^show hn/i.test(title)) {
    return `这是开发者在 Hacker News 展示的新项目，主题与${topic}有关。可以关注它解决了什么问题、是否有可复用的产品或技术思路。`;
  }

  return `这是 Hacker News 技术社区正在讨论的一条链接，主题与${topic}有关。它的分数和评论数较高，说明开发者正在集中讨论它的价值、实现方式或潜在影响。`;
}

async function fetchHackerNews({ q = "" } = {}) {
  let stories = [];
  let degraded = false;
  let message;
  let accessMode = "Hacker News Firebase API";

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

  if (degraded || stories.length < 10) {
    try {
      const data = await fetchJsonWithRetry("https://hn.algolia.com/api/v1/search?tags=front_page", {
        timeoutMs: 8000,
        retries: 1,
      });
      const algoliaStories = (Array.isArray(data?.hits) ? data.hits : [])
        .map((hit) => ({
          id: hit.objectID,
          title: hit.title || hit.story_title,
          url: hit.url || hit.story_url,
          score: hit.points,
          descendants: hit.num_comments,
          type: "story",
        }))
        .filter((item) => item.title);

      if (algoliaStories.length > stories.length) {
        stories = algoliaStories;
        degraded = false;
        message = undefined;
        accessMode = "Hacker News Algolia Front Page API";
      }
    } catch {
      degraded = true;
    }
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
      sample: true,
      message,
      accessMode: "内置离线样例",
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
        summary: buildStorySummary(story),
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
    accessMode,
  };
}

module.exports = {
  fetchHackerNews,
};
