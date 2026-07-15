# 测试报告

## 2026-07-15 MVP 收敛回归

- 前端单元测试：3/3 通过，覆盖示例数据排除、同事件聚类、不同地区防误合并。
- 后端单元测试：3/3 通过，覆盖聚合响应状态、缓存 key 和新鲜度判断。
- 本地 API：首次真实抓取约 14-21 秒；聚合缓存命中 40-56ms。过期聚合结果会先返回旧缓存并在后台刷新。
- 前端生产构建通过，Vite 产物正常生成。
- Playwright 桌面端 1280px、手机端 360px 均无横向溢出。
- 手机端默认页面高度由约 21,000px 降至约 7,113px，首个内容标题位于约 570px，默认展示 4 个平台并支持展开全部。
- 页面中“今日主线”重复文本为 0；离线示例不进入今日重点和综合 Top 20。

## 环境

- Node.js：22.22.1
- npm：10.9.4
- 前端：React + TypeScript + Vite
- 后端：Express

## 已执行检查

```bash
npm --workspace client run build
node --check server/index.js
node --check server/app.js
node --check server/services/weibo.js
node --check server/services/zhihu.js
node --check server/services/bilibili.js
node --check server/services/github.js
node --check server/services/huggingface.js
node --check server/services/hackernews.js
node --check server/utils/archive.js
```

构建输出已保存到：

```text
docs/evidence/build-success.txt
```

## API 验证

```text
GET http://127.0.0.1:3001/api/health
结果：{"ok":true,"ttlSec":600,"refreshCooldownSec":60,"sourceCount":12}
```

```text
GET http://127.0.0.1:3001/api/sources
结果：返回 12 个数据源策略；无公开 API 平台包含第三方聚合源、公开页面解析、历史快照或离线数据兜底说明。
```

API 摘要已保存到：

```text
docs/evidence/api-hot-summary.json
```

缓存命中日志已保存到：

```text
docs/evidence/server-cache.log
```

首页截图已保存到：

```text
docs/evidence/homepage-react.png
```

线上验证证据：

```text
docs/evidence/online-homepage-vercel.png
docs/evidence/online-ai-filter-vercel.png
docs/evidence/online-api-summary-vercel.json
docs/evidence/miaoda-public-homepage.png
```

```text
GET http://127.0.0.1:3017/api/hot/zhihu?refresh=1
结果（2026-07-15）：
- zhihu: 10 条，`dataState=live`，`sample=false`
- accessMode: `知乎实时热榜 JSON`
- 首条包含知乎问题链接、平台热度文字和摘要
- 主接口失败时会自动切换 `api.zhihu.com` 备接口；全源失败时交由共享历史快照兜底

GET http://127.0.0.1:3001/api/hot?refresh=1
结果：
- weibo: 10 条，真实接口
- bilibili: 10 条，真实接口
- huggingface: 10 条，直连失败时国内入口推荐
- aihot: 10 条，真实接口
- github: 10 条，直连失败时国内入口推荐
- hackernews: 10 条，官方 Firebase API 超时或为空时切换离线快照
```

```text
GET http://127.0.0.1:3001/api/hot?refresh=1
连续请求结果：
- 第一次绕过缓存刷新。
- 冷却期内第二次返回缓存，并带 x-refresh-limited 响应头。
```

```text
GET http://127.0.0.1:3001/api/archive?range=today
结果：
- 本地 Node 环境返回 persistent: true。
- Vercel Serverless 环境返回临时归档提示，历史快照不作为持久数据源。
```

## UI 测试清单

- [x] 首页显示站点名称、介绍和更新时间。
- [x] 默认显示 12 张卡片。
- [x] 每张卡片默认显示前 5 条。
- [x] 点击“展开前 10 条”可显示完整榜单。
- [x] 搜索框可触发关键词查询。
- [x] 分类 Tab 可切换：全部、综合热点、AI 热点、开源项目。
- [x] 刷新按钮有 loading 状态。
- [x] 单卡“重新获取”可重新请求对应平台。
- [x] 失败或降级平台不影响其他平台。
- [x] GitHub / Hugging Face 显示“国内入口 / 原站”。
- [x] 卡片和详情抽屉显示当前采集策略，用户可识别官方 API、第三方源、缓存、快照或离线兜底。
- [x] 页脚合规文案存在。
- [x] 线上前端 `https://today-hotsearch-home.vercel.app` 可访问。
- [x] 线上后端 `https://today-hotsearch-home-server.vercel.app/api/hot` 返回 12 个平台。
- [x] 线上前端构建包包含 `today-hotsearch-home-server.vercel.app`，`VITE_API_BASE` 生效。
- [x] 国内公网入口 `https://ncn2j3n91nay.aiforce.cloud/app/app_4ka0f1un2r5re/` 可打开。
- [x] 公网入口在实时 API 不可达时自动展示 12 平台离线快照。

## 已修复问题

1. 长标题和热度字段重叠：改为排名 + 内容区布局，热度作为元信息展示。
2. 英文界面词过多：面向中文用户重写 UI 文案。
3. GitHub / Hugging Face 访问不稳定：增加国内入口和降级推荐列表。
4. 静态页不符合教程结构：迁移为 `client/ + server/`。
5. Railway 账号 trial expired 阻塞部署：改为 Vercel 前端 + Vercel Express 后端双项目部署。
6. 妙搭子路径托管资源加载失败：将 Vite `base` 改为 `./`，让 JS/CSS 以相对路径加载。
7. CORS 过宽：改为本地、Vercel、妙搭域名白名单，并支持 `CLIENT_ORIGIN` 追加。
8. 强制刷新无冷却：新增 `REFRESH_COOLDOWN_SEC`，冷却期内返回缓存并标记响应头。
9. Hacker News 并发过多：限制详情请求数量和超时时间，失败时降级到离线快照。
10. 归档持久性不透明：`/api/archive` 返回 `persistent/message`，前端状态条显示临时归档。
11. 无公开 API 站点国内访问不稳定：新增 `/api/sources` 策略层，知乎增加公开页面解析兜底，前端展示采集与国内访问策略。
12. 知乎长期显示示例：改为两个知乎实时 JSON 端点优先、第三方聚合后备、共享成功快照兜底；生产环境取消硬编码知乎示例。

## 剩余风险

- 第三方公开接口可能变化。
- 知乎实时 JSON 端点目前可匿名访问，但不是承诺稳定的正式开放 API，仍需双端点和共享快照兜底。
- GitHub 匿名 Search API 有速率限制。
- 国内镜像不是官方服务，稳定性可能变化。
- Vercel Serverless 不适合作为持久归档存储，长期历史趋势需要迁移到 KV 或数据库。
