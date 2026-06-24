const path = require("path");
const fs = require("fs");
const cors = require("cors");
const express = require("express");
const { getCache, setCache } = require("./utils/cache");
const { claimRefreshSlot } = require("./utils/refresh-lock");
const { getStoreInfo } = require("./utils/shared-store");
const { ensurePlatformLinks } = require("./utils/source-links");
const { fetchAihot } = require("./services/aihot");
const { fetchBilibiliHot } = require("./services/bilibili");
const { fetchGithub } = require("./services/github");
const { fetchHuggingFace } = require("./services/huggingface");
const { fetchHackerNews } = require("./services/hackernews");
const { fetchWeiboHot } = require("./services/weibo");
const { fetchZhihuHot } = require("./services/zhihu");
const { createDailyHotFetcher } = require("./services/dailyhot");
const { attachSourceStrategy, listSourceStrategies } = require("./services/source-strategies");
const {
  getArchive,
  getLatestSnapshot,
  getSourceStatuses,
  recordSnapshot,
  recordStatus,
} = require("./utils/archive");

const app = express();
const ttlSec = Number(process.env.CACHE_TTL || 600);
const refreshCooldownSec = Number(process.env.REFRESH_COOLDOWN_SEC || 60);
const clientDist = path.resolve(__dirname, "..", "client", "dist");
const clientIndex = path.resolve(clientDist, "index.html");

const sources = {
  weibo: fetchWeiboHot,
  baidu: createDailyHotFetcher("baidu"),
  zhihu: fetchZhihuHot,
  bilibili: fetchBilibiliHot,
  douyin: createDailyHotFetcher("douyin"),
  toutiao: createDailyHotFetcher("toutiao"),
  "36kr": createDailyHotFetcher("36kr"),
  ithome: createDailyHotFetcher("ithome"),
  huggingface: fetchHuggingFace,
  aihot: fetchAihot,
  github: fetchGithub,
  hackernews: fetchHackerNews,
};

const sourceOrder = Object.keys(sources);

const defaultOrigins = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "https://today-hotsearch-home.vercel.app",
  "https://ncn2j3n91nay.aiforce.cloud",
];

function parseOrigins(value = "") {
  return String(value)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = new Set([...defaultOrigins, ...parseOrigins(process.env.CLIENT_ORIGIN)]);

function getRequester(req) {
  const trusted =
    req.headers["x-vercel-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    "unknown";
  return String(trusted).split(",")[0].trim();
}

async function shouldRefresh(req, scope) {
  if (req.query.refresh !== "1") return false;

  const key = `${getRequester(req)}:${scope}`;
  const allowed = await claimRefreshSlot(key, refreshCooldownSec);

  if (!allowed) {
    req.refreshLimited = true;
    return false;
  }

  return true;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(express.static(clientDist));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    ttlSec,
    refreshCooldownSec,
    sourceCount: sourceOrder.length,
    storage: getStoreInfo(),
    docs: ["/api/hot", "/api/hot/:source", "/api/archive", "/api/status", "/api/sources"],
  });
});

async function loadSource(source, { refresh = false, q = "" } = {}) {
  const handler = sources[source];
  const startedAt = Date.now();

  if (!handler) {
    const error = new Error(`Unknown source: ${source}`);
    error.status = 404;
    throw error;
  }

  const cacheKey = `hot:${source}:q=${q}`;

  if (!refresh) {
    const cached = await getCache(cacheKey);

    if (cached) {
      console.log(`[cache hit] ${cacheKey}`);
      const cachedPlatform = {
        ...cached,
        dataState: cached.dataState === "offline" ? "offline" : "cached",
        fetchDurationMs: 0,
      };

      await recordStatus(source, {
        status: "cached",
        itemCount: cachedPlatform.items?.length || 0,
        updatedAt: new Date().toISOString(),
        durationMs: 0,
      });

      return attachSourceStrategy(source, ensurePlatformLinks(cachedPlatform));
    }
  }

  console.log(`[fetch] ${cacheKey}`);
  const data = await handler({ q });
  const linkedData = ensurePlatformLinks(data);
  const platform = attachSourceStrategy(source, {
    ...linkedData,
    dataState: linkedData.dataState || (linkedData.degraded ? "offline" : "live"),
    fetchDurationMs: Date.now() - startedAt,
  });

  await setCache(cacheKey, platform, ttlSec);
  await recordSnapshot(platform, {
    durationMs: platform.fetchDurationMs,
    status: platform.degraded ? "degraded" : "success",
  });

  return platform;
}

