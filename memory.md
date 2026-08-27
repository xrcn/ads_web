# 已验证经验

- 模板列表的多行命令仅以 `↵` 压缩展示；编辑弹窗必须以原换行展示，便于管理员直接照抄发送。
- 群私有模板继承公共 alias 时，页面使用后端 `commandUsage` 展示实际口令，不显示“沿用公共口令”。
- 2026-08-26：前端任务必须同时读取根级与 `ads_web/AGENTS.md`；后者只维护 Vue、浏览器取证、dotenv、构建和静态控制台增量，公共门禁不得重复维护。
- 2026-08-27：涉及前后端两个 Git 仓库的设计与实施计划必须分别写入对应仓库的 `docs/superpowers/specs` 与 `docs/superpowers/plans`，不能放在非 Git 根目录 `E:\ads\docs` 作为待提交文件。
- 2026-08-27：公共上传组件必须区分 canonical 存储值与补全 URL 的展示值；并发成功回调要先同步本地 canonical 再 emit，单图成功直接替换，删除按稳定标识只删一项，服务端上传限制优先于 props fallback。401 Token 刷新重试必须有请求级一次性 marker，弹框 guard 必须在未跳转路径复位。
