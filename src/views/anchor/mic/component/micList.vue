<template>
	<div class="anchor-mic-list-container">
		<el-table :data="tableData.data" style="width: 100%">
			<el-table-column prop="statDate" label="日期" min-width="110" />
			<el-table-column prop="nickname" label="主播昵称" min-width="120" />
			<el-table-column prop="hallName" label="所属厅" min-width="120" />
			<el-table-column prop="hostSlots" label="主持时段" min-width="180" />
			<el-table-column prop="hostHours" label="主持小时数" min-width="100" />
			<el-table-column prop="shiftSlots" label="接档时段" min-width="180" />
			<el-table-column prop="shiftHours" label="接档小时数" min-width="100" />
			<el-table-column prop="totalHours" label="总麦序" min-width="90" />
			<el-table-column prop="jobCount" label="作业数量" min-width="90" />
			<el-table-column prop="remark" label="备注" min-width="180" />
			<el-table-column label="操作" width="100" fixed="right">
				<template #default="scope">
					<el-button size="small" text type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
				</template>
			</el-table-column>
		</el-table>
		<pagination
			v-show="tableData.total > 0"
			:total="tableData.total"
			v-model:page="tableData.param.pageNum"
			v-model:limit="tableData.param.pageSize"
			@pagination="loadList"
		/>
		<EditMic ref="editMicRef" @success="loadList" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import EditMic from '/@/views/anchor/mic/component/editMic.vue';
import { getAnchorMicList } from '/@/api/anchorMic';

defineOptions({ name: 'anchorMicList' });

const props = defineProps({
	query: {
		type: Object,
		default: () => ({}),
	},
});

const state = reactive({
	tableData: {
		data: [] as any[],
		total: 0,
		param: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});

const editMicRef = ref();

const { tableData } = toRefs(state);

const loadList = () => {
	const params = {
		...state.tableData.param,
		...props.query,
	};
	getAnchorMicList(params).then((res: any) => {
		state.tableData.data = res.data.list ?? [];
		state.tableData.total = res.data.total ?? 0;
	});
};

const openAddDialog = () => {
	editMicRef.value?.openDialog();
};

const openEditDialog = (row: any) => {
	editMicRef.value?.openDialog(row);
};

onMounted(() => {
	loadList();
});

defineExpose({
	loadList,
	openAddDialog,
});
</script>
