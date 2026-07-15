function getAggregateCacheKey() {
  return "hot:aggregate:v2";
}

function isAggregateFresh(payload, now = Date.now()) {
  const freshUntil = Date.parse(payload?.freshUntil || "");
  return Number.isFinite(freshUntil) && freshUntil > now;
}

function deriveStatus(platform) {
  let status = "success";
  if (platform.error || platform.dataState === "error") status = "failed";
  else if (platform.degraded || platform.dataState === "offline" || platform.dataState === "stale") status = "degraded";
  else if (platform.dataState === "cached") status = "cached";

  return {
    source: platform.source,
    status,
    message: platform.message || "",
    itemCount: platform.items?.length || 0,
    updatedAt: platform.updatedAt || new Date().toISOString(),
    durationMs: platform.fetchDurationMs,
  };
}

function buildAggregatePayload(platforms, ttlSec, storage) {
  const generatedAt = new Date();
  return {
    platforms,
    ttlSec,
    statuses: platforms.map(deriveStatus),
    storage,
    generatedAt: generatedAt.toISOString(),
    freshUntil: new Date(generatedAt.getTime() + ttlSec * 1000).toISOString(),
  };
}

module.exports = {
  buildAggregatePayload,
  getAggregateCacheKey,
  isAggregateFresh,
};
