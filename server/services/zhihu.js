const { fetchJson } = require("./http");

const fallbackItems = [
  ["如何看待 AI 编程工具进入日常开发", "356.2万", "AI 工具进入真实工作流的讨论持续升温。"],
  ["普通人怎样建立长期稳定的阅读习惯", "338.7万", "学习成长类话题长期在知乎保持讨论热度。"],
  ["年轻人存钱变难了吗", "286.1万", "消费、收入和长期规划相关问题受到关注。"],
  ["高效远程协作需要哪些基本规范", "263.8万", "远程办公和团队协作方式继续演进。"],
  ["什么样的简历更容易被看见", "241.4万", "求职季职业发展讨论热度较高。"],
  ["城市通勤时间会影响幸福感吗", "226.9万", "城市生活体验和通勤成本受到关注。"],
  ["夏季运动如何避免过度疲劳", "208.6万", "健康生活类问题进入高频讨论。"],
  ["如何评价最近的国产动画电影", "184.3万", "内容产业和国漫作品讨论增加。"],
  ["厨房小家电哪些是真的实用", "162.5万", "消费决策类问题适合知乎长讨论。"],
  ["AI 时代还需要学习编程基础吗", "151.8万", "技术教育和职业转型相关话题。"],
];

function normalizeFromUnknown(data) {
  const rawList =
    data?.data?.items ||
    data?.data?.list ||
    data?.data ||
    data?.result ||
    data?.list ||
    [];

  return Array.isArray(rawList) ? rawList : [];
}

function pickTitle(item) {
  return (
    item.title ||
    item.name ||
    item.word ||
    item.hotTitle ||
    item.question?.title ||
    item.target?.title ||
    item.target?.question?.title ||
    "未命名知乎话题"
  );
}

function pickUrl(item, title) {
  return (
    item.url ||
    item.link ||
    item.mobileUrl ||
    item.target?.url ||
    item.question?.url ||
    `https://www.zhihu.com/search?q=${encodeURIComponent(title)}`
  );
}

async function fetchZhihuHot({ q = "" } = {}) {
  const api = process.env.ZHIHU_HOT_API || "https://api-hot.imsyy.top/zhihu";
  let list = [];
  let degraded = false;
  let message;

  try {
    const data = await fetchJson(api);
    list = normalizeFromUnknown(data);
    if (!list.length) {
      throw new Error("empty zhihu hot list");
    }
  } catch (error) {
    degraded = true;
    message = "知乎官方接口需要认证，第三方接口暂不可用，已切换为知乎示例热榜。";
    list = fallbackItems.map(([title, heat, summary]) => ({ title, heat, summary }));
  }

  const filtered = q ? list.filter((item) => pickTitle(item).includes(q)) : list;

  return {
    source: "zhihu",
    sourceName: "知乎热榜",
    listName: degraded ? "知乎热榜（降级）" : "讨论热度榜",
    updatedAt: new Date().toISOString(),
    degraded,
    message,
    items: filtered.slice(0, 10).map((item, index) => {
      const title = pickTitle(item);
      return {
        rank: index + 1,
        title,
        heat: item.heat || item.hot || item.metrics || item.excerpt || "热榜",
        url: pickUrl(item, title),
        summary: item.summary || item.desc || item.excerpt || item.answer_count_text || "",
      };
    }),
  };
}

module.exports = {
  fetchZhihuHot,
};
