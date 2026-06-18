import type { CSSProperties } from "react";
import type { HotItem, HotPlatform } from "../types/hot";
import {
  formatRelativeTime,
  getListName,
  getMetricText,
  getSourceMark,
  getSourceName,
  getSourceType,
  getStateTone,
  isKnownBrokenDomesticHref,
  platformColors,
  safeHref,
} from "./config";
import { getHotStatus } from "../utils/hotStatus";

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
  const hasLongMetrics = ["huggingface", "github", "hackernews", "aihot"].includes(board.source);
  const sourceColor = platformColors[board.source] || "#111827";

  return (
    <article
      className={`board ${hasLongMetrics ? "has-long-metrics" : ""}`}
      data-source={board.source}
      style={{ "--source-color": sourceColor } as CSSProperties}
    >
      <header className="board-head">
        <div className="board-title">
          <span className="source-mark" aria-hidden="true">
            {getSourceMark(board)}
          </span>
          <div>
            <h2>{getSourceName(board)}</h2>
            <p>{getListName(board)}</p>
          </div>
        </div>
        <span className={`state ${getStateTone(board)}`}>{getSourceType(board)}</span>
      </header>

      {board.error ? (
        <p className="error-state">{board.message || "数据加载失败"}</p>
      ) : items.length ? (
        <ol className="hot-list">
          {visibleItems.map((item, index) => {
            const metric = getMetricText(board, item);
            const itemHref = safeHref(item.url || item.cnUrl);
            const originalHref = safeHref(item.originalUrl);
            const hotStatus = getHotStatus(item);
            const showDomesticLink = itemHref !== "#" && !isKnownBrokenDomesticHref(itemHref) && itemHref !== originalHref;

            return (
              <li className="hot-item" key={`${board.source}-${item.rank}-${item.title}`}>
                <span className="rank">{String(item.rank || index + 1).padStart(2, "0")}</span>
                <span className="topic">
                  <span className="topic-title-row">
                    <button className="title-button" title={item.title} type="button" onClick={() => onSelectItem(board, item)}>
                      {item.title}
                    </button>
                    <span className={`hot-status is-${hotStatus.tone}`}>{hotStatus.label}</span>
                  </span>
                  {item.summary ? <small>{item.summary}</small> : null}
                  {(showDomesticLink || originalHref !== "#") && item.originalUrl !== item.url ? (
                    <span className="access-links">
                      {showDomesticLink ? (
                        <a href={itemHref} rel="noreferrer" target="_blank">
                          国内入口
                        </a>
                      ) : null}
                      {originalHref !== "#" ? (
                        <a href={originalHref} rel="noreferrer" target="_blank">
                          原站
                        </a>
                      ) : null}
                    </span>
                  ) : null}
                </span>
                {metric ? <span className="metric">{metric}</span> : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="empty-state">没有匹配的热搜</p>
      )}

      <footer className="board-foot">
        <span>更新于 {formatRelativeTime(board.updatedAt)}</span>
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
