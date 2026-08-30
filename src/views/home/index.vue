<template>
	<div class="home-container">
		<el-card v-if="permissionDenied" shadow="never"><el-empty description="暂无经营数据权限" /></el-card>
		<el-card v-else v-loading="loading" shadow="never">
			<template #header>
				<div class="page-header">
					<div><h3>数据总览</h3><p>所有指标、趋势和排行使用同一统计周期</p></div>
					<div class="date-actions">
						<el-button :type="activePreset === 'yesterday' ? 'primary' : 'default'" :disabled="!yesterdayAvailable" @click="applyPreset('yesterday')">昨日</el-button>
						<el-button :type="activePreset === '7' ? 'primary' : 'default'" @click="applyPreset('7')">近7天</el-button>
						<el-button :type="activePreset === '30' ? 'primary' : 'default'" @click="applyPreset('30')">近30天</el-button>
						<el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" :disabled-date="disabledDate" @change="applyCustomRange" />
					</div>
				</div>
			</template>

			<el-alert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon class="overview-error"><template #default><el-button link type="primary" @click="retryOverview">重试</el-button></template></el-alert>
			<el-empty v-if="!loading && overview && !overview.window.hasData" description="暂无共同完成同步的数据" />

			<template v-if="overview?.window.hasData">
				<el-row :gutter="14" class="kpi-row">
					<el-col :xs="24" :sm="12" :lg="6"><div class="kpi-card"><span>周期总流水</span><strong>¥ {{ formatMoney(overview.metrics.totalFlow) }}</strong><small>厅每日流水汇总</small></div></el-col>
					<el-col :xs="24" :sm="12" :lg="6"><div class="kpi-card"><span>日均流水</span><strong>¥ {{ formatMoney(overview.metrics.averageDailyFlow) }}</strong><small>按已同步完整自然日计算</small></div></el-col>
					<el-col :xs="24" :sm="12" :lg="6"><div class="kpi-card"><span>有流水主播</span><strong>{{ overview.metrics.revenueAnchorCount }} 人</strong><small>周期流水大于0，主播去重</small></div></el-col>
					<el-col :xs="24" :sm="12" :lg="6"><div class="kpi-card"><span>主播活跃率</span><strong>{{ overview.metrics.activeAnchorRate }}%</strong><small>日均活跃主播 {{ overview.metrics.averageDailyActiveAnchorCount }} 人</small></div></el-col>
				</el-row>

				<el-row :gutter="14" class="content-row">
					<el-col :xs="24" :lg="16">
						<div class="panel-card chart-card"><div class="panel-header"><strong>厅流水趋势</strong><el-button v-if="canViewDaily" link type="primary" @click="openDetail('/flowData/daily')">查看每日流水 →</el-button></div><div ref="flowChartRef" class="chart"></div></div>
					</el-col>
					<el-col :xs="24" :lg="8">
						<div class="panel-card"><div class="panel-header"><strong>厅流水 Top 5</strong><el-button v-if="canViewRanking" link type="primary" @click="openRanking('HALL_FLOW')">查看全部 →</el-button></div>
							<el-table :data="overview.hallFlowTop" stripe size="small"><el-table-column type="index" label="排名" width="65" /><el-table-column prop="hallName" label="厅名" min-width="120" /><el-table-column label="周期流水" width="120" align="right"><template #default="{ row }">{{ formatMoney(row.totalFlow) }}</template></el-table-column></el-table>
							<el-empty v-if="overview.hallFlowTop.length === 0" description="暂无厅流水" :image-size="60" />
						</div>
					</el-col>
				</el-row>

				<el-row :gutter="14" class="content-row">
					<el-col :xs="24" :lg="10">
						<div class="panel-card chart-card"><div class="panel-header"><strong>每日活跃主播趋势</strong><el-button v-if="canViewAnchorActivity" link type="primary" @click="openDetail('/flowData/anchorActivity')">查看活跃数据 →</el-button></div><div ref="activeChartRef" class="chart"></div></div>
					</el-col>
					<el-col :xs="24" :lg="14">
						<div class="panel-card"><div class="panel-header"><el-radio-group v-model="anchorTopType" size="small"><el-radio-button value="ANCHOR_FLOW">主播流水榜</el-radio-button><el-radio-button value="ANCHOR_ACTIVITY">主播活跃榜</el-radio-button></el-radio-group><el-button v-if="canViewRanking" link type="primary" @click="openRanking(anchorTopType)">查看全部 →</el-button></div>
							<el-table v-if="anchorTopType === 'ANCHOR_FLOW'" :data="overview.anchorFlowTop" stripe size="small"><el-table-column type="index" label="排名" width="65" /><el-table-column prop="anchorName" label="主播" min-width="130" /><el-table-column prop="hallName" label="所属厅" min-width="120" /><el-table-column label="周期流水" width="125" align="right"><template #default="{ row }">{{ formatMoney(row.totalFlow) }}</template></el-table-column></el-table>
							<el-table v-else :data="overview.anchorActivityTop" stripe size="small"><el-table-column type="index" label="排名" width="65" /><el-table-column prop="anchorName" label="主播" min-width="120" /><el-table-column prop="hallName" label="所属厅" min-width="110" /><el-table-column prop="activeDayCount" label="活跃天数" width="90" align="right" /><el-table-column label="活跃度" width="85" align="right"><template #default="{ row }">{{ row.activityRate }}%</template></el-table-column><el-table-column prop="sayHiNum" label="打招呼人数" width="105" align="right" /></el-table>
							<el-empty v-if="currentAnchorTop.length === 0" description="暂无主播排行" :image-size="60" />
						</div>
					</el-col>
				</el-row>
			</template>
		</el-card>

		<HomeRankingDrawer v-if="canViewRanking" v-model="rankingOpen" :ranking-type="rankingType" :start-date="overview?.window.startDate || ''" :end-date="overview?.window.endDate || ''" />
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { storeToRefs } from 'pinia';
import { auth } from '/@/utils/authFunction';
import { decimalStringToChartNumber, formatDecimalString } from '/@/utils/decimal';
import { useThemeConfig } from '/@/stores/themeConfig';
import { getFlowDataHomeOverview, type FlowDataHomeOverview, type FlowDataHomeOverviewQuery, type FlowDataHomeRankingType } from '/@/api/system/flowData';
import HomeRankingDrawer from './components/HomeRankingDrawer.vue';

