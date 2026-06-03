import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAllHot, fetchHotPlatform } from "./api/hot";
import { CategoryTabs } from "./components/CategoryTabs";
import { categorySources } from "./components/config";
import { FocusPanel } from "./components/FocusPanel";
import { Footer } from "./components/Footer";
import { HotCard } from "./components/HotCard";
import type { HotPlatform } from "./types/hot";

export function App() {
  const [boards, setBoards] = useState<HotPlatform[]>([]);
  const [ttlSec, setTtlSec] = useState(600);
  const [keyword, setKeyword] = useState("");
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedText, setUpdatedText] = useState("");
  const searchTimer = useRef<number | undefined>(undefined);

  const visibleBoards = useMemo(() => {
    const sources = categorySources[activeCategory] || categorySources.all;
    return boards.filter((board) => sources.includes(board.source));
  }, [activeCategory, boards]);

  const resultStatus = useMemo(() => {
    if (loading) return "正在加载数据...";
    const total = visibleBoards.reduce((sum, board) => sum + (board.items?.length || 0), 0);
    const visible = visibleBoards.reduce((sum, board) => {
      const count = board.items?.length || 0;
      return sum + (expandedSources.has(board.source) ? count : Math.min(count, 5));
    }, 0);
    const keywordText = keyword ? `，关键词「${keyword}」` : "";
    return `当前 ${visibleBoards.length} 个榜单，共 ${total} 条结果，已展示 ${visible} 条${keywordText}，缓存约 ${Math.round(ttlSec / 60)} 分钟`;
  }, [expandedSources, keyword, loading, ttlSec, visibleBoards]);

  async function loadBoards(options: { refresh?: boolean; q?: string } = {}) {
    setLoading(true);
    setRefreshing(Boolean(options.refresh));
    try {
      const data = await fetchAllHot({ q: options.q ?? keyword, refresh: options.refresh });
      setBoards(data.platforms || []);
      setTtlSec(data.ttlSec || ttlSec);
      setUpdatedText(
        new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      setBoards([
        {
          source: "local",
          sourceName: "今日热搜",
          listName: "加载失败",
          updatedAt: new Date().toISOString(),
          error: true,
          message: "后端接口暂时不可用，请确认 Express 服务已启动。",
          items: [],
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function retrySource(source: string) {
    const data = await fetchHotPlatform(source, { q: keyword, refresh: true });
    setBoards((current) => current.map((board) => (board.source === source ? data : board)));
  }

  function toggleSource(source: string) {
    setExpandedSources((current) => {
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

  useEffect(() => {
    loadBoards();
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div>
            <h1>今日热搜</h1>
            <p>聚合中文热点、AI 动态与开源项目，一页看完今天发生了什么。</p>
          </div>
          <span className="update-time" aria-live="polite">
            {updatedText ? `更新于 ${updatedText}` : ""}
          </span>
        </div>
      </header>

      <main className="page-shell">
        <section className="board-toolbar" aria-label="榜单摘要">
          <div>
            <strong>实时榜单</strong>
            <span>微博、知乎、B站、AI 模型、AI 资讯、开源项目</span>
          </div>
          <div className="toolbar-actions">
            <label className="search-box">
              <span>搜索热点</span>
              <input
                onChange={(event) => applySearch(event.target.value)}
                placeholder="搜 AI、模型、开源项目"
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
          <CategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />
          <div className="result-status" aria-live="polite">
            {resultStatus}
          </div>
        </section>

        {loading ? (
          <section className="cards-grid">
            <article className="hot-card">
              <p className="status-state">正在加载热搜数据...</p>
            </article>
          </section>
        ) : (
          <>
            <FocusPanel boards={visibleBoards} />
            <section className="cards-grid" aria-label="热搜榜单">
              {visibleBoards.map((board) => (
                <HotCard
                  board={board}
                  expanded={expandedSources.has(board.source)}
                  key={board.source}
                  onRetry={retrySource}
                  onToggle={toggleSource}
                />
              ))}
            </section>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
