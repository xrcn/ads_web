import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';

const view = fs.readFileSync(new URL('../src/views/wechat/robotConfig/index.vue', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../src/api/wechatRobotGroup/index.ts', import.meta.url), 'utf8');
for (const token of ['命令与回复', 'GROUP_ENABLED', 'GROUP_DISABLED', 'PUBLIC', '所有人', '仅管理员', '禁止群内代发', '恢复公共默认', '完整模板管理', 'templateCommands', 'templateCommandSave', 'templateCommandReset', 'templateCommandAudit']) {
	assert.ok(view.includes(token) || api.includes(token), `template command config missing ${token}`);
}

// 执行页面本身的计算逻辑，固定权限与共享回复行都必须留在人工命令分类。
const filterSource = view.match(/^const filteredTemplateCommands=.*$/m)?.[0];
assert.ok(filterSource, 'command filter missing');
const fixtures = [
	{ commandKey: 'QUERY_GROUP_ADMINS', commandName: '查询管理', triggerKind: 'COMMAND', delegationMode: '' },
	{ commandKey: 'VOID_CURRENT_ROUND', commandName: '整档作废', triggerKind: 'COMMAND', delegationMode: '' },
	{ commandKey: 'ANCHOR_CUSTOM_COMMAND_DELETE_SELF', commandName: '删除我的专属指令', triggerKind: 'COMMAND', delegationMode: 'ALL' },
	{ commandKey: 'AUTO_CURRENT_ROUND_REPORT', commandName: '定时麦序播报', triggerKind: 'AUTO', delegationMode: '' },
];
function evaluate(source, extra = {}) {
	const context = { ...extra };
	const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
	vm.runInNewContext(js, context);
	return JSON.parse(JSON.stringify(context.result));
}
for (const [kind, expected] of [['COMMAND', fixtures.slice(0, 3)], ['AUTO', fixtures.slice(3)], ['', fixtures]]) {
	const result = evaluate(`${filterSource}\nglobalThis.result=filteredTemplateCommands.map(row=>row.commandKey);`, {
		computed: (fn) => fn(), templateCommands: { value: fixtures }, templateKeyword: { value: '' }, templateKind: { value: kind },
	});
	assert.deepEqual(result, expected.map(row => row.commandKey), `incorrect ${kind || 'ALL'} classification`);
}
const accessSource = view.match(/const commandExecutionAccessLabel=[^;]+;/)?.[0];
assert.ok(accessSource, 'execution label missing');
assert.equal(evaluate(`${accessSource}\nglobalThis.result=commandExecutionAccessLabel(row);`, {
	row: { accessMode: 'PUBLIC', executionAccessLabel: '按业务查询权限' },
}), '按业务查询权限');
assert.ok(!view.includes("row.commandUsage||'定时触发'"), 'manual commands must not use timed fallback');
for (const token of ['row.sharedReplyCommandName', 'row.triggerDescription', 'row.executionAccessDescription']) {
	assert.ok(view.split(token).length - 1 >= 2, `desktop and mobile metadata missing ${token}`);
}
console.log('PASS: command types, fixed-access commands, business-query labels and desktop/mobile metadata');
