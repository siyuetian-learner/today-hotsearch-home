import type { HotPlatform } from "../types/hot";

const updatedAt = new Date().toISOString();

function buildFallbackUrl(source: string, title: string) {
  const keyword = encodeURIComponent(title);
  const searchMap: Record<string, string> = {
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

function item(rank: number, title: string, heat: string, summary = "", url = "#") {
  return { rank, title, heat, summary, url };
}

// 说明：以下全部为「占位示例」数据，仅用于实时接口完全不可达时避免页面白屏。
// 标题刻意写成中性占位句（不指向任何具体真实事件 / 真实模型 / 真实仓库），
// 避免被用户误读为真实热点。所有条目在文件末尾会被统一强制标记为 sample。
export const fallbackHotResponse: { ttlSec: number; platforms: HotPlatform[] } = {
  ttlSec: 600,
  platforms: [
    {
      source: "weibo",
      sourceName: "微博热搜",
      listName: "全站热搜榜（离线占位示例）",
      updatedAt,
      degraded: true,
      message: "当前为离线占位示例，非真实热搜；实时接口可达时会自动切换为实时数据。",
      items: [
        item(1, "示例 · 某社会民生类热搜话题", ""),
        item(2, "示例 · 某体育赛事相关话题", ""),
        item(3, "示例 · 某考试 / 升学相关话题", ""),
        item(4, "示例 · 某生活方式类话题", ""),
        item(5, "示例 · 某消费数码类话题", ""),
        item(6, "示例 · 某天气 / 出行相关话题", ""),
        item(7, "示例 · 某科技产品发布话题", ""),
        item(8, "示例 · 某传统节庆相关话题", ""),
        item(9, "示例 · 某文旅出游类话题", ""),
        item(10, "示例 · 某健康养生类话题", ""),
      ],
    },
    {
      source: "baidu",
      sourceName: "百度热搜",
      listName: "实时热搜榜（离线占位示例）",
      updatedAt,
      degraded: true,
      dataState: "offline",
      message: "当前为离线占位示例，非真实热搜；百度热搜实时接口可达时会自动切换。",
      items: [
        item(1, "示例 · 某考试护考服务类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(2, "示例 · 某假期出游订单类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(3, "示例 · 某高温天气预警类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(4, "示例 · 某国产大模型发布类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(5, "示例 · 某毕业季租房类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(6, "示例 · 某新能源补能类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(7, "示例 · 某城市文旅活动类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(8, "示例 · 某旅行方式类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(9, "示例 · 某消费品牌上新类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(10, "示例 · 某健康管理类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
      ],
    },
    {
      source: "zhihu",
      sourceName: "知乎热榜",
      listName: "讨论热度榜（离线占位示例）",
      updatedAt,
      degraded: true,
      message: "当前为离线占位示例，非真实热榜；知乎官方接口需要认证，实时聚合可达时会自动切换。",
      items: [
        item(1, "示例 · 关于 AI 编程工具进入日常开发的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(2, "示例 · 关于建立长期阅读习惯的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(3, "示例 · 关于个人储蓄与理财的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(4, "示例 · 关于远程协作规范的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(5, "示例 · 关于求职简历的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(6, "示例 · 关于城市通勤与幸福感的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(7, "示例 · 关于夏季运动健康的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(8, "示例 · 关于国产动画作品的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(9, "示例 · 关于厨房小家电选购的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(10, "示例 · 关于编程基础学习的讨论", "", "占位示例，用于上游不可用时保持页面可读。"),
      ],
    },
    {
      source: "bilibili",
      sourceName: "B站热搜",
      listName: "站内搜索榜（离线占位示例）",
      updatedAt,
      degraded: true,
      message: "当前为离线占位示例，非真实热搜；实时接口可达时会自动切换为实时数据。",
      items: [
        item(1, "示例 · 某音乐 / 舞台类视频话题", ""),
        item(2, "示例 · 某教育资讯类话题", ""),
        item(3, "示例 · 某体育赛事盘点类话题", ""),
        item(4, "示例 · 某硬核科普类视频话题", ""),
        item(5, "示例 · 某校园 / 毕业季话题", ""),
        item(6, "示例 · 某经典内容修复上线话题", ""),
        item(7, "示例 · 某生活方式挑战类话题", ""),
        item(8, "示例 · 某国风内容合集话题", ""),
        item(9, "示例 · 某数码测评类话题", ""),
        item(10, "示例 · 某番剧口碑排行话题", ""),
      ],
    },
    {
      source: "douyin",
      sourceName: "抖音热榜",
      listName: "热点榜（离线占位示例）",
      updatedAt,
      degraded: true,
      dataState: "offline",
      message: "当前为离线占位示例，非真实热榜；抖音热榜实时接口可达时会自动切换。",
      items: [
        item(1, "示例 · 某毕业季音乐内容话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(2, "示例 · 某节日限定美食内容话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(3, "示例 · 某航天科普内容话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(4, "示例 · 某独立游戏试玩内容话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(5, "示例 · 某手机摄影教程内容话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(6, "示例 · 某经典内容修复上线话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(7, "示例 · 某生活挑战内容话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(8, "示例 · 某国风舞台内容话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(9, "示例 · 某数码拆解内容话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(10, "示例 · 某番剧口碑排行话题", "", "占位示例，用于上游不可用时保持页面可读。"),
      ],
    },
    {
      source: "toutiao",
      sourceName: "今日头条",
      listName: "头条热榜（离线占位示例）",
      updatedAt,
      degraded: true,
      dataState: "offline",
      message: "当前为离线占位示例，非真实热榜；今日头条实时接口可达时会自动切换。",
      items: [
        item(1, "示例 · 某安全生产部署类新闻话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(2, "示例 · 某假期铁路客流类新闻话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(3, "示例 · 某消费补贴政策类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(4, "示例 · 某交通临时管制类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(5, "示例 · 某 AI 教育评测类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(6, "示例 · 某防汛准备类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(7, "示例 · 某县域文旅类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(8, "示例 · 某新职业培训类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(9, "示例 · 某老旧小区改造类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(10, "示例 · 某家电以旧换新类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
      ],
    },
    {
      source: "36kr",
      sourceName: "36氪",
      listName: "创投与商业热榜（离线占位示例）",
      updatedAt,
      degraded: true,
      dataState: "offline",
      message: "当前为离线占位示例，非真实热榜；36氪实时接口可达时会自动切换。",
      items: [
        item(1, "示例 · 某 AI 原生办公产品商业话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(2, "示例 · 某具身智能融资话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(3, "示例 · 某大模型应用交付话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(4, "示例 · 某跨境电商 AI 工具话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(5, "示例 · 某新能源供应链出海话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(6, "示例 · 某消费品牌线下营销话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(7, "示例 · 某企业服务 SaaS 经营话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(8, "示例 · 某 AI 编程工具落地话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(9, "示例 · 某端侧模型硬件话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(10, "示例 · 某低空经济试点话题", "", "占位示例，用于上游不可用时保持页面可读。"),
      ],
    },
    {
      source: "ithome",
      sourceName: "IT之家",
      listName: "科技数码热榜（离线占位示例）",
      updatedAt,
      degraded: true,
      dataState: "offline",
      message: "当前为离线占位示例，非真实热榜；IT之家实时接口可达时会自动切换。",
      items: [
        item(1, "示例 · 某桌面处理器规格类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(2, "示例 · 某手机系统年度更新类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(3, "示例 · 某国产操作系统生态类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(4, "示例 · 某显卡驱动更新类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(5, "示例 · 某智能汽车 OTA 类话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(6, "示例 · 某长续航笔记本新品话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(7, "示例 · 某开源浏览器版本话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(8, "示例 · 某折叠屏设备价格话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(9, "示例 · 某家用 NAS 新品话题", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(10, "示例 · 某无线耳机功能更新话题", "", "占位示例，用于上游不可用时保持页面可读。"),
      ],
    },
    {
      source: "huggingface",
      sourceName: "Hugging Face",
      listName: "趋势模型（离线占位示例）",
      updatedAt,
      degraded: true,
      message: "当前为离线占位示例，非真实趋势；实时接口可达时会自动切换为真实 Trending。",
      items: [
        model(1, "示例 · 某中文大语言模型", "", "text-generation"),
        model(2, "示例 · 某推理增强模型", "", "text-generation"),
        model(3, "示例 · 某中文向量检索模型", "", "sentence-similarity"),
        model(4, "示例 · 某多模态视觉语言模型", "", "image-text-to-text"),
        model(5, "示例 · 某端侧轻量模型", "", "text-generation"),
        model(6, "示例 · 某语音识别模型", ""),
        model(7, "示例 · 某 OCR / 文档理解模型", "", "image-text-to-text"),
        model(8, "示例 · 某重排序模型", "", "sentence-similarity"),
        model(9, "示例 · 某代码生成模型", "", "text-generation"),
        model(10, "示例 · 某文本嵌入模型", "", "sentence-similarity"),
      ],
    },
    {
      source: "aihot",
      sourceName: "AI HOT",
      listName: "AI 精选动态（离线占位示例）",
      updatedAt,
      degraded: true,
      message: "当前为离线占位示例，非真实动态；实时接口可达时会自动切换为实时数据。",
      items: [
        item(1, "示例 · 某 AI 大厂竞争动态", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(2, "示例 · 某 AI 商业助手上线动态", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(3, "示例 · 某 AI 企业生态合作动态", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(4, "示例 · 某智能体工程落地动态", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(5, "示例 · 某开源模型多模态进展", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(6, "示例 · 某 AI 编程规范建设动态", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(7, "示例 · 某端侧 AI 硬件动态", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(8, "示例 · 某视频生成模型进展", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(9, "示例 · 某 AI 搜索商业化动态", "", "占位示例，用于上游不可用时保持页面可读。"),
        item(10, "示例 · 某企业知识库落地动态", "", "占位示例，用于上游不可用时保持页面可读。"),
      ],
    },
    {
      source: "github",
      sourceName: "GitHub",
      listName: "热门仓库（离线占位示例）",
      updatedAt,
      degraded: true,
      message: "当前为离线占位示例，非真实仓库列表；实时接口可达时会自动切换为真实数据。",
      items: [
        repo(1, "示例 · 某 AI 工作台开源项目", "", "占位示例：自托管 AI 工作台类项目。"),
        repo(2, "示例 · 某开发者工具开源项目", "", "占位示例：开发者效率工具类项目。"),
        repo(3, "示例 · 某本地优先应用开源项目", "", "占位示例：本地优先应用类项目。"),
        repo(4, "示例 · 某智能体生产力开源项目", "", "占位示例：任务型 AI Agent 类项目。"),
        repo(5, "示例 · 某 AI 技能 / 插件示例项目", "", "占位示例：AI 技能与插件示例类项目。"),
        repo(6, "示例 · 某 Shell 工作流开源项目", "", "占位示例：Shell 工具与工作流类项目。"),
        repo(7, "示例 · 某工程协作开源项目", "", "占位示例：工程协作工具类项目。"),
        repo(8, "示例 · 某自动化脚本开源项目", "", "占位示例：自动化与节点工具类项目。"),
        repo(9, "示例 · 某命令行助手开源项目", "", "占位示例：CLI 辅助工具类项目。"),
        repo(10, "示例 · 某开发环境配置开源项目", "", "占位示例：开发桌面环境类项目。"),
      ],
    },
    {
      source: "hackernews",
      sourceName: "Hacker News",
      listName: "Top Stories（离线占位示例）",
      updatedAt,
      degraded: true,
      dataState: "offline",
      message: "当前为离线占位示例，非真实榜单；Hacker News 官方 API 可达时会自动切换。",
      items: [
        item(1, "示例 · 某本地优先数据库展示话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(2, "示例 · 某边缘数据库工程经验话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(3, "示例 · 某开发者工具体验话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(4, "示例 · 某浏览器渲染性能话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(5, "示例 · 某本地 AI 模型用法讨论话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(6, "示例 · 某开源可持续资金话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(7, "示例 · 某 Serverless 定时任务话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(8, "示例 · 某个人网站回潮话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(9, "示例 · 某编译器重写经验话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
        item(10, "示例 · 某数据库索引可视化话题", "", "占位示例，用于上游不可用时保持榜单可读。"),
      ],
    },
  ],
};

fallbackHotResponse.platforms.forEach((platform) => {
  platform.items = platform.items.map((hotItem) => {
    const url = hotItem.url && hotItem.url !== "#" ? hotItem.url : buildFallbackUrl(platform.source, hotItem.title);
    return {
      ...hotItem,
      url,
      heat: "示例热度",
      sample: true,
    };
  });
  platform.sample = true;
});

// 占位示例的标题不指向真实仓库 / 模型，因此不再生成 hf-mirror / github 直链，
// 统一返回 "#"，避免产生指向不存在资源的 404 链接。
function model(rank: number, repoId: string, heat: string, summary = "") {
  return {
    rank,
    title: repoId,
    heat,
    summary,
    url: "#",
  };
}

function repo(rank: number, fullName: string, heat: string, summary = "") {
  return {
    rank,
    title: fullName,
    heat,
    summary,
    url: "#",
  };
}
