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
const hall = read('src/views/anchor/hall/index.vue');
const anchors = read('src/views/anchor/manage/index.vue');

for (const [source, needle] of [
	[api, '/api/v1/system/vvAuth/status'],
	[api, '/api/v1/system/flowData/anchorIncome/sync'],
	[api, '/api/v1/system/flowData/anchorIncome/list'],
	[anchorApi, '/api/v1/system/anchor/vvSync'],
	[login, 'type="password"'],
	[login, '当前登录状态'],
	[login, '.vv-login-container :deep(.el-card) { min-height: 0; }'],
	[income, '同步主播收益'],
	[daily, '厅每日流水'],
	[daily, 'prop="rank"'],
	[daily, 'prop="roomId"'],
	[daily, 'prop="enterRoomNewUser24h"'],
	[daily, 'prop="roomPayNewUser24h"'],
	[daily, 'prop="newUserTotalFlow24h"'],
	[tasks, '厅任务流水数据'],
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
console.log('VV data pages verifier passed');
