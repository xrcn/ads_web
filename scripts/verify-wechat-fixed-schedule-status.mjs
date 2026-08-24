import fs from 'node:fs';

const view = fs.readFileSync(new URL('../src/views/wechat/group/index.vue', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');

const requiredView = [
	"auth('api/v1/system/wechatRobotGroup/fixedSchedule')",
	"auth('api/v1/system/wechatRobotGroup/fixedScheduleSave')",
	'row.fixedScheduleEnabled',
	'固定档',
	'toggleFixedSchedule',
];
for (const token of requiredView) {
	if (!view.includes(token)) throw new Error(`missing fixed schedule UI token: ${token}`);
}
for (const token of ['/fixedSchedule', '/fixedScheduleSave']) {
	if (!api.includes(token)) throw new Error(`missing fixed schedule API token: ${token}`);
}
console.log('PASS: fixed schedule state and control are visible');
