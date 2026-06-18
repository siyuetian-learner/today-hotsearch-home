import type { RankedHot } from "../utils/insights";
import { getHotStatus } from "../utils/hotStatus";
import { getMetricText, getSourceName } from "./config";

type Props = {
  ranking: RankedHot[];
  onSelectItem: (entry: RankedHot) => void;
};

export function TrendPanel({ ranking, onSelectItem }: Props) {
  const signals = ranking.slice(0, 6);

  return (
    <section className="trend-panel" aria-label="趋势观察">
      <header>
        <span className="panel-kicker">Trend radar</span>
        <h2>趋势观察</h2>
        <p>用“新、热、火热、上升、观察”标记热点状态，帮助你快速判断哪些内容值得立刻点开。</p>
      </header>

      <div className="trend-list">
        {signals.map((entry) => {
          const hotStatus = getHotStatus(entry.item, entry.score);

          return (
            <button key={`${entry.board.source}-${entry.item.rank}-${entry.item.title}`} type="button" onClick={() => onSelectItem(entry)}>
              <span className={`hot-status is-${hotStatus.tone}`}>{hotStatus.label}</span>
              <strong>{entry.item.title}</strong>
              <small>
                {getSourceName(entry.board)}
                {getMetricText(entry.board, entry.item) ? ` · ${getMetricText(entry.board, entry.item)}` : ""}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
