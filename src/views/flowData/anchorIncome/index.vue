<template>
	<el-card shadow="hover">
		<template #header><div class="header"><span class="summary">最近成功同步时间：{{ summary.finishedAt || '-' }}</span><el-button :loading="backfilling" :disabled="operationBusy" @click="runBackfill">回补所选日期</el-button><el-button type="warning" :loading="syncing" :disabled="operationBusy" @click="runSync">同步主播收益</el-button></div></template>
		<VVSyncProgress sync-type="ANCHOR_INCOME" :active="syncing || applyingBackfill" />
		<el-form class="filters" inline>
			<el-form-item label="日期范围"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
			<el-form-item label="所属厅"><el-select v-model="query.hallId" clearable placeholder="全部厅" style="width: 220px"><el-option v-for="hall in halls" :key="hall.hallId" :label="hall.hallName" :value="hall.hallId" /></el-select></el-form-item>
			<el-form-item label="主播ID"><el-input v-model="query.anchorId" clearable /></el-form-item>
			<el-form-item label="主播昵称"><el-input v-model="query.anchorName" clearable /></el-form-item>
			<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button></el-form-item>
		</el-form>
		<el-table v-loading="table.loading" :data="table.list" border stripe><el-table-column prop="statDate" label="日期" width="110"/><el-table-column prop="anchorId" label="主播ID" width="120"/><el-table-column prop="anchorName" label="主播昵称" min-width="150"/><el-table-column prop="hallName" label="所属厅" width="130"/><el-table-column prop="totalFlow" label="总流水" width="110"/><el-table-column prop="anchorProfit" label="主播总收益" width="110"/><el-table-column prop="totalLiveDiamond" label="收入钻石价值" width="120"/><el-table-column prop="totalBindDiamond" label="绑定钻石价值" width="120"/><el-table-column prop="totalLuckyBagGiftFlow" label="福袋价值" width="100"/><el-table-column prop="unionProfit" label="家族收益" width="100"/><el-table-column prop="anchorOpenFlow" label="个人房流水" width="110"/><el-table-column prop="unionOpenFlow" label="公开厅流水" width="110"/><el-table-column prop="totalTimeText" label="直播总时长" width="130"/></el-table>
		<pagination v-show="table.total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="table.total" @pagination="load" />
	</el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAnchorHallOptions } from '/@/api/anchor';
import { getAnchorIncomeList, getAnchorIncomeSummary, syncAnchorIncome } from '/@/api/system/flowData';
import VVSyncProgress from '/@/components/vvSyncProgress/index.vue';

defineOptions({ name: 'flowDataAnchorIncome' });
const syncing = ref(false);
const backfilling = ref(false);
const applyingBackfill = ref(false);
const operationBusy = computed(() => syncing.value || backfilling.value);
const halls = ref<any[]>([]);
const dateRange = ref<string[] | null>(null);
const summary = reactive({ finishedAt: '' });
const query = reactive({ hallId: '' as string | number, anchorId: '', anchorName: '', pageNum: 1, pageSize: 20 });
const table = reactive({ list: [] as any[], total: 0, loading: false });
const load = async () => {
	table.loading = true;
	try {
		const [startDate = '', endDate = ''] = dateRange.value ?? [];
		const response: any = await getAnchorIncomeList({ ...query, startDate, endDate });
		table.list = response.data.list ?? [];
		table.total = response.data.total ?? 0;
	} finally {
		table.loading = false;
	}
};
const loadSummary = async () => Object.assign(summary, (await getAnchorIncomeSummary() as any).data);
const search = () => { query.pageNum = 1; void load(); };
const resetQuery = () => { Object.assign(query, { hallId: '', anchorId: '', anchorName: '', pageNum: 1, pageSize: 20 }); dateRange.value = null; void load(); };
const runSync = async () => {
	syncing.value = true;
	try {
		const response: any = await syncAnchorIncome();
		ElMessage.success(response.data.upToDate ? '数据已是最新' : `同步成功：新增 ${response.data.insertedCount}，更新 ${response.data.updatedCount}`);
		await Promise.all([load(), loadSummary()]);
	} finally {
		syncing.value = false;
	}
};
const shanghaiDate = (date: Date) => {
	const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map((item) => [item.type, item.value]));
	return `${values.year}-${values.month}-${values.day}`;
};
const validateBackfillRange = () => {
	const [startDate = '', endDate = ''] = dateRange.value ?? [];
	if (!startDate || !endDate) throw new Error('请选择回补日期范围');
	const start = new Date(`${startDate}T00:00:00`);
	const end = new Date(`${endDate}T00:00:00`);
	if (start.getTime() > end.getTime()) throw new Error('开始日期不能晚于结束日期');
	const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
	if (dayCount > 31) throw new Error('回补日期范围不能超过31天');
	const shanghaiNow = new Date(Date.now() - 86400000);
	if (endDate > shanghaiDate(shanghaiNow)) throw new Error('结束日期不能晚于昨天');
	return { startDate, endDate };
};
const runBackfill = async () => {
	let range: { startDate: string; endDate: string };
	try {
		range = validateBackfillRange();
	} catch (error) {
		ElMessage.warning(error instanceof Error ? error.message : '回补日期范围无效');
		return;
	}
	backfilling.value = true;
	try {
		const preview: any = await syncAnchorIncome({ mode: 'BACKFILL_PREVIEW', ...range });
		const data = preview.data;
		if ((data.missingCount ?? 0) === 0) {
			ElMessage.info('所选日期没有缺失数据');
			return;
		}
		await ElMessageBox.confirm(`预览批次 ${data.batchId}：上游 ${data.fetchedCount}，白名单命中 ${data.eligibleCount}，本地已存在 ${data.existingCount}，待回补 ${data.missingCount}，跳过 ${data.skippedCount}。确认只插入缺失记录？`, '确认回补主播收益', { type: 'warning' });
		applyingBackfill.value = true;
		const applied: any = await syncAnchorIncome({ mode: 'BACKFILL_APPLY', ...range });
		ElMessage.success(`回补成功：批次 ${applied.data.batchId}，新增 ${applied.data.insertedCount}`);
		await Promise.all([load(), loadSummary()]);
	} catch (error) {
		if (error !== 'cancel' && error !== 'close') throw error;
	} finally {
		applyingBackfill.value = false;
		backfilling.value = false;
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
.filters :deep(.el-input) { width: 220px; }
</style>
