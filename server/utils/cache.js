const { getJson, setJson } = require("./shared-store");

function cacheKey(key) {
  return `cache:${key}`;
}

async function getCache(key) {
  return getJson(cacheKey(key));
}

async function setCache(key, value, ttlSec = Number(process.env.CACHE_TTL || 600)) {
  await setJson(cacheKey(key), value, ttlSec);
}

module.exports = {
  getCache,
  setCache,
};
