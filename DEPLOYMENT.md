# 部署说明

## 部署前检查表

- [ ] `npm install --workspaces --include-workspace-root` 成功。
- [ ] `npm run build` 成功生成 `client/dist`。
- [ ] `npm run start` 可启动后端。
- [ ] `GET /api/health` 返回 `{ ok: true }`。
- [ ] `GET /api/hot` 返回 6 个榜单。
- [ ] Vercel `VITE_API_BASE` 指向 Railway 域名。
- [ ] Railway `CLIENT_ORIGIN` 指向 Vercel 域名。
- [ ] 国内入口变量已设置。

## GitHub

```bash
git init
git add .
git commit -m "feat: complete 21-day hot search project"
git branch -M main
git remote add origin https://github.com/<your-name>/today-hotsearch-home.git
git push -u origin main
```

## Vercel 前端

- Root Directory：`client`
- Framework Preset：Vite
- Build Command：`npm run build`
- Output Directory：`dist`
- Environment Variables：
  - `VITE_API_BASE=https://<your-railway-domain>`

## Railway 后端

- Root Directory：`server`
- Start Command：`npm run start`
- Variables：
  - `PORT=3001`
  - `CACHE_TTL=600`
  - `CLIENT_ORIGIN=https://<your-vercel-domain>`
  - `USE_CN_LINKS=1`
  - `HUGGINGFACE_CN_BASE=https://hf-mirror.com`
  - `GITHUB_CN_BASE=https://kkgithub.com`
  - `ZHIHU_HOT_API=https://api-hot.imsyy.top/zhihu`

## 上线验证

1. 打开 Vercel 页面。
2. 检查首页 6 个榜单。
3. 搜索 `AI`。
4. 点击刷新。
5. 切换 `AI 热点` 与 `开源项目`。
6. 点击 GitHub / Hugging Face 的国内入口和原站。
7. 打开 DevTools Network，确认 `/api/hot` 指向 Railway。

## 常见问题

- CORS 报错：检查 Railway `CLIENT_ORIGIN` 是否完全等于 Vercel 域名。
- 前端空白：检查 `VITE_API_BASE` 是否配置并重新部署。
- GitHub/Hugging Face 访问慢：使用国内入口或替换镜像环境变量。
- 知乎接口不可用：页面会标记降级，属于预期容错。
