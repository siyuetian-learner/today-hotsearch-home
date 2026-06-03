# 任务提交文件

## 交付范围

已按《21天 Vibe Coding 实战打卡教程》整理完整本地交付内容：

- React + TypeScript + Vite 前端
- Express 后端
- 统一热榜 API
- 真实数据源与降级策略
- 缓存、刷新、搜索、分类、错误态
- 21 天打卡文案草稿
- 测试报告、部署说明、项目总结

## 当前完成状态

|阶段|状态|
|---|---|
|Day 1-3 认知与研究|已输出账号清单、RESEARCH、打卡文案|
|Day 4-6 PRD/设计/AGENTS|已完成|
|Day 7-11 前端与 Mock API|已完成并升级为 React/Vite|
|Day 12 缓存|已完成|
|Day 13-15 真实数据|微博/B站/AI HOT 真实；知乎/HF/GitHub 具备降级策略|
|Day 16-18 测试与体验|已完成测试报告和体验优化|
|Day 19-20 部署准备|已完成部署说明，实际部署需用户手动登录|
|Day 21 总结|已完成 500+ 字项目总结|

## 本地验证

```bash
npm --workspace client run build
npm run start
```

接口：

```text
GET http://127.0.0.1:3001/api/health
GET http://127.0.0.1:3001/api/hot?refresh=1
```

## 需要用户本人完成

- 注册/登录 Cursor、GitHub、Vercel、Railway。
- 新建 GitHub 仓库并推送代码。
- 在 Vercel 和 Railway 手动授权部署。
- 在知识星球发布打卡内容。
- 将线上链接发给朋友并收集真实反馈。

## 打卡发布建议

发布时可使用：

- `DAILY_CHECKINS.md`：每天打卡文案草稿。
- `PROJECT_SUMMARY.md`：最终总结。
- `TEST_REPORT.md`：测试清单与问题修复记录。
- `DEPLOYMENT.md`：部署过程与踩坑记录。
