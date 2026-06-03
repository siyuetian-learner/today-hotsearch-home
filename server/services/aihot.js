const { fetchJson } = require("./http");

async function fetchAihot({ q = "" } = {}) {
  const url = new URL("https://aihot.virxact.com/api/public/items");
  url.searchParams.set("mode", "selected");

  if (q) {
    // AI HOT 的公开 API 支持服务端关键词搜索，避免客户端拉全量后再过滤。
    url.searchParams.set("q", q);
  }

  const data = await fetchJson(url.toString());
  const items = (data.items || []).slice(0, 10).map((item, index) => ({
    rank: index + 1,
    title: item.title || item.title_en || "未命名 AI 动态",
    heat: item.category ? `分类：${item.category}` : item.source || "精选",
    url: item.url || "https://aihot.virxact.com/",
    summary: item.summary || item.source || "",
  }));

  return {
    source: "aihot",
    sourceName: "AI HOT",
    listName: "AI 精选动态",
    updatedAt: new Date().toISOString(),
    items,
  };
}

module.exports = {
  fetchAihot,
};
