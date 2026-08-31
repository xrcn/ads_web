import fs from 'node:fs';

const view = fs.readFileSync(new URL('../src/views/vvAuthorization/index.vue', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../src/api/vvAuthorization/index.ts', import.meta.url), 'utf8');

for (const text of ['授权账号', '授权密码', '显示名称', '启用', '停用', 'VV账号', '登录时间']) {
	if (!view.includes(text)) throw new Error(`missing view text: ${text}`);
}
for (const path of ['/list', '/add', '/edit', '/status', '/history']) {
	if (!api.includes(`/vvRobotAuthorizedAccount${path}`)) throw new Error(`missing API path: ${path}`);
}
if (/机器人/.test(view)) throw new Error('visible copy contains forbidden word');
for (const text of ['prop="loggedInAt"', 'prop="clientVersion"', '@keyup.enter="searchAccounts"', '@click="searchAccounts"', '@keyup.enter="searchHistory"', '@click="searchHistory"', 'const searchAccounts = () =>', 'const searchHistory = () =>']) {
	if (!view.includes(text)) throw new Error(`missing query/history behavior: ${text}`);
}
for (const text of ['TextEncoder', 'byteLength', '授权密码必须为 8 到 72 个字节']) {
	if (!view.includes(text)) throw new Error(`missing password validation: ${text}`);
}
for (const text of [
	'interface AuthorizedAccountQuery', 'interface AuthorizedAccount', 'interface VVLoginHistoryQuery',
	'interface VVLoginHistory', 'interface PageResponse', 'Promise<ApiResponse<PageResponse<AuthorizedAccount>>>',
	'Promise<ApiResponse<PageResponse<VVLoginHistory>>>',
]) {
	if (!api.includes(text)) throw new Error(`missing concrete API type: ${text}`);
}
for (const forbidden of ['(params: object)', 'ref<any[]>', '(res: any)', '(row: any)']) {
	if (api.includes(forbidden) || view.includes(forbidden)) throw new Error(`broad DTO retained: ${forbidden}`);
}
for (const text of [
	'accountRequestGeneration', 'historyRequestGeneration', 'generation !== accountRequestGeneration',
	'generation !== historyRequestGeneration', 'try {', 'catch {', 'finally {', 'void loadAccounts()', 'void loadHistory()',
]) {
	if (!view.includes(text)) throw new Error(`missing request race/error guard: ${text}`);
}
const historySection = view.split('<template #header>登录历史</template>')[1].split('</el-card>')[0];
for (const text of ['prop="loginTime"', 'prop="remark"']) {
	if (historySection.includes(text)) throw new Error(`invalid history field: ${text}`);
}
