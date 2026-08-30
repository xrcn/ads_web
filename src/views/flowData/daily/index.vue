<template>
	<el-card shadow="hover">
		<template #header><div class="header"><span class="summary">最近成功同步时间：{{ summary.finishedAt || '-' }}</span><el-button type="warning" :loading="syncing" @click="runSync">同步厅数据</el-button></div></template>
		<VVSyncProgress sync-type="HALL_DATA" :active="syncing" />
		<el-form inline>
			<el-form-item label="日期范围"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
			<el-form-item label="所属厅"><el-select v-model="query.hallId" clearable placeholder="全部厅" style="width: 220px"><el-option v-for="hall in halls" :key="hall.hallId" :label="hall.hallName" :value="hall.hallId" /></el-select></el-form-item>
			<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button></el-form-item>
		</el-form>
		<el-table v-loading="table.loading" :data="table.list" border stripe><el-table-column prop="statDate" label="日期" width="110"/><el-table-column prop="hallName" label="厅名" min-width="140"/><el-table-column prop="hallId" label="厅号" width="90"/><el-table-column prop="roomId" label="roomId" width="115"/><el-table-column prop="rank" label="排名" width="75"/><el-table-column prop="totalFlow" label="总流水" width="110"/><el-table-column prop="totalLiveDiamond" label="钻石流水" width="110"/><el-table-column prop="enterRoomUser" label="进房人数" width="100"/><el-table-column prop="sendGiftPersonNum" label="送礼人数" width="100"/><el-table-column prop="enterRoomNewUser" label="新进房用户" width="110"/><el-table-column prop="roomPayNewUser" label="新进房送礼" width="110"/><el-table-column prop="enterRoomNewUser24h" label="24h进房新用户" width="130"/><el-table-column prop="roomPayNewUser24h" label="24h新用户送礼" width="130"/><el-table-column prop="newUserTotalFlow24h" label="24h新用户流水" width="130"/></el-table>
		<pagination v-show="table.total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="table.total" @pagination="load" />
	</el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAnchorHallOptions } from '/@/api/anchor';
import { getFlowDataDaily, getFlowDataSummary, syncFlowData } from '/@/api/system/flowData';
import VVSyncProgress from '/@/components/vvSyncProgress/index.vue';

defineOptions({ name: 'flowDataDaily' });
const route = useRoute();
const isDate = (value: unknown): value is string => {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00`);
	return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value;
};
const routeDateRange = () => {
	const { startDate, endDate } = route.query;
	return isDate(startDate) && isDate(endDate) && startDate <= endDate ? [startDate, endDate] : null;
};
const syncing = ref(false);
const halls = ref<any[]>([]);
const dateRange = ref<string[] | null>(routeDateRange());
const summary = reactive({ finishedAt: '' });
const query = reactive({ hallId: '' as string | number, pageNum: 1, pageSize: 20 });
const table = reactive({ list: [] as any[], total: 0, loading: false });
const load = async () => {
	table.loading = true;
	try {
		const [startDate = '', endDate = ''] = dateRange.value ?? [];
		const response: any = await getFlowDataDaily({ ...query, startDate, endDate });
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
const loadSummary = async () => Object.assign(summary, (await getFlowDataSummary() as any).data);
const search = () => { query.pageNum = 1; void load(); };
const resetQuery = () => { Object.assign(query, { hallId: '', pageNum: 1, pageSize: 20 }); dateRange.value = null; void load(); };
const runSync = async () => {
	await ElMessageBox.confirm('确认同步厅数据？', '同步确认', { type: 'warning' });
	syncing.value = true;
	try {
		const response: any = await syncFlowData();
		ElMessage.success(`同步成功：新增 ${response.data.insertedCount}，更新 ${response.data.updatedCount}`);
		await Promise.all([load(), loadSummary()]);
	} finally {
		syncing.value = false;
	}
};
onMounted(async () => {
	const response: any = await getAnchorHallOptions();
	halls.value = response.data.list ?? [];
	await Promise.allSettled([load(), loadSummary()]);
});
</script>

<style scoped>
.header { display: flex; justify-content: flex-end; align-items: center; }
.summary { margin-right: 16px; color: var(--el-text-color-secondary); }
</style>
