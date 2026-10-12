import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url), 'utf8');
const messages = fs.readFileSync(new URL('../src/views/wechat/message/index.vue', import.meta.url), 'utf8');

for (const expected of ['businessQueryEnabled', 'businessAccess']) {
  if (!api.includes(expected) && !page.includes(expected)) throw new Error(`missing ${expected}`);
}
for (const expected of ['业务查询', '仅运维白名单', '群内所有成员', 'OPERATORS_ONLY', 'ALL_MEMBERS']) {
  if (!page.includes(expected)) throw new Error(`missing ${expected}`);
}
for (const name of ['followupEnabled', 'businessQueryEnabled']) {
  const control = page.match(new RegExp(`<el-switch[^>]*v-model=\"aiChatConfig\.${name}\"[^>]*>`))?.[0];
  assert.ok(control, `${name} switch missing`);
  assert.ok(!/:disabled=\"[^\"]*aiChatConfig\.enabled/.test(control), `${name} must not depend on chat`);
}
assert.ok(!page.includes('watch(()=>aiChatConfig.enabled'), 'chat changes must not reset sibling switches');
const load = page.match(/const loadAIChat[\s\S]*?(?=\r?\nconst saveAIChatForm)/)?.[0];
const save = page.match(/const saveAIChatForm[\s\S]*?(?=\r?\n\r?\nconst loadQueueRules)/)?.[0];
assert.ok(load && save, 'form handlers missing');
for (const enabled of [0, 1]) for (const followupEnabled of [0, 1]) for (const businessQueryEnabled of [0, 1]) {
  let submitted;
  const values = {enabled, followupEnabled, businessQueryEnabled, memoryEnabled:0, configurationReady:true, memoryConfigurationReady:true, businessAccess:'OPERATORS_ONLY', assistantActionEnabled:0, assistantActionAccess:'OPERATORS_ONLY'};
  const context = vm.createContext({
    selectedGroupId:{value:16}, canReadAIChat:true, canSaveAIChat:true,
    aiChatRequestGeneration:0, loadedAIChatGroupId:{value:undefined}, aiChatConfig:{}, aiChatSaving:{value:false},
    ElMessage:{error:(message)=>{throw new Error(message)},success:()=>{}},
    getWechatRobotGroupAIChatConfig:async()=>({data:{...values}}),
    saveWechatRobotGroupAIChatConfig:async(data)=>{submitted={...data};return {data}},
  });
  vm.runInContext(`${load}\n${save}\nthis.load=loadAIChat;this.save=saveAIChatForm;`,context);
  await context.load();
  for (const key of ['enabled','followupEnabled','businessQueryEnabled']) assert.equal(context.aiChatConfig[key],values[key],`load changed ${key}`);
  await context.save();
  for (const key of ['enabled','followupEnabled','businessQueryEnabled']) assert.equal(submitted?.[key],values[key],`save changed ${key}`);
}

for (const expected of ['AI_BUSINESS_QUERY', '业务查询', 'replyStage', 'messageType']) {
  if (!messages.includes(expected)) throw new Error(`message view missing ${expected}`);
}
console.log('wechat AI business query verifier passed');
