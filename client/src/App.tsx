import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAllHot, fetchArchive, fetchHotPlatform } from "./api/hot";
import { BriefPanel } from "./components/BriefPanel";
import { CategoryTabs } from "./components/CategoryTabs";
import { CompositePanel } from "./components/CompositePanel";
import { FeedbackPanel } from "./components/FeedbackPanel";
import {
  categorySources,
  formatRelativeTime,
  getMetricText,
  getSourceName,
  getSourceType,
  safeHref,
  sourceLabels,
  sourceOrder,
} from "./components/config";
import { FocusPanel } from "./components/FocusPanel";
import { Footer } from "./components/Footer";
import { HotCard } from "./components/HotCard";
import { SourceStatusPanel } from "./components/SourceStatusPanel";
import { TrendPanel } from "./components/TrendPanel";
import { WatchPanel } from "./components/WatchPanel";
import { fallbackHotResponse } from "./data/fallbackHot";
import type { HotItem, HotPlatform, SourceStatus } from "./types/hot";
import { buildCompositeRanking, buildLeadCategories, buildShareDigest } from "./utils/insights";

type ViewMode = "cards" | "reader";
type ArchiveRange = "today" | "yesterday" | "7d";
type SelectedHot = { board: HotPlatform; item: HotItem } | null;

const sceneShortcuts = [
  { label: "大众热点", desc: "微博、百度、知乎、B站、抖音", category: "general" },
  { label: "AI 与科技", desc: "AI HOT、模型、开源、科技媒体", category: "ai" },
  { label: "开发者关注", desc: "GitHub、Hacker News、Hugging Face", category: "dev" },
  { label: "新闻速览", desc: "百度、今日头条、微博", category: "news" },
];

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

function readStoredArray(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function readStoredListLength(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.length : 0;
  } catch {
    return 0;
  }
}

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^\p{Script=Han}a-z0-9]+/gu, "");
}

function titleBigrams(value: string) {
  const chars = Array.from(normalizeTitle(value));
  const grams = new Set<string>();

  for (let index = 0; index < chars.length - 1; index += 1) {
    grams.add(`${chars[index]}${chars[index + 1]}`);
  }

  return grams;
}

function sameText(a: string, b: string) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);

  if (left.length < 4 || right.length < 4) return false;
  if ((left.includes(right) || right.includes(left)) && Math.min(left.length, right.length) >= 6) return true;

  const leftGrams = titleBigrams(left);
  const rightGrams = titleBigrams(right);

  if (!leftGrams.size || !rightGrams.size) return false;

  let hits = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) hits += 1;
  }

  return hits >= 3 && hits / Math.min(leftGrams.size, rightGrams.size) >= 0.38;
}

