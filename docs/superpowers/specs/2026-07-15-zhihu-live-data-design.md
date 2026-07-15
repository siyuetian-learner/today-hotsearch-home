# 知乎实时热榜设计

## 目标

将知乎从不稳定第三方接口和硬编码示例，改为双实时 JSON 端点、共享缓存与最近成功快照组成的可信数据链路，并同步到 Vercel 与飞书妙搭静态入口。

## 数据流

1. 首选 `www.zhihu.com/api/v3/feed/topstory/hot-list-web`，读取标题、摘要、热度和链接。
2. 首选失败时请求 `api.zhihu.com/topstory/hot-lists/total`，映射等价字段。
3. 两个端点均失败后，按配置顺序尝试第三方聚合接口。
4. 所有实时源失败时抛错，由现有 `safeLoadSource` 读取 Upstash Redis 最近成功快照。
5. 没有快照时返回空错误态，不返回硬编码示例。

## 状态定义

- 实时端点或第三方聚合成功：`dataState=live`、`sample=false`、`degraded=false`。
- 共享历史快照：由归档层返回 `dataState=cached` 并说明快照时间。
- 无实时结果且无快照：`error=true`、`dataState=error`、`items=[]`。

## 缓存与频率

继续使用平台缓存 `CACHE_TTL=600`。手动刷新受 `REFRESH_COOLDOWN_SEC=60` 限制。浏览器只请求本站后端，不直接请求知乎。

## 验收

- 两种知乎响应结构均能规范化为 Top 10。
- 每条数据有真实问题链接、摘要和热度文字。
- 同一问题 ID 或同标题只保留一次。
- 双接口失败时不会返回硬编码示例。
- Vercel API 与飞书入口均显示非示例知乎数据。
