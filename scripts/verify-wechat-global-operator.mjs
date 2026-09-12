import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const api = read('src/api/wechatGlobalOperator/index.ts');
const page = read('src/views/wechat/globalOperator/index.vue');
const monitorApi = read('src/api/wechatMonitor/index.ts');
const monitorPage = read('src/views/wechat/monitor/index.vue');
const messagePage = read('src/views/wechat/message/index.vue');

const requireText = (source, text, file) => {
	if (!source.includes(text)) throw new Error(`${file} missing ${text}`);
};

for (const endpoint of ['/wechatGlobalOperator/list', '/wechatGlobalOperator/add', '/wechatGlobalOperator/edit', '/wechatGlobalOperator/status']) {
	requireText(api, endpoint, 'global operator api');
}
for (const permission of ['wechatGlobalOperator/list', 'wechatGlobalOperator/add', 'wechatGlobalOperator/edit', 'wechatGlobalOperator/status']) {
	requireText(page, permission, 'global operator page');
}
for (const field of ['wxid', 'displayName', 'remark', 'status']) requireText(page, field, 'global operator page');
requireText(monitorApi, '/wechatMonitor/callbackRefresh', 'monitor api');
requireText(monitorPage, 'wechatMonitor/callbackRefresh', 'monitor page');
for (const field of ['callbackCredentials', 'verifiedAt', 'lastError', 'PENDING', 'ACTIVE', 'RETIRING', 'NOT_STARTED']) {
	requireText(monitorPage, field, 'monitor page');
}
requireText(messagePage, "GLOBAL_OPERATOR: '全局运维'", 'message page');
for (const [name, source] of [['global operator api', api], ['global operator page', page], ['monitor page', monitorPage]]) {
	for (const forbidden of ['secretCiphertext', 'secretHash', 'callbackUrl']) {
		if (source.includes(forbidden)) throw new Error(`${name} leaks forbidden field ${forbidden}`);
	}
}
console.log('PASS: WeChat global operator UI verifier');
