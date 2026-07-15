# 今日热搜部署说明

## 当前线上入口

- Vercel 前端：https://today-hotsearch-home.vercel.app
- Vercel 后端：https://today-hotsearch-home-server.vercel.app
- 国内公网入口：https://ncn2j3n91nay.aiforce.cloud/app/app_4ka0f1un2r5re/
- GitHub 仓库：https://github.com/siyuetian-learner/today-hotsearch-home

Railway 部署时账号提示 `Trial expired`，最终采用 Vercel 双项目部署：一个前端项目，一个 Express API 后端项目。国内公网入口通过飞书妙搭发布静态构建产物。

## 必须完成的生产配置

P1-1 的根因是 Vercel Serverless 没有稳定本地磁盘，且可能多实例冷启动。生产环境必须配置共享 KV/Redis，否则缓存、刷新冷却和归档只能退回当前实例内存。

后端项目需要配置以下变量：

```text
PORT=3001
CACHE_TTL=600
REFRESH_COOLDOWN_SEC=60
STORE_KEY_PREFIX=today-hotsearch
CLIENT_ORIGIN=https://today-hotsearch-home.vercel.app,https://ncn2j3n91nay.aiforce.cloud
USE_CN_LINKS=1
HUGGINGFACE_CN_BASE=https://hf-mirror.com
GITHUB_CN_BASE=
GITHUB_TOKEN=
ZHIHU_HOT_API=https://api-hot.imsyy.top/zhihu
ZHIHU_HOT_APIS=https://hot.baiwumm.com/api/zhihu,https://api-hot.imsyy.top/zhihu
ZHIHU_WEB_API=https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=20&desktop=true
ZHIHU_MOBILE_API=https://api.zhihu.com/topstory/hot-lists/total?limit=50
DAILY_HOT_API_BASE=https://api-hot.imsyy.top
DAILY_HOT_API_BASES=https://api-hot.imsyy.top
ARCHIVE_DAYS=7
ARCHIVE_TIMEZONE_OFFSET=8
```

共享存储二选一：

```text
KV_REST_API_URL=<Vercel KV REST 地址>
KV_REST_API_TOKEN=<Vercel KV REST Token>
```

或：

```text
UPSTASH_REDIS_REST_URL=<Upstash Redis REST 地址>
UPSTASH_REDIS_REST_TOKEN=<Upstash Redis REST Token>
```

前端项目需要配置：

```text
VITE_API_BASE=https://today-hotsearch-home-server.vercel.app
```

## Vercel 后端

- Project Name：`today-hotsearch-home-server`
- Root Directory：`server`
- Framework Preset：Other
- Build Command：留空或 `npm install`
- Output Directory：留空
- Install Command：`npm install`
- Start Command：Vercel Serverless 会使用 `server/api/index.js`

验证：

```text
GET https://today-hotsearch-home-server.vercel.app/api/health
GET https://today-hotsearch-home-server.vercel.app/api/hot
GET https://today-hotsearch-home-server.vercel.app/api/archive?range=today
GET https://today-hotsearch-home-server.vercel.app/api/sources
```

`/api/health` 应返回：

```json
{
  "ok": true,
  "sourceCount": 12,
  "storage": {
    "backend": "redis-rest",
    "shared": true
  }
}
```

如果 `storage.shared=false`，说明线上还没有配置 KV/Redis，P1-1 仍然只是降级运行。

## Vercel 前端

- Project Name：`today-hotsearch-home`
- Root Directory：仓库根目录
- Build Command：`npm run build`
- Output Directory：`client/dist`
- 环境变量：`VITE_API_BASE=https://today-hotsearch-home-server.vercel.app`

## 飞书妙搭公网入口

妙搭是纯静态托管，没有自己的后端。发布前必须在构建阶段注入 `VITE_API_BASE`，否则页面会请求妙搭自身域名下的 `/api/hot` 并失败，最后只显示离线占位示例。

发布命令：

```bash
# Windows PowerShell
$env:VITE_API_BASE="https://today-hotsearch-home-server.vercel.app"; npm --workspace client run build

# macOS / Linux
VITE_API_BASE=https://today-hotsearch-home-server.vercel.app npm --workspace client run build

lark-cli apps +html-publish --app-id app_4ka0f1un2r5re --path client/dist
lark-cli apps +access-scope-set --app-id app_4ka0f1un2r5re --scope public --require-login=false
```

知乎实时数据由 Vercel 后端统一采集，因此飞书妙搭无需配置知乎 Cookie 或 AI API。妙搭只需重新发布带正确 `VITE_API_BASE` 的静态构建，即可读取更新后的知乎 API。

## 验收清单

1. GitHub main 分支包含 `client/`、`server/`、文档和 evidence 文件。
2. 仓库不包含 `node_modules`、`client/dist`、`.env`。
3. `cd client && npm run build` 成功。
4. `node -c server/app.js` 和关键后端文件语法检查成功。
5. `/api/health` 返回 `ok=true`、`sourceCount=12`、`storage.shared=true`。
6. `/api/hot` 返回 12 个平台，每个平台 10 条数据或明确降级提示。
7. 连续两次请求 `/api/hot`，第二次应主要命中缓存。
8. 连续两次请求 `/api/hot?refresh=1`，第二次应带 `x-refresh-limited` 响应头。
9. `/api/archive?range=today` 返回 `persistent=true`，并能看到最近快照。
10. 首页无 CORS 报错，Network 中 `/api/hot` 指向 Vercel 后端。
11. 妙搭入口无登录拦截，默认显示实时/缓存数据；只有后端不可达时才显示离线占位示例。
12. `/api/hot/zhihu?refresh=1` 返回 `sample=false`、10 条真实问题链接，并且妙搭入口显示相同榜单。

## 常见问题

- `storage.shared=false`：后端项目未配置 KV/Redis REST 变量，或变量只配到了前端项目。
- 妙搭入口只显示占位示例：重新带 `VITE_API_BASE` 构建并发布 `client/dist`。
- 归档为空：先访问 `/api/hot?refresh=1` 触发抓取，再访问 `/api/archive?range=today`。
- GitHub / Hugging Face 打开慢：使用国内入口或配置更稳定的镜像域名。
