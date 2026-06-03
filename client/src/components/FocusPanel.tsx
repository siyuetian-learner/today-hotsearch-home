import type { HotPlatform } from "../types/hot";
import type { CSSProperties } from "react";
import { getMetricText, getSourceName, platformColors } from "./config";

type Props = {
  boards: HotPlatform[];
};

export function FocusPanel({ boards }: Props) {
  const focusBoards = boards.filter((board) => !board.error && board.items?.length).slice(0, 6);

  return (
    <section className="focus-panel" aria-label="今日焦点">
      <div className="section-head">
        <div>
          <h2>今日焦点</h2>
          <span>各平台当前第一条</span>
        </div>
      </div>
      <div className="focus-strip">
        {focusBoards.map((board) => {
          const item = board.items[0];
          return (
            <a
              className="focus-item"
              href={item.url || "#"}
              key={board.source}
              rel="noreferrer"
              style={{ "--platform-color": platformColors[board.source] || "#64748b" } as CSSProperties}
              target="_blank"
            >
              <span className="focus-rank">1</span>
              <span>
                <span className="focus-meta">
                  {getSourceName(board)} · {getMetricText(board, item)}
                </span>
                <span className="focus-title">{item.title}</span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
