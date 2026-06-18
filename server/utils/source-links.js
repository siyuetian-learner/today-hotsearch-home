function encodeKeyword(value = "") {
  return encodeURIComponent(String(value || "").trim());
}

function buildSourceUrl(source, title = "") {
  const keyword = encodeKeyword(title);

  if (!keyword) return "#";

  const searchMap = {
    weibo: `https://s.weibo.com/weibo?q=${keyword}`,
    baidu: `https://www.baidu.com/s?wd=${keyword}`,
    zhihu: `https://www.zhihu.com/search?q=${keyword}`,
    bilibili: `https://search.bilibili.com/all?keyword=${keyword}`,
    douyin: `https://www.douyin.com/search/${keyword}`,
    toutiao: `https://www.toutiao.com/search/?keyword=${keyword}`,
    "36kr": `https://www.36kr.com/search/articles/${keyword}`,
    ithome: `https://www.ithome.com/search/?q=${keyword}`,
    aihot: `https://aihot.virxact.com/?q=${keyword}`,
    hackernews: `https://hn.algolia.com/?q=${keyword}`,
  };

  return searchMap[source] || "#";
}

function hasUsableUrl(item = {}) {
  return [item.url, item.originalUrl, item.cnUrl].some((value) => {
    const href = String(value || "").trim();
    return href && href !== "#";
  });
}

function ensureItemLink(source, item = {}) {
  if (hasUsableUrl(item)) return item;

  const url = buildSourceUrl(source, item.title);
  return url === "#" ? item : { ...item, url };
}

function ensurePlatformLinks(platform = {}) {
  return {
    ...platform,
    items: (platform.items || []).map((item) => ensureItemLink(platform.source, item)),
  };
}

module.exports = {
  buildSourceUrl,
  ensureItemLink,
  ensurePlatformLinks,
};
