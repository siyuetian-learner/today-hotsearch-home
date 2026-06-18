const useCnLinks = process.env.USE_CN_LINKS !== "0";
const huggingFaceCnBase = process.env.HUGGINGFACE_CN_BASE || "https://hf-mirror.com";
const githubCnBase = normalizeGithubCnBase(process.env.GITHUB_CN_BASE);

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function normalizeGithubCnBase(value) {
  const base = trimSlash(value || "");
  return base && !/^https?:\/\/(www\.)?kkgithub\.com$/i.test(base) ? base : "";
}

function toHuggingFaceLinks(repoId) {
  const originalUrl = `https://huggingface.co/${repoId}`;
  const cnUrl = `${trimSlash(huggingFaceCnBase)}/${repoId}`;

  return {
    url: useCnLinks ? cnUrl : originalUrl,
    originalUrl,
    cnUrl,
  };
}

function toGithubLinks(fullName) {
  const originalUrl = `https://github.com/${fullName}`;
  const cnUrl = githubCnBase ? `${trimSlash(githubCnBase)}/${fullName}` : "";

  return {
    url: useCnLinks && cnUrl ? cnUrl : originalUrl,
    originalUrl,
    ...(cnUrl ? { cnUrl } : {}),
  };
}

module.exports = {
  toGithubLinks,
  toHuggingFaceLinks,
};
