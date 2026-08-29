# ADS 管理后台移动端响应式卡片列表实施计划

> **执行要求：** 实施时必须使用 `subagent-driven-development` 或 `executing-plans` 技能，严格按任务顺序执行。所有步骤使用复选框（`- [ ]`）跟踪。

**目标：** 实现已批准的 320px 至 768px 手机竖屏布局和逐页卡片列表，同时保持桌面行为、API 请求、权限、数据语义和发布状态不变。

**架构：** 全局注册的 `MobileRecordList` 统一负责响应式筛选容器、桌面/手机视图切换、加载状态、空状态和卡片循环。各页面保留现有请求、分页、格式化函数、权限和操作处理函数，将不变的桌面表单/表格移入插槽，并按已批准设计提供页面专属卡片内容。登录页、微信静态控制台、机器人配置、字典管理和用户管理采用针对性的响应式布局修复。

**技术栈：** Vue 3、TypeScript、SCSS、Element Plus、原生 `<details>`、Node.js 内置 `assert`/`fs`、Vite 构建和真实浏览器响应式验证。

说明：正文、步骤和验收标准全部使用中文；代码标识、文件路径、命令、组件名和工具原始输出保留英文，避免执行时产生歧义。

## 全局约束

- 权威设计文档为提交 `7a60fc4` 中的 `docs/superpowers/specs/2026-08-29-mobile-responsive-card-list-design.md`。
- `max-width: 768px` 为手机模式，`min-width: 769px` 开始使用桌面模式。
- 保留全部现有 API 调用、请求参数、分页语义、权限、确认流程、处理函数、加载状态、空状态和桌面表格。
- 不引入依赖、测试框架、字段 DSL、schema 层，不修改路由、store、后端或数据库，也不全局覆盖 Element Plus 固定列行为。
- API 调试空白页和 Swagger `localhost:8808` 故障不在本批范围内。
- 所有源码稳定后只运行一次 `npm run build`。
- 不运行 `npm run lint-fix`。
- 下文每个 commit 步骤都是硬门禁：只有用户明确授权该次提交后才能执行；不得 amend、rebase 或改写现有两个设计提交。
- 本计划不授权生产发布、远端写入或回滚操作。

---

## 文件结构

**新增文件**

- `scripts/verify-mobile-responsive.mjs`：无依赖的分阶段失败/通过（RED/GREEN）结构验证器。
- `src/components/mobileRecordList/index.vue`：唯一的共享响应式筛选/表格/卡片容器。

**修改：共享与特殊布局**

- `src/main.ts`
- `src/views/login/index.vue`
- `src/theme/media/login.scss`
- `src/views/wechat/visualConsole/index.vue`
- `public/wechat-visual-console/css/style.css`
- `src/views/wechat/robotConfig/index.vue`

**修改：业务列表**

- `src/views/anchor/manage/index.vue`
- `src/views/anchor/manage/component/anchorList.vue`
- `src/views/wechat/message/index.vue`
- `src/views/wechat/group/index.vue`
- `src/views/wechat/template/index.vue`
- `src/views/wechat/account/index.vue`
- `src/views/wechat/scheduleDuration/index.vue`
- `src/views/anchor/mic/index.vue`
- `src/views/anchor/mic/component/micList.vue`
- `src/views/wechat/monitor/index.vue`

**修改：系统列表与双栏页面**

- `src/views/system/config/index.vue`
- `src/views/system/menu/index.vue`
- `src/views/system/role/index.vue`
- `src/views/system/dept/index.vue`
- `src/views/system/post/index.vue`
- `src/views/system/monitor/loginLog/index.vue`
- `src/views/system/monitor/operLog/index.vue`
- `src/views/system/monitor/userOnline/index.vue`
- `src/views/system/tools/gen/index.vue`
- `src/views/system/sysJob/list/index.vue`
- `src/views/system/dict/index.vue`
- `src/views/system/dict/dataList.vue`
- `src/views/system/user/index.vue`
- `src/views/system/user/component/userList.vue`

---

### 任务 1：分阶段验证器与共享响应式容器

**文件：**

- 新增：`scripts/verify-mobile-responsive.mjs`
- 新增：`src/components/mobileRecordList/index.vue`
- 修改：`src/main.ts:19-45`

**接口：**

- 产出全局组件 `MobileRecordList`。
- 属性：`data: unknown[]`、`loading?: boolean`、`rowKey?: string`、`filterSummary?: string`。
- 插槽：`filters`、`desktop` 和默认作用域插槽 `{ row, index }`。
- 为所有页面提供前缀样式类：`mobile-record-card__header`、`mobile-record-card__fields`、`mobile-record-card__details`、`mobile-record-card__actions`。

- [ ] **步骤 1：编写分阶段结构验证器**

创建 `scripts/verify-mobile-responsive.mjs`，完整内容如下：

