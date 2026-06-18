import type { RankedHot } from "../utils/insights";
import { getMetricText, getSourceName } from "./config";

type Props = {
  ranking: RankedHot[];
  onSelectItem: (entry: RankedHot) => void;
};

function getTrendLabel(entry: RankedHot) {
  if (entry.sourceCount > 1) return "多源共振";
  if (entry.item.trend === "new") return "新上榜";
  if (entry.item.trend === "up") return "正在上升";
  if (entry.score >= 100) return "高热度";
  return "可跟进";
}

export function TrendPanel({ ranking, onSelectItem }: Props) {
  const signals = ranking.slice(0, 6);

  return (
    <section className="trend-panel" aria-label="趋势观察">
      <header>
        <span className="panel-kicker">Trend radar</span>
        <h2>趋势观察</h2>
        <p>把榜单排名、热度、跨平台出现次数和信源状态合在一起，优先标出更值得继续跟进的热点。</p>
      </header>

      <div className="trend-list">
        {signals.map((entry) => (
          <button key={`${entry.board.source}-${entry.item.rank}-${entry.item.title}`} type="button" onClick={() => onSelectItem(entry)}>
            <span>{getTrendLabel(entry)}</span>
            <strong>{entry.item.title}</strong>
            <small>
              {getSourceName(entry.board)}
              {getMetricText(entry.board, entry.item) ? ` · ${getMetricText(entry.board, entry.item)}` : ""}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
