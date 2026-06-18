import type { SourceStatus } from "../types/hot";
import type { LeadCategory, RankedHot } from "../utils/insights";
import { getMetricText, getSourceName } from "./config";

type Props = {
  leads: LeadCategory[];
  ranking: RankedHot[];
  statuses: SourceStatus[];
  onSelectItem: (entry: RankedHot) => void;
  onShare: () => void;
  shareState: string;
};

function getStatusCount(statuses: SourceStatus[], status: string) {
  return statuses.filter((item) => item.status === status).length;
}

export function BriefPanel({ leads, ranking, statuses, onSelectItem, onShare, shareState }: Props) {
  const topItems = ranking.slice(0, 3);
  const liveCount = getStatusCount(statuses, "success") + getStatusCount(statuses, "cached");
  const degradedCount = getStatusCount(statuses, "degraded");
  const failedCount = getStatusCount(statuses, "failed");

  return (
    <section className="brief-panel" aria-label="今日快报">
      <header className="brief-head">
        <div>
          <span className="panel-kicker">Daily brief</span>
          <h2>今日快报</h2>
        </div>
        <button className="share-button" type="button" onClick={onShare}>
          {shareState || "复制快报"}
        </button>
      </header>

      <div className="brief-grid">
        <article className="brief-primary">
          <span>今日主线</span>
          <h3>{leads[0]?.title || topItems[0]?.item.title || "等待热点信号"}</h3>
          <p>{leads[0]?.desc || "系统正在聚合多个中文平台和技术社区的实时热度。"}</p>
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

      <footer className="brief-health" aria-label="数据健康度">
        <span>可用信源 {liveCount}</span>
        <span>降级兜底 {degradedCount}</span>
        <span>失败 {failedCount}</span>
        <span>缓存 {statuses.length ? "已启用" : "待更新"}</span>
      </footer>
    </section>
  );
}
