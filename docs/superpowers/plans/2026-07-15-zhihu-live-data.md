# 知乎实时热榜 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让知乎榜单稳定使用真实热榜数据，并将同一构建发布到 Vercel 与飞书妙搭。

**Architecture:** `zhihu.js` 依次请求两个知乎 JSON 端点和可配置第三方端点，只负责规范化实时数据。所有请求失败时抛错，复用 `app.js` 既有的共享快照兜底。

**Tech Stack:** Node.js、Express、Node Test、Upstash Redis REST、React/Vite、Vercel、飞书妙搭 HTML 托管。

## Global Constraints

- 缓存 TTL 保持 600 秒，刷新冷却保持 60 秒。
- 不新增知乎账号、Cookie 或 AI API Key。
- 不修改当前前端视觉结构。
- 不覆盖工作区中用户已有的未提交文件。

---

### Task 1: 知乎响应规范化与请求顺序

**Files:**
- Modify: `server/services/zhihu.js`
- Test: `server/test/zhihu.test.js`

**Interfaces:**
- Consumes: `fetchJson(url, options)`。
- Produces: `fetchZhihuHot({ q }) -> HotPlatform`，以及可测试的响应规范化函数。

- [ ] 先写失败测试，覆盖 NewsNow 结构、DailyHotApi 结构、去重、查询过滤和全源失败抛错。
- [ ] 运行 `npm --workspace server test -- zhihu.test.js`，确认测试因缺少新行为失败。
- [ ] 实现双实时端点、第三方后备和规范化映射。
- [ ] 再次运行单测，确认全部通过。

### Task 2: 全量回归与构建

**Files:**
- Modify: `TEST_REPORT.md`
- Modify: `DEPLOYMENT.md`

**Interfaces:**
- Consumes: Task 1 的 `fetchZhihuHot`。
- Produces: 可复现测试与部署记录。

- [ ] 运行 `npm --workspace server test`。
- [ ] 启动后端并验证 `/api/health`、`/api/hot/zhihu?refresh=1`、`/api/hot`。
- [ ] 运行 `npm --workspace client run build`。
- [ ] 记录真实标题、非示例状态和构建结果。

### Task 3: 双端部署验证

**Files:**
- Modify: `DEPLOYMENT.md`

**Interfaces:**
- Consumes: 已验证的提交和 `client/dist`。
- Produces: Vercel 生产 API、Vercel 前端和飞书妙搭公开入口。

- [ ] 提交并推送到 `main`，等待 Vercel 前后端部署成功。
- [ ] 验证线上 `/api/hot/zhihu?refresh=1` 返回真实数据。
- [ ] 使用 `VITE_API_BASE=https://today-hotsearch-home-server.vercel.app` 重新构建前端。
- [ ] 用 `lark-cli apps +html-publish --app-id app_4ka0f1un2r5re --path client/dist --as user` 发布妙搭版本。
- [ ] 确认可见范围为 public、免登录，并验证国内入口读取相同知乎实时数据。
