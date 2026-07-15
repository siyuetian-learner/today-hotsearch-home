const { fetchJson } = require("./http");

const DEFAULT_WEB_API =
  "https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=20&desktop=true";
const DEFAULT_MOBILE_API = "https://api.zhihu.com/topstory/hot-lists/total?limit=50";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function questionIdFrom(value) {
  const match = String(value || "").match(/questions?\/(\d+)|question\/(\d+)|(\d+)$/);
  return match?.[1] || match?.[2] || match?.[3] || "";
}

function questionUrl(id, fallback = "") {
  if (id) return `https://www.zhihu.com/question/${id}`;
  if (/^https?:\/\//i.test(fallback)) return fallback;
  return "";
}

function normalizeZhihuWebItems(payload) {
  const list = Array.isArray(payload?.data) ? payload.data : [];

  return list
    .map((entry) => {
      const target = entry?.target || {};
      const rawUrl = text(target.link?.url);
      const id = questionIdFrom(rawUrl || entry?.card_id || entry?.id);
      const title = text(target.title_area?.text);

      return {
        id,
        title,
        summary: text(target.excerpt_area?.text),
        heat: text(target.metrics_area?.text) || "知乎热榜",
        url: questionUrl(id, rawUrl),
      };
    })
    .filter((item) => item.title && item.url);
}

function normalizeZhihuApiItems(payload) {
  const list = Array.isArray(payload?.data) ? payload.data : [];

  return list
    .map((entry) => {
      const target = entry?.target || {};
      const id = String(target.id || questionIdFrom(target.url)).trim();
      const title = text(target.title);

      return {
        id,
        title,
        summary: text(target.excerpt),
        heat: text(entry?.detail_text) || "知乎热榜",
        url: questionUrl(id, text(target.url)),
      };
    })
    .filter((item) => item.title && item.url);
}

function normalizeAggregateItems(payload) {
  const list =
    payload?.data?.items ||
    payload?.data?.list ||
    payload?.data ||
    payload?.result ||
    payload?.list ||
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((entry) => {
      const target = entry?.target || {};
      const title = text(entry?.title || entry?.name || entry?.word || target?.title);
      const rawUrl = text(entry?.url || entry?.link || entry?.mobileUrl || target?.url);
      const id = String(entry?.id || target?.id || questionIdFrom(rawUrl)).trim();

      return {
        id,
        title,
        summary: text(entry?.summary || entry?.desc || entry?.excerpt || target?.excerpt),
        heat: entry?.heat || entry?.hot || entry?.metrics || entry?.detail_text || "知乎热榜",
        url: questionUrl(id, rawUrl) || `https://www.zhihu.com/search?q=${encodeURIComponent(title)}`,
      };
    })
    .filter((item) => item.title && item.url);
}

function dedupeItems(items) {
  const seen = new Set();

  return items.filter((item) => {
    const titleKey = item.title.replace(/[\s\p{P}\p{S}]+/gu, "").toLowerCase();
    const key = item.id ? `id:${item.id}` : `title:${titleKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function configuredAggregateApis() {
  return [
    ...String(process.env.ZHIHU_HOT_APIS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    process.env.ZHIHU_HOT_API || "",
  ].filter((value, index, list) => value && list.indexOf(value) === index);
}

function createZhihuFetcher({ fetchJsonImpl = fetchJson, aggregateApis } = {}) {
  return async function fetchZhihuHot({ q = "" } = {}) {
    const sources = [
      {
        url: process.env.ZHIHU_WEB_API || DEFAULT_WEB_API,
        normalize: normalizeZhihuWebItems,
        accessMode: "知乎实时热榜 JSON",
      },
      {
        url: process.env.ZHIHU_MOBILE_API || DEFAULT_MOBILE_API,
        normalize: normalizeZhihuApiItems,
        accessMode: "知乎移动端热榜 JSON",
      },
      ...(aggregateApis ?? configuredAggregateApis()).map((url) => ({
        url,
        normalize: normalizeAggregateItems,
        accessMode: "第三方聚合接口",
      })),
    ];

    const errors = [];

    for (const source of sources) {
      try {
        const payload = await fetchJsonImpl(source.url, {
          timeoutMs: 8000,
          headers: {
            referer: "https://www.zhihu.com/hot",
            origin: "https://www.zhihu.com",
            "accept-language": "zh-CN,zh;q=0.9",
          },
        });
        const normalized = dedupeItems(source.normalize(payload));
        if (!normalized.length) throw new Error("empty hot list");

        const keyword = String(q || "").trim().toLowerCase();
        const filtered = keyword
          ? normalized.filter(
              (item) =>
                item.title.toLowerCase().includes(keyword) ||
                item.summary.toLowerCase().includes(keyword),
            )
          : normalized;

        return {
          source: "zhihu",
          sourceName: "知乎热榜",
          listName: "讨论热度榜",
          updatedAt: new Date().toISOString(),
          degraded: false,
          dataState: "live",
          accessMode: source.accessMode,
          sample: false,
          items: filtered.slice(0, 10).map((item, index) => ({
            rank: index + 1,
            title: item.title,
            heat: item.heat,
            url: item.url,
            summary: item.summary,
            sample: false,
          })),
        };
      } catch (error) {
        errors.push(`${source.url}: ${error.message}`);
      }
    }

    const error = new Error("知乎实时热榜暂不可用，请使用最近成功快照。");
    error.causes = errors;
    throw error;
  };
}

const fetchZhihuHot = createZhihuFetcher();

module.exports = {
  createZhihuFetcher,
  fetchZhihuHot,
  normalizeAggregateItems,
  normalizeZhihuApiItems,
  normalizeZhihuWebItems,
};
