export type HotItem = {
  rank: number;
  title: string;
  url: string;
  heat?: string | number;
  summary?: string;
  originalUrl?: string;
  cnUrl?: string;
  sourceType?: string;
  trend?: "new" | "up" | "down" | "steady";
  why?: string;
};

export type SourceStrategy = {
  active: string;
  primary: string;
  fallbacks: string[];
  domesticAccess: string;
  noPublicApi?: boolean;
  note?: string;
};

export type HotPlatform = {
  source: string;
  sourceName: string;
  listName: string;
  updatedAt: string;
  items: HotItem[];
  error?: boolean;
  message?: string;
  degraded?: boolean;
  dataState?: "live" | "cached" | "stale" | "offline" | "error";
  fetchDurationMs?: number;
  accessMode?: string;
  strategy?: SourceStrategy;
};

export type SourceStatus = {
  source: string;
  status: "idle" | "success" | "cached" | "degraded" | "failed" | string;
  message?: string;
  itemCount?: number;
  updatedAt?: string;
  durationMs?: number;
};

export type HotResponse = {
  platforms: HotPlatform[];
  ttlSec: number;
  statuses?: SourceStatus[];
};

export type ArchiveSnapshot = {
  date: string;
  platform: HotPlatform;
};

export type ArchiveResponse = {
  dates: string[];
  snapshots: ArchiveSnapshot[];
  count: number;
  persistent?: boolean;
  message?: string;
};
