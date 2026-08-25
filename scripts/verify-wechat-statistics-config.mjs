import fs from 'node:fs';

const view = fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');

for (const token of [
	'统计总开关', 'showMemberMinutes', 'showRoundCount', 'showEntryType',
	'showHostMinutes', 'showTotalMinutes', 'showDetails', 'showTaskList',
	'效果预览', '打卡统计配置审计', '保存本页',
	'api/v1/system/wechatRobotGroup/statisticsConfig',
	'api/v1/system/wechatRobotGroup/statisticsConfigSave',
	'api/v1/system/wechatRobotGroup/statisticsConfigAudit',
]) {
	if (!view.includes(token) && !api.includes(token)) throw new Error(`statistics config missing ${token}`);
}

console.log('wechat statistics config verified');
