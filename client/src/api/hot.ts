import type { HotPlatform, HotResponse } from "../types/hot";

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
