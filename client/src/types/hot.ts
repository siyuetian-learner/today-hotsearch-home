export type HotItem = {
  rank: number;
  title: string;
  url: string;
  heat?: string | number;
  summary?: string;
  originalUrl?: string;
  cnUrl?: string;
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
};

export type HotResponse = {
  platforms: HotPlatform[];
  ttlSec: number;
};
