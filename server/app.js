const path = require("path");
const fs = require("fs");
const cors = require("cors");
const express = require("express");
const { getCache, setCache } = require("./utils/cache");
const { fetchAihot } = require("./services/aihot");
const { fetchBilibiliHot } = require("./services/bilibili");
const { fetchGithub } = require("./services/github");
const { fetchHuggingFace } = require("./services/huggingface");
const { fetchWeiboHot } = require("./services/weibo");
const { fetchZhihuHot } = require("./services/zhihu");

const app = express();
const ttlSec = Number(process.env.CACHE_TTL || 600);
const clientDist = path.resolve(__dirname, "..", "client", "dist");
const clientIndex = path.resolve(clientDist, "index.html");

const sources = {
  weibo: fetchWeiboHot,
  zhihu: fetchZhihuHot,
  bilibili: fetchBilibiliHot,
  huggingface: fetchHuggingFace,
  aihot: fetchAihot,
  github: fetchGithub,
};

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
  }),
);

app.use(express.static(clientDist));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ttlSec });
});

async function loadSource(source, { refresh = false, q = "" } = {}) {
  const handler = sources[source];

  if (!handler) {
    const error = new Error(`Unknown source: ${source}`);
    error.status = 404;
    throw error;
  }

  const cacheKey = `hot:${source}:q=${q}`;

  if (!refresh) {
    const cached = getCache(cacheKey);

    if (cached) {
      console.log(`[cache hit] ${cacheKey}`);
      return cached;
    }
  }

  console.log(`[fetch] ${cacheKey}`);
  const data = await handler({ q });
  setCache(cacheKey, data, ttlSec);
  return data;
}

async function safeLoadSource(source, options) {
  try {
    return await loadSource(source, options);
  } catch (error) {
    console.error(`[source error] ${source}:`, error.message);
    return {
      source,
      sourceName: source,
      listName: "加载失败",
      updatedAt: new Date().toISOString(),
      items: [],
      error: true,
      message: `暂时无法获取 ${source} 数据，请稍后重试。`,
    };
  }
}

app.get("/api/hot", async (req, res) => {
  const refresh = req.query.refresh === "1";
  const q = String(req.query.q || "").trim();
  const platforms = await Promise.all(
    Object.keys(sources).map((source) => safeLoadSource(source, { refresh, q })),
  );

  res.json({ platforms, ttlSec });
});

app.get("/api/hot/:source", async (req, res) => {
  const source = req.params.source;
  const refresh = req.query.refresh === "1";
  const q = String(req.query.q || "").trim();

  try {
    const platform = await loadSource(source, { refresh, q });
    res.json(platform);
  } catch (error) {
    res.status(error.status || 500).json({
      source,
      sourceName: source,
      listName: "加载失败",
      updatedAt: new Date().toISOString(),
      items: [],
      error: true,
      message: error.status === 404 ? "未知平台" : "平台数据获取失败",
    });
  }
});

app.get("/", (_req, res) => {
  if (fs.existsSync(clientIndex)) {
    res.sendFile(clientIndex);
    return;
  }

  res.json({
    ok: true,
    service: "today-hotsearch-api",
    docs: ["/api/health", "/api/hot", "/api/hot/:source"],
  });
});

app.get("*", (req, res) => {
  if (fs.existsSync(clientIndex)) {
    res.sendFile(clientIndex);
    return;
  }

  res.status(404).json({
    error: "not_found",
    message: `API-only mode: ${req.path} is not available.`,
  });
});

module.exports = app;