```js
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const phase = process.argv[2] || 'all';

const checks = {
  base: [
    ['src/components/mobileRecordList/index.vue', ['mobile-record-list__filter-toggle', '<slot name="desktop"', '<slot :row="row" :index="index"', 'mobile-record-card__actions']],
    ['src/main.ts', ["import MobileRecordList from '/@/components/mobileRecordList/index.vue'", "app.component('MobileRecordList', MobileRecordList)"]],
  ],
  shell: [
    ['src/views/login/index.vue', ['mobile-login-shell']],
    ['src/theme/media/login.scss', ['min-height: 100dvh', '.login-footer', '.login-icon-group-title']],
    ['src/views/wechat/visualConsole/index.vue', ['mobile-console-host']],
    ['public/wechat-visual-console/css/style.css', ['@media (max-width: 768px)', '.layout-body', 'flex-direction: column', '.side-menu', 'width: max-content']],
  ],
  group: [
    ['src/views/wechat/group/index.vue', ['<MobileRecordList', 'data-mobile-view="wechat-group"', 'mobile-record-card__details', 'member-mobile-cards']],
  ],
  business: [
    ['src/views/anchor/manage/component/anchorList.vue', ['data-mobile-view="anchor-list"']],
    ['src/views/wechat/message/index.vue', ['data-mobile-view="wechat-message"']],
    ['src/views/wechat/template/index.vue', ['data-mobile-view="wechat-template"']],
    ['src/views/wechat/account/index.vue', ['data-mobile-view="wechat-account"']],
    ['src/views/wechat/scheduleDuration/index.vue', ['data-mobile-view="schedule-duration"']],
    ['src/views/anchor/mic/component/micList.vue', ['data-mobile-view="anchor-mic"']],
  ],
  monitor: [
    ['src/views/wechat/monitor/index.vue', ['data-mobile-view="wechat-monitor-accounts"', 'data-mobile-view="wechat-monitor-events"']],
    ['src/views/wechat/robotConfig/index.vue', ['mobile-robot-config', 'mobile-record-card__fields', 'width: 100% !important']],
  ],
  system: [
    ['src/views/system/config/index.vue', ['data-mobile-view="system-config"']],
    ['src/views/system/menu/index.vue', ['data-mobile-view="system-menu"']],
    ['src/views/system/role/index.vue', ['data-mobile-view="system-role"']],
    ['src/views/system/dept/index.vue', ['data-mobile-view="system-dept"']],
    ['src/views/system/post/index.vue', ['data-mobile-view="system-post"']],
    ['src/views/system/monitor/loginLog/index.vue', ['data-mobile-view="login-log"']],
    ['src/views/system/monitor/operLog/index.vue', ['data-mobile-view="operation-log"']],
    ['src/views/system/monitor/userOnline/index.vue', ['data-mobile-view="online-user"']],
    ['src/views/system/tools/gen/index.vue', ['data-mobile-view="code-generator"']],
    ['src/views/system/sysJob/list/index.vue', ['data-mobile-view="system-job"']],
  ],
  twoColumn: [
    ['src/views/system/dict/index.vue', ['mobile-dict-layout']],
    ['src/views/system/dict/dataList.vue', ['data-mobile-view="system-dict"']],
    ['src/views/system/user/index.vue', ['mobile-user-layout']],
    ['src/views/system/user/component/userList.vue', ['data-mobile-view="system-user"']],
  ],
};

const phaseOrder = ['base', 'shell', 'group', 'business', 'monitor', 'system', 'twoColumn'];
const selected = phase === 'all' ? phaseOrder : [phase];

for (const name of selected) {
  assert.ok(checks[name], `unknown phase: ${name}`);
  for (const [relativePath, patterns] of checks[name]) {
    const file = resolve(root, relativePath);
    assert.ok(existsSync(file), `${relativePath} is missing`);
    const source = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      assert.ok(source.includes(pattern), `${relativePath} is missing: ${pattern}`);
    }
  }
}

console.log(`MOBILE_RESPONSIVE_VERIFY_PASS phase=${phase}`);
```

- [ ] **步骤 2：运行基础验证并确认失败（RED）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs base
```

预期：退出码 1，并显示 `src/components/mobileRecordList/index.vue is missing`。

- [ ] **步骤 3：创建共享组件**

创建 `src/components/mobileRecordList/index.vue`，完整内容如下：

```vue
<template>
	<div class="mobile-record-list">
		<section v-if="$slots.filters" class="mobile-record-list__filters">
			<el-button class="mobile-record-list__filter-toggle" @click="filterOpen = !filterOpen">
				<el-icon><ele-Filter /></el-icon>
				<span>筛选条件</span>
				<small v-if="filterSummary">{{ filterSummary }}</small>
				<el-icon><ele-ArrowDown v-if="!filterOpen" /><ele-ArrowUp v-else /></el-icon>
			</el-button>
			<div :class="['mobile-record-list__filter-content', { 'is-open': filterOpen }]">
				<slot name="filters" />
			</div>
		</section>

		<div class="mobile-record-list__desktop">
			<slot name="desktop" />
		</div>

		<div v-loading="loading" class="mobile-record-list__mobile">
			<el-empty v-if="!loading && data.length === 0" description="暂无数据" />
			<article v-for="(row, index) in data" :key="recordKey(row, index)" class="mobile-record-card">
				<slot :row="row" :index="index" />
			</article>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineOptions({ name: 'MobileRecordList' });

const props = withDefaults(defineProps<{
	data: any[];
	loading?: boolean;
	rowKey?: string;
	filterSummary?: string;
}>(), {
	loading: false,
	rowKey: 'id',
	filterSummary: '',
});

const filterOpen = ref(false);
const recordKey = (row: any, index: number) => row?.[props.rowKey] ?? index;
</script>

<style lang="scss">
.mobile-record-list__filter-toggle,
.mobile-record-list__mobile {
	display: none;
}

