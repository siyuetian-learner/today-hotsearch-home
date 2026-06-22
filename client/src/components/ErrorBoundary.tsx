import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Today hotsearch UI crashed", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="error-boundary" role="alert">
        <h1>页面暂时无法显示</h1>
        <p>前端渲染遇到异常，请刷新页面重试；热搜接口不会因此中断。</p>
        <button type="button" onClick={() => window.location.reload()}>
          刷新页面
        </button>
      </main>
    );
  }
}
