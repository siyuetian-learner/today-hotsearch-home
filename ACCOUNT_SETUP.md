# 账号与手动操作清单

这些任务需要用户本人完成，AI 不保存账号、密码或 token。

## Day 1 账号注册

- Cursor：访问 https://cursor.com 注册。
- GitHub：访问 https://github.com 注册，后续新建仓库 `today-hotsearch-home`。
- Vercel：访问 https://vercel.com，建议使用 GitHub 登录。
- Railway：访问 https://railway.app，建议使用 GitHub 登录。

## GitHub 仓库

建议仓库名：`today-hotsearch-home`

推荐描述：

```text
中文多平台今日热搜聚合站，21 天 Vibe Coding 实战项目。
```

## Vercel 手动登录部署

1. 登录 Vercel。
2. Import GitHub Repository。
3. Root Directory 选择 `client`。
4. Build Command：`npm run build`。
5. Output Directory：`dist`。
6. 设置环境变量：`VITE_API_BASE=<Railway 后端域名>`。

## Railway 手动登录部署

1. 登录 Railway。
2. New Project -> Deploy from GitHub repo。
3. Root Directory 选择 `server`。
4. Start Command：`npm run start`。
5. 设置环境变量：
   - `PORT`
   - `CACHE_TTL=600`
   - `CLIENT_ORIGIN=<Vercel 前端域名>`
   - `USE_CN_LINKS=1`
   - `HUGGINGFACE_CN_BASE=https://hf-mirror.com`
   - `GITHUB_CN_BASE=https://kkgithub.com`
   - `ZHIHU_HOT_API=https://api-hot.imsyy.top/zhihu`

## 知识星球打卡

AI 已生成 `DAILY_CHECKINS.md`，发布时请补充截图、线上链接和真实体验。
