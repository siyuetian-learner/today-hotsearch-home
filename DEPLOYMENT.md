# 部署说明

## 最终线上地址

- 前端：https://today-hotsearch-home.vercel.app
- 后端 API：https://today-hotsearch-home-server.vercel.app
- GitHub：https://github.com/siyuetian-learner/today-hotsearch-home

Railway 部署时账号提示 `Trial expired`，需要升级套餐才能继续。最终采用 Vercel 双项目部署：一个 Vite 前端项目，一个 Express 后端项目。

## 部署前检查表

- [x] `npm install --workspaces --include-workspace-root` 成功。
- [x] `npm run build` 成功生成 `client/dist`。
- [x] `npm run start` 可启动后端。
- [x] `GET /api/health` 返回 `{ ok: true }`。
- [x] `GET /api/hot` 返回 6 个榜单。
- [x] Vercel 前端 `VITE_API_BASE` 指向 Vercel 后端域名。
- [x] 国内入口链接默认启用。

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
- 环境变量：可不填，代码默认值已覆盖课程演示需求
  - `CACHE_TTL=600`
  - `USE_CN_LINKS=1`
  - `HUGGINGFACE_CN_BASE=https://hf-mirror.com`
  - `GITHUB_CN_BASE=https://kkgithub.com`
  - `ZHIHU_HOT_API=https://api-hot.imsyy.top/zhihu`

验证：

```text
GET https://today-hotsearch-home-server.vercel.app/api/health
GET https://today-hotsearch-home-server.vercel.app/api/hot
```

## Vercel 前端

- Project Name：`today-hotsearch-home`
- Root Directory：首次部署为仓库根目录，Build Command 为 `npm run build`，Output Directory 为 `client/dist`
- Environment Variables：
  - `VITE_API_BASE=https://today-hotsearch-home-server.vercel.app`

设置环境变量后需要重新部署 Production，前端构建包中才会带上后端地址。

## 上线验证

1. 打开 https://today-hotsearch-home.vercel.app。
2. 检查首页 6 个榜单。
3. 搜索 `AI`。
4. 点击刷新。
5. 切换 `AI 热点` 与 `开源项目`。
6. 点击 GitHub / Hugging Face 的国内入口和原站。
7. 确认前端构建包包含 `today-hotsearch-home-server.vercel.app`。
8. 确认后端 `/api/hot` 返回 6 个平台，每个平台 10 条数据或明确降级提示。

## 线上证据

- `docs/evidence/online-homepage-vercel.png`
- `docs/evidence/online-ai-filter-vercel.png`
- `docs/evidence/online-api-summary-vercel.json`

## 常见问题

- Railway trial expired：可改用 Vercel Express 后端，或升级 Railway 后继续使用 Railway。
- 前端仍请求自身 `/api`：检查 Vercel 前端项目是否设置 `VITE_API_BASE` 并重新部署。
- GitHub/Hugging Face 访问慢：使用国内入口或替换镜像环境变量。
- 知乎接口不可用：页面会标记降级，属于预期容错。
