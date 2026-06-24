const memoryStore = new Map();

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const keyPrefix = process.env.STORE_KEY_PREFIX || "today-hotsearch";
const hasRemote = Boolean(redisUrl && redisToken);
let remoteUnavailableLogged = false;

function now() {
  return Date.now();
}

function prefixedKey(key) {
  return `${keyPrefix}:${key}`;
}

function cleanupMemory() {
  const current = now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt && entry.expiresAt <= current) {
      memoryStore.delete(key);
    }
  }
}

function getMemoryRaw(key) {
  cleanupMemory();
  const entry = memoryStore.get(key);
  return entry ? entry.value : null;
}

function setMemoryRaw(key, value, ttlSec = 0) {
  cleanupMemory();
  memoryStore.set(key, {
    value,
    expiresAt: ttlSec > 0 ? now() + ttlSec * 1000 : 0,
  });
}

function setMemoryNx(key, value, ttlSec) {
  cleanupMemory();
  if (memoryStore.has(key)) return false;
  setMemoryRaw(key, value, ttlSec);
  return true;
}

async function runRemoteCommand(args) {
  if (!hasRemote) {
    return { ok: false, result: null };
  }

  const command = String(args[0] || "").toUpperCase();
  const commandArgs = [...args];

  if (commandArgs[1]) {
    commandArgs[1] = prefixedKey(commandArgs[1]);
  }

  try {
    const response = await fetch(redisUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commandArgs),
    });

    if (!response.ok) {
      throw new Error(`shared store ${command} failed with ${response.status}`);
    }

    const payload = await response.json();
    if (payload.error) {
      throw new Error(String(payload.error));
    }

    return { ok: true, result: payload.result };
  } catch (error) {
    if (!remoteUnavailableLogged) {
      console.warn(`[shared-store] remote store unavailable, falling back to memory: ${error.message}`);
      remoteUnavailableLogged = true;
    }
    return { ok: false, result: null };
  }
}

async function runCommand(args) {
  const response = await runRemoteCommand(args);
  return response.ok ? response.result : null;
}

async function getRaw(key) {
  if (hasRemote) {
    const response = await runRemoteCommand(["GET", key]);
    if (response.ok) {
      return response.result;
    }
  }

  return getMemoryRaw(key);
}

async function setRaw(key, value, ttlSec = 0) {
  if (hasRemote) {
    const args = ttlSec > 0 ? ["SET", key, value, "EX", String(ttlSec)] : ["SET", key, value];
    const response = await runRemoteCommand(args);
    if (response.ok) return true;
  }

  setMemoryRaw(key, value, ttlSec);
  return false;
}

async function getJson(key) {
  const raw = await getRaw(key);
  if (!raw) return null;

  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

async function setJson(key, value, ttlSec = 0) {
  return setRaw(key, JSON.stringify(value), ttlSec);
}

async function setNx(key, value, ttlSec) {
  if (hasRemote) {
    const response = await runRemoteCommand(["SET", key, value, "EX", String(ttlSec), "NX"]);
    if (response.ok) return response.result === "OK";
  }

  return setMemoryNx(key, value, ttlSec);
}

async function addSetMember(key, value, ttlSec = 0) {
  if (hasRemote) {
    const addResponse = await runRemoteCommand(["SADD", key, value]);
    if (!addResponse.ok) {
      const values = new Set((await getJson(key)) || []);
      values.add(value);
      await setJson(key, Array.from(values), ttlSec);
      return false;
    }
    if (ttlSec > 0) {
      await runRemoteCommand(["EXPIRE", key, String(ttlSec)]);
    }
    return true;
  }

  const values = new Set((await getJson(key)) || []);
  values.add(value);
  await setJson(key, Array.from(values), ttlSec);
  return false;
}

async function getSetMembers(key) {
  if (hasRemote) {
    const response = await runRemoteCommand(["SMEMBERS", key]);
    if (response.ok) return Array.isArray(response.result) ? response.result : [];
  }

  return (await getJson(key)) || [];
}

function hasSharedStore() {
  return hasRemote;
}

function getStoreInfo() {
  return {
    backend: hasRemote ? "redis-rest" : "memory",
    shared: hasRemote,
    keyPrefix,
  };
}

module.exports = {
  addSetMember,
  getJson,
  getSetMembers,
  getStoreInfo,
  hasSharedStore,
  runCommand,
  setJson,
  setNx,
};
