# 部署说明

## 最终线上地址

- 前端：https://today-hotsearch-home.vercel.app
- 后端 API：https://today-hotsearch-home-server.vercel.app
- 国内公网入口：https://ncn2j3n91nay.aiforce.cloud/app/app_4ka0f1un2r5re/
- GitHub：https://github.com/siyuetian-learner/today-hotsearch-home

Railway 部署时账号提示 `Trial expired`，需要升级套餐才能继续。最终采用 Vercel 双项目部署：一个 Vite 前端项目，一个 Express 后端项目。
为保证国内用户无需 VPN 也能打开，另通过飞书妙搭发布静态公网入口。该入口设置为互联网公开免登录，构建时注入 `VITE_API_BASE` 后默认拉取 Vercel 后端实时数据；只有后端不可达时才使用标注清晰的离线占位示例。

## 部署前检查表

- [x] `npm install --workspaces --include-workspace-root` 成功。
- [x] `npm run build` 成功生成 `client/dist`。
- [x] `npm run start` 可启动后端。
- [x] `GET /api/health` 返回 `{ ok: true }`。
- [x] `GET /api/health` 返回 `ttlSec`、`refreshCooldownSec`、`sourceCount: 12`。
- [x] `GET /api/hot` 返回 12 个榜单。
- [x] Vercel 前端 `VITE_API_BASE` 指向 Vercel 后端域名。
- [x] 国内入口链接默认启用。
- [x] Vercel Serverless 下 `/api/archive` 标记为临时归档，不承诺持久存储。

## GitHub

```bash
git init
git add .
git commit -m "feat: complete today hotsearch project"
git branch -M main
git remote add origin https://github.com/siyuetian-learner/today-hotsearch-home.git
git push -u origin main
```

## Vercel 后端

- Project Name：`today-hotsearch-home-server`
- Root Directory：`server`
- Framework Preset：Express
- Install Command：`npm install`
- 环境变量：
  - `CACHE_TTL=600`
  - `CACHE_MAX_ENTRIES=200`
  - `REFRESH_COOLDOWN_SEC=60`
  - `CLIENT_ORIGIN=https://today-hotsearch-home.vercel.app,https://ncn2j3n91nay.aiforce.cloud`
  - `USE_CN_LINKS=1`
  - `HUGGINGFACE_CN_BASE=https://hf-mirror.com`
  - `GITHUB_CN_BASE=`（没有稳定可用镜像时保持为空）
  - `GITHUB_TOKEN=`（可选，用于提高 GitHub API 限额）
  - `ZHIHU_HOT_API=https://api-hot.imsyy.top/zhihu`
  - `ZHIHU_HOT_APIS=https://hot.baiwumm.com/api/zhihu,https://api-hot.imsyy.top/zhihu`
  - `ZHIHU_HOT_PAGE=https://www.zhihu.com/billboard`
  - `DAILY_HOT_API_BASE=https://api-hot.imsyy.top`
  - `DAILY_HOT_API_BASES=https://api-hot.imsyy.top`
  - `ARCHIVE_DAYS=7`
  - `ARCHIVE_TIMEZONE_OFFSET=8`

验证：

```text
GET https://today-hotsearch-home-server.vercel.app/api/health
GET https://today-hotsearch-home-server.vercel.app/api/hot
GET https://today-hotsearch-home-server.vercel.app/api/sources
```

## Vercel 前端

- Project Name：`today-hotsearch-home`
- Root Directory：首次部署为仓库根目录，Build Command 为 `npm run build`，Output Directory 为 `client/dist`
- Environment Variables：
  - `VITE_API_BASE=https://today-hotsearch-home-server.vercel.app`

设置环境变量后需要重新部署 Production，前端构建包中才会带上后端地址。

## 飞书妙搭公网入口

- App ID：`app_4ka0f1un2r5re`
- URL：https://ncn2j3n91nay.aiforce.cloud/app/app_4ka0f1un2r5re/
- 发布目录：`client/dist`
- 访问范围：互联网公开，免登录
- 构建要求：`client/vite.config.ts` 使用 `base: "./"`，确保资源能在 `/app/app_xxx/` 子路径下正确加载。
- **数据要求（重要）**：妙搭是纯静态托管、没有自己的后端。如果构建时不注入 `VITE_API_BASE`，前端会把 `/api/hot` 请求发到 `aiforce.cloud` 自身域名上，必然 404 / 跨域失败，导致页面**永远只显示离线占位示例**。因此发布前必须把 `VITE_API_BASE` 指向 Vercel 后端，让公网入口真正拉实时数据；离线占位仅在后端也不可达时兜底。

发布命令：

```bash
# 关键：构建时注入后端地址，否则妙搭入口只会显示离线占位示例（非真实热点）。
# Windows PowerShell: $env:VITE_API_BASE="https://today-hotsearch-home-server.vercel.app"; npm --workspace client run build
# Windows CMD:        set VITE_API_BASE=https://today-hotsearch-home-server.vercel.app && npm --workspace client run build
VITE_API_BASE=https://today-hotsearch-home-server.vercel.app \
  npm --workspace client run build
lark-cli apps +html-publish --app-id app_4ka0f1un2r5re --path client/dist
lark-cli apps +access-scope-set --app-id app_4ka0f1un2r5re --scope public --require-login=false
```

## 上线验证

1. 打开 https://today-hotsearch-home.vercel.app。
2. 检查首页 12 个榜单。
3. 搜索 `AI`。
4. 点击刷新。
5. 切换 `AI 热点` 与 `开源项目`。
6. 点击 GitHub / Hugging Face 的国内入口和原站。
7. 确认前端构建包包含 `today-hotsearch-home-server.vercel.app`。
8. 确认后端 `/api/hot` 返回 12 个平台，每个平台 10 条数据或明确降级提示。
9. 连续请求 `/api/hot?refresh=1`，第二次在冷却期内返回缓存并带 `x-refresh-limited` 响应头。
10. 打开 `/api/archive?range=today`，确认 Serverless 环境会返回 `persistent: false` 或明确临时归档提示。
11. 打开 `/api/sources`，确认无公开 API 平台包含第三方源、公开页面、历史快照和离线数据兜底策略。
12. 打开妙搭公网入口，确认无登录拦截、12 张卡片可见；并确认默认显示的是**实时/缓存数据**（构建已注入 `VITE_API_BASE`），仅在后端不可达时才回退到标注清晰的离线占位示例。

## 线上证据

- `docs/evidence/online-homepage-vercel.png`
- `docs/evidence/online-ai-filter-vercel.png`
- `docs/evidence/online-api-summary-vercel.json`
- `docs/evidence/miaoda-public-homepage.png`

## 常见问题

- Railway trial expired：可改用 Vercel Express 后端，或升级 Railway 后继续使用 Railway。
- 前端仍请求自身 `/api`：检查 Vercel 前端项目是否设置 `VITE_API_BASE` 并重新部署。
- 妙搭入口只显示空白：检查 Vite 构建资源是否为 `./assets/...`，即 `base: "./"` 是否生效。
- GitHub/Hugging Face 访问慢：使用国内入口或替换镜像环境变量。
- 知乎接口不可用：页面会标记降级，属于预期容错。
- 无公开 API 平台不稳定：检查 `/api/sources` 中的兜底策略，必要时替换第三方聚合源或公开页面地址。
- 归档数量不稳定：Vercel Serverless 不提供持久文件系统，当前归档只作为临时快照；需要长期历史时应接入 KV 或数据库。
