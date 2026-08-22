import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = fs.readFileSync(path.join(root, 'src/views/wechat/template/index.vue'), 'utf8');

for (const source of ['templateIfOpenPattern', 'templateControlPattern', '\\/if', 'previewWechatMessageTemplate']) {
	if (!page.includes(source)) throw new Error(`模板条件块编辑/预览缺少 ${source}`);
}
if (!page.includes('...Array.from(scenario.content.matchAll(templateIfOpenPattern)')) {
	throw new Error('条件变量未进入模板变量可用性校验');
}
if (page.includes('templateVariablePattern = /\\{\\{([A-Za-z][A-Za-z0-9]*)\\}\\}/g') && !page.includes('templateControlPattern')) {
	throw new Error('条件控制标记会被误作普通变量处理');
}

console.log('wechat template condition editor checks passed');
