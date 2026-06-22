const defaultStrategy = {
  active: "后端聚合",
  primary: "公开接口",
  fallbacks: ["内存缓存", "历史快照", "内置离线数据"],
  domesticAccess: "前端只访问本站 API，原站访问不稳定时展示缓存或快照。",
  noPublicApi: false,
  note: "所有来源统一由后端采集、缓存和降级，前端不直连第三方站点。",
};

const strategies = {
  weibo: {
    active: "官方公开接口",
    primary: "微博公开 JSON 接口",
    fallbacks: ["内存缓存", "历史快照", "错误卡片"],
    domesticAccess: "国内用户访问本站后端即可读取整理后的微博热搜。",
  },
  baidu: {
    active: "公开页面解析",
    primary: "百度热榜公开页面",
    fallbacks: ["DailyHotApi 聚合接口", "内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "由本站后端解析百度热榜页面并缓存返回，前端不跨站请求。",
  },
  zhihu: {
    active: "公开聚合 JSON",
    primary: "知乎公开聚合 JSON",
    fallbacks: ["知乎公开热榜页面解析", "历史快照", "内置离线数据"],
    domesticAccess: "知乎官方接口需要认证，本站后端优先使用公开聚合 JSON，失败后尝试公开页面，再显示快照。",
    note: "知乎热榜不是官方开放 API，聚合源失效时会明确标记降级状态。",
  },
  bilibili: {
    active: "官方公开接口",
    primary: "B站公开热词接口",
    fallbacks: ["内存缓存", "历史快照", "错误卡片"],
    domesticAccess: "国内用户访问本站后端即可读取整理后的 B站热搜。",
  },
  douyin: {
    active: "公开 JSON",
    primary: "抖音热榜公开 JSON",
    fallbacks: ["DailyHotApi 聚合接口", "内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "由本站后端抓取抖音热榜 JSON 并缓存，前端不直连抖音。",
  },
  toutiao: {
    active: "公开 JSON",
    primary: "今日头条热榜公开 JSON",
    fallbacks: ["DailyHotApi 聚合接口", "内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "前端不直连头条页面，统一读取本站缓存结果。",
  },
  "36kr": {
    active: "公开页面解析",
    primary: "36氪快讯页面",
    fallbacks: ["DailyHotApi 聚合接口", "内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "前端不直连 36氪页面，统一读取本站缓存结果。",
  },
  ithome: {
    active: "公开 RSS",
    primary: "IT之家 RSS",
    fallbacks: ["DailyHotApi 聚合接口", "内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "前端不直连 IT之家页面，统一读取本站缓存结果。",
  },
  huggingface: {
    active: "官方接口 + 国内镜像入口",
    primary: "Hugging Face Trending 接口",
    fallbacks: ["Hugging Face 国内镜像 Trending API", "历史快照", "内置模型推荐"],
    domesticAccess: "标题默认指向 Hugging Face 国内入口，同时保留原站链接。",
    note: "国内入口可通过 HUGGINGFACE_CN_BASE 替换。",
  },
  aihot: {
    active: "公开 REST API",
    primary: "AI HOT 公开接口",
    fallbacks: ["内存缓存", "历史快照", "错误卡片"],
    domesticAccess: "由本站后端中转并缓存，前端不直接请求第三方接口。",
  },
  github: {
    active: "官方接口 + 可选镜像入口",
    primary: "GitHub Search API",
    fallbacks: ["历史快照", "内置开源项目推荐", "可配置镜像入口"],
    domesticAccess: "默认保留 GitHub 原站链接；只有配置了可用 GITHUB_CN_BASE 时才显示国内入口，避免无效镜像 404。",
    note: "GitHub 镜像稳定性不固定，本站不会默认使用已知失效镜像。",
  },
  hackernews: {
    active: "官方公开接口",
    primary: "Hacker News Firebase API",
    fallbacks: ["Hacker News Algolia Front Page API", "内存缓存", "历史快照", "内置离线快照"],
    domesticAccess: "由本站后端抓取并缓存，前端不直连海外接口。",
  },
};

function getSourceStrategy(source) {
  return {
    ...defaultStrategy,
    ...(strategies[source] || {}),
  };
}

function getActiveStrategy(source, platform = {}) {
  const strategy = getSourceStrategy(source);

  if (platform.error || platform.dataState === "error") return "错误态";
  if (platform.dataState === "stale") return "历史快照";
  if (platform.dataState === "cached") return "缓存结果";
  if (platform.accessMode) return platform.accessMode;
  if (platform.dataState === "offline" || platform.degraded) {
    return strategy.noPublicApi ? "降级兜底" : "离线兜底";
  }

  return strategy.active;
}

function attachSourceStrategy(source, platform = {}) {
  const strategy = getSourceStrategy(source);

  return {
    ...platform,
    strategy: {
      ...strategy,
      active: getActiveStrategy(source, platform),
    },
  };
}

function listSourceStrategies(sourceOrder = []) {
  return sourceOrder.map((source) => ({
    source,
    strategy: getSourceStrategy(source),
  }));
}

module.exports = {
  attachSourceStrategy,
  getSourceStrategy,
  listSourceStrategies,
};
