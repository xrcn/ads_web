import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/views/wechat/template/index.vue'), 'utf8');
for (const token of [
	'variableCatalog',
	'isVariableAvailable',
	'insertVariable',
	'scenarioVariableErrors',
	'当前回复场景不提供此数据',
	'系统未定义此模板变量',
	'variable-tag-unavailable',
]) {
	if (!source.includes(token)) throw new Error(`消息模板变量面板缺少 ${token}`);
}
console.log('PASS: wechat template variable catalog UI is present');
