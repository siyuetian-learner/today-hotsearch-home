import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAllHot, fetchArchive, fetchHotPlatform } from "./api/hot";
import { CategoryTabs } from "./components/CategoryTabs";
import {
  categorySources,
  formatRelativeTime,
  getMetricText,
  getSourceName,
  getSourceType,
  sourceLabels,
  sourceOrder,
} from "./components/config";
import { FocusPanel } from "./components/FocusPanel";
import { Footer } from "./components/Footer";
import { HotCard } from "./components/HotCard";
import { fallbackHotResponse } from "./data/fallbackHot";
import type { HotItem, HotPlatform, SourceStatus } from "./types/hot";

type ViewMode = "cards" | "reader";
type ArchiveRange = "today" | "yesterday" | "7d";
type SelectedHot = { board: HotPlatform; item: HotItem } | null;

function readStoredString(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readStoredSet(key: string) {
  try {
    return new Set<string>(JSON.parse(window.localStorage.getItem(key) || "[]"));
  } catch {
    return new Set<string>();
  }
}

function sameText(a: string, b: string) {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return left.includes(right.slice(0, 5)) || right.includes(left.slice(0, 5));
}

function findRelated(selected: SelectedHot, boards: HotPlatform[]) {
  if (!selected) return [];

  return boards
    .flatMap((board) =>
      board.items
        .filter((item) => board.source !== selected.board.source && sameText(item.title, selected.item.title))
        .slice(0, 2)
        .map((item) => ({ board, item })),
    )
    .slice(0, 5);
}

export function App() {
  const [boards, setBoards] = useState<HotPlatform[]>([]);
  const [ttlSec, setTtlSec] = useState(600);
  const [statuses, setStatuses] = useState<SourceStatus[]>([]);
  const [keyword, setKeyword] = useState("");
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState(() => readStoredString("hotsearch.category", "all"));
  const [viewMode, setViewMode] = useState<ViewMode>(() => (readStoredString("hotsearch.view", "cards") === "reader" ? "reader" : "cards"));
  const [archiveRange, setArchiveRange] = useState<ArchiveRange>("today");
  const [archiveCount, setArchiveCount] = useState(0);
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(() => readStoredSet("hotsearch.hiddenSources"));
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [selectedHot, setSelectedHot] = useState<SelectedHot>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedText, setUpdatedText] = useState("");
  const searchTimer = useRef<number | undefined>(undefined);

  const orderedBoards = useMemo(() => {
    return [...boards].sort((a, b) => sourceOrder.indexOf(a.source) - sourceOrder.indexOf(b.source));
  }, [boards]);

  const visibleBoards = useMemo(() => {
    const sources = categorySources[activeCategory] || categorySources.all;
    return orderedBoards.filter((board) => sources.includes(board.source) && !hiddenSources.has(board.source));
  }, [activeCategory, hiddenSources, orderedBoards]);

  const quickItems = useMemo(() => {
    return visibleBoards
      .flatMap((board) => board.items.slice(0, 3).map((item) => ({ board, item })))
      .sort((a, b) => a.item.rank - b.item.rank)
      .slice(0, 18);
  }, [visibleBoards]);

  const relatedItems = useMemo(() => findRelated(selectedHot, orderedBoards), [orderedBoards, selectedHot]);

  const resultStatus = useMemo(() => {
    if (loading) return "正在加载数据...";
    const total = visibleBoards.reduce((sum, board) => sum + (board.items?.length || 0), 0);
    const hidden = hiddenSources.size ? `，已隐藏 ${hiddenSources.size} 个平台` : "";
    const keywordText = keyword ? `，关键词「${keyword}」` : "";
    return `当前 ${visibleBoards.length} 个榜单，共 ${total} 条结果${keywordText}${hidden}，缓存约 ${Math.round(ttlSec / 60)} 分钟`;
  }, [hiddenSources.size, keyword, loading, ttlSec, visibleBoards]);

  const dataSummary = useMemo(() => {
    const live = visibleBoards.filter((board) => board.dataState === "live").length;
    const cached = visibleBoards.filter((board) => board.dataState === "cached").length;
    const degraded = visibleBoards.filter((board) => board.degraded || ["stale", "offline", "error"].includes(board.dataState || "")).length;
    const failed = statuses.filter((status) => status.status === "failed").length;
    return { live, cached, degraded, failed };
  }, [statuses, visibleBoards]);

  async function loadBoards(options: { refresh?: boolean; q?: string } = {}) {
    setLoading(true);
    setRefreshing(Boolean(options.refresh));
    try {
      const data = await fetchAllHot({ q: options.q ?? keyword, refresh: options.refresh });
      setBoards(data.platforms || []);
      setStatuses(data.statuses || []);
      setTtlSec(data.ttlSec || ttlSec);
      setUpdatedText(
        new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      setBoards(fallbackHotResponse.platforms);
      setStatuses([]);
      setTtlSec(fallbackHotResponse.ttlSec);
      setUpdatedText(
        new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadArchive(range: ArchiveRange) {
    try {
      const archive = await fetchArchive({ range });
      setArchiveCount(archive.count || 0);
    } catch {
      setArchiveCount(0);
    }
  }

  async function retrySource(source: string) {
    try {
      const data = await fetchHotPlatform(source, { q: keyword, refresh: true });
      setBoards((current) => current.map((board) => (board.source === source ? data : board)));
    } catch {
      setBoards((current) =>
        current.map((board) =>
          board.source === source
            ? {
                ...board,
                dataState: "error",
                degraded: true,
                message: "实时接口暂时不可用，当前继续展示已有快照。",
              }
            : board,
        ),
      );
    }
  }

  function toggleSource(source: string) {
    setExpandedSources((current) => {
      const next = new Set(current);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }

  function toggleHiddenSource(source: string) {
    setHiddenSources((current) => {
      const next = new Set(current);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }

  function applySearch(value: string) {
    setPendingKeyword(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      const nextKeyword = value.trim();
      setKeyword(nextKeyword);
      loadBoards({ q: nextKeyword });
    }, 260);
  }

  function selectCategory(category: string) {
    setActiveCategory(category);
  }

  function selectArchiveRange(range: ArchiveRange) {
    setArchiveRange(range);
    loadArchive(range);
  }

  useEffect(() => {
    loadBoards();
    loadArchive("today");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hotsearch.category", activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    window.localStorage.setItem("hotsearch.view", viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem("hotsearch.hiddenSources", JSON.stringify(Array.from(hiddenSources)));
  }, [hiddenSources]);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div>
            <h1>今日热搜</h1>
            <p>面向中文用户的一页式热点工作台，聚合热搜、AI 动态、模型与开源项目。</p>
          </div>
          <span className="update-time" aria-live="polite">
            {updatedText ? `更新于 ${updatedText}` : "等待更新"}
          </span>
        </div>
      </header>

      <main className="page-shell">
        <section className="board-toolbar" aria-label="榜单摘要">
          <div>
            <strong>全网实时榜</strong>
            <span>12 个数据源 · 详情解读 · 速读 · 历史快照 · 国内入口</span>
          </div>
          <div className="toolbar-actions">
            <label className="search-box">
              <span>筛选</span>
              <input
                onChange={(event) => applySearch(event.target.value)}
                placeholder="输入关键词"
                type="search"
                value={pendingKeyword}
              />
            </label>
            <button className="refresh-button" disabled={loading || refreshing} onClick={() => loadBoards({ refresh: true })} type="button">
              {refreshing ? "刷新中..." : loading ? "加载中..." : "刷新热度"}
            </button>
          </div>
        </section>

        <section className="control-panel" aria-label="榜单筛选">
          <CategoryTabs activeCategory={activeCategory} onChange={selectCategory} />
          <div className="panel-actions">
            <div className="segmented" aria-label="视图切换">
              <button className={viewMode === "cards" ? "is-active" : ""} type="button" onClick={() => setViewMode("cards")}>
                卡片
              </button>
              <button className={viewMode === "reader" ? "is-active" : ""} type="button" onClick={() => setViewMode("reader")}>
                速读
              </button>
            </div>
            <div className="segmented archive-switch" aria-label="历史归档">
              <button className={archiveRange === "today" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("today")}>
                今天
              </button>
              <button className={archiveRange === "yesterday" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("yesterday")}>
                昨天
              </button>
              <button className={archiveRange === "7d" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("7d")}>
                7天
              </button>
            </div>
          </div>
        </section>

        <section className="data-strip" aria-label="数据状态">
          <span>{resultStatus}</span>
          <span>实时 {dataSummary.live}</span>
          <span>缓存 {dataSummary.cached}</span>
          <span>降级 {dataSummary.degraded}</span>
          <span>失败 {dataSummary.failed}</span>
          <span>归档快照 {archiveCount}</span>
        </section>

        <details className="home-settings">
          <summary>我的首页</summary>
          <div className="source-toggles">
            {sourceOrder.map((source) => (
              <label key={source}>
                <input checked={!hiddenSources.has(source)} type="checkbox" onChange={() => toggleHiddenSource(source)} />
                <span>{sourceLabels[source]?.name || source}</span>
              </label>
            ))}
          </div>
        </details>

        {loading ? (
          <section className="cards-grid">
            <article className="hot-card loading-card">
              <p className="status-state">正在加载热搜数据...</p>
            </article>
          </section>
        ) : viewMode === "reader" ? (
          <section className="reader-list" aria-label="速读列表">
            <div className="section-head">
              <div>
                <h2>5 分钟速读</h2>
                <span>合并各平台 Top 3，按排名优先展示</span>
              </div>
            </div>
            {quickItems.map(({ board, item }) => (
              <button className="reader-item" key={`${board.source}-${item.rank}-${item.title}`} type="button" onClick={() => setSelectedHot({ board, item })}>
                <span className="reader-source">{getSourceName(board)}</span>
                <span className="reader-title">{item.title}</span>
                <span className="reader-meta">{getMetricText(board, item) || "热度更新中"}</span>
              </button>
            ))}
          </section>
        ) : (
          <>
            <FocusPanel boards={visibleBoards} onSelectItem={(board, item) => setSelectedHot({ board, item })} />
            <section className="cards-grid" aria-label="热搜榜单">
              {visibleBoards.map((board) => (
                <HotCard
                  board={board}
                  expanded={expandedSources.has(board.source)}
                  key={board.source}
                  onRetry={retrySource}
                  onSelectItem={(selectedBoard, item) => setSelectedHot({ board: selectedBoard, item })}
                  onToggle={toggleSource}
                />
              ))}
            </section>
          </>
        )}
      </main>

      {selectedHot ? (
        <div className="detail-backdrop" role="presentation" onClick={() => setSelectedHot(null)}>
          <aside className="detail-drawer" aria-label="热点详情" role="dialog" onClick={(event) => event.stopPropagation()}>
            <button className="drawer-close" type="button" onClick={() => setSelectedHot(null)}>
              关闭
            </button>
            <span className="detail-kicker">
              {getSourceName(selectedHot.board)} · 第 {selectedHot.item.rank} 名 · {getSourceType(selectedHot.board)}
            </span>
            <h2>{selectedHot.item.title}</h2>
            <div className="detail-metrics">
              <span>{getMetricText(selectedHot.board, selectedHot.item) || "热度更新中"}</span>
              <span>{formatRelativeTime(selectedHot.board.updatedAt)}</span>
              <span>{selectedHot.item.sourceType || sourceLabels[selectedHot.board.source]?.type || "公开来源"}</span>
            </div>
            <section className="detail-section">
              <h3>发生了什么</h3>
              <p>{selectedHot.item.summary || "该热点正在榜单中升温，建议结合原站信息继续核实背景。"}</p>
            </section>
            <section className="detail-section">
              <h3>为什么上榜</h3>
              <p>{selectedHot.item.why || "该条目在当前平台的搜索、点击、评论或社区互动信号较高。"}</p>
            </section>
            {relatedItems.length ? (
              <section className="detail-section">
                <h3>相似热点</h3>
                <div className="related-list">
                  {relatedItems.map(({ board, item }) => (
                    <button key={`${board.source}-${item.rank}-${item.title}`} type="button" onClick={() => setSelectedHot({ board, item })}>
                      <span>{getSourceName(board)}</span>
                      <strong>{item.title}</strong>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
            <div className="detail-links">
              <a href={selectedHot.item.url || "#"} rel="noreferrer" target="_blank">
                打开链接
              </a>
              {selectedHot.item.cnUrl ? (
                <a href={selectedHot.item.cnUrl} rel="noreferrer" target="_blank">
                  国内入口
                </a>
              ) : null}
              {selectedHot.item.originalUrl ? (
                <a href={selectedHot.item.originalUrl} rel="noreferrer" target="_blank">
                  原站
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      <Footer />
    </>
  );
}
