import fs from 'node:fs';

const view = fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');

for (const token of [
	'报备回厅', 'maxReportCount', 'reportMinutes', 'startText', 'endText',
	'当前 ACTIVE 报备', '提前关闭', '关闭原因', '报备配置审计',
	'api/v1/system/wechatRobotGroup/reportConfig',
	'api/v1/system/wechatRobotGroup/reportConfigSave',
	'api/v1/system/wechatRobotGroup/activeReports',
	'api/v1/system/wechatRobotGroup/reportClose',
	'api/v1/system/wechatRobotGroup/reportConfigAudit',
]) {
	if (!view.includes(token) && !api.includes(token)) throw new Error(`report config missing ${token}`);
}

console.log('wechat report config verified');