defineOptions({ name: 'home' });

type DatePreset = 'yesterday' | '7' | '30' | 'custom';

const router = useRouter();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const canViewDaily = auth('api/v1/system/flowData/daily');
const canViewAnchorActivity = auth('api/v1/system/flowData/anchorActivity/list');
const overview = ref<FlowDataHomeOverview | null>(null);
const loading = ref(false);
const loadError = ref('');
const permissionDenied = ref(false);
const dateRange = ref<string[] | null>(null);
const lastSuccessfulRange = ref<string[] | null>(null);
const activePreset = ref<DatePreset>('7');
const lastSuccessfulPreset = ref<DatePreset>('7');
const anchorTopType = ref<'ANCHOR_FLOW' | 'ANCHOR_ACTIVITY'>('ANCHOR_ACTIVITY');
const rankingOpen = ref(false);
const rankingType = ref<FlowDataHomeRankingType>('ANCHOR_ACTIVITY');
const flowChartRef = ref<HTMLElement>();
const activeChartRef = ref<HTMLElement>();
let flowChart: echarts.ECharts | null = null;
let activeChart: echarts.ECharts | null = null;
let overviewRequestToken = 0;
let failedOverviewRequest: { params: FlowDataHomeOverviewQuery; preset: DatePreset } | null = null;

