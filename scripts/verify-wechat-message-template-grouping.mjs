import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src', 'views', 'wechat', 'template', 'index.vue'), 'utf8');
const apiSource = readFileSync(resolve(process.cwd(), 'src', 'api', 'wechatMessageTemplate', 'index.ts'), 'utf8');

for (const token of ['row.scenarios', '<el-tabs', '场景数量', 'PARTIAL_ENABLED', 'activeEventKey']) {
	if (!source.includes(token)) throw new Error(`消息模板分组页面缺少 ${token}`);
}

for (const token of ['groupDetail', 'groupEdit', 'groupAdd', 'groupStatus', 'groupDelete', 'groupReset']) {
	if (!apiSource.includes(`/wechatMessageTemplate/${token}`)) throw new Error(`消息模板 API 缺少 ${token}`);
}

console.log('PASS: wechat message templates are grouped by command');
