<template>
	<el-card shadow="hover" class="room-rank-card">
		<template #header>
			<div class="header">
				<div class="selectors">
					<el-radio-group v-model="kind" size="small" aria-label="榜单类型">
						<el-radio-button value="WEALTH">豪客榜</el-radio-button>
						<el-radio-button value="HEART">心动榜</el-radio-button>
					</el-radio-group>
					<el-radio-group v-model="period" size="small" aria-label="榜单周期">
						<el-radio-button value="DAY">日榜</el-radio-button>
						<el-radio-button value="WEEK">周榜</el-radio-button>
						<el-radio-button value="MONTH">月榜</el-radio-button>
					</el-radio-group>
				</div>
				<div class="actions">
					<span class="refresh-label">智能刷新</span>
					<div class="help-wrap" @mouseenter="helpOpen = true" @mouseleave="helpOpen = false">
						<button
							type="button"
							class="help-button"
							:aria-expanded="helpOpen"
							aria-controls="room-rank-help"
							aria-label="查看数据获取方式"
							@click="helpOpen = !helpOpen"
							@focus="helpOpen = true"
							@blur="helpOpen = false"
						>!</button>
						<div v-show="helpOpen" id="room-rank-help" class="help-popover" role="tooltip">
							<strong>数据获取方式</strong>
							<dl>
								<div><dt>常规时段</dt><dd>每 10 分钟获取一次</dd></div>
								<div><dt>23:50–23:58</dt><dd>每 60 秒获取一次</dd></div>
								<div><dt>23:59:00 / :30</dt><dd>每 30 秒获取一次</dd></div>
								<div><dt>23:59:59</dt><dd>额外执行边界采集</dd></div>
								<div><dt>00:00:02</dt><dd>检查榜单是否已重置</dd></div>
							</dl>
							<p>并行读取全部启用厅的六种榜单；每榜保存独立累计获得值、前 10 名和采集时间。单项失败时保留上次成功数据。</p>
						</div>
					</div>
					<el-button @click="toggleView">{{ view === 'CURRENT' ? '查看上次截榜' : '返回当前榜' }}</el-button>
					<el-button type="primary" :loading="refreshing" :disabled="refreshDisabled" @click="runRefresh">立即刷新</el-button>
				</div>
			</div>
		</template>

		<div class="status-row">
			<span>{{ kindLabel }} · {{ periodLabel }} · {{ view === 'CURRENT' ? '当前周期' : '上次截榜' }}</span>
			<span class="status-detail">{{ collectionStatusText }}</span>
		</div>

		<el-form inline class="filters">
			<el-form-item label="所属厅">
				<el-select v-model="hallId" clearable placeholder="全部厅" style="width: 240px">
					<el-option v-for="hall in halls" :key="hall.hallId" :label="hall.hallName" :value="hall.hallId" />
				</el-select>
			</el-form-item>
			<el-form-item>
				<el-button type="primary" @click="load()">查询</el-button>
				<el-button @click="resetHall">重置</el-button>
			</el-form-item>
		</el-form>

		<el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="error-alert" />

		<el-table v-loading="loading" :data="rows" border stripe empty-text="暂无榜单数据">
			<el-table-column fixed prop="hallName" label="所属厅" width="170">
				<template #default="{ row }">
					<div class="hall-name">{{ row.hallName }}</div>
					<div class="secondary">厅号 {{ row.hallId }}</div>
				</template>
			</el-table-column>
			<el-table-column label="总流水" width="130" align="right">
				<template #default="{ row }"><strong>{{ row.hasData ? formatNumber(row.totalRank) : '-' }}</strong></template>
			</el-table-column>
			<el-table-column v-for="rank in rankColumns" :key="rank.value" :label="rank.label" width="145">
				<template #default="{ row }">
					<div v-if="rankItem(row, rank.value)" class="rank-cell">
						<span>{{ rankItem(row, rank.value)?.userName || '匿名用户' }}</span>
						<span class="score">{{ formatNumber(rankItem(row, rank.value)?.score || '0') }}</span>
					</div>
					<span v-else>-</span>
				</template>
			</el-table-column>
			<el-table-column fixed="right" label="截榜时间" width="185">
				<template #default="{ row }">
					<span :class="{ 'stale-time': row.stale }">{{ row.capturedAt || '-' }}</span>
				</template>
			</el-table-column>
		</el-table>
	</el-card>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getAnchorHallOptions } from '/@/api/anchor';
import {
	getRoomRanks,
	refreshRoomRanks,
	type RoomRankCollectionStatus,
	type RoomRankItem,
	type RoomRankKind,
	type RoomRankPeriod,
	type RoomRankRow,
	type RoomRankView,
} from '/@/api/system/flowData';

defineOptions({ name: 'flowDataRoomRanks' });

