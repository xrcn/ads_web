import fs from 'node:fs';
const view=fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts',import.meta.url),'utf8');
for(const token of['全部命令与自动场景','GROUP_ENABLED','GROUP_DISABLED','PUBLIC','所有人','仅管理员','禁止代发','恢复公共默认','完整模板管理','templateCommands','templateCommandSave','templateCommandReset','templateCommandAudit'])if(!view.includes(token)&&!api.includes(token))throw new Error(`template command config missing ${token}`);
console.log('wechat template command config verified');
