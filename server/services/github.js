const { fetchJson } = require("./http");
const { toGithubLinks } = require("../utils/cn-links");

const fallbackRepos = [
  {
    full_name: "deepseek-ai/DeepSeek-R1",
    stargazers_count: 110000,
    html_url: "https://github.com/deepseek-ai/DeepSeek-R1",
    description: "DeepSeek R1 推理模型开源项目。",
  },
  {
    full_name: "QwenLM/Qwen3",
    stargazers_count: 25000,
    html_url: "https://github.com/QwenLM/Qwen3",
    description: "通义千问 Qwen3 系列模型与示例。",
  },
  {
    full_name: "modelscope/modelscope",
    stargazers_count: 9500,
    html_url: "https://github.com/modelscope/modelscope",
    description: "面向中文用户的模型社区与工具链。",
  },
  {
    full_name: "InternLM/InternLM",
    stargazers_count: 9800,
    html_url: "https://github.com/InternLM/InternLM",
    description: "书生浦语大模型开源仓库。",
  },
  {
    full_name: "THUDM/GLM-4",
    stargazers_count: 18000,
    html_url: "https://github.com/THUDM/GLM-4",
    description: "清华智谱 GLM 系列模型。",
  },
  {
    full_name: "langgenius/dify",
    stargazers_count: 120000,
    html_url: "https://github.com/langgenius/dify",
    description: "开源 LLM 应用开发平台。",
  },
  {
    full_name: "lobehub/lobe-chat",
    stargazers_count: 65000,
    html_url: "https://github.com/lobehub/lobe-chat",
    description: "开源 AI 聊天应用。",
  },
  {
    full_name: "open-webui/open-webui",
    stargazers_count: 110000,
    html_url: "https://github.com/open-webui/open-webui",
    description: "自托管 AI 工作台。",
  },
  {
    full_name: "ollama/ollama",
    stargazers_count: 170000,
    html_url: "https://github.com/ollama/ollama",
    description: "本地运行大模型工具。",
  },
  {
    full_name: "vllm-project/vllm",
    stargazers_count: 60000,
    html_url: "https://github.com/vllm-project/vllm",
    description: "高吞吐 LLM 推理服务。",
  },
];

function getDateDaysAgo(days) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function hasMostlyEnglish(value = "") {
  const letters = String(value).match(/[a-z]/gi)?.length || 0;
  const han = String(value).match(/\p{Script=Han}/gu)?.length || 0;
  return letters > 18 && letters > han * 2;
}

function inferRepoTopic(repo = {}) {
  const text = `${repo.full_name || ""} ${repo.description || ""} ${repo.language || ""}`.toLowerCase();
  const topics = [];

  if (/medical|health|clinic|doctor|patient/.test(text)) topics.push("医疗健康");
  if (/agent|copilot|assistant|ai|llm|model|midjourney|claude|codex/.test(text)) topics.push("AI 工具或智能体");
  if (/code|developer|repo|open source|api|sdk|shell|python|typescript|rust/.test(text)) topics.push("开发者工具和开源工程");
  if (/database|sqlite|search|retrieval|rag|index/.test(text)) topics.push("数据检索或知识库");
  if (/design|ui|image|video|browser|web|html|css/.test(text)) topics.push("界面、Web 或内容生成");

  return topics.length ? topics.slice(0, 2).join("、") : "近期新出现的技术项目";
}

function buildRepoSummary(repo = {}) {
  const description = String(repo.description || "").trim();

  if (description && !hasMostlyEnglish(description)) return description;

  return `这个开源项目主要与${inferRepoTopic(repo)}有关，可用于技术选型、工具复用或观察近期开发者趋势。`;
}

async function fetchGithub({ q = "" } = {}) {
  const createdAfter = getDateDaysAgo(14);
  const queryParts = [`created:>=${createdAfter}`, "stars:>20"];

  if (q) {
    queryParts.unshift(q);
  }

  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", queryParts.join(" "));
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", "10");

  let repos = [];
  let fallback = false;
  const headers = {
    "x-github-api-version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const data = await fetchJson(url.toString(), {
      headers,
    });
    repos = data.items || [];
  } catch (error) {
    fallback = true;
    repos = fallbackRepos.filter((repo) => !q || repo.full_name.toLowerCase().includes(q.toLowerCase()));
  }

  return {
    source: "github",
    sourceName: "GitHub",
    listName: fallback ? "国内可访问开源项目推荐" : "近 14 天热门仓库",
    updatedAt: new Date().toISOString(),
    items: repos.slice(0, 10).map((repo, index) => ({
      rank: index + 1,
      title: repo.full_name,
      heat: fallback ? "示例热度" : `${repo.stargazers_count} stars`,
      ...toGithubLinks(repo.full_name),
      summary: buildRepoSummary(repo),
      sample: fallback,
      sourceType: "开源社区",
      trend: index < 3 ? "up" : index < 7 ? "steady" : "new",
      why: fallback
        ? "GitHub 实时搜索不可用时保留的国内可访问开源项目推荐。"
        : "近 14 天创建且星标增长较快，适合发现近期新项目。",
    })),
    degraded: fallback,
    dataState: fallback ? "offline" : "live",
    sample: fallback,
    message: fallback ? "GitHub 直连失败，已切换为国内入口推荐列表。" : undefined,
  };
}

module.exports = {
  fetchGithub,
};
