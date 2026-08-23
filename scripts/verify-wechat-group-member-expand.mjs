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
