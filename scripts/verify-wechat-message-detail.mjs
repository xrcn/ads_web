import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src', 'views', 'wechat', 'message', 'index.vue'), 'utf8');

if (!source.includes('const formatJson =')) {
	throw new Error('微信消息详情缺少 JSON 格式化函数');
}

console.log('PASS: wechat message detail has JSON formatter');