const currentAnchorTop = computed(() => anchorTopType.value === 'ANCHOR_FLOW' ? overview.value?.anchorFlowTop ?? [] : overview.value?.anchorActivityTop ?? []);
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shiftDate = (value: string, days: number) => { const date = new Date(`${value}T00:00:00`); date.setDate(date.getDate() + days); return formatDate(date); };
const formatMoney = (value: string) => formatDecimalString(value, 2);
const literalYesterday = () => { const date = new Date(); date.setDate(date.getDate() - 1); return formatDate(date); };
const yesterdayAvailable = computed(() => !!overview.value?.window.hasData && literalYesterday() >= overview.value.window.availableStartDate && literalYesterday() <= overview.value.window.availableEndDate);

const disabledDate = (date: Date) => {
	if (!overview.value?.window.hasData) return true;
	const value = formatDate(date);
	return value < overview.value.window.availableStartDate || value > overview.value.window.availableEndDate;
};

const loadOverview = async (params: FlowDataHomeOverviewQuery = {}, preset: DatePreset = activePreset.value) => {
	const token = ++overviewRequestToken;
	const previousPreset = lastSuccessfulPreset.value;
	loading.value = true;
	loadError.value = '';
	try {
		const response: any = await getFlowDataHomeOverview(params);
		if (token !== overviewRequestToken) return;
		overview.value = response.data as FlowDataHomeOverview;
		permissionDenied.value = false;
		failedOverviewRequest = null;
		dateRange.value = overview.value.window.hasData ? [overview.value.window.startDate, overview.value.window.endDate] : null;
		lastSuccessfulRange.value = dateRange.value ? [...dateRange.value] : null;
		activePreset.value = preset;
		lastSuccessfulPreset.value = preset;
		await renderCharts();
	} catch (error) {
		if (token !== overviewRequestToken) return;
		const message = error instanceof Error ? error.message : '数据总览加载失败';
		permissionDenied.value = message === '没有权限';
		loadError.value = permissionDenied.value ? '' : message;
		failedOverviewRequest = { params: { ...params }, preset };
		dateRange.value = lastSuccessfulRange.value ? [...lastSuccessfulRange.value] : null;
		activePreset.value = previousPreset;
	} finally {
		if (token === overviewRequestToken) loading.value = false;
	}
};

const applyPreset = (preset: Exclude<DatePreset, 'custom'>) => {
	if (!overview.value?.window.hasData) return;
	const availableStart = overview.value.window.availableStartDate;
	const availableEnd = overview.value.window.availableEndDate;
	let start = availableEnd;
	if (preset === 'yesterday') start = literalYesterday();
	if (preset === '7') start = shiftDate(availableEnd, -6);
	if (preset === '30') start = shiftDate(availableEnd, -29);
	if (start < availableStart) start = availableStart;
	void loadOverview({ startDate: start, endDate: preset === 'yesterday' ? start : availableEnd }, preset);
};

const applyCustomRange = (range: string[] | null) => {
	if (!range || range.length !== 2) return;
	void loadOverview({ startDate: range[0], endDate: range[1] }, 'custom');
};

const retryOverview = () => {
	if (failedOverviewRequest) {
		void loadOverview(failedOverviewRequest.params, failedOverviewRequest.preset);
		return;
	}
	const [startDate, endDate] = dateRange.value ?? [];
	void loadOverview(startDate && endDate ? { startDate, endDate } : {}, activePreset.value);
};

