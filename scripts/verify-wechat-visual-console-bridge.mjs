import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src', 'views', 'wechat', 'visualConsole', 'index.vue'), 'utf8');

if (!source.includes("event.data?.type !== 'wechat-console:ready'")) {
	throw new Error('可视化控制台父页面未监听子页面就绪事件');
}
if (!source.includes('window.addEventListener(\'message\', onFrameMessage)')) {
	throw new Error('可视化控制台父页面未注册就绪事件监听器');
}

console.log('PASS: visual console bootstrap handshake is registered');
