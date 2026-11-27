import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import ts from 'typescript';

const file = readFileSync(new URL('../src/views/vvHomework/users/index.vue', import.meta.url), 'utf8');
const { descriptor, errors } = parse(file);
assert.deepEqual(errors, []);
const template = descriptor.template.content;
assert.match(template, /v-auth="'api\/v1\/system\/vvHomework\/user\/reconnect'"/);
assert.match(template, /帮用户重连 VV/);
assert.match(template, /vvReconnect\?\.canRequest/);
assert.match(template, /row\.actorId.*管理员/);
const script = descriptor.scriptSetup.content;
const code = script.slice(script.indexOf('const auditEvents:'), script.indexOf('const editOpen'));
const { auditEvents, auditDescription, vvReconnectStatusText } = new Function(ts.transpile(
	`function beijingTime(v: string) { return v; }\n${code}\nreturn { auditEvents, auditDescription, vvReconnectStatusText };`,
))();

const command = 'a'.repeat(64) + ' ' + 'B'.repeat(43);
assert.equal(auditEvents.VV_ADMIN_RECONNECT_REQUESTED[0], '管理员请求 VV 重连');
assert.match(auditDescription({ event: 'VV_ADMIN_RECONNECT_RESULT', detail: command + ' PRESENCE_ONLINE' }), /在线/);
assert.match(vvReconnectStatusText({ status: 'BLOCKED', reason: 'PRESENCE_UNKNOWN' }), /无法确认/);
assert.match(vvReconnectStatusText({ status: 'EXPIRED' }), /超时/);
assert.match(vvReconnectStatusText({ status: 'SUCCEEDED' }), /成功/);
assert.doesNotMatch(auditDescription({ event: 'VV_ADMIN_RECONNECT_RESULT', detail: 'raw text' }), /raw text/);
console.log('PASS admin VV reconnect permission, audit result and deadline display');
