import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import ts from 'typescript';

const page = readFileSync(new URL('../src/views/vvHomework/users/index.vue', import.meta.url), 'utf8');
const api = readFileSync(new URL('../src/api/vvHomework/index.ts', import.meta.url), 'utf8');
const { descriptor, errors } = parse(page);
assert.deepEqual(errors, []);
const script = descriptor.scriptSetup.content;
const auditCode = script.slice(script.indexOf('const auditEvents:'), script.indexOf('const editOpen'));
const timeFormatter = api.split(/\r?\n/).find(line => line.startsWith('export function beijingTime('));
assert.ok(auditCode && timeFormatter);
const { auditEvents, auditDescription } = new Function(ts.transpile(
	`${timeFormatter.replace('export ', '')}\n${auditCode}\nreturn { auditEvents, auditDescription };`,
))();

const events = [
	['AUTHORIZATION_TRANSFER_OUT', '授权转出'],
	['AUTHORIZATION_TRANSFER_IN', '授权转入'],
];
const receipt = {
	sourceAccount: '100000001',
	targetAccount: '100000002',
	remainingMillis: 2_326_985_055,
	targetExpiresAt: '2026-12-20T02:57:47Z',
};
const stored = (payload) => `${'a'.repeat(32)} ${JSON.stringify({ reference: { sourceRevision: 4 }, receipt: payload })}`;
const summary = '转出方 VV 号 100000001，接收方 VV 号 100000002。转移 26 天 22 小时 23 分 5 秒，接收方授权到期时间为 2026-12-20 10:57:47（北京时间）。';
for (const [event, label] of events) {
	assert.equal(auditEvents[event]?.[0], label);
	assert.equal(auditDescription({ event, detail: stored(receipt) }), summary);
	assert.equal(auditDescription({ event, detail: `${'a'.repeat(32)} {` }), `已记录${label}，详情暂不可读。`);
	assert.equal(auditDescription({ event, detail: stored({ ...receipt, targetExpiresAt: '无效时间' }) }), `已记录${label}，详情暂不可读。`);
	assert.match(auditDescription({ event, detail: stored({ ...receipt, remainingMillis: 500 }) }), /转移不足 1 秒/);
}
assert.equal(auditDescription({ event: 'LOGOUT', detail: 'EXIT' }), '用户正常退出软件。');
console.log('VV authorization transfer audit labels, stored receipts and fallbacks verified');
