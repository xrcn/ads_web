import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue',import.meta.url),'utf8');
for(const token of ['slotCount','speedPriorityCount','specialTopCount','speedTakeEnabled','taskTakeEnabled','p8Mode','p8Name','queueSelfAdminOnly','specialCandidates','AVAILABLE','CONSUMED','CANCELLED','queueRulesSave','specialTopGrant','specialTopCancel']){if(!source.includes(token))throw new Error(`queue rules missing ${token}`)}
if(source.includes('保存全部'))throw new Error('global save forbidden');
console.log('wechat queue rules verified');
