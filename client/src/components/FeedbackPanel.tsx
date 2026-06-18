type Props = {
  sourceDraft: string;
  feedbackDraft: string;
  savedCount: number;
  onSourceChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onSubmit: () => void;
};

export function FeedbackPanel({ sourceDraft, feedbackDraft, savedCount, onSourceChange, onFeedbackChange, onSubmit }: Props) {
  return (
    <section className="feedback-panel" aria-label="反馈与信源提报">
      <header>
        <span className="panel-kicker">Feedback loop</span>
        <h2>反馈与信源提报</h2>
        <p>记录想新增的平台、访问问题或榜单质量反馈。当前先保存在本机，后续可接入真实数据库。</p>
      </header>

      <div className="feedback-grid">
        <label>
          <span>推荐信源</span>
          <input placeholder="例如 少数派、掘金、Product Hunt" type="text" value={sourceDraft} onChange={(event) => onSourceChange(event.target.value)} />
        </label>
        <label>
          <span>反馈内容</span>
          <textarea placeholder="哪些信息不准、哪些入口打不开、希望新增什么分类" value={feedbackDraft} onChange={(event) => onFeedbackChange(event.target.value)} />
        </label>
      </div>

      <footer>
        <button type="button" onClick={onSubmit}>
          保存反馈
        </button>
        <span>已保存 {savedCount} 条</span>
      </footer>
    </section>
  );
}
