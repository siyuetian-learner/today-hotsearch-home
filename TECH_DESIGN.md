# 今日热搜技术设计

## 技术栈

- 前端：React + TypeScript + Vite + CSS
- 后端：Node.js + Express
- 数据：公开 JSON 接口、公开页面解析、第三方聚合 API、历史快照、离线占位示例
- 缓存：内存 Map，每个平台独立缓存，默认 TTL 600 秒
- 部署：Vercel 前端项目 + Vercel Express 后端项目；国内公网入口使用飞书妙搭静态托管

## 架构

```text
用户浏览器
  -> Vercel 前端 / 飞书妙搭静态入口
  -> VITE_API_BASE 指向 Vercel Express 后端
  -> /api/hot / /api/hot/:source / /api/sources
  -> 内存缓存与刷新冷却
  -> 各平台公开接口 / 页面解析 / 第三方聚合源
  -> 历史快照或离线占位示例兜底
  -> 统一 HotPlatform JSON
```

飞书妙搭只托管静态文件，没有自己的后端。因此发布妙搭入口时必须在构建阶段注入 `VITE_API_BASE=https://today-hotsearch-home-server.vercel.app`。如果没有注入，前端会请求自身域名下的 `/api/hot`，导致 404 或跨域失败，页面只能显示离线占位示例。

## 数据模型

### HotItem

```json
{
  "rank": 1,
  "title": "示例标题",
  "url": "https://example.com/item",
  "heat": "356.2万",
  "summary": "用于解释热点是什么、为什么值得看。",
  "originalUrl": "https://origin.example.com/item",
  "cnUrl": "https://cn.example.com/item",
  "sample": false
}
```

### HotPlatform

```json
{
  "source": "zhihu",
  "sourceName": "知乎热榜",
  "listName": "讨论热度榜",
  "updatedAt": "2026-06-24T10:00:00.000Z",
  "items": [],
  "error": false,
  "message": "",
  "degraded": false,
  "dataState": "live",
  "sample": false
}
```

## API

- `GET /api/health`
- `GET /api/hot`
- `GET /api/hot?q=AI`
- `GET /api/hot?refresh=1`
- `GET /api/hot/:source`
- `GET /api/hot/:source?q=OpenAI&refresh=1`
- `GET /api/archive?range=today`
- `GET /api/sources`

## 数据源与兜底

| source | 方式 | 失败策略 |
|---|---|---|
| weibo | 微博公开 JSON / 公开页面兜底 | 历史快照或离线占位 |
| baidu | 第三方聚合 API / 公开页面解析 | 历史快照或离线占位 |
| zhihu | 第三方聚合 API / 公开页面解析 | 历史快照或离线占位 |
| bilibili | B站热词 JSON | 历史快照或离线占位 |
| douyin | 第三方聚合 API / 公开页面解析 | 历史快照或离线占位 |
| toutiao | 第三方聚合 API / 公开页面解析 | 历史快照或离线占位 |
| 36kr | 第三方聚合 API / 公开页面解析 | 历史快照或离线占位 |
| ithome | 第三方聚合 API / 公开页面解析 | 历史快照或离线占位 |
| aihot | AI HOT REST API | 历史快照或离线占位 |
| huggingface | Hugging Face Trending / 国内镜像入口 | 历史快照或离线占位 |
| github | GitHub Search API / 国内入口 | 历史快照或离线占位 |
| hackernews | Hacker News 官方 API | 历史快照或离线占位 |

离线占位数据只用于「实时接口、历史快照都不可用」时避免白屏。占位标题必须保持中性，例如「示例 · 某 AI 工具类话题」，不得伪装成真实热点。

## 缓存与刷新

- 缓存 key：`hot:${source}:q=${q}`
- 默认 TTL：`CACHE_TTL=600`
- `?refresh=1` 可请求刷新，但受冷却限制。
- 刷新冷却使用平台可信 IP 头（如 `x-vercel-forwarded-for` / `x-real-ip`），避免直接信任客户端可伪造的 `x-forwarded-for`。
- 单个平台失败只返回该平台的降级状态，不影响其他平台。

## 归档策略

当前归档用于保存轻量历史快照和页面状态说明：

- 本地或长驻 Node 环境：异步节流写入 `server/data/archive.json`。
- Vercel Serverless：不写本地文件，只保留本实例内临时快照，并在 `/api/archive` 标记 `persistent: false`。
- 如果后续要做真正的历史趋势，应迁移到 KV、Redis、对象存储或数据库。

## 前端交互

- 分类 Tab：全部、综合热点、新闻资讯、社交媒体、科技数码、AI 热点、开发者。
- 搜索：触发 `/api/hot?q=关键词`。
- 刷新：触发 `/api/hot?refresh=1`。
- 单卡重试：触发 `/api/hot/:source?refresh=1`。
- 卡片默认前 5 条，可展开 Top 10。
- 详情抽屉解释「发生了什么、为什么上榜、适合谁看、可能影响」。
- 信源状态和反馈放在页面后段，避免干扰主阅读。

## 部署注意事项

- Vercel 前端项目需要设置 `VITE_API_BASE=https://today-hotsearch-home-server.vercel.app`。
- Vercel 后端项目需要设置 `CLIENT_ORIGIN`、`CACHE_TTL`、`USE_CN_LINKS`、`HUGGINGFACE_CN_BASE`、`GITHUB_CN_BASE` 等变量。
- 飞书妙搭发布前必须带 `VITE_API_BASE` 构建 `client/dist`。
- `.env`、`node_modules`、`client/dist` 不提交到 GitHub。
