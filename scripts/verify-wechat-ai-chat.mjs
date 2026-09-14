import fs from 'node:fs';

const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');
const config = fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url), 'utf8');
const messages = fs.readFileSync(new URL('../src/views/wechat/message/index.vue', import.meta.url), 'utf8');

for (const expected of [
	'/api/v1/system/wechatRobotGroup/aiChatConfig',
	'/api/v1/system/wechatRobotGroup/aiChatConfigSave',
]) {
	if (!api.includes(expected)) throw new Error(`missing API ${expected}`);
}
for (const expected of [
	"auth('api/v1/system/wechatRobotGroup/aiChatConfig')",
	"auth('api/v1/system/wechatRobotGroup/aiChatConfigSave')",
	"name: 'aiChat'",
	'小助手聊天',
	'configurationReady',
	'aiChatRequestGeneration',
	'loadedAIChatGroupId',
	'selectedGroupId.value===groupId',
	':disabled="aiChatConfig.enabled!==1&&!aiChatConfig.configurationReady"',
	'if(aiChatConfig.enabled===1&&!aiChatConfig.configurationReady)',
	'自动识别中',
]) {
	if (!config.includes(expected)) throw new Error(`missing robot config contract ${expected}`);
}
for (const expected of ["AI_CHAT: 'AI聊天'", 'processingMilliseconds', '处理耗时', 'canViewAIChat']) {
	if (!messages.includes(expected)) throw new Error(`missing message audit contract ${expected}`);
}

console.log('wechat AI chat config and audit UI verified');