async function safeLoadSource(source, options) {
  try {
    return await loadSource(source, options);
  } catch (error) {
    console.error(`[source error] ${source}:`, error.message);
    await recordStatus(source, {
      status: "failed",
      message: error.message,
      updatedAt: new Date().toISOString(),
    });

    const snapshot = await getLatestSnapshot(source);

    if (snapshot) {
      return attachSourceStrategy(source, ensurePlatformLinks(snapshot));
    }

    return attachSourceStrategy(source, {
      source,
      sourceName: source,
      listName: "加载失败",
      updatedAt: new Date().toISOString(),
      items: [],
      error: true,
      dataState: "error",
      message: `暂时无法获取 ${source} 数据，请稍后重试。`,
    });
  }
}

app.get("/api/hot", async (req, res) => {
  const refresh = await shouldRefresh(req, "all");
  const q = String(req.query.q || "").trim();
  if (req.refreshLimited) {
    res.set("x-refresh-limited", String(refreshCooldownSec));
  }

  const platforms = await Promise.all(
    sourceOrder.map((source) => safeLoadSource(source, { refresh, q })),
  );

  res.json({
    platforms,
    ttlSec,
    statuses: await getSourceStatuses(sourceOrder),
    storage: getStoreInfo(),
  });
});

app.get("/api/hot/:source", async (req, res) => {
  const source = req.params.source;
  const refresh = await shouldRefresh(req, source);
  const q = String(req.query.q || "").trim();
  if (req.refreshLimited) {
    res.set("x-refresh-limited", String(refreshCooldownSec));
  }

  try {
    const platform = await loadSource(source, { refresh, q });
    res.json(platform);
  } catch (error) {
    if (error.status !== 404) {
      const snapshot = await getLatestSnapshot(source);

      if (snapshot) {
        res.json(attachSourceStrategy(source, ensurePlatformLinks(snapshot)));
        return;
      }
    }

    res.status(error.status || 500).json(attachSourceStrategy(source, {
      source,
      sourceName: source,
      listName: "加载失败",
      updatedAt: new Date().toISOString(),
      items: [],
      error: true,
      dataState: "error",
      message: error.status === 404 ? "未知平台" : "平台数据获取失败",
    }));
  }
});

app.get("/api/archive", async (req, res) => {
  const source = String(req.query.source || "").trim();
  const date = String(req.query.date || "").trim();
  const range = String(req.query.range || "today").trim();
  res.json(await getArchive({ source, date, range }));
});

app.get("/api/status", async (_req, res) => {
  res.json({
    ttlSec,
    statuses: await getSourceStatuses(sourceOrder),
    storage: getStoreInfo(),
  });
});

app.get("/api/sources", (_req, res) => {
  res.json({
    sourceCount: sourceOrder.length,
    sources: listSourceStrategies(sourceOrder),
  });
});

app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: "not_found",
    message: `${req.method} ${req.path} is not a supported API endpoint.`,
  });
});

app.get("/", (_req, res) => {
  if (fs.existsSync(clientIndex)) {
    res.sendFile(clientIndex);
    return;
  }

  res.json({
    ok: true,
    service: "today-hotsearch-api",
    docs: ["/api/health", "/api/hot", "/api/hot/:source", "/api/archive", "/api/status", "/api/sources"],
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
