<template>
	<div class="anchor-mic-container">
		<el-card shadow="hover">
			<div class="anchor-mic-search mb15">
				<el-form :model="query" ref="queryRef" :inline="true" label-width="68px">
					<el-form-item label="开始日期" prop="startDate">
						<el-date-picker v-model="query.startDate" value-format="YYYY-MM-DD" />
					</el-form-item>
					<el-form-item label="结束日期" prop="endDate">
						<el-date-picker v-model="query.endDate" value-format="YYYY-MM-DD" />
					</el-form-item>
					<el-form-item label="主播" prop="anchorInfoId">
						<el-select v-model="query.anchorInfoId" clearable filterable>
							<el-option v-for="item in anchorOptions" :key="item.anchorInfoId" :label="item.nickname" :value="item.anchorInfoId" />
						</el-select>
					</el-form-item>
					<el-form-item label="所属厅" prop="hallId">
						<el-select v-model="query.hallId" clearable>
							<el-option v-for="item in hallOptions" :key="item.hallId" :label="item.hallName" :value="item.hallId" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" @click="loadData">
							<el-icon><ele-Search /></el-icon>
							查询
						</el-button>
						<el-button @click="resetQuery">
							<el-icon><ele-Refresh /></el-icon>
							重置
						</el-button>
						<el-button type="success" plain @click="openAddDialog">
							<el-icon><ele-FolderAdd /></el-icon>
							新增记录
						</el-button>
					</el-form-item>
				</el-form>
			</div>
			<el-row :gutter="15" class="mb15">
				<el-col :xs="12" :sm="6"><el-statistic title="记录数" :value="summary.recordCount" /></el-col>
				<el-col :xs="12" :sm="6"><el-statistic title="作业数量" :value="summary.jobCount" /></el-col>
				<el-col :xs="12" :sm="6"><el-statistic title="主持小时数" :value="summary.hostHours" /></el-col>
				<el-col :xs="12" :sm="6"><el-statistic title="接档小时数" :value="summary.shiftHours" /></el-col>
				<el-col :xs="12" :sm="6"><el-statistic title="总麦序" :value="summary.totalHours" /></el-col>
			</el-row>
			<MicList ref="micListRef" :query="query" />
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import MicList from '/@/views/anchor/mic/component/micList.vue';
import { getAnchorHallOptions } from '/@/api/anchor';
import { getAnchorMicAnchorOptions, getAnchorMicSummary } from '/@/api/anchorMic';

defineOptions({ name: 'anchorMic' });

const queryRef = ref<FormInstance>();
const micListRef = ref();
const anchorOptions = ref<any[]>([]);
const hallOptions = ref<any[]>([]);
const query = reactive({
	startDate: '',
	endDate: '',
	anchorInfoId: '',
	hallId: '',
});
const summary = reactive({
	recordCount: 0,
	jobCount: 0,
	hostHours: 0,
	shiftHours: 0,
	totalHours: 0,
});

const loadAnchorOptions = () => {
	getAnchorMicAnchorOptions().then((res: any) => {
		anchorOptions.value = res.data.list ?? [];
	});
};

const loadHallOptions = () => {
	getAnchorHallOptions().then((res: any) => {
		hallOptions.value = res.data.list ?? [];
	});
};

const loadSummary = () => {
	getAnchorMicSummary(query).then((res: any) => {
		Object.assign(summary, res.data ?? {});
	});
};

const loadList = () => {
	micListRef.value?.loadList();
};

const loadData = () => {
	loadSummary();
	loadList();
};

const openAddDialog = () => {
	micListRef.value?.openAddDialog();
};

const resetQuery = () => {
	queryRef.value?.resetFields();
	loadData();
};

onMounted(() => {
	loadAnchorOptions();
	loadHallOptions();
	loadSummary();
});
</script>
