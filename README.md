# ADS 管理后台（ads_web）

ADS 的 Vue 3、Vite、TypeScript、Element Plus 管理后台，提供主播、语音厅、微信小助手、VV 数据等业务管理页面。

## 阅读入口

- [共享文档](../docs/README.md)：项目架构、开发、协作、变更与发布导航。
- [新成员上手](../docs/development.md)、[团队协作](../docs/CONTRIBUTING.md)、[接口与数据导航](../docs/api-data-guide.md)。
- [AGENTS.md](./AGENTS.md)：本仓组件职责、交互、配置、授权与验证边界。

跨仓链接按 `ads_server`、`ads_web`、`ads_vv_robot`、`docs` 同级检出布局解析。实际仓库地址由项目负责人提供，不使用上游模板 clone 地址。

## 环境与启动

当前锁定 Vite 为 `7.1.11`，要求 Node `^20.19.0 || >=22.12.0`，使用配套 npm。虽然 [package.json](./package.json) 仍声明 `node >=16.0.0`，准备环境时必须满足锁定 Vite 的要求。本次没有修改依赖或锁文件。

先按开发指南准备隔离后端与测试账号，再在本仓执行以下示例。2026-09-25 已用 Vite 实际加载开发/生产配置，未执行以下依赖安装或启动命令：

```powershell
Set-Location E:\ads\ads_web
npm ci
npm run dev -- --host 127.0.0.1
```

`npm ci` 适用于按锁文件准备依赖，会重建已有依赖目录。开发端口当前为 `8888`，页面路径以 Vite 输出为准；开发 API/WebSocket 分别由 `.env.development` 中的 `VITE_API_URL` / `VITE_WEBSOCKET_URL` 配置，当前指向本地后端 `8808`。

Vite 环境变量影响构建产物；调整生产变量需要重新构建。不要将构建期变量误当成服务端运行期凭据配置。

实际配置求值确认：serve 的 base 为 `./`，生产 build 的 base 为 `/`，产物目录 `dist`。[router/index.ts](./src/router/index.ts) 使用 hash history；[themeConfig](./src/stores/themeConfig.ts) 默认开启后端路由菜单。配置加载结果和源码依据见 [项目说明书](../docs/ADS项目说明书.md)，未据此宣称浏览器或完整构建通过。

## 代码与验证

| 目录/文件 | 职责 |
| --- | --- |
| `src/views` | 业务页面 |
| `src/api` | API 调用、请求与响应类型 |
| `src/stores` | 共享状态 |
| `vite.config.ts` | 开发与构建配置 |
| `public/wechat-visual-console` | 独立微信 API 可视化控制台 |

当前 scripts 只有 `dev`、`build`、`lint-fix`，没有自动化 test 或独立 typecheck script。

- Vue、TypeScript、API、样式或 Vite 配置修改按规则在闭包末运行一次 `npm run build`，关键交互另做浏览器验收。
- Markdown 修改不运行 build；`lint-fix` 会改写源码，不作为只读检查。
- 可视化控制台使用专用验证和静态发布流程，不混用 Vue 整站发布。
- 本地构建不证明生产页面、登录态、供应商或真实微信群行为。

## 发布、变更与上游

正式交付按共享文档中的目标环境手册与本仓规则执行；`dist` 存在不代表已经发布。ADS 自身变化见 [共享变更记录](../docs/CHANGELOG.md)。

当前 develop 发布脚本的发布/rollback 入口被 readiness guard 禁用；静态控制台脚本又使用不同的连接配置来源，不能将两者视为同一个已验证目标。详见 [发布入口现状](../docs/develop生产发布操作说明.md)。

本仓基于 GFast UI / vue-next-admin，保留上游 [LICENSE](./LICENSE) 和 [历史日志](./CHANGELOG.md)。package 名称、版本及上游日志不作为 ADS 产品发布记录。
