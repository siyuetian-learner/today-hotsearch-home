const { fetchJson } = require("./http");
const { toHuggingFaceLinks } = require("../utils/cn-links");

const fallbackModels = [
  {
    id: "Qwen/Qwen3-32B",
    likes: 7420,
    downloads: 980000,
    tags: ["中文友好", "大语言模型", "开源权重"],
  },
  {
    id: "deepseek-ai/DeepSeek-R1",
    likes: 53000,
    downloads: 2500000,
    tags: ["推理模型", "中文友好", "研究"],
  },
  {
    id: "BAAI/bge-m3",
    likes: 3800,
    downloads: 1800000,
    tags: ["向量模型", "中文检索", "embedding"],
  },
  {
    id: "THUDM/glm-4-9b-chat",
    likes: 2100,
    downloads: 420000,
    tags: ["对话模型", "中文", "ChatGLM"],
  },
  {
    id: "internlm/internlm2_5-7b-chat",
    likes: 1600,
    downloads: 260000,
    tags: ["对话模型", "中文", "书生浦语"],
  },
  {
    id: "Qwen/Qwen2.5-VL-7B-Instruct",
    likes: 6500,
    downloads: 1100000,
    tags: ["多模态", "视觉语言模型", "中文友好"],
  },
  {
    id: "moka-ai/m3e-base",
    likes: 920,
    downloads: 380000,
    tags: ["中文向量", "文本检索"],
  },
  {
    id: "BAAI/bge-reranker-v2-m3",
    likes: 1300,
    downloads: 760000,
    tags: ["重排序", "检索增强", "中文"],
  },
  {
    id: "openbmb/MiniCPM-V-2_6",
    likes: 4200,
    downloads: 560000,
    tags: ["端侧模型", "多模态", "中文"],
  },
  {
    id: "Qwen/Qwen2.5-Coder-7B-Instruct",
    likes: 7900,
    downloads: 1400000,
    tags: ["代码模型", "中文注释", "编程"],
  },
];

function describeModelTask(repo = {}) {
  const text = [repo.pipeline_tag, repo.library_name, ...(repo.tags || []), repo.id, repo.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/embedding|reranker|retrieval|sentence-similarity/.test(text)) return "向量检索、重排序或 RAG 知识库";
  if (/image-to-text|text-to-image|vision|video|multimodal|image/.test(text)) return "图像理解、视觉生成或多模态任务";
  if (/text-generation|conversational|chat|llm|agent|inference/.test(text)) return "文本生成、智能问答或 Agent 应用";
  if (/translation|summarization|classification|token-classification/.test(text)) return "翻译、摘要或文本分类";
  if (/audio|speech|voice|automatic-speech-recognition/.test(text)) return "语音识别、音频理解或语音交互";
  if (/dataset/.test(text)) return "模型训练、评测或数据分析";
  return "AI 模型选型、能力验证或应用原型开发";
}

function normalizeRepo(repo, index) {
  const id = repo.id || repo.name || "unknown/model";
  const likes = repo.likes ?? repo.likesCount;
  const downloads = repo.downloads;
  const trendingScore = repo.trendingScore;
  const heatParts = [];

  if (typeof trendingScore === "number") {
    heatParts.push(`趋势 ${trendingScore}`);
  }

  if (typeof likes === "number") {
    heatParts.push(`${likes} likes`);
  }

  if (typeof downloads === "number") {
    heatParts.push(`${downloads} downloads`);
  }

  const links = toHuggingFaceLinks(id);

  return {
    rank: index + 1,
    title: id,
    heat: heatParts.slice(0, 2).join(" · ") || "Trending",
    ...links,
    summary: `这个模型或数据项目主要面向${describeModelTask(repo)}，适合先判断是否符合当前业务场景。`,
    sourceType: "AI 模型社区",
    trend: index < 3 ? "up" : index < 7 ? "steady" : "new",
    why: "近期点赞、下载或趋势分数较高，适合观察模型能力与任务方向。",
  };
}

async function fetchHuggingFace({ q = "" } = {}) {
  let trending = [];
  let fallback = false;

  try {
    const data = await fetchJson("https://huggingface.co/api/trending");
    trending = (data.recentlyTrending || [])
      .map((entry) => entry.repoData || entry)
      .filter((repo) => repo && (repo.id || repo.name));
  } catch (error) {
    fallback = true;
    trending = fallbackModels;
  }

  const filtered = q
    ? trending.filter((repo) => (repo.id || repo.name || "").toLowerCase().includes(q.toLowerCase()))
    : trending;

  return {
    source: "huggingface",
    sourceName: "Hugging Face",
    listName: fallback ? "国内可访问模型推荐" : "Trending Models",
    updatedAt: new Date().toISOString(),
    items: filtered.slice(0, 10).map(normalizeRepo),
    degraded: fallback,
    dataState: fallback ? "offline" : "live",
    message: fallback ? "Hugging Face 直连失败，已切换为国内入口推荐列表。" : undefined,
  };
}

module.exports = {
  fetchHuggingFace,
};
