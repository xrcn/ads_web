import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const api = read('src/api/anchor/index.ts');
const page = read('src/views/anchor/manage/index.vue');
const anchorAudit = read('src/views/anchor/manage/component/anchorAuditList.vue');
const hallAudit = read('src/views/anchor/manage/component/hallAuditList.vue');

for (const value of [
	'/anchor/vvAudit/anchor/list',
	'/anchor/vvAudit/anchor/detail',
	'/anchor/vvAudit/anchor/decision',
	'/anchor/vvAudit/hall/list',
	'/anchor/vvAudit/hall/decision',
]) {
	if (!api.includes(value)) throw new Error(`missing API: ${value}`);
}
for (const value of ['name="anchorList"', 'name="anchorAudit"', 'name="hallAudit"', 'lazy']) {
	if (!page.includes(value)) throw new Error(`missing lazy tab: ${value}`);
}
for (const value of ['待审核', '已通过', '未通过', '查看主播资料', 'APPROVE', 'REJECT', 'vvAudit/anchor/decision']) {
	if (!anchorAudit.includes(value)) throw new Error(`missing anchor audit contract: ${value}`);
}
if (!api.includes('recordKey: string') || !anchorAudit.includes('row-key="recordKey"')) throw new Error('anchor audit mobile rows require a stable recordKey');
if (!anchorAudit.includes('续约申请(续签中)')) throw new Error('missing VV historical audit status mapping');
for (const value of ['原所属厅', '申请所属厅', 'APPROVE', 'REJECT', 'vvAudit/hall/decision']) {
	if (!hallAudit.includes(value)) throw new Error(`missing hall audit contract: ${value}`);
}
if (page.includes('主播解约审核') || anchorAudit.includes('主播解约审核') || hallAudit.includes('主播解约审核')) {
	throw new Error('termination audit is out of scope');
}
if ((api.match(/__skipGlobalErrorMessage/g) || []).length < 2) throw new Error('audit lists must use local error state without duplicate global messages');
console.log('vv anchor audit verifier passed');
