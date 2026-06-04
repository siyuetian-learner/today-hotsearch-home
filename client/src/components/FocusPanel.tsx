import type { CSSProperties } from "react";
import type { HotItem, HotPlatform } from "../types/hot";
import { getMetricText, getSourceName, platformColors } from "./config";

type Props = {
  boards: HotPlatform[];
  onSelectItem: (board: HotPlatform, item: HotItem) => void;
};

export function FocusPanel({ boards, onSelectItem }: Props) {
  const focusBoards = boards.filter((board) => !board.error && board.items?.length).slice(0, 8);

  return (
    <section className="focus-panel" aria-label="今日焦点">
      <div className="section-head">
        <div>
          <h2>今日焦点</h2>
          <span>各平台当前第一条，先扫最强信号</span>
        </div>
      </div>
      <div className="focus-strip">
        {focusBoards.map((board) => {
          const item = board.items[0];
          return (
            <button
              className="focus-item"
              key={board.source}
              style={{ "--platform-color": platformColors[board.source] || "#64748b" } as CSSProperties}
              type="button"
              onClick={() => onSelectItem(board, item)}
            >
              <span className="focus-rank">1</span>
              <span>
                <span className="focus-meta">
                  {getSourceName(board)} · {getMetricText(board, item) || "热度更新中"}
                </span>
                <span className="focus-title">{item.title}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
