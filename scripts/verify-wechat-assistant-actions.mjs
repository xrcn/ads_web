import fs from 'node:fs';

const api = fs.readFileSync('src/api/wechatRobotGroup/index.ts', 'utf8');
const page = fs.readFileSync('src/views/wechat/robotConfig/index.vue', 'utf8');
const messages = fs.readFileSync('src/views/wechat/message/index.vue', 'utf8');

for (const expected of [
	'assistantActionEnabled: 0 | 1',
	"assistantActionAccess: 'OPERATORS_ONLY' | 'ALL_MEMBERS'",
	"'assistantActionEnabled'",
	"'assistantActionAccess'",
]) {
	if (!api.includes(expected)) throw new Error(`assistant action API contract missing: ${expected}`);
}

for (const expected of [
	"label: '小助手功能'",
	'<h4>小助手功能</h4>',
	'label="执行操作"',
	'v-model="aiChatConfig.assistantActionEnabled"',
	'label="执行操作权限"',
	'v-model="aiChatConfig.assistantActionAccess"',
	':disabled="aiChatConfig.assistantActionEnabled!==1"',
	"assistantActionEnabled:0",
	"assistantActionAccess:'OPERATORS_ONLY'",
	'assistantActionEnabled,assistantActionAccess',
]) {
	if (!page.includes(expected)) throw new Error(`assistant action UI contract missing: ${expected}`);
}

const chatWatcher = page.match(/watch\(\(\)=>aiChatConfig\.enabled,[\s\S]*?\}\);/)?.[0] || '';
if (!chatWatcher.includes('aiChatConfig.businessQueryEnabled=0') || !chatWatcher.includes('aiChatConfig.followupEnabled = 0')) {
	throw new Error('chat-disabled normalization missing');
}
if (chatWatcher.includes('assistantActionEnabled') || chatWatcher.includes('assistantActionAccess')) {
	throw new Error('chat-disabled normalization must not change assistant actions');
}

for (const expected of ["RESIGN_DOUBLE_BAN: '离职双封'", "APPROVE_ANCHOR_SIGNING: '签约'", "APPROVE_HALL_CHANGE: '修改所属厅'"]) {
	if (!messages.includes(expected)) throw new Error(`assistant action audit label missing: ${expected}`);
}
if (!messages.includes("GROUP_ALL_MEMBERS: '群内所有成员'")) throw new Error('assistant action all-members authority label missing');

console.log('wechat assistant controlled actions UI verified');
