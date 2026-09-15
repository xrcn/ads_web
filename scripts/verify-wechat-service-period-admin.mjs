import fs from 'node:fs';

const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');
const view = fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url), 'utf8');

for (const token of [
	'/api/v1/system/wechatRobotGroup/servicePeriodSave',
	'saveWechatRobotGroupServicePeriod',
	"mode: 'SET' | 'ADD'",
]) {
	if (!api.includes(token)) throw new Error(`missing service-period API ${token}`);
}

for (const token of [
	"auth('api/v1/system/wechatRobotGroup/servicePeriodSave')",
	'管理服务期',
	'设置会覆盖当前服务期',
	'追加会从当前有效期结束时间继续计算',
	'openingMissing',
	'servicePeriodSaving',
	'servicePeriodRequestGeneration',
	'generation !== servicePeriodRequestGeneration',
	'overviewRequestGeneration',
	'requestGeneration !== overviewRequestGeneration',
	"typeof servicePeriodForm.days !== 'number'",
	'Number.isInteger(servicePeriodForm.days)',
	'await loadOverview()',
	'overview.groupStatus !== 1',
	'请先启用微信群',
]) {
	if (!view.includes(token)) throw new Error(`missing service-period UI ${token}`);
}

if (view.includes('type="datetime"') || view.includes('datetime-range')) {
	throw new Error('exact datetime editing is outside scope');
}
if (view.includes('@change="loadOverview"')) {
	throw new Error('group overview must load from the selectedGroupId watcher only');
}

console.log('wechat service-period admin UI verified');