const kind = ref<RoomRankKind>('HEART');
const period = ref<RoomRankPeriod>('DAY');
const view = ref<RoomRankView>('CURRENT');
const hallId = ref<number | string>('');
const halls = ref<Array<{ hallId: number; hallName: string }>>([]);
const rows = ref<RoomRankRow[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const helpOpen = ref(false);
const errorMessage = ref('');
const collectionStatus = ref<RoomRankCollectionStatus>({
	status: 'IDLE',
	trigger: '',
	expected: 0,
	succeeded: 0,
	failed: 0,
	startedAt: '',
	finishedAt: '',
	errorMessage: '',
});
let requestVersion = 0;
let refreshTimer: number | undefined;

const rankColumns = [
	{ value: 1, label: '第一名' },
	{ value: 2, label: '第二名' },
	{ value: 3, label: '第三名' },
	{ value: 4, label: '第四名' },
	{ value: 5, label: '第五名' },
	{ value: 6, label: '第六名' },
	{ value: 7, label: '第七名' },
	{ value: 8, label: '第八名' },
	{ value: 9, label: '第九名' },
	{ value: 10, label: '第十名' },
];

const kindLabel = computed(() => kind.value === 'WEALTH' ? '豪客榜' : '心动榜');
const periodLabel = computed(() => ({ DAY: '日榜', WEEK: '周榜', MONTH: '月榜' })[period.value]);
const refreshDisabled = computed(() => refreshing.value || collectionStatus.value.status === 'RUNNING');
const collectionStatusText = computed(() => {
	const status = collectionStatus.value;
	switch (status.status) {
		case 'RUNNING':
			return '正在采集';
		case 'SUCCEEDED':
			return '最近采集成功：' + (status.finishedAt || '-');
		case 'PARTIAL':
			return '最近采集部分成功：' + status.succeeded + '/' + status.expected;
		case 'FAILED':
			return '最近采集失败：' + (status.errorMessage || status.finishedAt || '-');
		default:
			return '尚未采集';
	}
});

const rankItem = (row: RoomRankRow, rank: number): RoomRankItem | undefined => row.items.find((item) => item.rank === rank);
const formatNumber = (value: string) => String(value || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const load = async (showLoading = true) => {
	const version = ++requestVersion;
	if (showLoading) loading.value = true;
	errorMessage.value = '';
	try {
		const response: any = await getRoomRanks({
			rankKind: kind.value,
			rankPeriod: period.value,
			view: view.value,
			hallId: hallId.value || undefined,
		});
		if (version !== requestVersion) return;
		rows.value = response.data.rows ?? [];
		collectionStatus.value = response.data.collectionStatus ?? collectionStatus.value;
	} catch (error) {
		if (version !== requestVersion) return;
		errorMessage.value = error instanceof Error ? error.message : '厅内榜单加载失败';
	} finally {
		if (version === requestVersion) loading.value = false;
	}
};

const loadHalls = async () => {
	const response: any = await getAnchorHallOptions();
	halls.value = response.data.list ?? [];
};

const resetHall = () => {
	hallId.value = '';
	void load();
};

const toggleView = () => {
	view.value = view.value === 'CURRENT' ? 'PREVIOUS' : 'CURRENT';
	void load();
};

const runRefresh = async () => {
	refreshing.value = true;
	errorMessage.value = '';
	try {
		await refreshRoomRanks();
		ElMessage.success('厅内榜单刷新完成');
		await load();
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : '厅内榜单刷新失败';
	} finally {
		refreshing.value = false;
	}
};

const stopPolling = () => {
	if (refreshTimer !== undefined) {
		window.clearInterval(refreshTimer);
		refreshTimer = undefined;
	}
};

const startPolling = () => {
	stopPolling();
	refreshTimer = window.setInterval(() => { void load(false); }, 60_000);
};

watch([kind, period], () => { void load(); });
onMounted(async () => {
	await Promise.allSettled([loadHalls(), load()]);
	startPolling();
});
onActivated(startPolling);
onDeactivated(stopPolling);
onUnmounted(stopPolling);
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.selectors, .actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.refresh-label, .secondary, .status-detail { color: var(--el-text-color-secondary); font-size: 12px; }
.status-row { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.filters { margin-bottom: 2px; }
.error-alert { margin-bottom: 16px; }
.hall-name { font-weight: 500; }
.rank-cell { display: flex; flex-direction: column; gap: 3px; }
.score { color: var(--el-color-primary); font-size: 12px; font-variant-numeric: tabular-nums; }
.stale-time { color: var(--el-color-danger); font-weight: 500; }
.help-wrap { position: relative; display: inline-flex; }
.help-button {
	display: inline-grid;
	place-items: center;
	width: 24px;
	height: 24px;
	padding: 0;
	border: 1px solid var(--el-color-warning);
	border-radius: 50%;
	color: var(--el-color-warning);
	background: var(--el-color-warning-light-9);
	cursor: pointer;
}
.help-popover {
	position: absolute;
	z-index: 20;
	top: 32px;
	right: 0;
	width: 390px;
	padding: 14px 16px;
	border: 1px solid var(--el-border-color-light);
	border-radius: var(--el-border-radius-base);
	color: var(--el-text-color-primary);
	background: var(--el-bg-color-overlay);
	box-shadow: var(--el-box-shadow-light);
}
.help-popover dl { margin: 10px 0; }
.help-popover dl div { display: grid; grid-template-columns: 125px 1fr; gap: 10px; padding: 3px 0; }
.help-popover dt { color: var(--el-text-color-secondary); }
.help-popover dd { margin: 0; }
.help-popover p { margin: 10px 0 0; padding-top: 10px; border-top: 1px solid var(--el-border-color-light); line-height: 1.6; }
@media (max-width: 768px) {
	.header, .status-row { align-items: flex-start; flex-direction: column; }
	.help-popover { right: auto; left: 0; width: min(390px, calc(100vw - 48px)); }
}
</style>
