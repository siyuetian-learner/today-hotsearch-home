import type { CSSProperties } from "react";
import type { HotItem, HotPlatform } from "../types/hot";
import {
  formatRelativeTime,
  getListName,
  getMetricText,
  getSourceName,
  getSourceType,
  getStateTone,
  getTrendText,
  platformColors,
  safeHref,
} from "./config";

type Props = {
  board: HotPlatform;
  expanded: boolean;
  onRetry: (source: string) => void;
  onSelectItem: (board: HotPlatform, item: HotItem) => void;
  onToggle: (source: string) => void;
};

export function HotCard({ board, expanded, onRetry, onSelectItem, onToggle }: Props) {
  const items = board.items || [];
  const visibleItems = expanded ? items : items.slice(0, 5);

  return (
    <article className="hot-card" style={{ "--platform-color": platformColors[board.source] || "#64748b" } as CSSProperties}>
      <header className="card-head">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="platform">
          <span className="platform-mark" aria-hidden="true" />
          <div>
            <h2 className="platform-name">{getSourceName(board)}</h2>
            <div className="list-name">{getListName(board)}</div>
            {board.strategy ? <div className="strategy-line">采集：{board.strategy.active}</div> : null}
          </div>
        </div>
        <div className="card-badges">
          <span className={`source-badge ${getStateTone(board)}`}>{getSourceType(board)}</span>
          <span className="badge">{expanded ? "Top 10" : "Top 5"}</span>
        </div>
      </header>

      {board.error ? (
        <p className="error-state">{board.message || "数据加载失败"}</p>
      ) : items.length ? (
        <ol className="hot-list">
          {visibleItems.map((item, index) => {
            const metric = getMetricText(board, item);
            const itemHref = safeHref(item.url || item.cnUrl);
            const originalHref = safeHref(item.originalUrl);
            return (
              <li className={`hot-item ${item.summary ? "has-summary" : ""}`} key={`${board.source}-${item.rank}-${item.title}`}>
                <span className="rank">{item.rank || index + 1}</span>
                <span className="item-body">
                  <button className="title title-button" title={item.title} type="button" onClick={() => onSelectItem(board, item)}>
                    {item.title}
                  </button>
                  <span className="item-meta">
                    {metric ? <span className="heat">{metric}</span> : null}
                    <span className={`trend-chip trend-${item.trend || "steady"}`}>{getTrendText(item)}</span>
                    {item.summary ? <span className="summary">{item.summary}</span> : null}
                  </span>
                  {item.originalUrl && item.originalUrl !== item.url ? (
                    <span className="access-links">
                      <span>访问</span>
                      <a href={itemHref} rel="noreferrer" target="_blank">
                        国内入口
                      </a>
                      <a href={originalHref} rel="noreferrer" target="_blank">
                        原站
                      </a>
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="empty-state">没有匹配的热搜</p>
      )}

      <footer className="card-foot">
        <span>更新于 {formatRelativeTime(board.updatedAt)}</span>
        {board.strategy ? <span className="strategy-tip" title={board.strategy.domesticAccess}>国内可达：{board.strategy.primary}</span> : null}
        {board.degraded ? <span className="degraded-tip">{board.message || "已启用兜底数据"}</span> : null}
        <span className="foot-actions">
          {items.length > 5 ? (
            <button className="retry-button expand-button" type="button" onClick={() => onToggle(board.source)}>
              {expanded ? "收起" : "展开 Top 10"}
            </button>
          ) : null}
          <button className="retry-button" type="button" onClick={() => onRetry(board.source)}>
            重试
          </button>
        </span>
      </footer>
    </article>
  );
}
