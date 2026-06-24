const fs = require("fs");
const path = require("path");
const {
  addSetMember,
  getJson,
  getSetMembers,
  getStoreInfo,
  hasSharedStore,
  setJson,
} = require("./shared-store");

const archiveDir = path.resolve(__dirname, "..", "data");
const archiveFile = path.resolve(archiveDir, "archive.json");
const maxDays = Number(process.env.ARCHIVE_DAYS || 7);
const timezoneOffsetHours = Number(process.env.ARCHIVE_TIMEZONE_OFFSET || 8);
const archiveTtlSec = Number(process.env.ARCHIVE_TTL_SEC || (maxDays + 2) * 24 * 60 * 60);
const localWriteDebounceMs = Number(process.env.ARCHIVE_WRITE_DEBOUNCE_MS || 2000);
const isServerless = process.env.VERCEL === "1";

let localArchive = readLocalArchive();
const localStatuses = new Map();
let pendingWriteTimer = null;
let writeInFlight = false;

function readLocalArchive() {
  try {
    if (!fs.existsSync(archiveFile)) {
      return { snapshots: {} };
    }

    return JSON.parse(fs.readFileSync(archiveFile, "utf8"));
  } catch {
    return { snapshots: {} };
  }
}

function storageMessage() {
  if (hasSharedStore()) {
    return "当前使用共享 KV/Redis 保存缓存、刷新冷却和历史快照，可跨 Serverless 实例复用。";
  }

  if (isServerless) {
    return "当前 Serverless 环境未配置共享 KV/Redis，历史快照仅作本实例内临时参考。";
  }

  return "当前运行环境使用本地轻量快照文件。";
}

function archivePersistent() {
  return hasSharedStore() || !isServerless;
}

function dateSetKey() {
  return "archive:dates";
}

function sourceSetKey(dateKey) {
  return `archive:sources:${dateKey}`;
}

function snapshotKey(dateKey, source) {
  return `archive:snapshot:${dateKey}:${source}`;
}

function statusKey(source) {
  return `status:${source}`;
}

function statusSourceSetKey() {
  return "status:sources";
}

function toDateKey(value = new Date()) {
  const date = new Date(value);
  date.setHours(date.getHours() + timezoneOffsetHours);
  return date.toISOString().slice(0, 10);
}

function previousDateKey(daysAgo) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return toDateKey(date);
}

function pruneLocalArchive() {
  const keep = new Set(Array.from({ length: maxDays }, (_item, index) => previousDateKey(index)));

  for (const dateKey of Object.keys(localArchive.snapshots)) {
    if (!keep.has(dateKey)) {
      delete localArchive.snapshots[dateKey];
    }
  }
}

function clonePlatform(platform) {
  return {
    ...platform,
    items: (platform.items || []).slice(0, 10).map((item) => ({ ...item })),
  };
}

function staleSnapshot(snapshot) {
  return {
    ...clonePlatform(snapshot),
    degraded: true,
    dataState: "stale",
    message: "实时接口暂不可用，已展示最近一次成功快照。",
  };
}

function scheduleLocalArchiveWrite() {
  if (isServerless || hasSharedStore() || pendingWriteTimer) return;

  pendingWriteTimer = setTimeout(() => {
    pendingWriteTimer = null;
    flushLocalArchive();
  }, localWriteDebounceMs);

  if (typeof pendingWriteTimer.unref === "function") {
    pendingWriteTimer.unref();
  }
}

function flushLocalArchive() {
  if (writeInFlight) {
    scheduleLocalArchiveWrite();
    return;
  }

  writeInFlight = true;
  const payload = JSON.stringify(localArchive);

  fs.promises
    .mkdir(archiveDir, { recursive: true })
    .then(() => fs.promises.writeFile(archiveFile, payload, "utf8"))
    .catch((error) => {
      console.warn(`[archive] local archive write failed: ${error.message}`);
    })
    .finally(() => {
      writeInFlight = false;
    });
}

function normalizeStatus(source, status) {
  return {
    source,
    status: status.status || "unknown",
    message: status.message || "",
    itemCount: Number(status.itemCount || 0),
    updatedAt: status.updatedAt || new Date().toISOString(),
    durationMs: status.durationMs,
  };
}

