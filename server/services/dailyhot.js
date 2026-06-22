const { fetchJson, fetchJsonWithRetry, fetchText } = require("./http");
const { buildSourceUrl } = require("../utils/source-links");

const defaultBaseUrl = process.env.DAILY_HOT_API_BASE || "https://api-hot.imsyy.top";
const dailyHotBaseUrls = [
  ...String(process.env.DAILY_HOT_API_BASES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  defaultBaseUrl,
].filter((value, index, list) => value && list.indexOf(value) === index);

const sourceConfig = {
  baidu: {
    sourceName: "百度热搜",
    listName: "百度实时热搜榜",
    category: "news",
    sourceType: "搜索趋势",
    fallback: [
      ["高考首日多地开启护考模式", "实时热度 489.2万", "搜索热度集中在交通、安检和考场服务。"],
      ["端午假期国内游订单增长", "实时热度 421.7万", "短途游和亲子游成为主要增长点。"],
      ["多地发布高温黄色预警", "实时热度 397.8万", "天气、出行和用电安全相关搜索上升。"],
      ["国产大模型新品密集发布", "实时热度 365.1万", "AI 应用与端侧部署成为讨论焦点。"],
      ["毕业季租房避坑指南", "实时热度 312.4万", "租房合同、押金和通勤成本被集中搜索。"],
      ["新能源车充电桩加速下沉", "实时热度 294.7万", "县域市场和高速服务区补能受到关注。"],
      ["今年龙舟赛有哪些看点", "实时热度 266.8万", "传统节庆与城市文旅活动带动搜索。"],
      ["年轻人开始反向旅游", "实时热度 239.2万", "小城旅行和低预算路线继续升温。"],
      ["咖啡品牌联名周边上新", "实时热度 211.9万", "消费品牌借新品拉动社交传播。"],
      ["睡眠质量如何科学改善", "实时热度 186.5万", "健康管理话题保持稳定热度。"],
    ],
  },
  douyin: {
    sourceName: "抖音热榜",
    listName: "抖音热点榜",
    category: "social",
    sourceType: "短视频平台",
    fallback: [
      ["毕业歌会全程回放", "热度 398.8万", "毕业季内容带动音乐和校园话题传播。"],
      ["端午限定美食测评", "热度 364.6万", "地域美食和节日消费内容走高。"],
      ["一口气看懂空间站任务", "热度 331.2万", "科普视频获得高完播和转发。"],
      ["独立游戏新作试玩", "热度 309.9万", "游戏解说和试玩内容吸引年轻用户。"],
      ["三分钟学会手机摄影构图", "热度 281.7万", "实用教程类内容维持高收藏率。"],
      ["经典动画高清修复上线", "热度 253.5万", "怀旧内容与版权上线形成讨论。"],
      ["UP主挑战一周不点外卖", "热度 232.4万", "生活方式挑战具备传播性。"],
      ["国风舞台混剪合集", "热度 218.1万", "国风音乐和舞蹈内容持续活跃。"],
      ["硬核拆解旗舰耳机", "热度 197.3万", "数码测评进入消费决策场景。"],
      ["新番五月口碑排行", "热度 173.6万", "二次元内容保持固定受众。"],
    ],
  },
  toutiao: {
    sourceName: "今日头条",
    listName: "头条热榜",
    category: "news",
    sourceType: "新闻资讯",
    fallback: [
      ["多部门部署夏季安全生产检查", "阅读 823万", "政策和民生类新闻进入高关注区。"],
      ["端午假期铁路客流高位运行", "阅读 711万", "出行服务信息成为新闻消费主线。"],
      ["新一轮消费补贴怎么领", "阅读 645万", "补贴规则和适用范围被集中关注。"],
      ["高考期间这些路段临时管制", "阅读 602万", "本地服务类信息具备强时效价值。"],
      ["AI 教育产品进入集中评测期", "阅读 568万", "教育科技和合规讨论同步升温。"],
      ["全国多地启动防汛准备", "阅读 512万", "天气与公共安全信息受关注。"],
      ["县域文旅热度继续上升", "阅读 480万", "小城目的地与短途游相互带动。"],
      ["新职业培训需求增长", "阅读 435万", "就业和技能提升成为稳定议题。"],
      ["老旧小区改造进度更新", "阅读 389万", "社区民生内容具有高本地点击。"],
      ["智能家电以旧换新政策落地", "阅读 342万", "消费政策与家电销售相关。"],
    ],
  },
  "36kr": {
    sourceName: "36氪",
    listName: "创投与商业热榜",
    category: "tech",
    sourceType: "商业科技",
    fallback: [
      ["AI 原生办公产品进入企业采购名单", "热度 91.2万", "企业更关注权限、审计和知识库接入。"],
      ["具身智能创业公司完成新一轮融资", "热度 84.6万", "机器人与工业场景继续吸引资本。"],
      ["大模型应用从演示转向交付", "热度 79.8万", "客户开始要求可量化的效率提升。"],
      ["跨境电商卖家加速使用 AI 工具", "热度 72.1万", "选品、客服和广告投放成为落地点。"],
      ["新能源供应链公司布局海外市场", "热度 66.5万", "出海与本地化运营成为关键词。"],
      ["消费品牌重回线下快闪", "热度 61.7万", "线下体验被用于提升品牌记忆点。"],
      ["企业服务 SaaS 重新强调现金流", "热度 58.3万", "商业模式从增长转向健康经营。"],
      ["AI 编程助手进入团队标准工具链", "热度 53.9万", "研发效率和代码安全共同被评估。"],
      ["智能硬件开始强调端侧模型", "热度 49.2万", "隐私、延迟和成本是核心动因。"],
      ["低空经济场景进入试点扩张期", "热度 45.1万", "政策和基础设施是近期关键变量。"],
    ],
  },
  ithome: {
    sourceName: "IT之家",
    listName: "科技数码热榜",
    category: "tech",
    sourceType: "科技媒体",
    fallback: [
      ["新一代桌面处理器规格曝光", "热度 88.9万", "硬件性能和功耗成为用户关注点。"],
      ["主流手机系统迎来年度更新", "热度 82.4万", "AI 功能和隐私权限是更新重点。"],
      ["国产操作系统生态应用增加", "热度 76.8万", "办公、开发和教育场景逐步补齐。"],
      ["显卡驱动更新修复多款游戏问题", "热度 69.7万", "玩家关注性能和稳定性变化。"],
      ["智能汽车 OTA 推送新版本", "热度 64.5万", "辅助驾驶和座舱体验继续迭代。"],
      ["笔记本新品主打长续航", "热度 58.8万", "轻薄本市场进入续航和性能平衡阶段。"],
      ["开源浏览器项目发布重大版本", "热度 53.1万", "隐私保护和插件生态是核心卖点。"],
      ["折叠屏设备价格下探", "热度 48.6万", "供应链成熟推动高端形态普及。"],
      ["家用 NAS 新品支持 AI 相册", "热度 43.2万", "本地存储和智能整理需求增加。"],
      ["无线耳机新增实时翻译功能", "热度 39.4万", "端侧 AI 提升可用场景。"],
    ],
  },
};

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function extractItems(payload) {
  return firstArray(
    payload,
    payload?.data,
    payload?.data?.list,
    payload?.data?.items,
    payload?.data?.cards,
    payload?.data?.data,
    payload?.list,
    payload?.items,
    payload?.result,
    payload?.result?.list,
    payload?.result?.items,
  );
}

function pickText(item, keys) {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function normalizeItem(raw, index, config) {
  const title = pickText(raw, ["title", "name", "word", "keyword", "hotword", "query", "desc"]);
  const url = pickText(raw, ["url", "mobileUrl", "link", "pcUrl", "appUrl", "shareUrl"]) || "#";
  const heat = pickText(raw, ["hot", "heat", "metrics", "index", "score", "views", "desc", "hotValue"]);
  const summary = pickText(raw, ["summary", "abstract", "description", "intro", "author", "category"]);

  return {
    rank: Number(raw?.rank || raw?.index || index + 1),
    title: title || `${config.sourceName}热点 ${index + 1}`,
    url,
    heat: heat || "热度更新中",
    summary,
    sourceType: config.sourceType,
  };
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

function stripTags(value = "") {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value = "", max = 96) {
  const text = String(value).trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function parseBaiduHot(html) {
  const match = html.match(/<!--s-data:([\s\S]*?)-->/);
  if (!match?.[1]) throw new Error("empty baidu s-data");

  const payload = JSON.parse(match[1]);
  const cards = payload?.data?.cards || [];
  const hotList = cards.find((card) => Array.isArray(card.content))?.content || [];

  return hotList.map((item, index) => ({
    rank: index + 1,
    title: item.query || item.word || `百度热点 ${index + 1}`,
    url: item.rawUrl || item.url || item.appUrl || buildSourceUrl("baidu", item.query || item.word || ""),
    heat: item.hotScore ? `实时热度 ${item.hotScore}` : "热度更新中",
    summary: truncate(item.desc || ""),
    sourceType: sourceConfig.baidu.sourceType,
  }));
}

async function fetchBaiduDirect() {
  const html = await fetchText("https://top.baidu.com/board?tab=realtime", { timeoutMs: 10000 });
  const items = parseBaiduHot(html);
  if (!items.length) throw new Error("empty baidu hot list");
  return { items, accessMode: "百度热榜公开页面解析" };
}

function normalizeDouyinLabel(label) {
  if (label === 3) return "热";
  if (label === 1) return "新";
  if (label === 8) return "首发";
  return "";
}

async function fetchDouyinDirect() {
  const data = await fetchJson("https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web", {
    timeoutMs: 10000,
    headers: {
      referer: "https://www.douyin.com/hot",
    },
  });
  const list = data?.data?.word_list || data?.word_list || [];
  if (!Array.isArray(list) || !list.length) throw new Error("empty douyin hot list");

  return {
    accessMode: "抖音热榜公开 JSON",
    items: list.map((item, index) => {
      const title = item.word || item.sentence || `抖音热点 ${index + 1}`;
      return {
        rank: Number(item.position || index + 1),
        title,
        url: `https://www.douyin.com/search/${encodeURIComponent(title)}`,
        heat: item.hot_value ? `热度 ${item.hot_value}` : "热度更新中",
        summary: normalizeDouyinLabel(item.label),
        sourceType: sourceConfig.douyin.sourceType,
      };
    }),
  };
}

async function fetchToutiaoDirect() {
  const data = await fetchJson("https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc", { timeoutMs: 10000 });
  const list = Array.isArray(data?.data) ? data.data : [];
  if (!list.length) throw new Error("empty toutiao hot list");

  return {
    accessMode: "今日头条热榜公开 JSON",
    items: list.map((item, index) => ({
      rank: index + 1,
      title: item.Title || item.QueryWord || `头条热点 ${index + 1}`,
      url: item.Url || buildSourceUrl("toutiao", item.Title || item.QueryWord || ""),
      heat: item.HotValue ? `热度 ${item.HotValue}` : "热度更新中",
      summary: item.LabelDesc || item.InterestCategory || "",
      sourceType: sourceConfig.toutiao.sourceType,
    })),
  };
}

async function fetch36krDirect() {
  const html = await fetchText("https://www.36kr.com/newsflashes", { timeoutMs: 10000 });
  const matches = [...html.matchAll(/<a[^>]+href=["'](\/newsflashes\/[^"']+)["'][^>]*>([^<]{6,160})<\/a>/g)];
  const seen = new Set();
  const items = matches
    .map((match) => ({
      title: stripTags(match[2]),
      url: `https://www.36kr.com${match[1]}`,
    }))
    .filter((item) => {
      if (!item.title || seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    })
    .map((item, index) => ({
      rank: index + 1,
      title: item.title,
      url: item.url,
      heat: "实时快讯",
      summary: "36氪最新商业与科技快讯",
      sourceType: sourceConfig["36kr"].sourceType,
    }));

  if (!items.length) throw new Error("empty 36kr newsflash list");
  return { items, accessMode: "36氪快讯公开页面解析" };
}

function pickXmlValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripTags(match[1]) : "";
}

async function fetchIthomeDirect() {
  const xml = await fetchText("https://www.ithome.com/rss/", { timeoutMs: 10000 });
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const items = matches.map((match, index) => {
    const itemXml = match[1];
    const title = pickXmlValue(itemXml, "title");
    const link = pickXmlValue(itemXml, "link");
    const description = pickXmlValue(itemXml, "description");
    return {
      rank: index + 1,
      title: title || `IT之家资讯 ${index + 1}`,
      url: link || buildSourceUrl("ithome", title),
      heat: "最新资讯",
      summary: truncate(description, 100),
      sourceType: sourceConfig.ithome.sourceType,
    };
  });

  if (!items.length) throw new Error("empty ithome rss list");
  return { items, accessMode: "IT之家 RSS" };
}

const directFetchers = {
  baidu: fetchBaiduDirect,
  douyin: fetchDouyinDirect,
  toutiao: fetchToutiaoDirect,
  "36kr": fetch36krDirect,
  ithome: fetchIthomeDirect,
};

function fallbackItems(config, q, source) {
  const keyword = q.trim().toLowerCase();
  const rows = config.fallback
    .map(([title, heat, summary], index) => ({
      rank: index + 1,
      title,
      url: buildSourceUrl(source, title),
      heat: "示例热度",
      summary,
      sample: true,
      sourceType: config.sourceType,
      trend: index < 3 ? "up" : index < 6 ? "steady" : "new",
      why: `${config.sourceName}离线样例，用于上游不可用时保持页面可读。`,
    }))
    .filter((item) => !keyword || `${item.title} ${item.summary}`.toLowerCase().includes(keyword));

  return rows;
}

function withReason(item, index, config) {
  const trend = index === 0 ? "up" : index < 3 ? "new" : index < 7 ? "steady" : "down";
  return {
    ...item,
    trend,
    why:
      item.why ||
      `${config.sourceName}近期搜索、点击或讨论信号较高，适合快速判断中文互联网关注点。`,
  };
}

async function fetchDailyHot(source, { q = "" } = {}) {
  const config = sourceConfig[source];

  if (!config) {
    const error = new Error(`Unknown DailyHot source: ${source}`);
    error.status = 404;
    throw error;
  }

  let items = [];
  let degraded = false;
  let message;
  let accessMode;
  const errors = [];

  try {
    if (directFetchers[source]) {
      const result = await directFetchers[source]();
      items = result.items;
      accessMode = result.accessMode;
    } else {
      throw new Error("no direct fetcher");
    }
  } catch (error) {
    errors.push(error);
  }

  if (!items.length) {
    for (const baseUrl of dailyHotBaseUrls) {
      try {
        const url = `${baseUrl.replace(/\/+$/, "")}/${source}`;
        const payload = await fetchJsonWithRetry(url, { timeoutMs: 10000, retries: 1 });
        items = extractItems(payload).map((raw, index) => normalizeItem(raw, index, config));
        accessMode = "DailyHotApi 公开聚合接口";
        break;
      } catch (error) {
        errors.push(error);
      }
    }
  }

  if (!items.length) {
    degraded = true;
    message = `${config.sourceName}真实接口暂不可用，已切换为内置离线快照。`;
    items = fallbackItems(config, q, source);
  }

  const keyword = q.trim().toLowerCase();
  const filtered = items
    .filter((item) => !keyword || `${item.title} ${item.summary || ""}`.toLowerCase().includes(keyword))
    .slice(0, 10)
    .map((item, index) => withReason({ ...item, rank: index + 1 }, index, config));

  return {
    source,
    sourceName: config.sourceName,
    listName: degraded ? `${config.listName}（离线快照）` : config.listName,
    updatedAt: new Date().toISOString(),
    items: filtered,
    degraded,
    dataState: degraded ? "offline" : "live",
    message,
    accessMode,
  };
}

function createDailyHotFetcher(source) {
  return (options = {}) => fetchDailyHot(source, options);
}

module.exports = {
  createDailyHotFetcher,
  sourceConfig,
};
