import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src', 'utils', 'gfast.ts'), 'utf8');

if (!source.includes("targetUrl.protocol === 'wss:'")) {
	throw new Error('wss 地址未被识别为安全 WebSocket 协议');
}

console.log('PASS: wss WebSocket protocol is preserved');
