import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/views/wechat/template/index.vue'), 'utf8');

for (const token of ['row.triggerDescription', 'row.commandUsage', 'compactCommandUsage', 'form.triggerDescription', 'form.commandUsage', "command.triggerKind !== item.triggerKind", "command.triggerKind = 'COMMAND'"]) {
	if (!source.includes(token)) throw new Error(`消息模板展示缺少后端元数据 ${token}`);
}

for (const placeholder of ['定时触发', '沿用公共口令']) {
	if (source.includes(placeholder)) throw new Error(`消息模板展示仍包含旧占位文案 ${placeholder}`);
}

console.log('PASS: wechat template display uses backend trigger and command metadata');
