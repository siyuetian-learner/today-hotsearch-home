type Props = {
  keywords: string[];
  draft: string;
  matches: Array<{ keyword: string; count: number }>;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (keyword: string) => void;
  onApply: (keyword: string) => void;
};

export function WatchPanel({ keywords, draft, matches, onDraftChange, onAdd, onRemove, onApply }: Props) {
  return (
    <section className="watch-panel" aria-label="我的关注">
      <header>
        <span className="panel-kicker">Watchlist</span>
        <h2>我的关注</h2>
        <p>保存你长期关注的主题，下次打开时可以直接筛选。</p>
      </header>

      <div className="watch-form">
        <input
          aria-label="新增关注关键词"
          placeholder="例如 AI、出海、机器人、消费补贴"
          type="text"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAdd();
          }}
        />
        <button type="button" onClick={onAdd}>
          添加关注
        </button>
      </div>

      <div className="watch-tags">
        {keywords.length ? (
          keywords.map((keyword) => {
            const hit = matches.find((item) => item.keyword === keyword);
            return (
              <span className="watch-tag" key={keyword}>
                <button type="button" onClick={() => onApply(keyword)}>
                  {keyword}
                  <em>{hit?.count || 0}</em>
                </button>
                <button aria-label={`移除 ${keyword}`} type="button" onClick={() => onRemove(keyword)}>
                  ×
                </button>
              </span>
            );
          })
        ) : (
          <p>还没有关注主题，可以先添加 2-3 个你最常看的方向。</p>
        )}
      </div>
    </section>
  );
}
