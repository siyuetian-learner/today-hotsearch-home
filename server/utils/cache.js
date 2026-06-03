const store = new Map();

function getCache(key) {
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value;
}

function setCache(key, value, ttlSec = Number(process.env.CACHE_TTL || 600)) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000,
  });
}

module.exports = {
  getCache,
  setCache,
};
