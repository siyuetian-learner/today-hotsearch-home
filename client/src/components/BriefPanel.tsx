import type { LeadCategory, RankedHot } from "../utils/insights";
import { getMetricText, getSourceName } from "./config";

type Props = {
  leads: LeadCategory[];
  ranking: RankedHot[];
  onSelectItem: (entry: RankedHot) => void;
  onShare: () => void;
  shareState: string;
};

export function BriefPanel({ leads, ranking, onSelectItem, onShare, shareState }: Props) {
  const topItems = ranking.slice(0, 5);
  const primary = topItems[0];
  const sourceCount = new Set(ranking.map((entry) => entry.board.source)).size;

  return (
    <section className="brief-panel" aria-label="今日快报">
      <header className="brief-head">
        <div>
          <span className="panel-kicker">TODAY'S ESSENTIALS</span>
          <h2>今日重点</h2>
        </div>
        <button className="share-button" type="button" onClick={onShare}>
          {shareState || "复制快报"}
        </button>
      </header>

      <div className="brief-grid">
        <article className="brief-primary">
          <span>最值得先看</span>
          <h3>{primary?.item.title || leads[0]?.title || "等待热点信号"}</h3>
          <p>{primary?.summary || leads[0]?.desc || "系统正在聚合多个中文平台和技术社区的实时热度。"}</p>
        </article>

        <div className="brief-points" aria-label="重点热点">
          {topItems.map((entry, index) => (
            <button key={`${entry.board.source}-${entry.item.rank}-${entry.item.title}`} type="button" onClick={() => onSelectItem(entry)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{entry.item.title}</strong>
              <small>
                {getSourceName(entry.board)}
                {getMetricText(entry.board, entry.item) ? ` · ${getMetricText(entry.board, entry.item)}` : ""}
              </small>
            </button>
          ))}
        </div>
      </div>

      <footer className="brief-health" aria-label="内容说明">
        <span>基于 {sourceCount} 个可验证信源整理</span>
        <span>示例和故障数据不参与排序</span>
      </footer>
    </section>
  );
}
