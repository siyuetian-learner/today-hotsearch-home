# AGENTS.md

## 项目目标

维护一个面向中文用户的「今日热搜」聚合站。项目必须符合 21 天 Vibe Coding 教程主路径：React + TypeScript + Vite 前端，Express 后端，统一 API，缓存，真实数据与容错。

## 开发规范

- 默认使用简体中文文案。
- 前端代码放在 `client/`。
- 后端代码放在 `server/`。
- 第三方数据源必须从 `server/services/` 接入。
- 不在前端直接请求第三方平台。
- 不提交账号、密码、token 或登录态。
- 手动登录第三方平台时由用户本人输入。

## 数据规范

所有平台统一返回：

```ts
type HotItem = {
  rank: number;
  title: string;
  url: string;
  heat?: string | number;
  summary?: string;
  originalUrl?: string;
  cnUrl?: string;
};

type HotPlatform = {
  source: string;
  sourceName: string;
  listName: string;
  updatedAt: string;
  items: HotItem[];
  error?: boolean;
  message?: string;
  degraded?: boolean;
};
```

## 容错要求

- 每个平台独立缓存。
- 单平台失败不影响 `/api/hot` 其他平台。
- 降级数据必须通过 `degraded` 和 `message` 标明。
- GitHub / Hugging Face 默认提供国内入口链接。
- 知乎优先使用两个公开 JSON 热榜端点，第三方聚合仅作后备。
- 知乎实时抓取全部失败时必须抛错，由统一快照层兜底；生产环境不得返回硬编码知乎示例。

## 测试要求

- `cd client && npm run build`
- `cd server && npm run start`
- 验证 `/api/health`
- 验证 `/api/hot`
- 验证搜索、刷新、单卡重试、分类、展开、移动端布局
- 榜单标题最多 2 行，摘要桌面最多 3 行、移动端最多 4 行；详情抽屉必须保留完整文本。
