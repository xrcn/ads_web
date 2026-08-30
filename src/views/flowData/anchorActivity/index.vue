<template>
	<el-card shadow="hover">
		<template #header>
			<div class="header">
				<span class="summary">最近成功同步时间：{{ summary.finishedAt || '-' }}</span>
				<el-button type="warning" :loading="syncing" @click="runSync">同步主播活跃数据</el-button>
			</div>
		</template>
		<VVSyncProgress sync-type="ANCHOR_ACTIVITY" :active="syncing" :loader="getAnchorActivityProgress" />
		<el-form class="filters" inline>
			<el-form-item label="日期范围"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
			<el-form-item label="所属厅"><el-select v-model="query.hallId" clearable placeholder="全部厅" style="width: 220px"><el-option v-for="hall in halls" :key="hall.hallId" :label="hall.hallName" :value="hall.hallId" /></el-select></el-form-item>
			<el-form-item label="主播ID"><el-input v-model="query.anchorId" clearable /></el-form-item>
			<el-form-item label="主播昵称"><el-input v-model="query.anchorName" clearable /></el-form-item>
			<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button></el-form-item>
		</el-form>
		<el-table v-loading="table.loading" :data="table.list" border stripe>
			<el-table-column prop="statDate" label="日期" width="110" />
			<el-table-column prop="anchorId" label="主播ID" width="120" />
			<el-table-column prop="anchorName" label="主播昵称" min-width="150" />
			<el-table-column prop="hallName" label="所属厅" width="130" />
			<el-table-column prop="sayHiNum" label="打招呼人数" width="110" />
			<el-table-column prop="sayHiInfoNum" label="打招呼信息数量" width="135" />
			<el-table-column prop="userReplyNum" label="用户回复人数(6h)" width="145" />
			<el-table-column prop="sayHiToStrangerNum" label="向陌生人打招呼人数" width="160" />
			<el-table-column prop="strangerReplyNum" label="陌生人回复人数" width="130" />
			<el-table-column prop="userSayHiNum" label="用户向主播打招呼人数" width="165" />
			<el-table-column prop="anchorReplyStrangerRate" label="回应陌生人招呼率原始值" width="170" />
			<el-table-column prop="anchorMomentNum" label="发布动态数" width="110" />
			<el-table-column prop="anchorFansNum" label="新增粉丝数" width="110" />
			<el-table-column prop="prankNum" label="被整蛊次数" width="110" />
		</el-table>
		<pagination v-show="table.total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="table.total" @pagination="load" />
	</el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getAnchorActivityHallOptions, getAnchorActivityList, getAnchorActivityProgress, getAnchorActivitySummary, syncAnchorActivity } from '/@/api/system/flowData';
import VVSyncProgress from '/@/components/vvSyncProgress/index.vue';

defineOptions({ name: 'flowDataAnchorActivity' });
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
const halls = ref<any[]>([]);
const dateRange = ref<string[] | null>(routeDateRange() ?? defaultDateRange());
const summary = reactive({ finishedAt: '' });
const query = reactive({ hallId: '' as string | number, anchorId: '', anchorName: '', pageNum: 1, pageSize: 20 });
const table = reactive({ list: [] as any[], total: 0, loading: false });

const load = async () => {
	table.loading = true;
	try {
		const [startDate = '', endDate = ''] = dateRange.value ?? [];
		const response: any = await getAnchorActivityList({ ...query, startDate, endDate });
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
const loadSummary = async () => Object.assign(summary, (await getAnchorActivitySummary() as any).data);
const search = () => { query.pageNum = 1; void load(); };
const resetQuery = () => {
	Object.assign(query, { hallId: '', anchorId: '', anchorName: '', pageNum: 1, pageSize: 20 });
	dateRange.value = defaultDateRange();
	void load();
};
const runSync = async () => {
	syncing.value = true;
	try {
		const response: any = await syncAnchorActivity();
		ElMessage.success(response.data.upToDate ? '数据已是最新' : `同步成功：新增 ${response.data.insertedCount}，更新 ${response.data.updatedCount}`);
		await Promise.all([load(), loadSummary()]);
	} finally {
		syncing.value = false;
	}
};

onMounted(async () => {
	const loadHalls = async () => { halls.value = ((await getAnchorActivityHallOptions()) as any).data.list ?? []; };
	await Promise.allSettled([loadHalls(), load(), loadSummary()]);
});
</script>

<style scoped>
.header { display: flex; justify-content: flex-end; align-items: center; }
.summary { margin-right: 16px; color: var(--el-text-color-secondary); }
.filters :deep(.el-input) { width: 220px; }
</style>
