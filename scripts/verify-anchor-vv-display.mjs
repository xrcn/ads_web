import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('src/views/anchor/manage/index.vue');
const list = read('src/views/anchor/manage/component/anchorList.vue');
const filters = page.slice(0, page.indexOf('</el-form>'));
const desktopTable = list.slice(0, list.indexOf('</el-table>'));

for (const [source, needle] of [
	[filters, '开播状态'],
	[filters, '账号状态'],
	[filters, 'vvCurrentLiveStatus'],
	[filters, 'vvForbidStatus'],
	[desktopTable, '魅力&粉丝数'],
	[desktopTable, 'vvCharmLevel'],
	[desktopTable, 'vvFansCount'],
	[desktopTable, '开播情况'],
	[desktopTable, 'vvCurrentLiveStatus'],
	[desktopTable, '账号状态'],
	[desktopTable, 'vvForbidStatusName'],
	[list, '<el-drawer'],
	[list, '详情'],
	[list, 'filter.vvCurrentLiveStatus'],
	[list, 'filter.vvForbidStatus'],
]) {
	if (!source.includes(needle)) throw new Error(`missing VV anchor display contract: ${needle}`);
}
for (const forbidden of ['label="直播等级"', 'label="管理员"', 'label="同步时间"']) {
	if (desktopTable.includes(forbidden)) throw new Error(`forbidden main-list column: ${forbidden}`);
}
for (const forbidden of ['label="管理员"', 'label="签约到期"']) {
	if (filters.includes(forbidden)) throw new Error(`forbidden top-level filter: ${forbidden}`);
}
console.log('anchor VV display verifier passed');
