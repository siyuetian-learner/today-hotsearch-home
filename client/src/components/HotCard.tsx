import type { HotPlatform } from "../types/hot";
import type { CSSProperties } from "react";
import {
  exampleSources,
  formatRelativeTime,
  getListName,
  getMetricText,
  getSourceName,
  getSourceType,
  platformColors,
} from "./config";

type Props = {
  board: HotPlatform;
  expanded: boolean;
  onRetry: (source: string) => void;
  onToggle: (source: string) => void;
};

export function HotCard({ board, expanded, onRetry, onToggle }: Props) {
  const items = board.items || [];
  const visibleItems = expanded ? items : items.slice(0, 5);

  return (
    <article className="hot-card" style={{ "--platform-color": platformColors[board.source] || "#64748b" } as CSSProperties}>
      <header className="card-head">
        <div className="platform">
          <span className="platform-mark" aria-hidden="true" />
          <div>
            <h2 className="platform-name">{getSourceName(board)}</h2>
            <div className="list-name">{getListName(board)}</div>
          </div>
        </div>
        <div className="card-badges">
          <span className={`source-badge ${exampleSources.has(board.source) ? "is-mock" : "is-live"}`}>
            {getSourceType(board)}
          </span>
          <span className="badge">{expanded ? "前 10 条" : "前 5 条"}</span>
        </div>
      </header>

      {board.error ? (
        <p className="error-state">{board.message || "数据加载失败"}</p>
      ) : items.length ? (
        <ol className="hot-list">
          {visibleItems.map((item, index) => {
            const metric = getMetricText(board, item);
            return (
              <li className={`hot-item ${item.summary ? "has-summary" : ""}`} key={`${board.source}-${item.rank}-${item.title}`}>
                <span className="rank">{item.rank || index + 1}</span>
                <span className="item-body">
                  <a className="title" href={item.url || "#"} rel="noreferrer" target="_blank" title={item.title}>
                    {item.title}
                  </a>
                  <span className="item-meta">
                    {metric ? <span className="heat">{metric}</span> : null}
                    {item.originalUrl && item.originalUrl !== item.url ? (
                      <span className="access-links">
                        <span>访问</span>
                        <a href={item.url} rel="noreferrer" target="_blank">
                          国内入口
                        </a>
                        <a href={item.originalUrl} rel="noreferrer" target="_blank">
                          原站
                        </a>
                      </span>
                    ) : null}
                    {item.summary ? <span className="summary">{item.summary}</span> : null}
                  </span>
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
        {board.degraded ? <span className="degraded-tip">{board.message || "已启用兜底数据"}</span> : null}
        <span className="foot-actions">
          {items.length > 5 ? (
            <button className="retry-button expand-button" type="button" onClick={() => onToggle(board.source)}>
              {expanded ? "收起" : "展开前 10 条"}
            </button>
          ) : null}
          <button className="retry-button" type="button" onClick={() => onRetry(board.source)}>
            重新获取
          </button>
        </span>
      </footer>
    </article>
  );
}
