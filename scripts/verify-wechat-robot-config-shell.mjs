import fs from 'node:fs';

const viewFile = new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url);
if (!fs.existsSync(viewFile)) throw new Error('robot config view is missing');
const source = fs.readFileSync(viewFile, 'utf8');
for (const token of [
	'微信群机器人配置',
	'基础信息',
	'麦序规则',
	'定时排档',
	'固定档与主持',
	'报备回厅',
	'打卡统计',
	'扣排模式',
	'权限与提醒',
	'模板与口令',
	'api/v1/system/wechatRobotGroup/configOverview',
	'route.query.groupId',
]) {
	if (!source.includes(token)) throw new Error(`robot config shell missing ${token}`);
}
if (source.includes('保存全部')) throw new Error('phase1 must not expose a global save');
for (const token of ["name: 'queueMode'", '普通模式', 'p / P / 排', '其他扣排模式暂未开放', 'overview.queueMode']) {
	if (!source.includes(token)) throw new Error(`queue mode view missing ${token}`);
}
if (source.includes('互动与随机')) throw new Error('legacy interaction/random label remains');

const groupFile = new URL('../src/views/wechat/group/index.vue', import.meta.url);
const groupSource = fs.readFileSync(groupFile, 'utf8');
for (const token of ['openRobotConfig', '/wechat/robotConfig', 'api/v1/system/wechatRobotGroup/configOverview', 'groupId: row.id']) {
	if (!groupSource.includes(token)) throw new Error(`group config entry missing ${token}`);
}

console.log('wechat robot config shell verified');