const chartTextColor = () => themeConfig.value.isIsDark ? '#dadada' : '#606266';
const renderCharts = async () => {
	await nextTick();
	if (!overview.value?.window.hasData) { disposeCharts(); return; }
	const theme = themeConfig.value.isIsDark ? 'dark' : undefined;
	if (flowChartRef.value && !flowChart) flowChart = echarts.init(flowChartRef.value, theme);
	if (activeChartRef.value && !activeChart) activeChart = echarts.init(activeChartRef.value, theme);
	flowChart?.setOption({ backgroundColor: 'transparent', tooltip: { trigger: 'axis', formatter: (params: any) => { const item = Array.isArray(params) ? params[0] : params; const raw = overview.value?.flowTrend[item?.dataIndex]?.totalFlow ?? '0.00'; return `${item?.axisValue ?? ''}<br/>厅流水：¥ ${formatMoney(raw)}`; } }, grid: { top: 20, right: 20, bottom: 30, left: 70 }, xAxis: { type: 'category', data: overview.value.flowTrend.map((item) => item.statDate), axisLabel: { color: chartTextColor() } }, yAxis: { type: 'value', axisLabel: { color: chartTextColor() } }, series: [{ name: '厅流水', type: 'line', smooth: true, areaStyle: {}, data: overview.value.flowTrend.map((item) => decimalStringToChartNumber(item.totalFlow)) }] }, true);
	activeChart?.setOption({ backgroundColor: 'transparent', tooltip: { trigger: 'axis' }, grid: { top: 20, right: 20, bottom: 30, left: 55 }, xAxis: { type: 'category', data: overview.value.activeAnchorTrend.map((item) => item.statDate), axisLabel: { color: chartTextColor() } }, yAxis: { type: 'value', minInterval: 1, axisLabel: { color: chartTextColor() } }, series: [{ name: '活跃主播', type: 'line', smooth: true, data: overview.value.activeAnchorTrend.map((item) => item.activeAnchorCount) }] }, true);
};

const resizeCharts = () => { flowChart?.resize(); activeChart?.resize(); };
const disposeCharts = () => { flowChart?.dispose(); activeChart?.dispose(); flowChart = null; activeChart = null; };
const openRanking = (type: FlowDataHomeRankingType) => { rankingType.value = type; rankingOpen.value = true; };
const openDetail = (path: string) => { if (!overview.value?.window.hasData) return; void router.push({ path, query: { startDate: overview.value.window.startDate, endDate: overview.value.window.endDate } }); };

watch(() => themeConfig.value.isIsDark, () => { disposeCharts(); void renderCharts(); });
const canViewRanking = computed(() => !!overview.value?.window.hasData && !permissionDenied.value);
onMounted(() => { window.addEventListener('resize', resizeCharts); void loadOverview({}, '7'); });
onActivated(resizeCharts);
onBeforeUnmount(() => { overviewRequestToken++; window.removeEventListener('resize', resizeCharts); disposeCharts(); });
</script>

<style scoped lang="scss">
.home-container { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.page-header h3 { margin: 0 0 5px; font-size: 18px; font-weight: 600; }
.page-header p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }
.date-actions { display: flex; justify-content: flex-end; gap: 6px; flex-wrap: wrap; }
.date-actions :deep(.el-date-editor) { width: 250px; }
.overview-error { margin-bottom: 14px; }
.kpi-row { margin-bottom: 14px; }
.kpi-card { min-height: 116px; padding: 18px; border: 1px solid var(--next-border-color-light); border-radius: 6px; background: var(--el-bg-color); }
.kpi-card span, .kpi-card small { display: block; color: var(--el-text-color-secondary); }
.kpi-card strong { display: block; margin: 10px 0 6px; font-size: 25px; font-weight: 600; }
.content-row { margin-bottom: 14px; }
.panel-card { height: 100%; min-height: 330px; padding: 16px; border: 1px solid var(--next-border-color-light); border-radius: 6px; background: var(--el-bg-color); }
.chart-card { min-height: 350px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; min-height: 32px; margin-bottom: 12px; }
.chart { width: 100%; height: 285px; }
@media screen and (max-width: 1200px) { .content-row :deep(.el-col + .el-col), .kpi-row :deep(.el-col:nth-child(n+3)) { margin-top: 14px; } }
@media screen and (max-width: 768px) { .page-header { flex-direction: column; } .date-actions { justify-content: flex-start; } .kpi-row :deep(.el-col + .el-col) { margin-top: 14px; } }
</style>
