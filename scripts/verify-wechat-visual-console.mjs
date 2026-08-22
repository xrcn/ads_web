import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'public', 'wechat-visual-console');
const files = [
	'index.html',
	'css/style.css',
	'js/core.js',
	'js/modules-bundle.js',
	'js/app.js',
];

for (const file of files) {
	if (!existsSync(resolve(root, file))) {
		throw new Error(`缺少控制台资源: ${file}`);
	}
}

const html = readFileSync(resolve(root, 'index.html'), 'utf8');
for (const sectionId of ['login', 'profile-tags', 'contacts', 'messages', 'sns', 'labels', 'favorites', 'webhook', 'api-logs']) {
	if (!html.includes(`id="${sectionId}"`)) {
		throw new Error(`缺少控制台功能区: ${sectionId}`);
	}
}

const modules = readFileSync(resolve(root, 'js/modules-bundle.js'), 'utf8');
const paths = [...modules.matchAll(/['"](\/[a-zA-Z]+\/[a-zA-Z0-9]+)['"]/g)].map((match) => match[1]);
if (new Set(paths).size < 74) {
	throw new Error(`控制台接口数量不足: ${new Set(paths).size}`);
}

const core = readFileSync(resolve(root, 'js/core.js'), 'utf8');
if (core.includes('http://api.wechatapi.net') || core.includes('VideosApi-token')) {
	throw new Error('静态控制台仍包含直连 WechatApi 凭据逻辑');
}

const app = readFileSync(resolve(root, 'js/app.js'), 'utf8');
if (app.includes("C.modalConfirm('同步微信登录资料'")) {
	throw new Error('登录资料同步不应在每次登录时弹出确认框');
}
if (!app.includes('function hasLoginProfileChanged(profile, account)')) {
	throw new Error('缺少登录资料差异判断，无法避免重复同步');
}

if (!html.includes('id="ct-chatroom-member-list-id"') || !html.includes('id="btn-contacts-chatroom-member-list"')) {
	throw new Error('缺少群成员列表的 chatroomId 输入或调用入口');
}
if (!html.includes('id="ct-chatroom-member-list-status"')) {
	throw new Error('缺少群成员列表的调用状态展示');
}
if (!html.includes('id="contacts-module-log-body"') || !html.includes('id="btn-contacts-export-log"')) {
	throw new Error('群成员列表必须复用原始响应 JSON 展示和导出区');
}
if (!modules.includes("$('btn-contacts-chatroom-member-list')?.addEventListener('click'")) {
	throw new Error('缺少群成员列表调用处理');
}
if (!modules.includes("post('/group/getChatroomMemberList', { chatroomId })")) {
	throw new Error('群成员列表必须通过同源代理提交 chatroomId');
}
if (!app.includes("'btn-contacts-chatroom-member-list',")) {
	throw new Error('未选微信账号时，群成员列表必须由卡片处理并输出错误信息');
}

console.log(`PASS: ${files.length} resources, 9 sections, ${new Set(paths).size} API paths`);
