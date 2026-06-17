import type { RankedHot } from "../utils/insights";
import type { HotItem, HotPlatform } from "../types/hot";
import { getMetricText, getSourceName } from "./config";

type Props = {
  ranking: RankedHot[];
  onSelectItem: (board: HotPlatform, item: HotItem) => void;
  onShare: () => void;
  shareState: string;
};

export function CompositePanel({ ranking, onSelectItem, onShare, shareState }: Props) {
  return (
    <section className="composite-panel" aria-label="全网综合热度">
      <header className="composite-head">
        <div>
          <span className="panel-kicker">AI HOT-style aggregator</span>
          <h2>全网综合 Top 20</h2>
          <p>综合平台排名、热度、数据状态、跨平台相似信号和国内可访问性，帮你先看最值得关注的内容。</p>
        </div>
        <button className="share-button" type="button" onClick={onShare}>
          {shareState || "生成快报"}
        </button>
      </header>

      <ol className="composite-list">
        {ranking.map((entry, index) => (
          <li className="composite-item" key={`${entry.board.source}-${entry.item.rank}-${entry.item.title}`}>
            <button type="button" onClick={() => onSelectItem(entry.board, entry.item)}>
              <span className="composite-rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="composite-main">
                <strong>{entry.item.title}</strong>
                <small>{entry.reason}</small>
              </span>
              <span className="composite-score">
                <strong>{entry.score}</strong>
                <small>{entry.sourceCount > 1 ? `${entry.sourceCount} 源` : getSourceName(entry.board)}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <footer className="composite-foot">
        <span>排序方法：榜内排名优先，叠加热度、实时状态、跨平台相似度和国内入口。</span>
        <span>{ranking[0] ? `当前最高：${getSourceName(ranking[0].board)} · ${getMetricText(ranking[0].board, ranking[0].item)}` : "等待数据"}</span>
      </footer>
    </section>
  );
}
