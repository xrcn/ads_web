<template>
	<el-card shadow="hover">
		<template #header>
			<div class="header">
				<span class="summary">最近成功同步时间：{{ summary.finishedAt || '-' }}</span>
				<el-button type="warning" :loading="syncing" @click="runSync">同步俱乐部频道数据</el-button>
			</div>
		</template>
		<VVSyncProgress sync-type="CLUB_CHANNEL" :active="syncing" :loader="getClubChannelProgress" />
		<el-form class="filters" inline>
			<el-form-item label="日期范围"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
			<el-form-item label="频道ID"><el-input v-model="query.roomId" clearable /></el-form-item>
			<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button></el-form-item>
		</el-form>
		<el-table v-loading="table.loading" :data="table.list" border stripe>
			<el-table-column prop="statDate" label="日期" width="110" />
			<el-table-column prop="roomId" label="频道ID" width="120" />
			<el-table-column prop="rank" label="排名" width="80" />
			<el-table-column prop="totalFlow" label="流水(元)" width="120" />
			<el-table-column prop="totalLiveDiamond" label="直播钻石" width="120" />
			<el-table-column prop="enterRoomUser" label="进房人数" width="110" />
			<el-table-column prop="sendGiftPersonNum" label="送礼人数" width="110" />
			<el-table-column prop="enterRoomNewUser" label="进房新用户" width="120" />
			<el-table-column prop="roomPayNewUser" label="付费新用户" width="110" />
			<el-table-column prop="enterRoomNewUser24h" label="24h进房新用户" width="140" />
			<el-table-column prop="roomPayNewUser24h" label="24h付费新用户" width="140" />
			<el-table-column prop="newUserTotalFlow24h" label="24h新用户流水" width="130" />
		</el-table>
		<pagination v-show="table.total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="table.total" @pagination="load" />
	</el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getClubChannelList, getClubChannelProgress, getClubChannelSummary, syncClubChannel } from '/@/api/system/flowData';
import VVSyncProgress from '/@/components/vvSyncProgress/index.vue';

defineOptions({ name: 'flowDataClubChannel' });
const route = useRoute();

const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const defaultDateRange = () => {
	const end = new Date();
	end.setDate(end.getDate() - 1);
	const start = new Date(end);
	start.setDate(start.getDate() - 29);
	return [formatDate(start), formatDate(end)];
};
const isDate = (value: unknown): value is string => {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00`);
	return !Number.isNaN(date.getTime()) && formatDate(date) === value;
};
const routeDateRange = () => {
	const { startDate, endDate } = route.query;
	return isDate(startDate) && isDate(endDate) && startDate <= endDate ? [startDate, endDate] : null;
};

const syncing = ref(false);
const dateRange = ref<string[] | null>(routeDateRange() ?? defaultDateRange());
const summary = reactive({ finishedAt: '' });
const query = reactive({ roomId: '', pageNum: 1, pageSize: 20 });
const table = reactive({ list: [] as any[], total: 0, loading: false });

const load = async () => {
	table.loading = true;
	try {
		const [startDate = '', endDate = ''] = dateRange.value ?? [];
		const response: any = await getClubChannelList({ ...query, startDate, endDate });
		table.list = response.data.list ?? [];
		table.total = response.data.total ?? 0;
	} finally {
		table.loading = false;
	}
};
watch(() => [route.query.startDate, route.query.endDate], () => {
	const range = routeDateRange();
	if (!range || (dateRange.value?.[0] === range[0] && dateRange.value?.[1] === range[1])) return;
	dateRange.value = range;
	query.pageNum = 1;
	void load();
});
const loadSummary = async () => Object.assign(summary, (await getClubChannelSummary() as any).data);
const search = () => { query.pageNum = 1; void load(); };
const resetQuery = () => {
	Object.assign(query, { roomId: '', pageNum: 1, pageSize: 20 });
	dateRange.value = defaultDateRange();
	void load();
};
const runSync = async () => {
	syncing.value = true;
	try {
		const response: any = await syncClubChannel();
		ElMessage.success(response.data.upToDate ? '数据已是最新' : `同步成功：新增 ${response.data.insertedCount}，更新 ${response.data.updatedCount}`);
		await Promise.all([load(), loadSummary()]);
	} finally {
		syncing.value = false;
	}
};

onMounted(async () => {
	await Promise.allSettled([load(), loadSummary()]);
	if (!summary.finishedAt) {
		void runSync();
	}
});
</script>

<style scoped>
.header { display: flex; justify-content: flex-end; align-items: center; }
.summary { margin-right: 16px; color: var(--el-text-color-secondary); }
.filters :deep(.el-input) { width: 220px; }
</style>
