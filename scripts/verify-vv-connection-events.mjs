import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import ts from 'typescript';

const page = readFileSync(new URL('../src/views/vvHomework/users/index.vue', import.meta.url), 'utf8');
const { descriptor, errors } = parse(page);
assert.deepEqual(errors, []);
const script = descriptor.scriptSetup.content;
const auditCode = script.slice(script.indexOf('const auditEvents:'), script.indexOf('const editOpen'));
const { auditEvents, auditDescription } = new Function(ts.transpile(
	`function beijingTime(v: string) { return v; }\n${auditCode}\nreturn { auditEvents, auditDescription };`,
))();

const event = 'VV_DISCONNECTED';
const occurredAt = '2026-11-27T03:25:41Z';
const detail = 'a'.repeat(32) + ' ' + JSON.stringify({ occurredAt, reason: 'IM_SESSION_INVALIDATED' });
assert.equal(auditEvents[event][0], 'VV 断线');
assert.match(auditDescription({ event, detail }), /IM 会话失效/);
assert.ok(auditDescription({ event, detail }).includes(occurredAt));
assert.equal(auditEvents.VV_RECONNECT_SUCCEEDED[0], 'VV 重连成功');
assert.match(auditDescription({ event: 'VV_RECONNECT_SKIPPED', detail: 'b'.repeat(32) + ' ' +
	JSON.stringify({ occurredAt, reason: 'PRESENCE_ONLINE' }) }), /在线/);
assert.doesNotMatch(auditDescription({ event, detail: 'invalid-private-text' }), /invalid-private-text/);
console.log('PASS VV connection event labels, reason and detection time');