@media (max-width: 768px) {
	.mobile-record-list__filter-toggle {
		display: grid;
		grid-template-columns: auto auto minmax(0, 1fr) auto;
		align-items: center;
		width: 100%;
		margin-bottom: 12px;

		small {
			overflow: hidden;
			color: var(--el-text-color-secondary);
			text-align: right;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.mobile-record-list__filter-content {
		display: none;

		&.is-open {
			display: block;
		}

		.el-form {
			display: block;
		}

		.el-form-item,
		.el-input,
		.el-select,
		.el-date-editor {
			width: 100% !important;
		}
	}

	.mobile-record-list__desktop {
		display: none;
	}

	.mobile-record-list__mobile {
		display: grid;
		gap: 12px;
	}

	.mobile-record-card {
		min-width: 0;
		padding: 16px;
		border: 1px solid var(--el-border-color-lighter);
		border-radius: 8px;
		background: var(--el-bg-color);
		box-shadow: var(--el-box-shadow-lighter);
	}

	.mobile-record-card__header,
	.mobile-record-card__actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.mobile-record-card__title {
		min-width: 0;
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		overflow-wrap: anywhere;
	}

	.mobile-record-card__subtitle {
		margin: 4px 0 0;
		color: var(--el-text-color-secondary);
	}

	.mobile-record-card__fields {
		display: grid;
		gap: 9px;
		margin: 14px 0;

		> div {
			display: grid;
			grid-template-columns: 104px minmax(0, 1fr);
			gap: 10px;
		}

		dt {
			color: var(--el-text-color-secondary);
		}

		dd {
			min-width: 0;
			margin: 0;
			overflow-wrap: anywhere;
		}
	}

	.mobile-record-card__details {
		margin: 12px 0;
		border-top: 1px solid var(--el-border-color-lighter);
		border-bottom: 1px solid var(--el-border-color-lighter);

		summary {
			min-height: 44px;
			padding: 12px 0;
			color: var(--el-color-primary);
			cursor: pointer;
		}
	}

	.mobile-record-card__actions {
		justify-content: flex-start;
		flex-wrap: wrap;

		.el-dropdown {
			margin-left: auto;
		}
	}
}
```

- [ ] **步骤 4：全局注册组件**

在 `src/main.ts` 中新增：

```ts
import MobileRecordList from '/@/components/mobileRecordList/index.vue';
```

紧接 `app.component('pagination', pagination)` 后新增：

```ts
app.component('MobileRecordList', MobileRecordList);
```

- [ ] **步骤 5：确认通过（GREEN）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs base
```

预期：退出码 0，并输出 `MOBILE_RESPONSIVE_VERIFY_PASS phase=base`。

- [ ] **步骤 6：提交门禁**

仅在用户明确授权本次提交后执行：

```powershell
git add scripts/verify-mobile-responsive.mjs src/components/mobileRecordList/index.vue src/main.ts
git diff --cached --check
git commit -m "前端：新增移动端卡片列表基础组件"
```

---

### 任务 2：登录页与微信静态控制台外壳

**文件：**

- 修改：`src/views/login/index.vue:2`
- 修改：`src/theme/media/login.scss:33-51`
- 修改：`src/views/wechat/visualConsole/index.vue:2-65`
- 修改：`public/wechat-visual-console/css/style.css:295-344, 3336-3378`

**接口：**

- 保留登录表单组件和全部登录处理函数。
- 保留 iframe URL、bootstrap、same-origin 代理、账号选择和静态控制台 JavaScript。

- [ ] **步骤 1：确认页面外壳失败（RED）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs shell
```

预期：退出码 1，并报告缺少 `mobile-login-shell`。

- [ ] **步骤 2：让登录页进入自然的手机端文档流**

将 `src/views/login/index.vue` 根元素修改为：

```vue
<div class="login-container mobile-login-shell" :style="loginContainerStyle">
```

使用以下内容替换 `src/theme/media/login.scss` 中的 `max-width: $xs` 区块：

```scss
@media screen and (max-width: $xs) {
	.login-container.mobile-login-shell {
		min-height: 100dvh;
		height: auto;
		display: flex;
		flex-direction: column;
		overflow-y: auto;

		.login-content-out {
			flex: 1 0 auto;
			height: auto;
			padding: 24px 16px 12px;
			box-sizing: border-box;
		}

		.login-icon-group {
			display: block !important;
			height: auto;
		}

		.login-icon-group-title {
			margin-bottom: 18px;

			img {
				width: min(220px, 72vw);
			}
		}

		.login-content {
			width: 100% !important;
			max-width: 430px;
			height: auto !important;
			padding: 24px 0 !important;
			border-radius: 12px !important;
			box-sizing: border-box;
		}

		.login-footer {
			position: static;
			width: 100%;
			padding: 0 16px 16px;
			box-sizing: border-box;
		}

		.el-form-item {
			display: flex !important;
		}
	}
}
```

- [ ] **步骤 3：标记并设置 iframe 宿主页尺寸**

将 `src/views/wechat/visualConsole/index.vue` 的页面根元素修改为：

```vue
<div class="wechat-visual-console-page mobile-console-host">
```

在其 scoped 样式末尾追加：

```scss
@media (max-width: 768px) {
	.wechat-visual-console-page.mobile-console-host {
		min-height: calc(100dvh - 105px);
		height: calc(100dvh - 105px);
	}
}
```

- [ ] **步骤 4：将静态控制台侧栏收至内容上方**

在 `public/wechat-visual-console/css/style.css` 现有响应式样式之后追加以下完整 media 区块：

```css
@media (max-width: 768px) {
  .layout {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .layout-body {
    flex-direction: column;
    overflow: visible;
  }

  .layout-aside {
    width: 100%;
    flex: none;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .side-menu {
    display: flex;
    width: max-content;
    min-width: 100%;
    padding: 8px;
  }

  .side-menu li {
    flex: none;
  }

  .side-menu a {
    margin: 0 4px 0 0;
    white-space: nowrap;
  }

  .layout-main {
    width: 100%;
    min-width: 0;
    padding: 12px;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .login-col-left.login-console-main,
  .login-module.login-split,
  .panel.active {
    width: 100%;
    max-width: none;
  }
}
```

- [ ] **步骤 5：确认页面外壳通过（GREEN）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs shell
```

预期：退出码 0，并输出 `MOBILE_RESPONSIVE_VERIFY_PASS phase=shell`。

- [ ] **步骤 6：继续前用浏览器验证两个公开页面外壳**

在不改变依赖的前提下运行现有本地应用：

```powershell
npm run dev -- --host 127.0.0.1
```

在 430×932 下确认 `/login` 完整显示 Logo、表单、版权和公司名称。如果本地已有认证状态，则验证 `/wechat/visualConsole`；否则直接启动 `public/wechat-visual-console`，确认目录位于全宽主内容上方，并明确记录认证限制。

- [ ] **步骤 7：提交门禁**

仅在用户明确授权本次提交后执行：

```powershell
git add src/views/login/index.vue src/theme/media/login.scss src/views/wechat/visualConsole/index.vue public/wechat-visual-console/css/style.css
git diff --cached --check
git commit -m "前端：修复登录页和微信控制台移动布局"
```

---

### 任务 3：微信群试点卡片与嵌套成员卡片

**文件：**

- 修改：`src/views/wechat/group/index.vue:3-91`

**接口：**

- 使用 `list`、`loading`、`query`、`memberPanel(row)`、现有格式化函数、权限和操作处理函数。
- 产出已批准的基线 `data-mobile-view="wechat-group"`，在扩大迁移范围前验证共享模式。

- [ ] **步骤 1：确认微信群页面失败（RED）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs group
```

预期：退出码 1，并报告缺少 `<MobileRecordList`。

- [ ] **步骤 2：包裹现有筛选区和桌面表格**

在现有 `<el-card>` 内按以下方式包裹筛选区和表格：将现有 `el-form` 原样移入 `#filters`，将现有外层 `el-table` 原样移入 `#desktop`。

在现有查询表单前插入 `MobileRecordList` 和 `#filters` 开始标签；在现有 `</el-form>` 后插入 `</template><template #desktop>`；在现有外层 `</el-table>` 后插入 `</template>`，然后加入下方默认插槽。

```vue
<MobileRecordList
	:data="list"
	:loading="loading"
	row-key="id"
	filter-summary="全部机器人 · 全部状态"
	data-mobile-view="wechat-group"
>
	<template #default="{ row }">
		<div class="mobile-record-card__header">
			<div>
				<h3 class="mobile-record-card__title">{{ row.groupName }}</h3>
				<p class="mobile-record-card__subtitle">厅号 {{ row.hallNo || '-' }}</p>
			</div>
			<el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
		</div>
		<dl class="mobile-record-card__fields">
			<div><dt>绑定机器人</dt><dd>{{ row.robotName || '-' }}</dd></div>
			<div><dt>排档状态</dt><dd>{{ row.runningStatus === 1 ? '运行中' : '未启动' }}</dd></div>
			<div><dt>固定档</dt><dd>{{ row.fixedScheduleEnabled === 1 ? '已开启' : '未开启' }}</dd></div>
		</dl>
		<details class="mobile-record-card__details">
			<summary>查看完整信息</summary>
			<dl class="mobile-record-card__fields">
				<div><dt>微信群 wxid</dt><dd>{{ row.groupWxid || '-' }}</dd></div>
				<div><dt>机器人 appId</dt><dd>{{ row.appId || '-' }}</dd></div>
				<div><dt>默认平台</dt><dd>{{ platformName(row.defaultPlatformCode) }}</dd></div>
				<div><dt>默认厅</dt><dd>{{ hallName(row.defaultHallId) }}</dd></div>
				<div><dt>备注</dt><dd>{{ row.remark || '-' }}</dd></div>
			</dl>
			<div v-if="canListMembers" class="member-mobile-cards">
				<el-button :loading="memberPanel(row).loading" @click="loadMembers(row, true)">加载群成员</el-button>
				<article v-for="member in memberPanel(row).list" :key="member.wxid" class="mobile-record-card">
					<strong>{{ member.displayName || member.nickName || '-' }}</strong>
					<dl class="mobile-record-card__fields">
						<div><dt>wxid</dt><dd>{{ member.wxid }}</dd></div>
						<div><dt>状态</dt><dd>{{ member.isPresent ? '在群' : '已离群' }}</dd></div>
						<div><dt>邀请人</dt><dd>{{ member.inviterUserName || '-' }}</dd></div>
						<div><dt>角色</dt><dd>{{ member.roles?.join('、') || '-' }}</dd></div>
					</dl>
				</article>
			</div>
		</details>
		<div class="mobile-record-card__actions">
			<el-button v-if="canViewRobotConfig" v-auth="'api/v1/system/wechatRobotGroup/configOverview'" type="primary" @click="openRobotConfig(row)">配置</el-button>
			<el-button v-auth="'api/v1/system/wechatRobotGroup/edit'" @click="openEdit(row)">编辑</el-button>
			<el-dropdown>
				<el-button>更多</el-button>
				<template #dropdown>
					<el-dropdown-menu>
						<el-dropdown-item><el-button v-auth-all="['api/v1/system/wechatRobotGroup/adminList', 'api/v1/system/wechatRobotGroup/queuePolicy']" text @click="openPolicy(row)">管理员与排麦策略</el-button></el-dropdown-item>
						<el-dropdown-item><el-button v-auth="'api/v1/system/wechatRobotGroup/status'" text @click="handleToggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button></el-dropdown-item>
						<el-dropdown-item><el-button v-auth="'api/v1/system/wechatRobotGroup/runningStatus'" text @click="toggleRunning(row)">{{ row.runningStatus === 1 ? '停止排档' : '启动排档' }}</el-button></el-dropdown-item>
					</el-dropdown-menu>
				</template>
			</el-dropdown>
		</div>
	</template>
</MobileRecordList>
```

现有共享 `<pagination>` 保持在 `</MobileRecordList>` 之后。

- [ ] **步骤 3：确认微信群页面通过（GREEN）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs group
```

预期：退出码 0，并输出 `MOBILE_RESPONSIVE_VERIFY_PASS phase=group`。

- [ ] **步骤 4：迁移其他页面前先用浏览器验证试点**

在 430×932 下确认：筛选区可以展开、卡片不溢出、完整信息可以展开、加载成员不会再次请求群列表、权限与桌面一致、分页只触发一次现有 `loadList`。

- [ ] **步骤 5：提交门禁**

仅在用户明确授权本次提交后执行：

```powershell
git add src/views/wechat/group/index.vue
git diff --cached --check
git commit -m "前端：将微信群移动列表改为卡片展示"
```

---

### 任务 4：其余业务列表卡片

**文件：**

- 修改：`src/views/anchor/manage/index.vue`
- 修改：`src/views/anchor/manage/component/anchorList.vue`
- 修改：`src/views/wechat/message/index.vue`
- 修改：`src/views/wechat/template/index.vue`
- 修改：`src/views/wechat/account/index.vue`
- 修改：`src/views/wechat/scheduleDuration/index.vue`
- 修改：`src/views/anchor/mic/index.vue`
- 修改：`src/views/anchor/mic/component/micList.vue`

**接口：**

- 每个页面使用下表中已经加载的数据集合，并保留原有分页和操作处理函数。
- 每个页面提供一个手机卡片插槽，严格匹配下方字段/操作映射。

| 标记 | 数据 / 行键 | 标题区 | 默认字段 | 展开字段 | 操作 |
|---|---|---|---|---|---|
| `anchor-list` | `tableData.data` / `profileId` | `nickname`、`bindingText[bindingStatus]` | `wechatNickname`、`memberWxid`、群、资料完整度 | `bindings`、厅、`mobile`、`updatedAt` | `openEditDialog`、`openBankCardDialog`、现有 `runBatch` 操作 |
| `wechat-message` | `list` / `id` | 接收时间、状态 | `groupName`、`senderWxid`、`content`、`replyContent` | `commandName`、`errorMessage`、完整消息内容 | `openDetail(row.id)` |
| `wechat-template` | `list` / 稳定的命令或群标识 | `commandName`、群状态 | 触发/命令、范围类型、场景数量、生效群 | 场景和 `updatedAt` | `openEdit`、`toggleStatus`、`resetPublic` 或 `deleteGroup` |
| `wechat-account` | `list` / `id` | `robotName`、在线/状态/默认标签 | `appId`、`wxid`、`wechatNo`、`nickname` | `updatedAt`、`remark` | `openEdit`、`handleDefault`、`handleToggleStatus` |
| `schedule-duration` | `details` / `id` | `memberName`、状态 | 统计日期/群、`enteredAt-leftAt`、分钟/来源 | `memberWxid`、`lastReason` | `openDetail`、`openEdit`、按现有条件显示 `voidRecord` |
| `anchor-mic` | `tableData.data` / `id`，缺失时回退序号 | `nickname`、`statDate` | `hallName`、`hostSlots`、`shiftSlots`、`totalHours/jobCount` | `hostHours`、`shiftHours`、`remark` | `openEditDialog` |

- [ ] **步骤 1：确认业务列表失败（RED）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs business
```

预期：退出码 1，并指出第一个缺少的 `data-mobile-view` 标记。

- [ ] **步骤 2：使用完整统一的插槽结构改造各页面**

对每个文件，将现有筛选表单移入 `#filters`，将现有表格原样移入 `#desktop`，分页保持在组件之后。使用以下准确组件声明：

```vue
<MobileRecordList :data="tableData.data" row-key="profileId" data-mobile-view="anchor-list">
<MobileRecordList :data="list" :loading="loading" row-key="id" data-mobile-view="wechat-message">
<MobileRecordList :data="list" :loading="loading" data-mobile-view="wechat-template">
<MobileRecordList :data="list" :loading="loading" row-key="id" data-mobile-view="wechat-account">
<MobileRecordList :data="details" :loading="loading" row-key="id" data-mobile-view="schedule-duration">
<MobileRecordList :data="tableData.data" row-key="id" data-mobile-view="anchor-mic">
```

按照组件契约，为每个声明补齐 `filters`、`desktop` 和默认插槽。默认插槽必须依据映射表显式编写 `<div><dt>…` 字段行，不在 script 中创建字段数组，保证权限和格式化行为在模板中可直接审计。

`anchor/manage/index.vue` 和 `anchor/mic/index.vue` 由父组件管理筛选条件，数据则由子组件管理。两个父组件都新增 `const mobileFilterOpen = ref(false);`，在现有表单前放置以下按钮，并使用下方容器包裹表单：

```vue
<el-button class="mobile-record-list__filter-toggle" @click="mobileFilterOpen = !mobileFilterOpen">
	<el-icon><ele-Filter /></el-icon><span>筛选条件</span><el-icon><ele-ArrowDown v-if="!mobileFilterOpen" /><ele-ArrowUp v-else /></el-icon>
</el-button>
<div :class="['mobile-record-list__filter-content', { 'is-open': mobileFilterOpen }]">
</div>
```

在父组件完整现有 `el-form` 前插入开始 `<div>`，在表单后插入 `</div>`。共享组件的全局响应式样式在桌面隐藏按钮并保持表单可见，在手机端则折叠表单。

`anchorList.vue` 使用以下准确手机插槽：

```vue
<template #default="{ row }">
	<div class="mobile-record-card__header">
		<div><h3 class="mobile-record-card__title">{{ row.nickname }}</h3><p class="mobile-record-card__subtitle">{{ row.wechatNickname || '-' }}</p></div>
		<el-tag :type="row.bindingStatus === 'BOUND' ? 'success' : 'warning'">{{ bindingText[row.bindingStatus] || row.bindingStatus }}</el-tag>
	</div>
	<dl class="mobile-record-card__fields">
		<div><dt>wxid</dt><dd>{{ row.memberWxid || '未关联微信' }}</dd></div>
		<div><dt>微信群</dt><dd>{{ row.groups?.map((item) => item.groupName).join('、') || '-' }}</dd></div>
		<div><dt>资料</dt><dd>{{ row.profileCompleteness === 'COMPLETE' ? '已完善' : '待完善' }}</dd></div>
	</dl>
	<details class="mobile-record-card__details"><summary>查看完整信息</summary><dl class="mobile-record-card__fields"><div><dt>平台</dt><dd>{{ row.bindings?.map((item) => item.platformName || item.platformCode).join('、') || '待绑定' }}</dd></div><div><dt>主播ID</dt><dd>{{ row.bindings?.map((item) => item.anchorId).join('、') || '待绑定' }}</dd></div><div><dt>所属厅</dt><dd>{{ row.bindings?.map((item) => item.hallName || item.hallId).join('、') || '-' }}</dd></div><div><dt>手机号</dt><dd>{{ row.mobile || '-' }}</dd></div><div><dt>更新时间</dt><dd>{{ row.updatedAt || '-' }}</dd></div></dl></details>
	<div class="mobile-record-card__actions"><el-button type="primary" @click="openEditDialog(row)">编辑</el-button><el-button v-if="row.bindings?.length" @click="openBankCardDialog(row.bindings[0])">工资卡</el-button><el-dropdown><el-button>更多</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item v-if="row.recordType === 'PROFILE' && row.recordState === 'ACTIVE'"><el-button v-auth="'api/v1/system/anchor/profile/batchDelete'" text type="danger" @click="runBatch('DELETE', [row.profileId])">删除</el-button></el-dropdown-item><el-dropdown-item v-if="row.recordType === 'PROFILE' && row.recordState === 'ACTIVE'"><el-button v-auth="'api/v1/system/anchor/profile/batchIgnore'" text @click="runBatch('IGNORE', [row.profileId])">忽略</el-button></el-dropdown-item><el-dropdown-item v-if="row.recordState === 'IGNORED'"><el-button v-auth="'api/v1/system/anchor/profile/batchCancelIgnore'" text @click="runBatch('CANCEL_IGNORE', [row.profileId])">取消忽略</el-button></el-dropdown-item></el-dropdown-menu></template></el-dropdown></div>
</template>
```

其余五个页面同样显式编写模板，字段表达式和操作必须严格来自映射表及当前桌面列。

- [ ] **步骤 3：确认每个原始字段仍可访问**

逐页对比桌面列标题与卡片默认字段、展开字段；两部分合并后必须覆盖除选择列和序号列外的全部桌面列。逐一对比桌面操作按钮、权限条件与卡片操作区，集合必须一致。

- [ ] **步骤 4：确认业务列表通过（GREEN）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs business
```

预期：退出码 0，并输出 `MOBILE_RESPONSIVE_VERIFY_PASS phase=business`。

- [ ] **步骤 5：在 430×932 下用浏览器验证六个页面**

确认页面没有全局横向溢出，长标识可以换行，`<details>` 能展示全部次要字段，各操作打开与桌面相同的对话框或确认框。不得确认破坏性操作，只验证到确认框出现为止。

- [ ] **步骤 6：提交门禁**

仅在用户明确授权本次提交后执行：

```powershell
git add src/views/anchor/manage/index.vue src/views/anchor/manage/component/anchorList.vue src/views/wechat/message/index.vue src/views/wechat/template/index.vue src/views/wechat/account/index.vue src/views/wechat/scheduleDuration/index.vue src/views/anchor/mic/index.vue src/views/anchor/mic/component/micList.vue
git diff --cached --check
git commit -m "前端：迁移业务列表为移动端卡片展示"
```

---

### 任务 5：监控卡片与机器人配置内部响应式布局

**文件：**

- 修改：`src/views/wechat/monitor/index.vue:73-130, 373-379`
- 修改：`src/views/wechat/robotConfig/index.vue:6-122, 245-256`

**接口：**

- 监控账号卡片使用 `overview.accounts`；事件卡片使用 `eventList` 和现有格式化函数。
- 机器人配置保留 `selectedGroupId`、全部 tab key、保存处理函数、权限判断、审计 drawer 和表格数据源。

- [ ] **步骤 1：确认监控页面失败（RED）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs monitor
```

预期：退出码 1，并指出缺少的监控标记。

- [ ] **步骤 2：改造监控账号表和事件表**

分别使用独立的 `MobileRecordList` 包裹两个表格：

```vue
<MobileRecordList :data="overview.accounts" :loading="overviewLoading" row-key="id" data-mobile-view="wechat-monitor-accounts">
	<template #default="{ row }">
		<div class="mobile-record-card__header">
			<h3 class="mobile-record-card__title">{{ row.robotName }}</h3>
			<el-tag :type="healthTagType(row.healthStatus)">{{ healthLabel(row.healthStatus) }}</el-tag>
		</div>
		<dl class="mobile-record-card__fields">
			<div><dt>微信号</dt><dd>{{ row.wechatNo || '-' }}</dd></div>
			<div><dt>连续失败</dt><dd>{{ row.consecutiveFailures }}</dd></div>
			<div><dt>最后检查</dt><dd>{{ formatTime(row.lastCheckedAt) }}</dd></div>
			<div><dt>Callback</dt><dd>{{ formatTime(row.callbackConfiguredAt) }}</dd></div>
		</dl>
		<details class="mobile-record-card__details"><summary>查看完整状态</summary><dl class="mobile-record-card__fields"><div><dt>离线时长</dt><dd>{{ formatDuration(row.offlineSince) }}</dd></div><div><dt>最后重连</dt><dd>{{ formatTime(row.lastReconnectAt) }}</dd></div><div><dt>Callback 错误</dt><dd>{{ row.callbackError || '-' }}</dd></div></dl></details>
	</template>
</MobileRecordList>

<MobileRecordList :data="eventList" :loading="eventsLoading" row-key="id" data-mobile-view="wechat-monitor-events">
	<template #default="{ row }">
		<div class="mobile-record-card__header"><h3 class="mobile-record-card__title">{{ eventTypeLabel(row.eventType) }}</h3><el-tag :type="row.status === 'OPEN' ? 'danger' : 'success'">{{ row.status === 'OPEN' ? '未恢复' : '已恢复' }}</el-tag></div>
		<dl class="mobile-record-card__fields"><div><dt>机器人</dt><dd>{{ row.robotName }}</dd></div><div><dt>发生时间</dt><dd>{{ formatTime(row.startedAt) }}</dd></div><div><dt>摘要</dt><dd>{{ row.message || '-' }}</dd></div></dl>
		<details class="mobile-record-card__details"><summary>查看事件详情</summary><dl class="mobile-record-card__fields"><div><dt>恢复时间</dt><dd>{{ formatTime(row.resolvedAt) }}</dd></div><div><dt>通知状态</dt><dd>{{ row.notifyStatus || '-' }}</dd></div><div><dt>通知错误</dt><dd>{{ row.notifyError || '-' }}</dd></div></dl></details>
	</template>
</MobileRecordList>
```

事件分页保持在第二个组件外部。

- [ ] **步骤 3：修复机器人配置标题区、页签、长值、抽屉和嵌套表格**

在页面根元素上增加 `mobile-robot-config`。每个嵌套表格都使用其桌面表格已有的行数据和操作增加手机卡片替代视图，并追加以下样式：

```scss
@media (max-width: 768px) {
	.mobile-robot-config {
		.header-actions,
		.panel-heading,
		.scenario-header,
		.admin-toolbar {
			width: 100%;
			align-items: stretch;
			flex-direction: column;
		}

		.header-actions :deep(.el-select),
		.template-toolbar,
		.exception-form {
			width: 100%;
			grid-template-columns: minmax(0, 1fr);
		}

		.config-tabs :deep(.el-tabs__nav-scroll) {
			overflow-x: auto;
		}

		.overview-status :deep(td),
		.overview-status :deep(.el-descriptions__content) {
			overflow-wrap: anywhere;
		}

		:deep(.el-drawer) {
			width: 100% !important;
		}
	}
}
```

每个桌面嵌套表格都在同级增加手机卡片区，复用相同数据集合和现有操作处理函数。必须覆盖 `specialList`、`schedulePlan.rows`、`activeReports`、`permissionAdmins`、`reminderConfigs`、`filteredTemplateCommands`，以及 `planAudits`、`reportAudits`、`templateAudits`、`permissionAudits` 四个审计集合。

- [ ] **步骤 4：确认监控页面通过（GREEN）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs monitor
```

预期：退出码 0，并输出 `MOBILE_RESPONSIVE_VERIFY_PASS phase=monitor`。

- [ ] **步骤 5：在不写生产数据的前提下验证页签、保存入口和抽屉**

在 430×932 下确认所有 tab 均可到达、群选择器完整显示、长 wxid 可换行、嵌套卡片字段完整、drawer 占满宽度。只读浏览器验证期间不得保存、发放、取消、删除或重置任何内容。

- [ ] **步骤 6：提交门禁**

仅在用户明确授权本次提交后执行：

```powershell
git add src/views/wechat/monitor/index.vue src/views/wechat/robotConfig/index.vue
git diff --cached --check
git commit -m "前端：适配监控和机器人配置移动布局"
```

---

### 任务 6：标准系统列表卡片

**文件：**

- 修改：`src/views/system/config/index.vue`
- 修改：`src/views/system/menu/index.vue`
- 修改：`src/views/system/role/index.vue`
- 修改：`src/views/system/dept/index.vue`
- 修改：`src/views/system/post/index.vue`
- 修改：`src/views/system/monitor/loginLog/index.vue`
- 修改：`src/views/system/monitor/operLog/index.vue`
- 修改：`src/views/system/monitor/userOnline/index.vue`
- 修改：`src/views/system/tools/gen/index.vue`
- 修改：`src/views/system/sysJob/list/index.vue`

**接口：**

| 标记 | 数据集合 / 行键 | 标题/状态 | 默认字段 | 展开字段 | 现有操作 |
|---|---|---|---|---|---|
| `system-config` | `tableData.data` / `configId` | `configName` / `configType` | `configKey`、`configValue`、`remark` | `createdAt` | 修改、删除 |
| `system-menu` | `menuTableData` / `path` | `meta.title` 或 `name` / 菜单类型 | `path`、`component`、`apiUrl`、状态 | 排序、显示状态、子菜单 | 新增下级、修改、删除 |
| `system-role` | `tableData.data` / 默认 id 或序号 | `name` / 状态 | 排序、`userCnt`、`remark` | `createTime` | 修改、授权/数据范围、删除 |
| `system-dept` | `tableData.data` / `deptId` | `deptName` / 状态 | `orderNum`、`createdAt`、子部门数量 | 上级部门信息 | 新增下级、修改、删除 |
| `system-post` | `tableData.data` / `postId` | `postName` / 状态 | `postCode`、排序、`remark` | `createTime` | 修改、删除 |
| `login-log` | `tableData.data` / `infoId` | `loginName` / 状态 | `loginTime`、`ipaddr`、`loginLocation`、浏览器/系统 | `msg`、`module` | 删除 |
| `operation-log` | `tableData.data` / `operId` | `title` / 状态 | `operName`、`requestMethod`、`operTime`、`operUrl` | 请求/响应/`operLocation`/错误 | 详情、删除 |
| `online-user` | `tableData.data` / `uuid` | `userName` / 在线状态 | `ip`、`explorer`、`os`、`createTime` | `uuid` | 强制退出 |
| `code-generator` | `tableData.data` / `tableId` | `tableName` | `tableComment`、`className`、`createTime`、`updateTime` | 完整元数据 | 预览、编辑、同步、生成、删除 |
| `system-job` | `tableData.data` / `jobId` | `jobName` / 状态 | `jobGroup`、`invokeTarget`、`cronExpression`、`misfirePolicy` | 完整任务元数据 | 详情、修改、执行、删除 |

- [ ] **步骤 1：确认系统列表失败（RED）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs system
```

预期：退出码 1，并指出第一个缺少的系统标记。

- [ ] **步骤 2：为十个页面显式增加手机卡片插槽**

对每个文件，将现有筛选区移入 `#filters`，将现有表格原样移入 `#desktop`，分页保持在 `MobileRecordList` 外部，并根据映射表在默认插槽中显式编写 `<dl>` 字段行。菜单和部门卡片在存在层级值时使用该值缩进子卡片，保持树关系可见；不得扁平化或修改源集合。保留全部现有 `v-auth`、`v-if`、禁用状态和确认处理函数。使用以下准确声明：

```vue
<MobileRecordList :data="tableData.data" row-key="configId" data-mobile-view="system-config">
<MobileRecordList :data="menuTableData" row-key="path" data-mobile-view="system-menu">
<MobileRecordList :data="tableData.data" data-mobile-view="system-role">
<MobileRecordList :data="tableData.data" row-key="deptId" data-mobile-view="system-dept">
<MobileRecordList :data="tableData.data" row-key="postId" data-mobile-view="system-post">
<MobileRecordList :data="tableData.data" row-key="infoId" data-mobile-view="login-log">
<MobileRecordList :data="tableData.data" row-key="operId" data-mobile-view="operation-log">
<MobileRecordList :data="tableData.data" row-key="uuid" data-mobile-view="online-user">
<MobileRecordList :data="tableData.data" row-key="tableId" data-mobile-view="code-generator">
<MobileRecordList :data="tableData.data" row-key="jobId" data-mobile-view="system-job">
```

在 `mobile-record-card__actions` 中直接写出各页面现有按钮和处理函数调用，使权限指令保持声明式并可审计。破坏性操作放入主操作和次操作之后的 `el-dropdown`。

- [ ] **步骤 3：对比桌面列、卡片字段和操作集合**

实施时逐个文件列出桌面列标题，确认每个标题都出现在卡片默认区或展开区；同时确认卡片操作集合与桌面操作列完全一致。

- [ ] **步骤 4：确认系统列表通过（GREEN）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs system
```

预期：退出码 0，并输出 `MOBILE_RESPONSIVE_VERIFY_PASS phase=system`。

- [ ] **步骤 5：在 430×932 下验证卡片页和树页面**

检查全部十个路由。确认菜单和部门层级仍可理解、分页不会重复请求、长 URL/cron 表达式可以换行、破坏性操作只验证到现有确认框出现为止。

- [ ] **步骤 6：提交门禁**

仅在用户明确授权本次提交后执行：

```powershell
git add src/views/system/config/index.vue src/views/system/menu/index.vue src/views/system/role/index.vue src/views/system/dept/index.vue src/views/system/post/index.vue src/views/system/monitor/loginLog/index.vue src/views/system/monitor/operLog/index.vue src/views/system/monitor/userOnline/index.vue src/views/system/tools/gen/index.vue src/views/system/sysJob/list/index.vue
git diff --cached --check
git commit -m "前端：迁移系统列表为移动端卡片展示"
```

---

### 任务 7：字典管理与用户管理双栏布局

**文件：**

- 修改：`src/views/system/dict/index.vue`
- 修改：`src/views/system/dict/dataList.vue`
- 修改：`src/views/system/user/index.vue`
- 修改：`src/views/system/user/component/userList.vue`

**接口：**

- 字典选择继续驱动 `selectedTypeCode` 和现有数据视图加载。
- 部门选择继续驱动现有用户查询和用户列表加载。
- 不复制树数据或选择状态。

- [ ] **步骤 1：确认双栏页面失败（RED）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs twoColumn
```

预期：退出码 1，并指出缺少 `mobile-dict-layout`。

- [ ] **步骤 2：将字典类型树叠放在字典卡片上方**

在现有字典布局容器上增加 `mobile-dict-layout`，并追加 scoped 样式：

```scss
@media (max-width: 768px) {
	.mobile-dict-layout {
		display: grid !important;
		grid-template-columns: minmax(0, 1fr) !important;
		gap: 12px;

		.dict-tree-panel,
		.dict-data-panel {
			width: 100% !important;
			min-width: 0;
		}

		.dict-tree-panel {
			max-height: 320px;
			overflow-y: auto;
		}
	}
}
```

将新前缀样式类添加到现有真实树区域和数据区域容器，不重命名处理函数或 ref。

在 `dataList.vue` 中使用带 `data-mobile-view="system-dict"` 的 `MobileRecordList` 包裹现有筛选区和表格。标题使用 `dictLabel` 和状态；默认字段使用 `dictCode`、`dictValue`、`dictSort`；展开字段使用 `dictType`、`createTime` 和完整状态信息；操作仍为 `onOpenEditDic`、`onRowDel`。

- [ ] **步骤 3：将部门树叠放在用户卡片上方**

在当前用户页面布局容器上增加 `mobile-user-layout`，并追加：

```scss
@media (max-width: 768px) {
	.mobile-user-layout {
		display: grid !important;
		grid-template-columns: minmax(0, 1fr) !important;
		gap: 12px;

		.user-dept-panel,
		.user-list-panel {
			width: 100% !important;
			min-width: 0;
		}

		.user-dept-panel {
			max-height: 320px;
			overflow-y: auto;
		}
	}
}
```

将前缀样式类添加到现有部门区域和列表区域，不改变其 ref 或事件。

在 `userList.vue` 中使用带 `data-mobile-view="system-user"` 的 `MobileRecordList`。标题区显示账号/用户昵称和状态；默认字段显示部门、角色、脱敏手机号、创建时间；展开区包含其余全部桌面列；修改、删除、重置操作保留原有指令和确认流程。

- [ ] **步骤 4：确认双栏页面通过（GREEN）**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs twoColumn
```

预期：退出码 0，并输出 `MOBILE_RESPONSIVE_VERIFY_PASS phase=twoColumn`。

- [ ] **步骤 5：用浏览器验证树选择和列表刷新**

在 430×932 下分别选择字典类型和部门。确认对应卡片列表只刷新一次、已选树节点保持可见、两个树区域可独立滚动，并且页面没有全局横向溢出。

- [ ] **步骤 6：提交门禁**

仅在用户明确授权本次提交后执行：

```powershell
git add src/views/system/dict/index.vue src/views/system/dict/dataList.vue src/views/system/user/index.vue src/views/system/user/component/userList.vue
git diff --cached --check
git commit -m "前端：适配字典和用户管理移动布局"
```

---

### 任务 8：最终结构、构建与浏览器矩阵验证

**文件：**

- 验证本计划列出的全部文件。
- 不创建第二份报告或重复检查清单。

**接口：**

- 使用前面全部已完成任务的结果。
- 只产出本地技术证据，不代表发布或生产验收。

- [ ] **步骤 1：运行完整结构验证器**

运行：

```powershell
node .\scripts\verify-mobile-responsive.mjs all
```

预期：退出码 0，并输出 `MOBILE_RESPONSIVE_VERIFY_PASS phase=all`。

- [ ] **步骤 2：检查新增/untracked 文件和完整 diff**

运行：

```powershell
git status --short
git diff --check
rg -n "TO[D]O|FIX[M]E|HA[C]K|<{7}|={7}|>{7}" scripts src public
```

预期：只有计划内文件处于 modified/untracked 状态；不存在空白错误、占位符或冲突标记。

- [ ] **步骤 3：运行唯一一次完整编译验证**

运行：

```powershell
npm run build
```

预期：退出码 0，Vite 构建成功。除非此结果之后代码、配置、依赖或 fixture 输入发生变化，否则不得重复运行构建。

- [ ] **步骤 4：本地验证手机端公开页面和登录页外壳**

以只读方式启动最新 `dist`：

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory .\dist
```

在 390×844 和 430×932 下验证登录页及无需认证的页面外壳，随后停止服务。

- [ ] **步骤 5：使用用户提供的本地登录态验证全部已认证路由**

使用浏览器在两个目标尺寸下覆盖设计文档第 5 节列出的每个路由。逐路由记录：无全局横向溢出、卡片标题/状态可见、默认字段可见、完整字段可展开、操作可达、分页可达、无控制台错误。如果本地认证不可用，停止并将已认证页面本地验证报告为 `BLOCKED`；不得复制或检查生产 cookie/session storage。

- [ ] **步骤 6：桌面回归抽查**

在 1440×900 下验证 `/login`、`/wechat/group`、`/wechat/robotConfig`、`/system/dict/type/list`、`/system/auth/user/list`，确认现有桌面表单、表格、双栏布局和操作按钮保持不变。

- [ ] **步骤 7：记录证据边界**

报告内容：

- 命令、退出码和关键数量。
- 手机路由的通过、失败或阻塞状态。
- 桌面路由的通过、失败或阻塞状态。
- 本地认证限制。
- 准确文件清单和用户改动边界。
- branch、HEAD、tracked/untracked/staged/commit 状态。
- `发布状态：未发布`，`回滚：未执行/不适用`。

- [ ] **步骤 8：最终提交门禁**

如果验证专用文件发生变化，提交前必须申请明确授权；否则不得创建空提交或仅为“完成”而创建文档提交。

---

## 计划自检结果

- 设计覆盖：23 个唯一草图均映射到实施任务；字典管理和用户管理只在各自双栏专项任务中实现一次。
- 范围检查：不修改 API 调试空白页和 Swagger URL。
- 依赖检查：不引入依赖或测试框架。
- 类型/接口检查：所有任务统一使用 `MobileRecordList` 的稳定属性/插槽契约。
- 验证检查：每个实施阶段都有明确失败（RED）命令、通过（GREEN）命令和浏览器门禁；完整构建仅在最后运行一次。
- Git/发布检查：每次提交都保持独立授权门禁；计划中不存在发布操作。
