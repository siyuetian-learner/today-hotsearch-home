# 今日热搜

21 天 Vibe Coding 实战项目：一个面向中文用户的多平台热榜聚合站，聚合中文热点、AI 动态与开源项目。

## 当前能力

- 前端：React + TypeScript + Vite + CSS
- 后端：Node.js + Express
- 数据：微博、B站、AI HOT 真实数据；知乎第三方接口优先、不可用时降级；Hugging Face / GitHub 默认使用国内入口与推荐兜底
- 缓存：每个平台独立内存缓存，默认 600 秒
- 体验：分类 Tab、搜索、刷新、单卡重试、展开前 10 条、加载态、错误态、空状态、合规页脚

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
```

## 环境变量

前端 `client/.env`：

|变量|说明|
|---|---|
|VITE_API_BASE|生产后端地址，例如 Railway 域名|

后端 `server/.env`：

|变量|默认值|说明|
|---|---:|---|
|PORT|3001|后端端口|
|CACHE_TTL|600|缓存秒数|
|CLIENT_ORIGIN|true|CORS 来源，生产填 Vercel 域名|
|USE_CN_LINKS|1|默认使用国内入口链接|
|HUGGINGFACE_CN_BASE|https://hf-mirror.com|Hugging Face 国内入口|
|GITHUB_CN_BASE|https://kkgithub.com|GitHub 国内入口|
|ZHIHU_HOT_API|https://api-hot.imsyy.top/zhihu|知乎第三方热榜接口|

## 数据来源说明

- 微博：`https://weibo.com/ajax/side/hotSearch`
- B站：`https://s.search.bilibili.com/main/hotword?limit=20`
- 知乎：第三方聚合 API 优先；接口不可用时显示降级数据并标记提示
- AI HOT：`https://aihot.virxact.com/api/public/items`
- Hugging Face：公开趋势接口优先；访问不稳定时切换国内入口推荐列表
- GitHub：Search API 优先；访问不稳定时切换国内入口推荐列表

## 国内访问说明

GitHub 与 Hugging Face 对部分中文用户可能访问不稳定。项目默认把标题链接转换为国内入口，并在每条内容中保留「原站」链接。

如镜像不可用，可替换环境变量：

```bash
set HUGGINGFACE_CN_BASE=https://你的可用镜像域名
set GITHUB_CN_BASE=https://你的可用镜像域名
npm run dev:server
```

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 合规说明

本站为个人学习项目，非官方、非商用。第三方数据以原文链接为准；如第三方接口调整、限流或下线，页面会显示对应平台失败态或降级提示。
