import type { HotPlatform, SourceStatus } from "../types/hot";
import { getSourceName } from "./config";

type Props = {
  boards: HotPlatform[];
  statuses: SourceStatus[];
};

const statusText: Record<string, string> = {
  success: "实时",
  cached: "缓存",
  degraded: "降级",
  failed: "失败",
  loading: "同步",
};

function getTone(status = "") {
  if (status === "success") return "is-live";
  if (status === "cached") return "is-cache";
  if (status === "degraded") return "is-degraded";
  if (status === "failed") return "is-failed";
  return "is-idle";
}

export function SourceStatusPanel({ boards, statuses }: Props) {
  const rows = boards.map((board) => {
    const status = statuses.find((item) => item.source === board.source);
    const state = status?.status || board.dataState || "idle";

    return {
      source: board.source,
      name: getSourceName(board),
      state,
      label: statusText[state] || board.dataState || "待更新",
      count: status?.itemCount ?? board.items?.length ?? 0,
      message: status?.message || board.message || board.strategy?.note || "",
    };
  });

  return (
    <section className="source-status-panel" aria-label="信源状态">
      <header>
        <span className="panel-kicker">Source map</span>
        <h2>信源状态</h2>
      </header>
      <div className="source-status-grid">
        {rows.map((row) => (
          <article className={`source-status-card ${getTone(row.state)}`} key={row.source} title={row.message}>
            <strong>{row.name}</strong>
            <span>{row.label}</span>
            <small>{row.count} 条</small>
          </article>
        ))}
      </div>
    </section>
  );
}
