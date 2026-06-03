# 今日热搜 · 技术设计

## 技术栈

- 前端：React + TypeScript + Vite + CSS
- 后端：Node.js + Express
- 数据：公开 JSON 接口 + 第三方聚合接口 + 降级兜底
- 缓存：内存 Map，默认 TTL 600 秒
- 部署：Vercel（client）+ Railway（server）

## 架构

```text
访客浏览器
  -> Vercel React 前端
  -> Railway Express /api/hot
  -> 内存缓存
  -> 各平台公开接口
  -> 统一 HotPlatform JSON
```

## 数据模型

### HotItem

```json
{
  "rank": 1,
  "title": "Qwen/Qwen3-32B",
  "heat": "7420 likes · 980000 downloads",
  "url": "https://hf-mirror.com/Qwen/Qwen3-32B",
  "originalUrl": "https://huggingface.co/Qwen/Qwen3-32B",
  "cnUrl": "https://hf-mirror.com/Qwen/Qwen3-32B",
  "summary": "中文友好 · 大语言模型"
}
```

### HotPlatform

```json
{
  "source": "huggingface",
  "sourceName": "Hugging Face",
  "listName": "国内可访问模型推荐",
  "updatedAt": "2026-06-03T10:00:00.000Z",
  "items": [],
  "degraded": true,
  "message": "Hugging Face 直连失败，已切换为国内入口推荐列表。"
}
```

## API

- `GET /api/health`
- `GET /api/hot`
- `GET /api/hot?q=AI`
- `GET /api/hot?refresh=1`
- `GET /api/hot/:source`
- `GET /api/hot/:source?q=OpenAI&refresh=1`

## 数据源

|source|方式|失败策略|
|---|---|---|
|weibo|微博公开 JSON|返回 error 卡片|
|zhihu|第三方聚合 API|降级为知乎示例热榜|
|bilibili|B站热词 JSON|返回 error 卡片|
|huggingface|Hugging Face Trending|国内入口推荐兜底|
|aihot|AI HOT REST API|返回 error 卡片|
|github|GitHub Search API|国内入口推荐兜底|

## 缓存策略

- 缓存 key：`hot:${source}:q=${q}`
- 默认 TTL：`CACHE_TTL=600`
- `?refresh=1` 跳过缓存重新拉取
- 单个平台失败不影响其他平台

## 前端交互

- 分类：全部、综合热点、AI 热点、开源项目
- 搜索：触发 `/api/hot?q=关键词`
- 刷新：触发 `/api/hot?refresh=1`
- 单卡重试：触发 `/api/hot/:source?refresh=1`
- 默认每卡展示前 5 条，可展开前 10 条
