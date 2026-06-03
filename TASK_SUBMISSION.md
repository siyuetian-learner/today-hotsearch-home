# 任务提交文件

## 线上链接

- 项目首页：https://today-hotsearch-home.vercel.app
- 国内公网入口：https://ncn2j3n91nay.aiforce.cloud/app/app_4ka0f1un2r5re/
- 后端 API：https://today-hotsearch-home-server.vercel.app/api/hot
- GitHub 仓库：https://github.com/siyuetian-learner/today-hotsearch-home

## 交付范围

已按《21天 Vibe Coding 实战打卡教程》整理完整交付内容：

- React + TypeScript + Vite 前端
- Express 后端
- 统一热榜 API
- 真实数据源与降级策略
- 缓存、刷新、搜索、分类、错误态
- GitHub/Hugging Face 国内入口与原站链接
- 国内公网入口，接口不可达时自动展示离线快照
- 21 天打卡文案草稿
- 测试报告、部署说明、项目总结

## 当前完成状态

|阶段|状态|
|---|---|
|Day 1-3 认知与研究|已输出账号清单、RESEARCH、打卡文案|
|Day 4-6 PRD/设计/AGENTS|已完成|
|Day 7-11 前端与 Mock API|已完成并升级为 React/Vite|
|Day 12 缓存|已完成|
|Day 13-15 真实数据|微博/B站/AI HOT 真实；知乎具备降级；HF/GitHub 具备国内入口|
|Day 16-18 测试与体验|已完成测试报告和体验优化|
|Day 19-20 部署|已完成 GitHub + Vercel 前后端部署|
|公网分享入口|已完成飞书妙搭公开免登录入口|
|Day 21 总结|已完成 500+ 字项目总结|

## 验证记录

本地：

```bash
npm run build
npm run start
```

线上：

```text
GET https://today-hotsearch-home-server.vercel.app/api/health
GET https://today-hotsearch-home-server.vercel.app/api/hot
```

证据文件：

- `docs/evidence/homepage-react.png`
- `docs/evidence/api-hot-summary.json`
- `docs/evidence/build-success.txt`
- `docs/evidence/server-cache.log`
- `docs/evidence/online-homepage-vercel.png`
- `docs/evidence/online-ai-filter-vercel.png`
- `docs/evidence/online-api-summary-vercel.json`
- `docs/evidence/miaoda-public-homepage.png`

## 需要用户本人完成

- 在知识星球发布打卡内容。
- 将线上链接发给朋友并收集真实反馈。
- 如后续要使用 Railway，需自行处理 Railway 套餐或账号状态。

## 打卡发布建议

发布时可使用：

- `DAILY_CHECKINS.md`：每天打卡文案草稿。
- `PROJECT_SUMMARY.md`：最终总结。
- `TEST_REPORT.md`：测试清单与问题修复记录。
- `DEPLOYMENT.md`：部署过程与踩坑记录。
