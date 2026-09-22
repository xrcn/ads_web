import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assertOrdered = (source, needles, label) => {
	let previous = -1;
	for (const needle of needles) {
		const current = source.indexOf(needle);
		if (current < 0 || current <= previous) throw new Error(`${label} column order mismatch: ${needle}`);
		previous = current;
	}
};
const api = read('src/api/system/flowData.ts');
const anchorApi = read('src/api/anchor/index.ts');
const login = read('src/views/flowData/login/index.vue');
const income = read('src/views/flowData/anchorIncome/index.vue');
const daily = read('src/views/flowData/daily/index.vue');
const tasks = read('src/views/flowData/tasks/index.vue');
const clubChannel = read('src/views/flowData/clubChannel/index.vue');
const clubAnchorShow = read('src/views/flowData/clubAnchorShow/index.vue');
const clubAnchorActivity = read('src/views/flowData/clubAnchorActivity/index.vue');
const progress = read('src/components/vvSyncProgress/index.vue');
const hall = read('src/views/anchor/hall/index.vue');
const anchors = read('src/views/anchor/manage/index.vue');

for (const [source, needle] of [
	[api, '/api/v1/system/vvAuth/status'],
	[api, '/api/v1/system/flowData/anchorIncome/sync'],
	[api, '/api/v1/system/flowData/anchorIncome/list'],
	[api, '/api/v1/system/flowData/progress'],
	[api, "export type HallSyncScope = 'DAILY' | 'TASK'"],
	[api, "'HALL_DAILY' | 'HALL_TASK'"],
	[api, 'syncFlowData = (scope: HallSyncScope)'],
	[api, 'data: { scope }'],
	[api, 'getFlowDataSummary = (syncType: HallSplitSyncType)'],
	[api, 'params: { syncType }'],
	[api, 'errorMessage: string'],
	[progress, 'setInterval'],
	[progress, 'onUnmounted'],
	[progress, 'onDeactivated'],
	[progress, 'pollingEnabled = false'],
	[progress, 'if (!pollingEnabled) return'],
	[progress, 'catch {'],
	[progress, "!props.active && progress.status !== 'RUNNING'"],
	[progress, '{{ progress.current }}/{{ progress.total }}'],
	[progress, '上次同步已完成'],
	[progress, 'v-if="visible && progress.status"'],
	[progress, "progress.status === 'RUNNING'"],
	[progress, 'visible.value = false'],
	[progress, 'defineEmits<{ progress: [value: VVSyncProgress] }>()'],
	[progress, "emit('progress', { ...progress })"],
	[progress, "errorMessage: ''"],
	[progress, "`同步失败：${progress.errorMessage}`"],
	[income, 'sync-type="ANCHOR_INCOME"'],
	[daily, 'sync-type="HALL_DAILY"'],
	[daily, "getFlowDataSummary('HALL_DAILY')"],
	[daily, "syncFlowData('DAILY')"],
	[daily, '同步每日流水'],
	[daily, '数据已是最新'],
	[tasks, 'sync-type="HALL_TASK"'],
	[tasks, "getFlowDataSummary('HALL_TASK')"],
	[tasks, "syncFlowData('TASK')"],
	[tasks, '同步厅任务'],
	[anchors, 'sync-type="ANCHOR_LIST"'],
	[anchorApi, '/api/v1/system/anchor/vvSync'],
	[anchorApi, 'export interface AnchorVVSyncAccepted'],
	[anchorApi, 'batchId: number'],
	[login, 'type="password"'],
	[login, '当前登录状态'],
	[login, '.vv-login-container :deep(.el-card) { min-height: 0; }'],
	[income, '同步主播收益'],
	[api, 'export interface AnchorIncomeSyncInput'],
	[api, "'BACKFILL_PREVIEW' | 'BACKFILL_APPLY'"],
	[api, 'syncAnchorIncome = (data: AnchorIncomeSyncInput = {})'],
	[income, '回补所选日期'],
	[income, 'ElMessageBox.confirm'],
	[income, "mode: 'BACKFILL_PREVIEW'"],
	[income, "mode: 'BACKFILL_APPLY'"],
	[income, 'missingCount'],
	[income, '回补日期范围不能超过31天'],
	[income, "timeZone: 'Asia/Shanghai'"],
	[income, '批次 ${applied.data.batchId}'],
	[income, '预览批次 ${data.batchId}'],
	[income, 'label="所属厅"'],
	[income, 'placeholder="全部厅"'],
	[income, 'type="daterange"'],
	[income, 'dateRange.value ?? []'],
	[income, '>重置</el-button>'],
	[daily, 'label="所属厅"'],
	[daily, 'placeholder="全部厅"'],
	[daily, 'type="daterange"'],
	[daily, 'dateRange.value ?? []'],
	[daily, '>重置</el-button>'],
	[daily, 'prop="rank"'],
	[daily, 'prop="roomId"'],
	[daily, 'prop="enterRoomNewUser24h"'],
	[daily, 'prop="roomPayNewUser24h"'],
	[daily, 'prop="newUserTotalFlow24h"'],
	[tasks, 'label="所属厅"'],
	[tasks, 'placeholder="全部厅"'],
	[tasks, 'type="daterange"'],
	[tasks, 'dateRange.value ?? []'],
	[tasks, '>重置</el-button>'],
	[tasks, 'prop="hallId"'],
	[tasks, 'prop="roomId"'],
	[api, 'roomId?: string'],
	[api, 'channelId?: string'],
	[clubChannel, "pageSize: 10"],
	[clubChannel, 'table.list = response.data.list ?? []'],
	[clubChannel, 'response.data.summary'],
	[clubChannel, 'prop="rank" label="排名" width="80" />'],
	[clubChannel, 'label="进房新用户人数"'],
	[clubChannel, 'label="新用户送礼人数"'],
	[clubChannel, 'label="新用户送礼流水"'],
	[clubChannel, '流水合计：{{ table.summary.totalFlow || \'0.00\' }}元'],
	[clubChannel, '钻石流水(含福袋)：{{ table.summary.totalLiveDiamond || \'0.00\' }}元'],
	[clubAnchorShow, 'pageSize: 10'],
	[clubAnchorShow, 'prop="rank"'],
	[clubAnchorShow, 'label="频道ID/靓号"'],
	[clubAnchorShow, "channelId: ''"],
	[clubAnchorShow, 'response.data.summary'],
	[clubAnchorShow, '流水合计：{{ table.summary.totalFlow || \'0.00\' }}元'],
	[clubAnchorActivity, 'pageSize: 10'],
	[clubAnchorActivity, 'label="主播回应陌生人招呼率(6h)"'],
	[hall, '健康分'],
	[hall, 'getFlowDataScoreLogs'],
	[anchors, '同步主播'],
	[anchors, '最近成功同步时间'],
	[anchors, '未变化'],
	[anchors, '未返回'],
	[anchors, '冲突'],
	[anchors, 'activeBatchId'],
	[anchors, '同步任务已开始'],
	[anchors, '@progress="handleVVProgress"'],
	[anchors, 'progress.batchId !== activeBatchId.value'],
	[anchors, "progress.status === 'SUCCEEDED'"],
	[anchors, "progress.status === 'FAILED'"],
	[anchors, 'activeBatchId.value = undefined'],
	[anchors, 'Promise.allSettled([loadVVSummary(),loadList()])'],
	[anchors, "summaryResult.status==='fulfilled'"],
	[anchors, "ElMessage.error(progress.errorMessage || '同步失败')"],
]) {
	if (!source.includes(needle)) throw new Error(`missing VV data page contract: ${needle}`);
}
if (/syncVVAnchors[\s\S]*?timeout:\s*180000/.test(anchorApi)) throw new Error('anchor VV sync must use the normal short request timeout');
if (clubChannel.includes('.sort(')) throw new Error('club channel page must preserve backend source ordering');
if (clubAnchorShow.includes('.sort(') || clubAnchorActivity.includes('.sort(')) throw new Error('club anchor pages must preserve backend source ordering');
if (clubAnchorShow.includes('.reduce(') || clubAnchorActivity.includes('.reduce(')) throw new Error('club anchor pages must not aggregate paged rows');
assertOrdered(clubAnchorShow, ['prop="statDate"', 'prop="rank"', 'prop="anchorId"', 'prop="anchorName"', 'prop="roomId"', 'prop="roomName"', 'prop="cuteNumber"', 'prop="totalFlow"', 'prop="totalTimeStr"', 'prop="sendGiftPersonNum"', 'prop="healthScore"'], 'club anchor show');
assertOrdered(clubAnchorActivity, ['prop="statDate"', 'prop="anchorId"', 'prop="anchorName"', 'prop="sayHiNum"', 'prop="sayHiInfoNum"', 'prop="userReplyNum"', 'prop="sayHiToStrangerNum"', 'prop="strangerReplyNum"', 'prop="userSayHiNum"', 'prop="anchorReplyStrangerRate"', 'prop="anchorMomentNum"', 'prop="anchorFansNum"', 'prop="prankNum"'], 'club anchor activity');
for (const forbidden of ['prop="userReplyRate"', 'prop="pkNum"']) {
	if (clubAnchorActivity.includes(forbidden)) throw new Error(`club anchor activity contains forbidden field: ${forbidden}`);
}
if (!clubAnchorActivity.includes("value + '%'")) throw new Error('club anchor activity reply rate must render as a percentage');
if (anchors.includes('当前 VV 登录状态')) throw new Error('anchor list must not expose VV login status');
for (const [source, title] of [[income, '主播收益'], [daily, '厅每日流水'], [tasks, '厅任务流水数据']]) {
	if (source.includes(`<span>${title}</span>`)) throw new Error(`flow data card repeats page title: ${title}`);
}
console.log('VV data pages verifier passed');
