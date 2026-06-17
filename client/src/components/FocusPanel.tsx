import type { HotItem, HotPlatform } from "../types/hot";
import { getMetricText, getSourceName } from "./config";
import type { LeadCategory } from "../utils/insights";

type Props = {
  boards: HotPlatform[];
  leads: LeadCategory[];
  onSelectItem: (board: HotPlatform, item: HotItem) => void;
};

export function FocusPanel({ boards, leads, onSelectItem }: Props) {
  const focusItems = boards
    .filter((board) => !board.error && board.items?.length)
    .slice(0, 4)
    .map((board) => ({ board, item: board.items[0] }));

  return (
    <section className="brief-grid" aria-label="今日概览">
      <article className="lead-panel">
        <div className="source-rail" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className="lead-content">
          <div>
            <div className="eyebrow">
              <span>今日主线</span>
              <span>{new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 更新</span>
            </div>
            <div className="lead-categories" aria-label="今日主线分类">
              {leads.map((category) => (
                <article className={`lead-category ${category.className}`} key={category.code}>
                  <span className="category-code">
                    {category.code}
                    <em>{category.sourceCount} 源</em>
                  </span>
                  <h3>{category.title}</h3>
                  <p>{category.desc}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="lead-meta">
            <div className="meta-card">
              <strong>6</strong>
              <span>个中文平台</span>
            </div>
            <div className="meta-card">
              <strong>4</strong>
              <span>个科技源</span>
            </div>
            <div className="meta-card">
              <strong>2</strong>
              <span>海外源国内入口</span>
            </div>
            <div className="meta-card">
              <strong>OK</strong>
              <span>降级不白屏</span>
            </div>
          </div>
        </div>
      </article>

      <aside className="radar-panel">
        <div className="eyebrow">
          <span>跨平台信号</span>
          <span>TOP {focusItems.length}</span>
        </div>
        <div className="radar-map">
          {focusItems.map(({ board, item }, index) => (
            <button
              className={`signal-card is-signal-${index + 1}`}
              key={`${board.source}-${item.rank}-${item.title}`}
              type="button"
              onClick={() => onSelectItem(board, item)}
            >
              <strong>{item.title}</strong>
              <span>
                {getSourceName(board)} · {getMetricText(board, item) || "热度更新中"}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}
