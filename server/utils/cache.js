const store = new Map();
const maxEntries = Number(process.env.CACHE_MAX_ENTRIES || 200);

function cleanupExpired(now = Date.now()) {
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}

function enforceMaxEntries() {
  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) return;
    store.delete(oldestKey);
  }
}

function getCache(key) {
  cleanupExpired();
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
  cleanupExpired();
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000,
  });
  enforceMaxEntries();
}

module.exports = {
  cleanupExpired,
  getCache,
  setCache,
};
