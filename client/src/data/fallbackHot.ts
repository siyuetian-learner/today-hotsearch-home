import type { HotPlatform } from "../types/hot";

const updatedAt = "2026-06-03T14:48:00.000Z";

function item(rank: number, title: string, heat: string, summary = "", url = "#") {
  return { rank, title, heat, summary, url };
}

export const fallbackHotResponse = {
  ttlSec: 600,
  platforms: [
    {
      source: "weibo",
      sourceName: "微博热搜",
      listName: "全站热搜榜（离线快照）",
      updatedAt,
      degraded: true,
      message: "当前公网入口使用离线快照；实时接口可达时会自动切换为实时数据。",
      items: [
        item(1, "女子花2万查丈夫出轨揪出辅警内鬼", "1186450"),
        item(2, "中国女排0比3捷克女排", "842693"),
        item(3, "2026高考安检新变化", "734187"),
        item(4, "馒头从空气炸锅留学回来了", "707712"),
        item(5, "男子11年前买29.7万元手机懊悔不已", "598637"),
        item(6, "多地发布高温黄色预警", "397.8万"),
        item(7, "国产大模型新品发布", "294.7万"),
        item(8, "今年龙舟赛有哪些看点", "266.8万"),
        item(9, "年轻人开始反向旅游", "239.2万"),
        item(10, "睡眠质量如何科学改善", "186.5万"),
      ],
    },
    {
      source: "zhihu",
      sourceName: "知乎热榜",
      listName: "讨论热度榜（离线快照）",
      updatedAt,
      degraded: true,
      message: "知乎官方接口需要认证，当前公网入口保留示例热榜快照。",
      items: [
        item(1, "如何看待 AI 编程工具进入日常开发", "356.2万", "AI 工具进入真实工作流的讨论持续升温。"),
        item(2, "普通人怎样建立长期稳定的阅读习惯", "338.7万", "学习成长类话题长期在知乎保持讨论热度。"),
        item(3, "年轻人存钱变难了吗", "286.1万", "消费、收入和长期规划相关问题受到关注。"),
        item(4, "高效远程协作需要哪些基本规范", "263.8万", "远程办公和团队协作方式继续演进。"),
        item(5, "什么样的简历更容易被看见", "241.4万", "求职季职业发展讨论热度较高。"),
        item(6, "城市通勤时间会影响幸福感吗", "226.9万", "城市生活体验和通勤成本受到关注。"),
        item(7, "夏季运动如何避免过度疲劳", "208.6万", "健康生活类问题进入高频讨论。"),
        item(8, "如何评价最近的国产动画电影", "184.3万", "内容产业和国漫作品讨论增加。"),
        item(9, "厨房小家电哪些是真的实用", "162.5万", "消费决策类问题适合知乎长讨论。"),
        item(10, "AI 时代还需要学习编程基础吗", "151.8万", "技术教育和职业转型相关话题。"),
      ],
    },
    {
      source: "bilibili",
      sourceName: "B站热搜",
      listName: "站内搜索榜（离线快照）",
      updatedAt,
      degraded: true,
      message: "当前公网入口使用离线快照；实时接口可达时会自动切换为实时数据。",
      items: [
        item(1, "歌剧老师锐评BLACKPINK", "6525271", "热度层级 B"),
        item(2, "教育部严禁炒作高考状元", "2244971", "热度层级 S"),
        item(3, "世界杯十大最值得关注的球星", "1831325", "热度层级 S"),
        item(4, "硬核解析通江达海的平陆运河", "1796191", "热度层级 S"),
        item(5, "来自班主任的教科书式祝福", "1724389", "热度层级 S"),
        item(6, "经典动画高清修复上线", "253.5万"),
        item(7, "UP主挑战一周不点外卖", "232.4万"),
        item(8, "国风舞台混剪合集", "218.1万"),
        item(9, "硬核拆解旗舰耳机", "197.3万"),
        item(10, "新番五日口碑排行", "173.6万"),
      ],
    },
    {
      source: "huggingface",
      sourceName: "Hugging Face",
      listName: "趋势模型（离线快照）",
      updatedAt,
      degraded: true,
      message: "国内公网入口优先提供可访问镜像链接，并保留原站链接。",
      items: [
        model(1, "nvidia/LocateAnything-3B", "1091 likes · 78925 downloads", "image-text-to-text"),
        model(2, "LiquidAI/LFM2.5-8B-A1B", "463 likes · 60171 downloads", "text-generation"),
        model(3, "openbmb/MiniCPM5-1B", "747 likes · 68494 downloads", "text-generation"),
        model(4, "openbmb/UltraData-SFT-2605", "287 likes · 20175 downloads"),
        model(5, "HauhauCS/Qwen3.6-35B-A3B-Uncensored-HauhauCS-Aggressive", "1321 likes · 2602333 downloads", "image-text-to-text"),
        model(6, "stepfun-ai/Step-3.7-Flash", "220 likes · 17965 downloads", "image-text-to-text"),
        model(7, "PaddlePaddle/PaddleOCR-VL", "200 likes · 4829 downloads", "image-text-to-text"),
        model(8, "deepseek-ai/DeepSeek-V3", "4587 likes · 58110 downloads", "text-generation"),
        model(9, "meituan-longcat/LongCat-Flash", "500 likes · 282 downloads", "text-generation"),
        model(10, "Qwen/Qwen3-Embedding", "938 likes · 45112 downloads", "sentence-similarity"),
      ],
    },
    {
      source: "aihot",
      sourceName: "AI HOT",
      listName: "AI 精选动态（离线快照）",
      updatedAt,
      degraded: true,
      message: "当前公网入口使用离线快照；实时接口可达时会自动切换为实时数据。",
      items: [
        item(1, "微软与OpenAI分道扬镳，如今双方准备正面交锋", "分类：industry", "双方从合作伙伴转向更直接的 AI 基础设施与产品竞争。"),
        item(2, "Meta 面向 WhatsApp Business 的 AI 智能体现已全球上线", "分类：ai-products", "面向商家的 AI 助手能力继续扩展。"),
        item(3, "Claude Partner Network 推出服务和伙伴中心", "分类：ai-products", "Anthropic 扩展 Claude 企业生态。"),
        item(4, "智能体工程实践进入企业落地阶段", "分类：industry", "Agent 工作流从演示走向真实生产流程。"),
        item(5, "开源模型在多模态任务上继续追赶闭源模型", "分类：model", "模型能力和部署成本成为开发者关注重点。"),
        item(6, "AI 编程工具开始进入团队规范建设", "分类：developer", "企业开始关注代码质量、安全和权限边界。"),
        item(7, "端侧 AI 应用成为硬件厂商新卖点", "分类：device", "端侧推理降低延迟并增强隐私。"),
        item(8, "视频生成模型继续提升可控性", "分类：media", "镜头、角色一致性和编辑能力成为竞争重点。"),
        item(9, "AI 搜索产品加速商业化", "分类：search", "搜索、问答和广告模式正在重构。"),
        item(10, "企业知识库成为大模型落地入口", "分类：enterprise", "RAG、权限和审计能力成为采购关键。"),
      ],
    },
    {
      source: "github",
      sourceName: "GitHub",
      listName: "热门仓库（离线快照）",
      updatedAt,
      degraded: true,
      message: "国内公网入口优先提供可访问镜像链接，并保留原站链接。",
      items: [
        repo(1, "pewdiepie-archdaemon/odysseus", "39632 stars", "Self-hosted AI workspace."),
        repo(2, "perplexityai/bumblebee", "4197 stars", "Read-only developer endpoint scanner."),
        repo(3, "AprilNEA/OpenLogi", "3442 stars", "A native, local-first alternative to logistics tooling."),
        repo(4, "OpenBMB/PilotDeck", "2885 stars", "Task-oriented AI Agent productivity tool."),
        repo(5, "op7418/guizang-social-card", "2675 stars", "Claude Code / Codex skill examples."),
        repo(6, "thananon/9arm-skills", "2634 stars", "Shell utilities and workflow skills."),
        repo(7, "open-gsd/gsd-core", "2434 stars", "Git. Ship. Done - Core."),
        repo(8, "Tong89/smartNode", "2010 stars", "Python automation and node tooling."),
        repo(9, "helloiamneo/ian-xiaohei-cli", "1700 stars", "CLI helper for developer workflows."),
        repo(10, "basecamp/omarchy", "1600 stars", "Opinionated developer desktop environment."),
      ],
    },
  ] satisfies HotPlatform[],
};

function model(rank: number, repoId: string, heat: string, summary = "") {
  return {
    rank,
    title: repoId,
    heat,
    summary,
    url: `https://hf-mirror.com/${repoId}`,
    cnUrl: `https://hf-mirror.com/${repoId}`,
    originalUrl: `https://huggingface.co/${repoId}`,
  };
}

function repo(rank: number, fullName: string, heat: string, summary = "") {
  return {
    rank,
    title: fullName,
    heat,
    summary,
    url: `https://kkgithub.com/${fullName}`,
    cnUrl: `https://kkgithub.com/${fullName}`,
    originalUrl: `https://github.com/${fullName}`,
  };
}
