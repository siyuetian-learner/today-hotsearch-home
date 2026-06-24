# 今日热搜

21 天 Vibe Coding 实战项目：一个面向中文用户的多平台热榜聚合站，聚合中文热点、AI 动态与开源项目。

线上地址：

- 国内公网入口：https://ncn2j3n91nay.aiforce.cloud/app/app_4ka0f1un2r5re/
- 前端：https://today-hotsearch-home.vercel.app
- 后端 API：https://today-hotsearch-home-server.vercel.app

## 当前能力

- 前端：React + TypeScript + Vite + CSS
- 后端：Node.js + Express
- 数据：微博、百度、知乎、B站、抖音、今日头条、36氪、IT之家、AI HOT、Hugging Face、GitHub、Hacker News 共 12 个来源
- 缓存与归档：每个平台独立缓存，默认 600 秒；保存最近 7 天轻量快照，并提供数据状态
- 体验：分类 Tab、搜索、刷新、单卡重试、展开 Top 10、速读模式、热点详情抽屉、我的首页平台隐藏、数据状态条
- 视觉：参考 WIRED 科技媒体的黑白高对比报刊风（详见 `DESIGN.md`），方角、细分隔线、强标题层级，保留高信息密度与移动端单列布局
- 公网入口：飞书妙搭发布的静态入口，构建时注入 `VITE_API_BASE` 后默认拉取 Vercel 后端实时数据；仅在后端不可达时回退到标注清晰的「离线占位示例」（占位标题为中性文案，不指向具体真实事件），适合分享给国内用户

## 项目结构

```text
today-hotsearch-home/
├── client/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   └── types/
├── server/                 # Express API
│   ├── services/
│   └── utils/
├── docs/evidence/          # 任务截图和验证材料
├── RESEARCH.md
├── PRD.md
├── TECH_DESIGN.md
├── AGENTS.md
├── DAILY_CHECKINS.md
├── TEST_REPORT.md
├── DEPLOYMENT.md
├── ACCOUNT_SETUP.md
└── PROJECT_SUMMARY.md
```

## 本地启动

安装依赖：

```bash
npm install --workspaces --include-workspace-root --registry=https://registry.npmmirror.com
```

启动后端：

```bash
npm run dev:server
```

启动前端：

```bash
npm run dev:client
```

打开：

```text
http://127.0.0.1:5173/
```

生产构建：

```bash
npm run build
npm run start
```

构建后后端可托管 `client/dist`：

```text
http://127.0.0.1:3001/
```

## API

```text
GET /api/health
GET /api/hot
GET /api/hot?q=AI
GET /api/hot?refresh=1
GET /api/hot/:source
GET /api/hot/:source?q=OpenAI&refresh=1
GET /api/archive?range=today
GET /api/archive?range=yesterday
GET /api/archive?range=7d
GET /api/status
GET /api/sources
```

## 环境变量

前端 `client/.env`：

|变量|说明|
|---|---|
|VITE_API_BASE|生产后端地址，例如 Vercel Express 后端域名|

后端 `server/.env`：

|变量|默认值|说明|
|---|---:|---|
|PORT|3001|后端端口|
|CACHE_TTL|600|缓存秒数|
|CACHE_MAX_ENTRIES|200|内存缓存最多保留条目数，防止长时间运行占用过多内存|
|REFRESH_COOLDOWN_SEC|60|`?refresh=1` 强制刷新冷却秒数，避免公开接口被频繁刷新|
|CLIENT_ORIGIN|内置本地、Vercel、妙搭域名|CORS 白名单，生产可用逗号追加前端域名|
|USE_CN_LINKS|1|默认使用国内入口链接|
|HUGGINGFACE_CN_BASE|https://hf-mirror.com|Hugging Face 国内入口|
|GITHUB_CN_BASE|空|GitHub 国内入口。默认留空，只有确认镜像可用时才配置，避免页面出现 404 链接|
|GITHUB_TOKEN|空|可选 GitHub API Token，用于提高 GitHub Search API 访问限额|
|ZHIHU_HOT_API|https://api-hot.imsyy.top/zhihu|知乎第三方热榜接口|
|ZHIHU_HOT_PAGE|https://www.zhihu.com/billboard|知乎第三方接口失败后的公开页面解析兜底|
|DAILY_HOT_API_BASE|https://api-hot.imsyy.top|百度、抖音、头条、36氪、IT之家等聚合源基础地址|
|ARCHIVE_DAYS|7|本地快照保留天数|
|ARCHIVE_TIMEZONE_OFFSET|8|归档日期按中国时区偏移计算|

