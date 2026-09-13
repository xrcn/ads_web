import fs from 'node:fs';

const api = fs.readFileSync('src/api/system/flowData.ts', 'utf8');
const page = fs.readFileSync('src/views/flowData/roomRanks/index.vue', 'utf8');

for (const needle of [
	"export type RoomRankKind = 'WEALTH' | 'HEART'",
	"export type RoomRankPeriod = 'DAY' | 'WEEK' | 'MONTH'",
	"export type RoomRankView = 'CURRENT' | 'PREVIOUS'",
	'/api/v1/system/flowData/roomRanks',
	'/api/v1/system/flowData/roomRanks/refresh',
	'interface RoomRankRow',
	'totalRank: string',
	'capturedAt: string',
]) {
	if (!api.includes(needle)) throw new Error("missing room-rank API contract: " + needle);
}

for (const needle of [
	"defineOptions({ name: 'flowDataRoomRanks' })",
	'豪客榜',
	'心动榜',
	'日榜',
	'周榜',
	'月榜',
	'所属厅',
	'总流水',
	'第十名',
	'截榜时间',
	'查看上次截榜',
	'立即刷新',
	'数据获取方式',
	'23:59:59',
	'00:00:02',
	'setInterval',
	'onUnmounted',
	'requestVersion',
	'row.stale',
]) {
	if (!page.includes(needle)) throw new Error("missing room-rank page contract: " + needle);
}

for (const forbidden of ['修正差额', '历史已修正榜', '奖励发放', '奖励结算']) {
	if (page.includes(forbidden)) throw new Error("forbidden room-rank feature: " + forbidden);
}

console.log('VV room ranks verifier passed');
