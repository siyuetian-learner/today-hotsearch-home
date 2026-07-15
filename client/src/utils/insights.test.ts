import { describe, expect, it } from "vitest";
import type { HotPlatform } from "../types/hot";
import { buildCompositeRanking, buildLeadCategories } from "./insights";

function board(overrides: Partial<HotPlatform>): HotPlatform {
  return {
    source: "weibo",
    sourceName: "微博热搜",
    listName: "实时热搜",
    updatedAt: "2026-07-15T10:00:00.000Z",
    dataState: "live",
    items: [],
    ...overrides,
  };
}

describe("编辑型热点内容", () => {
  it("不让示例、离线或降级数据进入综合榜和今日主线", () => {
    const live = board({
      items: [{ rank: 1, title: "真实热点事件", url: "https://example.com/live", heat: 1000 }],
    });
    const sample = board({
      source: "zhihu",
      sourceName: "知乎热榜",
      sample: true,
      degraded: true,
      dataState: "offline",
      items: [{ rank: 1, title: "示例 AI 热点", url: "https://example.com/sample", sample: true }],
    });

    expect(buildCompositeRanking([sample, live]).map((entry) => entry.item.title)).toEqual(["真实热点事件"]);
    expect(buildLeadCategories([sample, live]).some((lead) => lead.title === "示例 AI 热点")).toBe(false);
  });

  it("把同一场比赛的不同标题聚合为一个事件", () => {
    const boards = [
      board({ items: [{ rank: 1, title: "西班牙力克法国进决赛", url: "https://example.com/1", heat: 1000 }] }),
      board({ source: "baidu", sourceName: "百度热搜", items: [{ rank: 1, title: "西班牙2比0法国", url: "https://example.com/2", heat: 900 }] }),
      board({ source: "douyin", sourceName: "抖音热榜", items: [{ rank: 1, title: "西班牙中场再现世界名画", url: "https://example.com/3", heat: 800 }] }),
    ];

    const ranking = buildCompositeRanking(boards);
    expect(ranking).toHaveLength(1);
    expect(ranking[0].sourceCount).toBe(3);
  });

  it("不会把不同地区的同类通知合并", () => {
    const boards = [
      board({ items: [{ rank: 1, title: "河南高考分数线公布", url: "https://example.com/henan" }] }),
      board({ source: "baidu", sourceName: "百度热搜", items: [{ rank: 1, title: "河北高考分数线公布", url: "https://example.com/hebei" }] }),
    ];

    expect(buildCompositeRanking(boards)).toHaveLength(2);
  });
});