## 数据来源说明

- 微博：`https://weibo.com/ajax/side/hotSearch`
- B站：`https://s.search.bilibili.com/main/hotword?limit=20`
- 百度：解析 `https://top.baidu.com/board?tab=realtime` 页面内公开热榜数据
- 知乎：`https://hot.baiwumm.com/api/zhihu` 公开聚合 JSON 优先；不可用时尝试公开页面，再切换历史快照或离线样例
- 抖音：`https://www.douyin.com/aweme/v1/web/hot/search/list/` 热榜 JSON
- 今日头条：`https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc`
- 36氪：解析 `https://www.36kr.com/newsflashes` 快讯页面
- IT之家：`https://www.ithome.com/rss/`
- DailyHotApi：作为百度、抖音、头条、36氪、IT之家等中文源的第二层聚合兜底
- AI HOT：`https://aihot.virxact.com/api/public/items`
- Hugging Face：公开趋势接口优先；访问不稳定时切换 `https://hf-mirror.com/api/trending`
- GitHub：Search API 优先；访问不稳定时切换国内入口推荐列表
- Hacker News：官方 Firebase API `https://hacker-news.firebaseio.com/v0/topstories.json`，条目不足时使用 `https://hn.algolia.com/api/v1/search?tags=front_page`

## 国内访问说明

GitHub 与 Hugging Face 对部分中文用户可能访问不稳定。Hugging Face 默认使用 `hf-mirror.com` 作为国内入口；GitHub 只有在 `GITHUB_CN_BASE` 配置了已验证可用的镜像时才显示「国内入口」，否则只保留原站链接，避免给用户一个 404 链接。
对访问不稳定的平台，前端不直接访问原站页面，而是读取本站后端聚合后的 `/api/hot`。后端按“官方或公开真实接口 / 公开页面解析 / 第三方聚合源 / 历史快照 / 内置离线数据”的顺序兜底，并通过 `/api/sources` 返回每个平台的采集策略。页面卡片和详情抽屉会显示当前使用的策略，方便判断数据是实时、缓存还是降级结果。

如镜像不可用，可替换环境变量：

```bash
set HUGGINGFACE_CN_BASE=https://你的可用镜像域名
set GITHUB_CN_BASE=https://你的可用镜像域名
set GITHUB_TOKEN=你的 GitHub API Token
npm run dev:server
```

## 归档说明

当前归档是后端本地轻量 JSON 快照。普通 Node 服务器可以持久保留最近 7 天；Vercel Serverless 文件系统不保证持久写入，因此线上会在 `/api/archive` 和页面状态条中标记「临时归档」。如果后续要做真正的历史趋势，应迁移到 Redis、Upstash KV、Vercel KV 或数据库。

## 部署

最终采用 Vercel 双项目部署：前端项目 `today-hotsearch-home`，后端项目 `today-hotsearch-home-server`。Railway 部署尝试时账号提示 `Trial expired`，因此改用 Vercel Express 后端。

为保证国内用户无需 VPN 也能打开页面，另发布飞书妙搭公网入口：`https://ncn2j3n91nay.aiforce.cloud/app/app_4ka0f1un2r5re/`。该入口使用静态构建产物，发布时通过 `VITE_API_BASE` 指向 Vercel 后端以默认拉取实时数据；只有当后端也不可达时，才回退到标注清晰的内置离线占位示例（占位标题为中性文案，不会被误读为真实热点）。

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 合规说明

本站为个人学习项目，非官方、非商用。第三方数据以原文链接为准；如第三方接口调整、限流或下线，页面会显示对应平台失败态或降级提示。
