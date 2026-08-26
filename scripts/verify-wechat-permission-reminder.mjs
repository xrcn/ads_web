import fs from'node:fs';
const s=fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue',import.meta.url),'utf8');
for(const token of['命令与回复','管理员','自动提醒','本人执行','executionMode','原生@所有人','permissionAdmins','permanentAdminSave','reminderConfigSave','permissionReminderAudit'])if(!s.includes(token))throw new Error(`permission reminder missing ${token}`);
for(const token of['v-if="canReadTemplates" label="命令与回复"','v-if="canReadAdmins" label="管理员"','v-if="canReadReminders" label="自动提醒"'])if(!s.includes(token))throw new Error(`permission tab guard missing ${token}`);
if(s.includes('普通自排仅管理员')||s.includes('queueSelfAdminOnly'))throw new Error('legacy queue self admin switch remains');
console.log('wechat permission reminder verified');
