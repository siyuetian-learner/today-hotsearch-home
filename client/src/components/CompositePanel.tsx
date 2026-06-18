import type { RankedHot } from "../utils/insights";
import type { HotItem, HotPlatform } from "../types/hot";
import { getMetricText, getSourceName } from "./config";
import { getHotStatus } from "../utils/hotStatus";

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
          <p>先看内容价值，再看来源和热度。每条热点会补一句简要概括，尤其是模型、开源项目和技术资讯，帮助你快速判断它是什么、能用来做什么。</p>
        </div>
        <button className="share-button" type="button" onClick={onShare}>
          {shareState || "生成快报"}
        </button>
      </header>

      <ol className="composite-list">
        {ranking.map((entry, index) => {
          const hotStatus = getHotStatus(entry.item, entry.score);

          return (
            <li className="composite-item" key={`${entry.board.source}-${entry.item.rank}-${entry.item.title}`}>
              <button type="button" onClick={() => onSelectItem(entry.board, entry.item)}>
                <span className="composite-rank">{String(index + 1).padStart(2, "0")}</span>
                <span className="composite-main">
                  <span className="composite-title-row">
                    <strong>{entry.item.title}</strong>
                    <span className={`hot-status is-${hotStatus.tone}`}>{hotStatus.label}</span>
                  </span>
                  <span className="composite-summary">{entry.summary}</span>
                  <small>{entry.reason}</small>
                </span>
                <span
                  className="composite-score"
                  title="综合分 = 榜内排名基础分 + 热度对数分 + 多源相似信号加分 + 数据状态分。分数用于站内排序，不等同于平台原始热度。"
                >
                  <strong>{entry.score}</strong>
                  <small>综合分</small>
                  <em>{entry.sourceCount > 1 ? `${entry.sourceCount} 源` : getSourceName(entry.board)}</em>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <footer className="composite-foot">
        <span>数字说明：综合分是本站排序分，不是平台原始热度。它由榜内排名、热度数值、多平台相似信号和数据状态共同计算，用来判断“优先看哪条”。</span>
        <span>{ranking[0] ? `当前最高：${getSourceName(ranking[0].board)} · ${getMetricText(ranking[0].board, ranking[0].item) || "综合热度领先"}` : "等待数据"}</span>
      </footer>
    </section>
  );
}
