# ads_web 前端增量规范

> 本文件只增加前端规则；同时继承 `E:\ads\AGENTS.md`。

## 1. Vue 职责边界

- 页面负责路由参数、区块组合和页面级协调；组件只负责单一 UI 区块及其交互。
- composable 仅在存在真实复用或独立生命周期时抽取；Pinia store 只保存跨页面或跨组件状态。
- API 模块负责请求、DTO 与类型，不操作 UI。
- 命令格式、触发规则和模板 metadata 由后端维护；前端不得建立第二套业务真相。

## 2. 页面、状态与交互

- 区分首屏关键和非关键数据；无依赖请求并发，存在真实依赖才串行。
- 独立区块各自维护 loading、empty、error、retry；非关键失败不得清空其他成功结果。
- 请求被替代、页面卸载或组件销毁时，清理请求、listener、timer 和 subscription。
- 导航使用链接，操作使用按钮；表单和图标按钮必须有可识别语义与键盘焦点。
- 大列表使用分页、虚拟化或其他受控渲染；不得延长全局 timeout 掩盖慢请求；同一错误不得由请求层与页面重复提示。

## 3. TypeScript 与注释

- component、composable、API 通过类型、命名和小函数表达职责。
- JSDoc 只说明公共契约、复杂参数或非显然副作用；template 注释只标记复杂区域。
- 异步竞态、事件监听及特殊清理时机必须说明原因与约束。

## 4. 浏览器缺陷取证

- 页面交互缺陷必须检查真实运行页面；生产缺陷同时检查生产和本地页面。
- 修复前记录 DOM、listener、bootstrap 与 Network 证据；修复后复测原路径、失败路径和相邻交互。
- 本地 build 不证明生产静态资源、登录态、供应商响应或真实微信群效果。

## 5. dotenv 与 Vite 配置

- `.env` 使用 parser 支持的 `#`，注释放在变量上方；说明变量是 build-time 还是 runtime 生效、是否需要 rebuild。
- `.env.example` 使用明显占位值并说明格式和受控来源；`#`、空格或引号等特殊字符按实际 parser 规则引用。
- 不执行未知 `.env`；变更至少验证 Vite build 和变量生效阶段，构建通过不等于生产值已生效。

## 6. 验证矩阵

- 当前 `package.json` 没有 test 或独立 typecheck script，不得虚报测试或类型检查通过。
- 前端代码修改至少运行非修复型相关静态检查和 `npm run build`；不得把会改写源码的 `npm run lint-fix` 当作只读验证。
- 关键 UI 必须验证浏览器真实交互；API 同时验证请求参数、响应、权限、空数据和错误状态。
- 引入自动化测试能力前，说明依赖、范围和成本并取得确认。

## 7. 微信 API 可视化控制台

- `public/wechat-visual-console` 是独立静态应用，不与 Vue 主站混淆。
- 受控五资源为 `index.html`、`css/style.css`、`js/core.js`、`js/app.js`、`js/modules-bundle.js`。
- 发布仅走专用 manifest、SHA-256、目录交换和 rollback 验证流程；不得调用整站 `生产一键发布.ps1`。
