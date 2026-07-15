const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createZhihuFetcher,
  normalizeZhihuApiItems,
  normalizeZhihuWebItems,
} = require("../services/zhihu");

test("normalizes the zhihu web hot-list response", () => {
  const items = normalizeZhihuWebItems({
    data: [
      {
        target: {
          title_area: { text: "实时问题一" },
          excerpt_area: { text: "这是问题一的摘要" },
          metrics_area: { text: "321 万热度" },
          link: { url: "https://www.zhihu.com/question/1001" },
        },
      },
    ],
  });

  assert.deepEqual(items, [
    {
      id: "1001",
      title: "实时问题一",
      summary: "这是问题一的摘要",
      heat: "321 万热度",
      url: "https://www.zhihu.com/question/1001",
    },
  ]);
});

test("normalizes the api.zhihu.com hot-list response", () => {
  const items = normalizeZhihuApiItems({
    data: [
      {
        target: {
          id: "2002",
          title: "实时问题二",
          excerpt: "这是问题二的摘要",
          url: "https://api.zhihu.com/questions/2002",
        },
        detail_text: "456 万热度",
      },
    ],
  });

  assert.deepEqual(items, [
    {
      id: "2002",
      title: "实时问题二",
      summary: "这是问题二的摘要",
      heat: "456 万热度",
      url: "https://www.zhihu.com/question/2002",
    },
  ]);
});

test("uses the secondary endpoint, removes duplicates and applies query filtering", async () => {
  const calls = [];
  const fetcher = createZhihuFetcher({
    fetchJsonImpl: async (url) => {
      calls.push(url);
      if (url.includes("hot-list-web")) throw new Error("primary unavailable");
      if (url.includes("api.zhihu.com")) {
        return {
          data: [
            {
              target: { id: "3003", title: "AI 实时问题", excerpt: "AI 摘要", url: "/questions/3003" },
              detail_text: "100 万热度",
            },
            {
              target: { id: "3003", title: "AI 实时问题", excerpt: "重复", url: "/questions/3003" },
              detail_text: "99 万热度",
            },
            {
              target: { id: "4004", title: "其他问题", excerpt: "其他", url: "/questions/4004" },
              detail_text: "80 万热度",
            },
          ],
        };
      }
      throw new Error("unexpected endpoint");
    },
    aggregateApis: [],
  });

  const platform = await fetcher({ q: "AI" });

  assert.equal(calls.length, 2);
  assert.equal(platform.dataState, "live");
  assert.equal(platform.sample, false);
  assert.equal(platform.items.length, 1);
  assert.equal(platform.items[0].url, "https://www.zhihu.com/question/3003");
});

test("throws when every live source fails so the shared snapshot layer can recover", async () => {
  const fetcher = createZhihuFetcher({
    fetchJsonImpl: async () => {
      throw new Error("upstream unavailable");
    },
    aggregateApis: ["https://aggregate.example/zhihu"],
  });

  await assert.rejects(fetcher(), /知乎实时热榜暂不可用/);
});
