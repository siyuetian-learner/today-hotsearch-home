import type { ArchiveResponse, HotPlatform, HotResponse, SourceStatus } from "../types/hot";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function buildQuery(options: { q?: string; refresh?: boolean } = {}) {
  const params = new URLSearchParams();

  if (options.q) {
    params.set("q", options.q);
  }

  if (options.refresh) {
    params.set("refresh", "1");
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchAllHot(options: { q?: string; refresh?: boolean } = {}) {
  return fetchJson<HotResponse>(`/api/hot${buildQuery(options)}`);
}

export function fetchHotPlatform(source: string, options: { q?: string; refresh?: boolean } = {}) {
  return fetchJson<HotPlatform>(`/api/hot/${source}${buildQuery(options)}`);
}

export function fetchArchive(options: { source?: string; date?: string; range?: string } = {}) {
  const params = new URLSearchParams();

  if (options.source) params.set("source", options.source);
  if (options.date) params.set("date", options.date);
  if (options.range) params.set("range", options.range);

  const query = params.toString();
  return fetchJson<ArchiveResponse>(`/api/archive${query ? `?${query}` : ""}`);
}

export function fetchSourceStatuses() {
  return fetchJson<{ ttlSec: number; statuses: SourceStatus[] }>("/api/status");
}
