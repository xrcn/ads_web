import fs from 'node:fs';

const viewFile = new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url);
if (!fs.existsSync(viewFile)) throw new Error('robot config view is missing');
const source = fs.readFileSync(viewFile, 'utf8');
const anchorCustomFile = new URL('../src/views/wechat/robotConfig/components/AnchorCustomCommandTab.vue', import.meta.url);
if (!fs.existsSync(anchorCustomFile)) throw new Error('anchor custom command tab is missing');
const anchorCustomSource = fs.readFileSync(anchorCustomFile, 'utf8');
for (const token of [
	'微信群机器人配置',
	'基础信息',
	'麦序规则',
	'定时排档',
	'固定档与主持',
	'报备回厅',
	'打卡统计',
	'专属扣排配置',
	'权限与提醒',
	'模板与口令',
	'api/v1/system/wechatRobotGroup/configOverview',
	'route.query.groupId',
]) {
	if (!source.includes(token)) throw new Error(`robot config shell missing ${token}`);
}
if (source.includes('保存全部')) throw new Error('phase1 must not expose a global save');
for (const token of ['AnchorCustomCommandTab', "name: 'anchorCustomCommand'", 'canReadAnchorCustomCommands', 'anchorCustomCommand/list']) {
	if (!source.includes(token)) throw new Error(`anchor custom command view missing ${token}`);
}
for (const token of [
	'扣排模式',
	'普通模式',
	'主播专属模式',
	'bindTimeoutSeconds',
	':min="10"',
	':max="120"',
	'getAnchorCustomCommandConfig',
	'getAnchorCustomCommandList',
	'saveAnchorCustomCommandConfig',
	'deleteAnchorCustomCommand',
	'getAnchorCustomCommandPreview',
	'切换后普通 p / P / 排 / 补 将立即失效',
	'canSave',
	'canDelete',
	'canPreview',
]) {
	if (!anchorCustomSource.includes(token)) throw new Error(`anchor custom command contract missing ${token}`);
}
for (const token of ['预览查询设置', 'settingsPreview', 'openSettingsPreview', '启用排档时段']) {
	if (!source.includes(token)) throw new Error(`query settings preview missing ${token}`);
}
if (source.includes('麦排小时')) throw new Error('legacy active-hours label remains');
if (source.includes('互动与随机')) throw new Error('legacy interaction/random label remains');

const groupFile = new URL('../src/views/wechat/group/index.vue', import.meta.url);
const groupSource = fs.readFileSync(groupFile, 'utf8');
for (const token of ['openRobotConfig', '/wechat/robotConfig', 'api/v1/system/wechatRobotGroup/configOverview', 'groupId: row.id']) {
	if (!groupSource.includes(token)) throw new Error(`group config entry missing ${token}`);
}

console.log('wechat robot config shell verified');