async function recordStatus(source, status) {
  const normalized = normalizeStatus(source, status);

  if (hasSharedStore()) {
    await setJson(statusKey(source), normalized, archiveTtlSec);
    await addSetMember(statusSourceSetKey(), source, archiveTtlSec);
    return;
  }

  localStatuses.set(source, normalized);
}

async function recordSnapshot(platform, meta = {}) {
  if (!platform || platform.error || !platform.items?.length) {
    return;
  }

  const dateKey = toDateKey(platform.updatedAt || new Date());
  const snapshot = {
    ...clonePlatform(platform),
    archivedAt: new Date().toISOString(),
  };

  await recordStatus(platform.source, {
    status: platform.degraded ? "degraded" : meta.status || "success",
    message: platform.message || meta.message || "",
    itemCount: platform.items.length,
    updatedAt: new Date().toISOString(),
    durationMs: meta.durationMs,
  });

  if (hasSharedStore()) {
    await setJson(snapshotKey(dateKey, platform.source), snapshot, archiveTtlSec);
    await addSetMember(dateSetKey(), dateKey, archiveTtlSec);
    await addSetMember(sourceSetKey(dateKey), platform.source, archiveTtlSec);
    return;
  }

  localArchive.snapshots[dateKey] ||= {};
  localArchive.snapshots[dateKey][platform.source] = snapshot;
  pruneLocalArchive();
  scheduleLocalArchiveWrite();
}

async function getLatestSnapshot(source) {
  if (hasSharedStore()) {
    const dates = (await getSetMembers(dateSetKey())).sort().reverse();

    for (const dateKey of dates) {
      const snapshot = await getJson(snapshotKey(dateKey, source));
      if (snapshot) {
        return staleSnapshot(snapshot);
      }
    }

    return null;
  }

  const dates = Object.keys(localArchive.snapshots).sort().reverse();

  for (const dateKey of dates) {
    const snapshot = localArchive.snapshots[dateKey]?.[source];
    if (snapshot) {
      return staleSnapshot(snapshot);
    }
  }

  return null;
}

function resolveArchiveDates({ date, range }) {
  if (date) return [date];
  if (range === "yesterday") return [previousDateKey(1)];
  if (range === "7d") return Array.from({ length: 7 }, (_item, index) => previousDateKey(index));
  return [previousDateKey(0)];
}

async function getSharedArchiveForDate(dateKey, source) {
  const sources = source ? [source] : await getSetMembers(sourceSetKey(dateKey));
  const snapshots = [];

  for (const currentSource of sources) {
    const platform = await getJson(snapshotKey(dateKey, currentSource));
    if (platform) {
      snapshots.push({
        date: dateKey,
        platform: clonePlatform(platform),
      });
    }
  }

  return snapshots;
}

async function getArchive({ source = "", date = "", range = "today" } = {}) {
  const dates = resolveArchiveDates({ date, range });
  const snapshots = [];

  if (hasSharedStore()) {
    for (const dateKey of dates) {
      snapshots.push(...(await getSharedArchiveForDate(dateKey, source)));
    }
  } else {
    for (const dateKey of dates) {
      const daily = localArchive.snapshots[dateKey] || {};
      const platforms = source ? [daily[source]].filter(Boolean) : Object.values(daily);

      for (const platform of platforms) {
        snapshots.push({
          date: dateKey,
          platform: clonePlatform(platform),
        });
      }
    }
  }

  return {
    dates,
    snapshots,
    count: snapshots.length,
    persistent: archivePersistent(),
    message: storageMessage(),
    storage: getStoreInfo(),
  };
}

async function getSourceStatuses(sourceOrder = []) {
  let known = sourceOrder;

  if (!known.length && hasSharedStore()) {
    known = await getSetMembers(statusSourceSetKey());
  } else if (!known.length) {
    known = Array.from(localStatuses.keys());
  }

  const statuses = [];

  for (const source of known) {
    const status = hasSharedStore() ? await getJson(statusKey(source)) : localStatuses.get(source);
    statuses.push(
      status || {
        source,
        status: "idle",
        message: "尚未抓取",
        itemCount: 0,
        updatedAt: "",
      },
    );
  }

  return statuses;
}

module.exports = {
  getArchive,
  getLatestSnapshot,
  getSourceStatuses,
  recordSnapshot,
  recordStatus,
};
