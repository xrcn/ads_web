import fs from 'node:fs';

const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');
const config = fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url), 'utf8');
const messages = fs.readFileSync(new URL('../src/views/wechat/message/index.vue', import.meta.url), 'utf8');

const assertMatch = (source, pattern, description) => {
	if (!pattern.test(source)) throw new Error(`missing anchored contract ${description}`);
};
const getDeclaration = (source, name) => source.match(new RegExp(`export const ${name}\\s*=\\s*[^;]*;`))?.[0] || '';

for (const expected of [
	'/api/v1/system/wechatRobotGroup/aiChatConfig',
	'/api/v1/system/wechatRobotGroup/aiChatConfigSave',
	'export interface WechatRobotGroupAIChatConfig',
	'followupEnabled: 0 | 1',
]) {
	if (!api.includes(expected)) throw new Error(`missing API ${expected}`);
}
const getAIChatDeclaration = getDeclaration(api, 'getWechatRobotGroupAIChatConfig');
const saveAIChatDeclaration = getDeclaration(api, 'saveWechatRobotGroupAIChatConfig');
assertMatch(getAIChatDeclaration, /export const getWechatRobotGroupAIChatConfig\s*=\s*\(groupId\s*:\s*number\)[\s\S]*?Promise<WechatRobotGroupApiResponse<WechatRobotGroupAIChatConfig>>/, 'typed AI chat get response');
assertMatch(saveAIChatDeclaration, /export const saveWechatRobotGroupAIChatConfig\s*=\s*\(data\s*:\s*WechatRobotGroupAIChatConfigSave\)[\s\S]*?Promise<WechatRobotGroupApiResponse<WechatRobotGroupAIChatConfig>>/, 'typed AI chat save payload and response');
for (const expected of [
	"auth('api/v1/system/wechatRobotGroup/aiChatConfig')",
	"auth('api/v1/system/wechatRobotGroup/aiChatConfigSave')",
	"name: 'aiChat'",
	'小助手功能',
	'小助手聊天',
	'configurationReady',
	'aiChatRequestGeneration',
	'loadedAIChatGroupId',
	'selectedGroupId.value===groupId',
	':disabled="aiChatConfig.enabled!==1&&!aiChatConfig.configurationReady"',
	'if(aiChatConfig.enabled===1&&!aiChatConfig.configurationReady)',
	'自动识别中',
	'followupEnabled: 0',
	'v-model="aiChatConfig.followupEnabled"',
	':disabled="aiChatConfig.enabled !== 1"',
	'const followupEnabled=',
	'saveWechatRobotGroupAIChatConfig({groupId,enabled,followupEnabled',
	'aiChatConfig.followupEnabled = 0',
	'免 @ 连续对话',
	'聊天、业务查询和受控执行操作分别启用；执行操作只接受精确 @。',
	'小助手聊天关闭时，免 @ 连续对话不可用。',
	'喊一次机器人昵称后，同一成员可在 2 分钟内免 @ 追问，最多 5 次；其他成员发言会结束会话。',
]) {
	if (!config.includes(expected)) throw new Error(`missing robot config contract ${expected}`);
}
const loadAIChatBlock = config.match(/const loadAIChat[\s\S]*?(?=\r?\nconst saveAIChatForm)/)?.[0] || '';
assertMatch(loadAIChatBlock, /const loadedConfig\s*=\s*\{\s*\.\.\.res\.data\s*\};[\s\S]*?if\s*\(\s*loadedConfig\.enabled\s*!==\s*1\s*\)\s*\{[\s\S]*?loadedConfig\.businessQueryEnabled\s*=\s*0;[\s\S]*?loadedConfig\.followupEnabled\s*=\s*0;[\s\S]*?\}[\s\S]*?Object\.assign\(aiChatConfig,\s*loadedConfig\)/, 'AI chat load normalization');
assertMatch(config, /watch\(selectedGroupId,[\s\S]*?Object\.assign\(aiChatConfig,\s*\{[\s\S]*?followupEnabled\s*:\s*0[\s\S]*?\}\)/, 'group switch followup reset');
const enabledWatchBlock = config.match(/watch\(\(\)=>aiChatConfig\.enabled,[\s\S]*?(?=watch\(permissionSubTab)/)?.[0] || '';
assertMatch(enabledWatchBlock, /if\s*\(\s*value\s*!==\s*1\s*\)\s*\{[\s\S]*?aiChatConfig\.businessQueryEnabled\s*=\s*0;[\s\S]*?aiChatConfig\.followupEnabled\s*=\s*0;[\s\S]*?\}/, 'AI chat disabled normalization');
const saveAIChatBlock = config.match(/const saveAIChatForm[\s\S]*?(?=\r?\n\r?\nconst loadQueueRules)/)?.[0] || '';
assertMatch(saveAIChatBlock, /saveWechatRobotGroupAIChatConfig\(\{\s*groupId\s*,\s*enabled\s*,\s*followupEnabled\s*,\s*businessQueryEnabled/, 'AI chat save followup payload');
for (const expected of ["AI_CHAT: 'AI聊天'", 'processingMilliseconds', '处理耗时', 'canViewAIChat']) {
	if (!messages.includes(expected)) throw new Error(`missing message audit contract ${expected}`);
}

console.log('wechat AI chat config and audit UI verified');
