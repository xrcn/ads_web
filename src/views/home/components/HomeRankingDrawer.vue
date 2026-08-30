<template>
	<el-drawer :model-value="modelValue" size="min(760px, 100%)" append-to-body @close="emit('update:modelValue', false)">
		<template #header>
			<div>
				<strong>完整榜单</strong>
				<div class="date-range">{{ startDate }} 至 {{ endDate }} · 与首页统计周期一致</div>
			</div>
		</template>
		<el-radio-group v-model="activeType" class="ranking-tabs" @change="changeType">
			<el-radio-button value="HALL_FLOW">厅流水榜</el-radio-button>
			<el-radio-button value="ANCHOR_FLOW">主播流水榜</el-radio-button>
			<el-radio-button value="ANCHOR_ACTIVITY">主播活跃榜</el-radio-button>
		</el-radio-group>
		<el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon>
			<template #default><el-button link type="primary" @click="retry">重试</el-button></template>
		</el-alert>
		<el-table v-loading="loading" :data="list" border stripe class="ranking-table">
			<el-table-column prop="rank" label="排名" width="70" align="center" />
			<template v-if="activeType === 'HALL_FLOW'">
				<el-table-column prop="hallName" label="厅名" min-width="180" />
				<el-table-column prop="hallId" label="厅号" width="100" />
				<el-table-column label="周期流水" width="150" align="right"><template #default="{ row }">{{ formatMoney(row.totalFlow) }}</template></el-table-column>
			</template>
			<template v-else>
				<el-table-column prop="anchorName" label="主播" min-width="150" />
				<el-table-column prop="anchorId" label="主播ID" width="120" />
				<el-table-column prop="hallName" label="所属厅" min-width="130" />
				<el-table-column v-if="activeType === 'ANCHOR_FLOW'" label="周期流水" width="150" align="right"><template #default="{ row }">{{ formatMoney(row.totalFlow) }}</template></el-table-column>
				<template v-else>
					<el-table-column prop="activeDayCount" label="活跃天数" width="95" align="right" />
					<el-table-column label="活跃度" width="90" align="right"><template #default="{ row }">{{ row.activityRate }}%</template></el-table-column>
					<el-table-column prop="sayHiNum" label="打招呼人数" width="110" align="right" />
				</template>
			</template>
		</el-table>
		<el-empty v-if="!loading && !errorMessage && list.length === 0" description="暂无榜单数据" />
		<pagination v-show="total > 0" v-model:page="pageNum" :limit="20" :total="total" layout="total, prev, pager, next, jumper" @pagination="load" />
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getFlowDataHomeRanking, type FlowDataHomeRankingItem, type FlowDataHomeRankingType } from '/@/api/system/flowData';
import { formatDecimalString } from '/@/utils/decimal';

const props = defineProps<{ modelValue: boolean; rankingType: FlowDataHomeRankingType; startDate: string; endDate: string }>();
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>();

const activeType = ref<FlowDataHomeRankingType>(props.rankingType);
const pageNum = ref(1);
const total = ref(0);
const list = ref<FlowDataHomeRankingItem[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const lastSuccessfulType = ref<FlowDataHomeRankingType>(props.rankingType);
const lastSuccessfulPage = ref(1);
const failedType = ref<FlowDataHomeRankingType | null>(null);
const failedPage = ref(1);
let requestToken = 0;

const formatMoney = (value: string) => formatDecimalString(value, 2);

const load = async () => {
	if (!props.modelValue || !props.startDate || !props.endDate) return;
	const token = ++requestToken;
	loading.value = true;
	errorMessage.value = '';
	try {
		const response: any = await getFlowDataHomeRanking({ rankingType: activeType.value, startDate: props.startDate, endDate: props.endDate, pageNum: pageNum.value });
		if (token !== requestToken) return;
		list.value = response.data.list ?? [];
		total.value = response.data.total ?? 0;
		pageNum.value = response.data.pageNum ?? pageNum.value;
		lastSuccessfulType.value = activeType.value;
		lastSuccessfulPage.value = pageNum.value;
		failedType.value = null;
	} catch (error) {
		if (token === requestToken) {
			errorMessage.value = error instanceof Error ? error.message : '完整榜单加载失败';
			failedType.value = activeType.value;
			failedPage.value = pageNum.value;
			activeType.value = lastSuccessfulType.value;
			pageNum.value = lastSuccessfulPage.value;
		}
	} finally {
		if (token === requestToken) loading.value = false;
	}
};

const changeType = () => {
	pageNum.value = 1;
	void load();
};

const retry = () => {
	if (failedType.value) {
		activeType.value = failedType.value;
		pageNum.value = failedPage.value;
	}
	void load();
};

watch(() => [props.modelValue, props.rankingType, props.startDate, props.endDate] as const, ([open, type]) => {
	if (!open) return;
	activeType.value = type;
	pageNum.value = 1;
	void load();
});
</script>

<style scoped>
.date-range { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
.ranking-tabs { margin-bottom: 16px; }
.ranking-table { margin-top: 12px; }
</style>
