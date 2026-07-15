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
  isKnownBrokenDomesticHref,
  safeHref,
  sourceLabels,
  sourceOrder,
} from "./components/config";
import { Footer } from "./components/Footer";
import { HotCard } from "./components/HotCard";
import { SourceStatusPanel } from "./components/SourceStatusPanel";
import { WatchPanel } from "./components/WatchPanel";
import { fallbackHotResponse } from "./data/fallbackHot";
import type { HotItem, HotPlatform, SourceStatus } from "./types/hot";
import { buildCompositeRanking, buildLeadCategories, buildShareDigest } from "./utils/insights";

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

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in private mode or strict browser settings.
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

function hasMostlyEnglish(value = "") {
  const letters = value.match(/[a-z]/gi)?.length || 0;
  const han = value.match(/\p{Script=Han}/gu)?.length || 0;
  return letters > 18 && letters > han * 2;
}

function inferTopicUse(title = "", summary = "") {
  const text = `${title} ${summary}`.toLowerCase();
  const uses = [];

  if (/medical|health|clinic|doctor|patient|医疗|健康/.test(text)) uses.push("医疗健康场景");
  if (/agent|copilot|assistant|ai|llm|model|midjourney|模型|智能体/.test(text)) uses.push("AI 工具或模型能力");
  if (/code|developer|github|repo|open source|api|sdk|开发|开源|代码/.test(text)) uses.push("开发者工具和开源项目");
  if (/database|sqlite|search|retrieval|rag|index|数据|检索|搜索/.test(text)) uses.push("数据检索或知识库");
  if (/design|ui|image|video|生成|视觉|图像|界面/.test(text)) uses.push("内容生成或视觉设计");

  return uses.length ? uses.slice(0, 2).join("、") : "相关领域的新项目、文章或讨论";
}

function getDetailSummary(board: HotPlatform, item: HotItem) {
  const rawSummary = String(item.summary || "").trim();
  const topicUse = inferTopicUse(item.title, rawSummary);

  if (board.source === "hackernews") {
    const storyType = /^ask hn/i.test(item.title)
      ? "社区问答"
      : /^show hn/i.test(item.title)
        ? "开发者展示的新项目"
        : "技术社区正在讨论的链接或文章";
    return `这是 Hacker News 上的一条${storyType}，主题与${topicUse}有关。它的分数和评论数较高，说明海外开发者正在讨论它的产品形态、技术实现或行业影响。`;
  }

  if (board.source === "github") {
    if (rawSummary && !hasMostlyEnglish(rawSummary)) {
      return `这是一个 GitHub 开源仓库：${rawSummary}。可以先看它是否适合做技术选型、工具复用或产品调研。`;
    }

    return `这是一个 GitHub 开源仓库，主题与${topicUse}有关。原站描述偏英文，页面已转成中文解释，建议从用途、星标增长和仓库活跃度判断是否值得继续查看。`;
  }

  if (board.source === "huggingface") {
    if (rawSummary && !hasMostlyEnglish(rawSummary)) {
      return `这是 Hugging Face 上的模型或数据项目：${rawSummary}。可以用于判断模型能力、应用方向和是否值得试用。`;
    }

    return `这是 Hugging Face 上的模型或数据项目，主题与${topicUse}有关。可以先判断它适合文本生成、视觉理解、检索增强或应用原型中的哪类场景。`;
  }

  if (board.source === "aihot") {
    return rawSummary
      ? `这是 AI 领域的一条资讯：${rawSummary}。重点看它对应的产品、公司或技术方向是否会影响你的工具选择。`
      : "这是 AI 领域正在升温的资讯，适合用来跟进产品动态、技术方向和内容选题。";
  }

  return rawSummary || "该热点正在榜单中升温，建议结合原站信息继续核实背景。";
}

