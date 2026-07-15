# 今日热搜技术设计

## 技术栈

- 前端：React + TypeScript + Vite + CSS
- 后端：Node.js + Express
- 数据：公开 JSON 接口、公开页面解析、第三方聚合 API、历史快照、离线占位示例
- 缓存：Vercel KV / Upstash Redis 共享存储优先；本地开发无配置时回退内存，默认 TTL 600 秒
- 部署：Vercel 前端项目 + Vercel Express 后端项目；国内公网入口使用飞书妙搭静态托管

## 架构

```text
用户浏览器
  -> Vercel 前端 / 飞书妙搭静态入口
  -> VITE_API_BASE 指向 Vercel Express 后端
  -> /api/hot / /api/hot/:source / /api/sources
  -> 共享 KV/Redis 缓存、刷新冷却与归档
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
| zhihu | `www.zhihu.com/api/v3/feed/topstory/hot-list-web` 主接口；`api.zhihu.com/topstory/hot-lists/total` 备接口 | 第三方聚合、共享历史快照，最终返回明确错误态 |
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

### 知乎实时链路（2026-07-15）

- 主接口：`https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=20&desktop=true`。
- 备接口：`https://api.zhihu.com/topstory/hot-lists/total?limit=50`。
- 主接口映射 `target.title_area.text`、`excerpt_area.text`、`metrics_area.text`、`link.url`。
- 备接口映射 `target.title`、`target.excerpt`、`detail_text` 和问题 ID。
- 两个官方 JSON 端点失败后才尝试 `ZHIHU_HOT_APIS` 配置的第三方聚合接口。
- 采集函数只返回实时结果或抛错；统一的 `safeLoadSource` 负责读取 Upstash Redis / 本地归档中的最近成功快照。这样快照状态统一为 `cached`，不会与实时状态混淆。
- 生产环境不再创建知乎硬编码示例；没有快照时返回空错误态，避免误导用户。

## 缓存与刷新

- 缓存 key：`cache:hot:${source}:q=${q}`，实际写入时会自动加 `STORE_KEY_PREFIX`
- 默认 TTL：`CACHE_TTL=600`
- `?refresh=1` 可请求刷新，但受共享刷新锁限制。
- 刷新冷却使用平台可信 IP 头（如 `x-vercel-forwarded-for` / `x-real-ip`），并通过 Redis `SET NX EX` / KV 共享锁记录，避免 Serverless 多实例绕过冷却。
- 单个平台失败只返回该平台的降级状态，不影响其他平台。

### 聚合快路径（2026-07-15）

- 新增聚合缓存 `cache:hot:aggregate:v2`，保存平台列表、状态和生成时间。
- 普通 `/api/hot` 请求优先读取聚合缓存；命中后直接返回，避免逐平台 Redis GET 和状态查询。
- 单平台缓存命中不再写 `recordStatus`；状态只在真实抓取、失败或快照写入时更新。
- 新生成的 `/api/hot` 响应直接从平台结果推导状态，不再阻塞等待共享状态表。
- `getSourceStatuses` 使用并行读取，供独立 `/api/status` 和归档接口使用。

### 编辑型内容过滤与事件聚类

- 前端 `isEditorialPlatform` / `isEditorialItem` 统一决定内容能否进入今日重点、综合榜和分享快报。
- 聚类先执行规范化标题和地理冲突判断，再结合双字片段、中文分词、事件领域和共享实体判断同一事件。
- 同一事件只保留一个代表标题，并统计跨平台来源数量；各平台原始标题仍保留在平台卡片和详情相关热点中。

## 归档策略

当前归档用于保存轻量历史快照和页面状态说明：

- 线上：配置 `KV_REST_API_URL` + `KV_REST_API_TOKEN` 或 `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` 后，按日期和来源分 key 写入共享 KV/Redis。
- 本地或长驻 Node 环境：无共享存储配置时，异步节流写入 `server/data/archive.json`。
- Vercel Serverless：未配置共享存储时不写本地文件，只保留本实例内临时快照，并在 `/api/archive` 标记 `persistent: false`。

## 前端交互

- 分类 Tab：全部、综合热点、新闻资讯、社交媒体、科技数码、AI 热点、开发者。
- 搜索：触发 `/api/hot?q=关键词`。
- 刷新：触发 `/api/hot?refresh=1`。
- 单卡重试：触发 `/api/hot/:source?refresh=1`。
- 卡片默认前 5 条，可展开 Top 10。
- 榜单标题使用 2 行 CSS line clamp；摘要桌面使用 3 行、移动端使用 4 行 line clamp。仅限制列表视觉展示，`HotItem.summary` 原始内容继续传入详情抽屉。
- 详情抽屉解释「发生了什么、为什么上榜、适合谁看、可能影响」。
- 信源状态和反馈放在页面后段，避免干扰主阅读。

## 部署注意事项

- Vercel 前端项目需要设置 `VITE_API_BASE=https://today-hotsearch-home-server.vercel.app`。
- Vercel 后端项目需要设置 `CLIENT_ORIGIN`、`CACHE_TTL`、`USE_CN_LINKS`、`HUGGINGFACE_CN_BASE`、`GITHUB_CN_BASE`，以及 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 或 Upstash Redis 对应变量。
- 飞书妙搭发布前必须带 `VITE_API_BASE` 构建 `client/dist`。
- `.env`、`node_modules`、`client/dist` 不提交到 GitHub。
