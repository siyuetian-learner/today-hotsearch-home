const { fetchJson } = require("./http");

async function fetchBilibiliHot({ q = "" } = {}) {
  const data = await fetchJson("https://s.search.bilibili.com/main/hotword?limit=20", {
    headers: {
      referer: "https://www.bilibili.com/",
    },
  });
  const list = data?.list || [];
  const filtered = q
    ? list.filter((item) => String(item.show_name || item.keyword || "").includes(q))
    : list;

  return {
    source: "bilibili",
    sourceName: "B站热搜",
    listName: "站内搜索榜",
    updatedAt: new Date().toISOString(),
    items: filtered.slice(0, 10).map((item, index) => {
      const title = item.show_name || item.keyword || "未命名关键词";
      return {
        rank: index + 1,
        title,
        heat: item.heat_score ? `${item.heat_score}` : item.heat_layer || "热搜",
        url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(title)}`,
        summary: item.heat_layer ? `热度层级 ${item.heat_layer}` : "",
      };
    }),
  };
}

module.exports = {
  fetchBilibiliHot,
};
