const { fetchJson } = require("./http");

async function fetchWeiboHot({ q = "" } = {}) {
  const data = await fetchJson("https://weibo.com/ajax/side/hotSearch", {
    headers: {
      referer: "https://weibo.com/",
    },
  });
  const list = data?.data?.realtime || [];
  const filtered = q
    ? list.filter((item) => String(item.note || item.word || "").includes(q))
    : list;

  return {
    source: "weibo",
    sourceName: "微博热搜",
    listName: "全站热搜榜",
    updatedAt: new Date().toISOString(),
    items: filtered.slice(0, 10).map((item, index) => {
      const title = item.note || item.word || item.word_scheme || "未命名话题";
      const keyword = item.word || title;
      return {
        rank: index + 1,
        title,
        heat: item.num ? `${item.num}` : item.label_name || "热搜",
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`,
        summary: item.label_name || item.flag_desc || item.icon_desc || "",
      };
    }),
  };
}

module.exports = {
  fetchWeiboHot,
};
