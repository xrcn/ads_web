import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const api = read('src/api/system/flowData.ts');
const anchorApi = read('src/api/anchor/index.ts');
const login = read('src/views/flowData/login/index.vue');
const income = read('src/views/flowData/anchorIncome/index.vue');
const daily = read('src/views/flowData/daily/index.vue');
const tasks = read('src/views/flowData/tasks/index.vue');
const progress = read('src/components/vvSyncProgress/index.vue');
const hall = read('src/views/anchor/hall/index.vue');
const anchors = read('src/views/anchor/manage/index.vue');

for (const [source, needle] of [
	[api, '/api/v1/system/vvAuth/status'],
	[api, '/api/v1/system/flowData/anchorIncome/sync'],
	[api, '/api/v1/system/flowData/anchorIncome/list'],
	[api, '/api/v1/system/flowData/progress'],
	[progress, 'setInterval'],
	[progress, 'onUnmounted'],
	[progress, 'onDeactivated'],
	[progress, 'pollingEnabled = false'],
	[progress, 'if (!pollingEnabled) return'],
	[progress, 'catch {'],
	[progress, "!props.active && progress.status !== 'RUNNING'"],
	[progress, '{{ progress.current }}/{{ progress.total }}'],
	[progress, '上次同步已完成'],
	[progress, 'v-if="visible && progress.status"'],
	[progress, "progress.status === 'RUNNING'"],
	[progress, 'visible.value = false'],
	[income, 'sync-type="ANCHOR_INCOME"'],
	[daily, 'sync-type="HALL_DATA"'],
	[tasks, 'sync-type="HALL_DATA"'],
	[anchors, 'sync-type="ANCHOR_LIST"'],
	[anchorApi, '/api/v1/system/anchor/vvSync'],
	[login, 'type="password"'],
	[login, '当前登录状态'],
	[login, '.vv-login-container :deep(.el-card) { min-height: 0; }'],
	[income, '同步主播收益'],
	[income, 'label="所属厅"'],
	[income, 'placeholder="全部厅"'],
	[income, 'type="daterange"'],
	[income, 'dateRange.value ?? []'],
	[income, '>重置</el-button>'],
	[daily, 'label="所属厅"'],
	[daily, 'placeholder="全部厅"'],
	[daily, 'type="daterange"'],
	[daily, 'dateRange.value ?? []'],
	[daily, '>重置</el-button>'],
	[daily, 'prop="rank"'],
	[daily, 'prop="roomId"'],
	[daily, 'prop="enterRoomNewUser24h"'],
	[daily, 'prop="roomPayNewUser24h"'],
	[daily, 'prop="newUserTotalFlow24h"'],
	[tasks, 'label="所属厅"'],
	[tasks, 'placeholder="全部厅"'],
	[tasks, 'type="daterange"'],
	[tasks, 'dateRange.value ?? []'],
	[tasks, '>重置</el-button>'],
	[tasks, 'prop="hallId"'],
	[tasks, 'prop="roomId"'],
	[hall, '健康分'],
	[hall, 'getFlowDataScoreLogs'],
	[anchors, '同步主播'],
	[anchors, '最近成功同步时间'],
	[anchors, '未变化'],
	[anchors, '未返回'],
	[anchors, '冲突'],
]) {
	if (!source.includes(needle)) throw new Error(`missing VV data page contract: ${needle}`);
}
if (anchors.includes('当前 VV 登录状态')) throw new Error('anchor list must not expose VV login status');
for (const [source, title] of [[income, '主播收益'], [daily, '厅每日流水'], [tasks, '厅任务流水数据']]) {
	if (source.includes(`<span>${title}</span>`)) throw new Error(`flow data card repeats page title: ${title}`);
}
console.log('VV data pages verifier passed');