function getDetailLinks(item: HotItem) {
  const primary = safeHref(item.originalUrl || (isKnownBrokenDomesticHref(item.url) ? "" : item.url));
  const fallback = safeHref(isKnownBrokenDomesticHref(item.url) ? "" : item.url);
  const domestic = safeHref(item.cnUrl);
  const links: { label: string; href: string }[] = [];

  if (primary !== "#") {
    links.push({ label: "打开原站", href: primary });
  } else if (fallback !== "#") {
    links.push({ label: "打开链接", href: fallback });
  }

  if (domestic !== "#" && !isKnownBrokenDomesticHref(domestic) && !links.some((link) => link.href === domestic)) {
    links.push({ label: "国内入口", href: domestic });
  }

  return links;
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
  const [showAllBoards, setShowAllBoards] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const searchTimer = useRef<number | undefined>(undefined);
  const requestSeq = useRef(0);

  const orderedBoards = useMemo(() => {
    return [...boards].sort((a, b) => sourceOrder.indexOf(a.source) - sourceOrder.indexOf(b.source));
  }, [boards]);

  const categoryBoards = useMemo(() => {
    const sources = categorySources[activeCategory] || categorySources.all;
    return orderedBoards.filter((board) => sources.includes(board.source) && !hiddenSources.has(board.source));
  }, [activeCategory, hiddenSources, orderedBoards]);

  const visibleBoards = useMemo(() => {
    const target = normalizeTitle(keyword);
    if (!target) return categoryBoards;

    return categoryBoards
      .map((board) => ({
        ...board,
        items: board.items.filter((item) => normalizeTitle(`${item.title} ${item.summary || ""}`).includes(target)),
      }))
      .filter((board) => board.items.length);
  }, [categoryBoards, keyword]);

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
    return `${visibleBoards.length} 个榜单 · ${total} 条热点${keywordText}${hidden}`;
  }, [hiddenSources.size, keyword, loading, visibleBoards]);

  const dataSummary = useMemo(() => {
    const live = visibleBoards.filter((board) => board.dataState === "live").length;
    const cached = visibleBoards.filter((board) => board.dataState === "cached").length;
    const degraded = visibleBoards.filter((board) => board.degraded || ["stale", "offline", "error"].includes(board.dataState || "")).length;
    const noPublicApi = visibleBoards.filter((board) => board.strategy?.noPublicApi).length;
    const failed = statuses.filter((status) => status.status === "failed").length;
    return { live, cached, degraded, failed, noPublicApi };
  }, [statuses, visibleBoards]);

  const hasSampleData = useMemo(() => {
    return visibleBoards.some((board) => board.sample || board.items?.some((item) => item.sample));
  }, [visibleBoards]);

  const detailTitleId = selectedHot ? `detail-title-${selectedHot.board.source}-${selectedHot.item.rank}` : undefined;

  async function loadBoards(options: { refresh?: boolean } = {}) {
    const requestId = (requestSeq.current += 1);
    if (!boards.length) setLoading(true);
    setRefreshing(Boolean(options.refresh));
    try {
      const data = await fetchAllHot({ refresh: options.refresh });
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
      const data = await fetchHotPlatform(source, { refresh: true });
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
      setKeyword(value.trim());
    }, 120);
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

    writeStoredValue("hotsearch.feedback", JSON.stringify(next));
    setSavedFeedbackCount(next.length);
    setSourceDraft("");
    setFeedbackDraft("");
  }

  useEffect(() => {
    loadBoards();
    loadArchive("today");
  }, []);

  useEffect(() => {
    writeStoredValue("hotsearch.category", activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    writeStoredValue("hotsearch.view", viewMode);
  }, [viewMode]);

  useEffect(() => {
    writeStoredValue("hotsearch.hiddenSources", JSON.stringify(Array.from(hiddenSources)));
  }, [hiddenSources]);

  useEffect(() => {
    writeStoredValue("hotsearch.watchKeywords", JSON.stringify(watchKeywords));
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
              <strong>{visibleBoards.reduce((sum, board) => sum + (board.items?.length || 0), 0)}</strong>
              <span>热点条目</span>
            </div>
            <div className="status-box">
              <strong>{dataSummary.live + dataSummary.cached}</strong>
              <span>可用信源</span>
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

        <section className="data-strip" aria-label="数据状态">
          {hasSampleData ? <span className="strip-warning">部分平台使用参考数据，不参与今日重点与综合榜</span> : null}
          <span>{resultStatus}</span>
          <span>可验证信源 {dataSummary.live + dataSummary.cached}</span>
          {dataSummary.degraded ? <span>降级 {dataSummary.degraded}</span> : null}
          {dataSummary.failed ? <span>失败 {dataSummary.failed}</span> : null}
          {updatedText ? <span>更新于 {updatedText}</span> : null}
        </section>

        {!loading ? (
          <BriefPanel
            leads={leadCategories}
            ranking={compositeRanking}
            shareState={shareState}
            onSelectItem={(entry) => setSelectedHot({ board: entry.board, item: entry.item })}
            onShare={shareDigest}
          />
        ) : null}

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
            <CompositePanel ranking={compositeRanking} shareState={shareState} onShare={shareDigest} onSelectItem={(board, item) => setSelectedHot({ board, item })} />
            <section className={`boards ${showAllBoards ? "show-all" : ""}`} aria-label="热点榜单">
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
            {visibleBoards.length > 4 ? (
              <button className="mobile-board-more" type="button" onClick={() => setShowAllBoards((current) => !current)}>
                {showAllBoards ? "收起平台榜单" : `查看全部 ${visibleBoards.length} 个平台`}
              </button>
            ) : null}
            <details className="secondary-tools">
              <summary>我的关注、历史与信源状态</summary>
              <div className="secondary-tools-content">
                <WatchPanel
                  draft={watchDraft}
                  keywords={watchKeywords}
                  matches={watchMatches}
                  onAdd={addWatchKeyword}
                  onApply={applyWatchKeyword}
                  onDraftChange={setWatchDraft}
                  onRemove={removeWatchKeyword}
                />
                <details className="home-settings">
                  <summary>管理首页信源</summary>
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
                  <span>历史快照 {archiveCount}</span>
                  <button className={archiveRange === "today" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("today")}>今天</button>
                  <button className={archiveRange === "yesterday" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("yesterday")}>昨天</button>
                  <button className={archiveRange === "7d" ? "is-active" : ""} type="button" onClick={() => selectArchiveRange("7d")}>7 天</button>
                  {archiveMessage ? <span className={archivePersistent === false ? "strip-warning" : ""}>{archiveMessage}</span> : null}
                </div>
                <SourceStatusPanel boards={categoryBoards} statuses={statuses} />
                <FeedbackPanel
                  feedbackDraft={feedbackDraft}
                  savedCount={savedFeedbackCount}
                  sourceDraft={sourceDraft}
                  onFeedbackChange={setFeedbackDraft}
                  onSourceChange={setSourceDraft}
                  onSubmit={submitFeedback}
                />
              </div>
            </details>
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
              <p>{getDetailSummary(selectedHot.board, selectedHot.item)}</p>
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
              {getDetailLinks(selectedHot.item).map((link) => (
                <a key={`${link.label}-${link.href}`} href={link.href} rel="noreferrer" target="_blank">
                  {link.label}
                </a>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <Footer />
    </>
  );
}
