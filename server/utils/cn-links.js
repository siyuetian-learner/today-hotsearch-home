const useCnLinks = process.env.USE_CN_LINKS !== "0";
const huggingFaceCnBase = process.env.HUGGINGFACE_CN_BASE || "https://hf-mirror.com";
const githubCnBase = process.env.GITHUB_CN_BASE || "https://kkgithub.com";

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
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
  const cnUrl = `${trimSlash(githubCnBase)}/${fullName}`;

  return {
    url: useCnLinks ? cnUrl : originalUrl,
    originalUrl,
    cnUrl,
  };
}

module.exports = {
  toGithubLinks,
  toHuggingFaceLinks,
};
