import { readFileSync } from 'node:fs';

const api = readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');
const view = readFileSync(new URL('../src/views/wechat/group/index.vue', import.meta.url), 'utf8');

for (const expected of [
	"/api/v1/system/wechatRobotGroup/memberList",
	"/api/v1/system/wechatRobotGroup/memberSync",
]) {
	if (!api.includes(expected)) throw new Error(`missing group-member API: ${expected}`);
}

for (const expected of [
	"type=\"expand\"",
	"getWechatRobotGroupMemberList",
	"syncWechatRobotGroupMembers",
	"includeLeft",
	"立即同步",
	"首次同步发现",
	"max-height=\"420\"",
]) {
	if (!view.includes(expected)) throw new Error(`missing group-member expand behavior: ${expected}`);
}

for (const expected of [
	"const canListMembers = auth('api/v1/system/wechatRobotGroup/memberList')",
	'v-if="canListMembers"',
	'if (!canListMembers) return',
	':disabled="row.status !== 1 || row.accountStatus !== 1"',
	"v-auth=\"'api/v1/system/wechatRobotGroup/memberSync'\"",
]) {
	if (!view.includes(expected)) throw new Error(`missing group-member permission/status guard: ${expected}`);
}

const uiState = ({ canListMembers, canSyncMembers, groupStatus, accountStatus }) => ({
	showExpand: canListMembers,
	loadsMembers: canListMembers,
	showSync: canListMembers && canSyncMembers,
	syncDisabled: groupStatus !== 1 || accountStatus !== 1,
});

for (const [name, input, expected] of [
	['list without sync', { canListMembers: true, canSyncMembers: false, groupStatus: 1, accountStatus: 1 }, { showExpand: true, loadsMembers: true, showSync: false, syncDisabled: false }],
	['without list', { canListMembers: false, canSyncMembers: true, groupStatus: 1, accountStatus: 1 }, { showExpand: false, loadsMembers: false, showSync: false, syncDisabled: false }],
	['disabled account', { canListMembers: true, canSyncMembers: true, groupStatus: 1, accountStatus: 0 }, { showExpand: true, loadsMembers: true, showSync: true, syncDisabled: true }],
	['disabled group', { canListMembers: true, canSyncMembers: true, groupStatus: 0, accountStatus: 1 }, { showExpand: true, loadsMembers: true, showSync: true, syncDisabled: true }],
]) {
	const actual = uiState(input);
	if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`unexpected ${name} state: ${JSON.stringify(actual)}`);
}