function upsertStatus(statuses: SourceStatus[], next: SourceStatus) {
  const found = statuses.some((status) => status.source === next.source);
  return found ? statuses.map((status) => (status.source === next.source ? { ...status, ...next } : status)) : [...statuses, next];
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

function getAudience(board: HotPlatform) {
  if (["huggingface", "github", "hackernews", "aihot"].includes(board.source)) return "适合 AI 从业者、开发者、产品经理和技术内容创作者优先查看。";
  if (["weibo", "douyin", "bilibili", "zhihu"].includes(board.source)) return "适合需要了解大众讨论、社交传播和内容选题的人查看。";
  if (["baidu", "toutiao"].includes(board.source)) return "适合需要快速掌握新闻、民生、政策和搜索趋势的人查看。";
  return "适合关注行业变化、科技产品和商业趋势的人查看。";
}

function getImpact(board: HotPlatform, item: HotItem) {
  if (item.why) return item.why;
  if (["huggingface", "github", "hackernews", "aihot"].includes(board.source)) return "可能影响工具选型、内容选题、产品规划或技术学习方向。";
  if (["weibo", "douyin", "bilibili", "zhihu"].includes(board.source)) return "可能影响社交讨论、短视频选题、品牌传播和用户关注点。";
  if (["baidu", "toutiao"].includes(board.source)) return "可能影响公众信息获取、出行决策、政策理解和民生关注。";
  return "可能影响行业判断、产品方向和后续跟进优先级。";
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
  const [archiveMessage, setArchiveMessage] = useState("");
  const [archivePersistent, setArchivePersistent] = useState<boolean | undefined>(undefined);
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(() => readStoredSet("hotsearch.hiddenSources"));
  const [watchKeywords, setWatchKeywords] = useState<string[]>(() => readStoredArray("hotsearch.watchKeywords"));
  const [watchDraft, setWatchDraft] = useState("");
  const [sourceDraft, setSourceDraft] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [savedFeedbackCount, setSavedFeedbackCount] = useState(() => readStoredListLength("hotsearch.feedback"));
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [selectedHot, setSelectedHot] = useState<SelectedHot>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedText, setUpdatedText] = useState("");
  const [shareState, setShareState] = useState("");
  const drawerRef = useRef<HTMLElement | null>(null);
  const searchTimer = useRef<number | undefined>(undefined);
  const requestSeq = useRef(0);

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

  const leadCategories = useMemo(() => buildLeadCategories(visibleBoards), [visibleBoards]);

  const compositeRanking = useMemo(() => buildCompositeRanking(visibleBoards, 20), [visibleBoards]);

  const relatedItems = useMemo(() => findRelated(selectedHot, orderedBoards), [orderedBoards, selectedHot]);

  const watchMatches = useMemo(() => {
    return watchKeywords.map((watchKeyword) => {
      const target = normalizeTitle(watchKeyword);
      const count = orderedBoards.reduce((sum, board) => {
        return sum + board.items.filter((item) => normalizeTitle(item.title).includes(target)).length;
      }, 0);

      return { keyword: watchKeyword, count };
    });
  }, [orderedBoards, watchKeywords]);

  const resultStatus = useMemo(() => {
    if (loading) return "正在加载数据...";
    const total = visibleBoards.reduce((sum, board) => sum + (board.items?.length || 0), 0);
    const hidden = hiddenSources.size ? `，已隐藏 ${hiddenSources.size} 个平台` : "";
    const keywordText = keyword ? `，关键词“${keyword}”` : "";
    return `当前 ${visibleBoards.length} 个榜单，共 ${total} 条结果${keywordText}${hidden}，缓存约 ${Math.round(ttlSec / 60)} 分钟`;
  }, [hiddenSources.size, keyword, loading, ttlSec, visibleBoards]);

  const dataSummary = useMemo(() => {
    const live = visibleBoards.filter((board) => board.dataState === "live").length;
    const cached = visibleBoards.filter((board) => board.dataState === "cached").length;
    const degraded = visibleBoards.filter((board) => board.degraded || ["stale", "offline", "error"].includes(board.dataState || "")).length;
    const noPublicApi = visibleBoards.filter((board) => board.strategy?.noPublicApi).length;
    const failed = statuses.filter((status) => status.status === "failed").length;
    return { live, cached, degraded, failed, noPublicApi };
  }, [statuses, visibleBoards]);

  const detailTitleId = selectedHot ? `detail-title-${selectedHot.board.source}-${selectedHot.item.rank}` : undefined;

  async function loadBoards(options: { refresh?: boolean; q?: string } = {}) {
    const requestId = (requestSeq.current += 1);
    setLoading(true);
    setRefreshing(Boolean(options.refresh));
    try {
      const data = await fetchAllHot({ q: options.q ?? keyword, refresh: options.refresh });
      if (requestSeq.current !== requestId) return;
      setBoards(data.platforms || []);
      setStatuses(data.statuses || []);
      setTtlSec(data.ttlSec || ttlSec);
      setUpdatedText(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      if (requestSeq.current !== requestId) return;
      setBoards(fallbackHotResponse.platforms);
      setStatuses([]);
      setTtlSec(fallbackHotResponse.ttlSec);
      setUpdatedText(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    } finally {
      if (requestSeq.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  async function loadArchive(range: ArchiveRange) {
    try {
      const archive = await fetchArchive({ range });
      setArchiveCount(archive.count || 0);
      setArchiveMessage(archive.message || "");
      setArchivePersistent(archive.persistent);
    } catch {
      setArchiveCount(0);
      setArchiveMessage("归档状态暂时无法读取。");
      setArchivePersistent(false);
    }
  }

  async function retrySource(source: string) {
    const startedAt = Date.now();
    setStatuses((current) =>
      upsertStatus(current, {
        source,
        status: "loading",
        message: "正在重新抓取",
        updatedAt: new Date().toISOString(),
      }),
    );

    try {
      const data = await fetchHotPlatform(source, { q: keyword, refresh: true });
      setBoards((current) => current.map((board) => (board.source === source ? data : board)));
      setStatuses((current) =>
        upsertStatus(current, {
          source,
          status: data.degraded ? "degraded" : data.dataState === "cached" ? "cached" : "success",
          message: data.message || "",
          itemCount: data.items?.length || 0,
          updatedAt: data.updatedAt || new Date().toISOString(),
          durationMs: Date.now() - startedAt,
        }),
      );
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
      setStatuses((current) =>
        upsertStatus(current, {
          source,
          status: "failed",
          message: "实时接口暂时不可用，当前继续展示已有快照。",
          itemCount: 0,
          updatedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
        }),
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

  function selectArchiveRange(range: ArchiveRange) {
    setArchiveRange(range);
    loadArchive(range);
  }

  async function shareDigest() {
    const text = buildShareDigest(compositeRanking, leadCategories);

    try {
      await navigator.clipboard.writeText(text);
      setShareState("已复制");
    } catch {
      setShareState("可手动复制");
      window.prompt("复制今日热搜快报", text);
    }

    window.setTimeout(() => setShareState(""), 1600);
  }

  function applyScene(category: string) {
    setActiveCategory(category);
    setViewMode("cards");
  }

  function addWatchKeyword() {
    const nextKeyword = watchDraft.trim();
    if (!nextKeyword) return;

    setWatchKeywords((current) => {
      if (current.some((item) => item.toLowerCase() === nextKeyword.toLowerCase())) return current;
      return [...current, nextKeyword].slice(0, 10);
    });
    setWatchDraft("");
  }

  function removeWatchKeyword(value: string) {
    setWatchKeywords((current) => current.filter((item) => item !== value));
  }

  function applyWatchKeyword(value: string) {
    setPendingKeyword(value);
    setKeyword(value);
    setActiveCategory("all");
    setViewMode("cards");
    loadBoards({ q: value });
  }

  function submitFeedback() {
    const source = sourceDraft.trim();
    const feedback = feedbackDraft.trim();
    if (!source && !feedback) return;

    const current = (() => {
      try {
        return JSON.parse(window.localStorage.getItem("hotsearch.feedback") || "[]");
      } catch {
        return [];
      }
    })();
    const next = [
      {
        source,
        feedback,
        createdAt: new Date().toISOString(),
      },
      ...(Array.isArray(current) ? current : []),
    ].slice(0, 30);

    window.localStorage.setItem("hotsearch.feedback", JSON.stringify(next));
    setSavedFeedbackCount(next.length);
    setSourceDraft("");
    setFeedbackDraft("");
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

  useEffect(() => {
    window.localStorage.setItem("hotsearch.watchKeywords", JSON.stringify(watchKeywords));
  }, [watchKeywords]);

  useEffect(() => {
    if (!selectedHot) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedHot(null);
    }

    window.setTimeout(() => drawerRef.current?.focus(), 0);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedHot]);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <section>
            <div className="date-line">
              <span>CN HOT SIGNAL</span>
              <span>{new Date().toLocaleDateString("zh-CN").replace(/\//g, ".")}</span>
            </div>
            <h1>今日热搜</h1>
            <p>聚合中文互联网高频话题，把社交媒体、新闻资讯、科技、AI 和开发者社区整理成一张可快速扫读的实时信号表。</p>
          </section>
          <aside className="status-stack" aria-label="运行状态">
            <div className="status-box">
              <strong>{sourceOrder.length}</strong>
              <span>数据源</span>
            </div>
            <div className="status-box">
              <strong>{visibleBoards.reduce((sum, board) => sum + (board.items?.length || 0), 0) || 120}</strong>
              <span>热点条目</span>
            </div>
            <div className="status-box">
              <strong>{ttlSec}</strong>
              <span>秒缓存</span>
            </div>
          </aside>
        </div>
      </header>

      <main className="page-shell">
        <section className="toolbar" aria-label="筛选工具">
          <CategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />
          <div className="tools">
            <label className="search-box">
              <span>筛选</span>
              <input onChange={(event) => applySearch(event.target.value)} placeholder="输入关键词筛选" type="search" value={pendingKeyword} />
            </label>
            <button className="density-btn" type="button" onClick={() => setViewMode(viewMode === "cards" ? "reader" : "cards")}>
              {viewMode === "cards" ? "速读" : "卡片"}
            </button>
            <button className="refresh-button" disabled={loading || refreshing} onClick={() => loadBoards({ refresh: true })} type="button">
              {refreshing ? "同步中" : loading ? "加载中" : "刷新热度"}
            </button>
          </div>
        </section>

        <section className="scene-panel" aria-label="高频场景">
          {sceneShortcuts.map((scene) => (
            <button className={activeCategory === scene.category ? "is-active" : ""} key={scene.category} type="button" onClick={() => applyScene(scene.category)}>
              <strong>{scene.label}</strong>
              <span>{scene.desc}</span>
            </button>
          ))}
        </section>

        <section className="data-strip" aria-label="数据状态">
          <span>{resultStatus}</span>
          <span>实时 {dataSummary.live}</span>
          <span>缓存 {dataSummary.cached}</span>
          <span>降级 {dataSummary.degraded}</span>
          <span>无 API 兜底 {dataSummary.noPublicApi}</span>
          <span>失败 {dataSummary.failed}</span>
          <span>归档快照 {archiveCount}</span>
          {updatedText ? <span>更新于 {updatedText}</span> : null}
          {archiveMessage ? (
            <span className={archivePersistent === false ? "strip-warning" : ""} title={archiveMessage}>
              {archivePersistent === false ? "临时归档" : "归档可用"}
            </span>
          ) : null}
        </section>

        {!loading ? (
          <BriefPanel
            leads={leadCategories}
            ranking={compositeRanking}
            shareState={shareState}
            statuses={statuses}
            onSelectItem={(entry) => setSelectedHot({ board: entry.board, item: entry.item })}
            onShare={shareDigest}
          />
        ) : null}

        {!loading ? (
          <section className="product-grid" aria-label="产品工具">
            <TrendPanel ranking={compositeRanking} onSelectItem={(entry) => setSelectedHot({ board: entry.board, item: entry.item })} />
            <WatchPanel
              draft={watchDraft}
              keywords={watchKeywords}
              matches={watchMatches}
              onAdd={addWatchKeyword}
              onApply={applyWatchKeyword}
              onDraftChange={setWatchDraft}
              onRemove={removeWatchKeyword}
            />
          </section>
        ) : null}

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

        <div className="archive-actions" aria-label="历史归档">
          <span>历史快照</span>
          <button className={archiveRange === "today" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("today")}>
            今天
          </button>
          <button className={archiveRange === "yesterday" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("yesterday")}>
            昨天
          </button>
          <button className={archiveRange === "7d" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("7d")}>
            7 天
          </button>
        </div>

        {loading ? (
          <section className="boards">
            <article className="board loading-card">
              <p className="status-state">正在加载热搜数据...</p>
            </article>
          </section>
        ) : viewMode === "reader" ? (
          <section className="reader-list" aria-label="速读列表">
            <div className="eyebrow">
              <span>5 分钟速读</span>
              <span>TOP SIGNAL</span>
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
            <FocusPanel boards={visibleBoards} leads={leadCategories} onSelectItem={(board, item) => setSelectedHot({ board, item })} />
            <CompositePanel ranking={compositeRanking} shareState={shareState} onShare={shareDigest} onSelectItem={(board, item) => setSelectedHot({ board, item })} />
            <section className="boards" aria-label="热点榜单">
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
            <SourceStatusPanel boards={visibleBoards} statuses={statuses} />
            <FeedbackPanel
              feedbackDraft={feedbackDraft}
              savedCount={savedFeedbackCount}
              sourceDraft={sourceDraft}
              onFeedbackChange={setFeedbackDraft}
              onSourceChange={setSourceDraft}
              onSubmit={submitFeedback}
            />
          </>
        )}
      </main>

      {selectedHot ? (
        <div className="detail-backdrop" role="presentation" onClick={() => setSelectedHot(null)}>
          <aside
            aria-labelledby={detailTitleId}
            aria-modal="true"
            className="detail-drawer"
            ref={drawerRef}
            role="dialog"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button aria-label="关闭热点详情" className="drawer-close" type="button" onClick={() => setSelectedHot(null)}>
              关闭
            </button>
            <span className="detail-kicker">
              {getSourceName(selectedHot.board)} · 第 {selectedHot.item.rank} 名 · {getSourceType(selectedHot.board)}
            </span>
            <h2 id={detailTitleId}>{selectedHot.item.title}</h2>
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
            <section className="detail-section">
              <h3>适合谁看</h3>
              <p>{getAudience(selectedHot.board)}</p>
            </section>
            <section className="detail-section">
              <h3>可能影响</h3>
              <p>{getImpact(selectedHot.board, selectedHot.item)}</p>
            </section>
            {selectedHot.board.strategy ? (
              <section className="detail-section">
                <h3>采集与访问策略</h3>
                <p>
                  当前：{selectedHot.board.strategy.active}。优先使用 {selectedHot.board.strategy.primary}；兜底路径：
                  {selectedHot.board.strategy.fallbacks.join(" / ")}。{selectedHot.board.strategy.domesticAccess}
                </p>
                {selectedHot.board.strategy.note ? <p>{selectedHot.board.strategy.note}</p> : null}
              </section>
            ) : null}
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
              <a href={safeHref(selectedHot.item.url)} rel="noreferrer" target="_blank">
                打开链接
              </a>
              {selectedHot.item.cnUrl ? (
                <a href={safeHref(selectedHot.item.cnUrl)} rel="noreferrer" target="_blank">
                  国内入口
                </a>
              ) : null}
              {selectedHot.item.originalUrl ? (
                <a href={safeHref(selectedHot.item.originalUrl)} rel="noreferrer" target="_blank">
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
