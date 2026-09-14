import fs from 'node:fs';

const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url), 'utf8');
const messages = fs.readFileSync(new URL('../src/views/wechat/message/index.vue', import.meta.url), 'utf8');

for (const expected of ['businessQueryEnabled', 'businessAccess']) {
  if (!api.includes(expected) && !page.includes(expected)) throw new Error(`missing ${expected}`);
}
for (const expected of ['业务查询', '仅运维白名单', '群内所有成员', 'OPERATORS_ONLY', 'ALL_MEMBERS']) {
  if (!page.includes(expected)) throw new Error(`missing ${expected}`);
}
if (!page.includes('watch(()=>aiChatConfig.enabled') || !page.includes('aiChatConfig.businessQueryEnabled=0')) throw new Error('disabling chat must disable business queries');
for (const expected of ['AI_BUSINESS_QUERY', '业务查询', 'replyStage', 'messageType']) {
  if (!messages.includes(expected)) throw new Error(`message view missing ${expected}`);
}
console.log('wechat AI business query verifier passed');
