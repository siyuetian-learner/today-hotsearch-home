const fs = require("fs");
const path = require("path");

const archiveDir = path.resolve(__dirname, "..", "data");
const archiveFile = path.resolve(archiveDir, "archive.json");
const maxDays = Number(process.env.ARCHIVE_DAYS || 7);
const timezoneOffsetHours = Number(process.env.ARCHIVE_TIMEZONE_OFFSET || 8);

let archive = readArchive();
const statuses = new Map();
let archivePersistent = process.env.VERCEL !== "1";
let archiveMessage = archivePersistent
  ? "当前运行环境支持本地轻量快照。"
  : "当前 Serverless 环境不保证持久归档，历史快照仅作本实例内临时参考。";

function readArchive() {
  try {
    if (!fs.existsSync(archiveFile)) {
      return { snapshots: {} };
    }

    return JSON.parse(fs.readFileSync(archiveFile, "utf8"));
  } catch {
    return { snapshots: {} };
  }
}

function persistArchive() {
  try {
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(archiveFile, JSON.stringify(archive, null, 2), "utf8");
    archivePersistent = process.env.VERCEL !== "1";
    archiveMessage = archivePersistent
      ? "当前运行环境支持本地轻量快照。"
      : "当前 Serverless 环境不保证持久归档，历史快照仅作本实例内临时参考。";
  } catch {
    archivePersistent = false;
    archiveMessage = "当前运行环境无法写入归档文件，历史快照仅作本实例内临时参考。";
  }
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

function pruneArchive() {
  const keep = new Set(Array.from({ length: maxDays }, (_item, index) => previousDateKey(index)));

  for (const dateKey of Object.keys(archive.snapshots)) {
    if (!keep.has(dateKey)) {
      delete archive.snapshots[dateKey];
    }
  }
}

function clonePlatform(platform) {
  return {
    ...platform,
    items: (platform.items || []).slice(0, 10).map((item) => ({ ...item })),
  };
}

function recordSnapshot(platform, meta = {}) {
  if (!platform || platform.error || !platform.items?.length) {
    return;
  }

  const dateKey = toDateKey(platform.updatedAt || new Date());
  archive.snapshots[dateKey] ||= {};
  archive.snapshots[dateKey][platform.source] = {
    ...clonePlatform(platform),
    archivedAt: new Date().toISOString(),
  };

  recordStatus(platform.source, {
    status: platform.degraded ? "degraded" : meta.status || "success",
    message: platform.message || meta.message || "",
    itemCount: platform.items.length,
    updatedAt: new Date().toISOString(),
    durationMs: meta.durationMs,
  });

  pruneArchive();
  persistArchive();
}

function recordStatus(source, status) {
  statuses.set(source, {
    source,
    status: status.status || "unknown",
    message: status.message || "",
    itemCount: Number(status.itemCount || 0),
    updatedAt: status.updatedAt || new Date().toISOString(),
    durationMs: status.durationMs,
  });
}

function getLatestSnapshot(source) {
  const dates = Object.keys(archive.snapshots).sort().reverse();

  for (const dateKey of dates) {
    const snapshot = archive.snapshots[dateKey]?.[source];

    if (snapshot) {
      return {
        ...clonePlatform(snapshot),
        degraded: true,
        dataState: "stale",
        message: "实时接口暂不可用，已展示最近一次成功快照。",
      };
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

function getArchive({ source = "", date = "", range = "today" } = {}) {
  const dates = resolveArchiveDates({ date, range });
  const snapshots = [];

  for (const dateKey of dates) {
    const daily = archive.snapshots[dateKey] || {};
    const platforms = source ? [daily[source]].filter(Boolean) : Object.values(daily);

    for (const platform of platforms) {
      snapshots.push({
        date: dateKey,
        platform: clonePlatform(platform),
      });
    }
  }

  return {
    dates,
    snapshots,
    count: snapshots.length,
    persistent: archivePersistent,
    message: archiveMessage,
  };
}

function getSourceStatuses(sourceOrder = []) {
  const known = sourceOrder.length ? sourceOrder : Array.from(statuses.keys());

  return known.map((source) => {
    return (
      statuses.get(source) || {
        source,
        status: "idle",
        message: "尚未抓取",
        itemCount: 0,
        updatedAt: "",
      }
    );
  });
}

module.exports = {
  getArchive,
  getLatestSnapshot,
  getSourceStatuses,
  recordSnapshot,
  recordStatus,
};
