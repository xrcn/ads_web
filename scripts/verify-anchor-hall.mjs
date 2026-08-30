import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const api = read('src/api/anchor/index.ts');
const page = read('src/views/anchor/hall/index.vue');
const anchorEdit = read('src/views/anchor/manage/component/editAnchor.vue');
const group = read('src/views/wechat/group/index.vue');
const mic = read('src/views/anchor/mic/component/editMic.vue');

for (const [source, needle] of [
	[api, '/anchor/hall/list'],
	[api, '/anchor/hall/detail'],
	[api, '/anchor/hall/add'],
	[api, '/anchor/hall/edit'],
	[api, '/anchor/hall/vvScoreSync'],
	[page, '厅 ID'],
	[page, '厅名'],
	[page, '厅管'],
	[page, '厅助理'],
	[page, '关联微信群'],
	[page, '停用后现有关联和历史记录不会被清除'],
	[page, '同步厅健康分'],
	[page, 'sync-type="HALL_SCORE"'],
	[page, 'sortable="custom"'],
	[page, '@sort-change="handleSortChange"'],
	[anchorEdit, '（已停用）'],
	[group, 'defaultHallName'],
	[mic, '（已停用）'],
]) {
	if (!source.includes(needle)) throw new Error(`missing anchor hall contract: ${needle}`);
}
if (page.includes('删除厅') || api.includes('deleteAnchorHall')) throw new Error('hall delete is out of scope');
console.log('anchor hall verifier passed');
