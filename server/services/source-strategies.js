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
    active: "第三方聚合源",
    primary: "DailyHotApi 风格聚合接口",
    fallbacks: ["内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "聚合结果经本站后端缓存后返回，避免前端跨站请求。",
    noPublicApi: true,
  },
  zhihu: {
    active: "第三方源 + 公开页面兜底",
    primary: "第三方公开聚合接口",
    fallbacks: ["知乎公开热榜页面解析", "历史快照", "内置离线数据"],
    domesticAccess: "知乎官方接口需要认证，本站后端优先使用聚合源，失败后尝试公开页面，再显示快照。",
    noPublicApi: true,
    note: "知乎热榜不是官方开放 API，结果会明确标记降级状态。",
  },
  bilibili: {
    active: "官方公开接口",
    primary: "B站公开热词接口",
    fallbacks: ["内存缓存", "历史快照", "错误卡片"],
    domesticAccess: "国内用户访问本站后端即可读取整理后的 B站热搜。",
  },
  douyin: {
    active: "第三方聚合源",
    primary: "DailyHotApi 风格聚合接口",
    fallbacks: ["内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "抖音无稳定公开热榜 API，本站仅展示聚合结果和快照。",
    noPublicApi: true,
  },
  toutiao: {
    active: "第三方聚合源",
    primary: "DailyHotApi 风格聚合接口",
    fallbacks: ["内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "前端不直连头条页面，统一读取本站缓存结果。",
    noPublicApi: true,
  },
  "36kr": {
    active: "第三方聚合源",
    primary: "DailyHotApi 风格聚合接口",
    fallbacks: ["内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "前端不直连 36氪页面，统一读取本站缓存结果。",
    noPublicApi: true,
  },
  ithome: {
    active: "第三方聚合源",
    primary: "DailyHotApi 风格聚合接口",
    fallbacks: ["内存缓存", "历史快照", "内置离线数据"],
    domesticAccess: "前端不直连 IT之家页面，统一读取本站缓存结果。",
    noPublicApi: true,
  },
  huggingface: {
    active: "官方接口 + 国内镜像入口",
    primary: "Hugging Face Trending 接口",
    fallbacks: ["国内镜像入口", "历史快照", "内置模型推荐"],
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
    active: "官方接口 + 国内镜像入口",
    primary: "GitHub Search API",
    fallbacks: ["国内镜像入口", "历史快照", "内置开源项目推荐"],
    domesticAccess: "标题默认指向 GitHub 国内入口，同时保留原站链接。",
    note: "国内入口可通过 GITHUB_CN_BASE 替换。",
  },
  hackernews: {
    active: "官方公开接口",
    primary: "Hacker News Firebase API",
    fallbacks: ["内存缓存", "历史快照", "内置离线快照"],
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
