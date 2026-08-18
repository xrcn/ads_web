<template>
	<div class="anchor-list-container">
		<el-table :data="tableData.data" style="width: 100%">
			<el-table-column type="index" label="序号" width="60" />
			<el-table-column label="主播头像" width="90" align="center">
				<template #default="scope">
					<el-avatar v-if="scope.row.avatar" :src="getUpFileUrl(scope.row.avatar)" :size="42" />
					<el-avatar v-else :size="42">无</el-avatar>
				</template>
			</el-table-column>
			<el-table-column prop="anchorId" label="主播ID" min-width="120" show-overflow-tooltip />
			<el-table-column prop="nickname" label="主播昵称" min-width="120" show-overflow-tooltip />
			<el-table-column prop="entryDate" label="入职时间" min-width="110" show-overflow-tooltip />
			<el-table-column prop="realName" label="姓名" min-width="100" show-overflow-tooltip />
			<el-table-column prop="mobile" label="手机号" min-width="120" show-overflow-tooltip />
			<el-table-column prop="hallName" label="所属厅" min-width="120" show-overflow-tooltip />
			<el-table-column label="状态" min-width="90" align="center">
				<template #default="scope">
					<el-tag :type="statusMap[scope.row.status]?.type || 'info'">{{ statusMap[scope.row.status]?.label || scope.row.status }}</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="工资卡信息" min-width="120" align="center">
				<template #default="scope">
					<el-button text type="primary" @click="openBankCardDialog(scope.row)">
						{{ scope.row.bankCardCount > 0 ? `${scope.row.bankCardCount}张` : '未录入' }}
					</el-button>
				</template>
			</el-table-column>
			<el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
			<el-table-column label="操作" width="180" fixed="right">
				<template #default="scope">
					<el-button size="small" text type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
					<el-button size="small" text type="primary" @click="openBankCardDialog(scope.row)">工资卡管理</el-button>
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
		<EditAnchor ref="editAnchorRef" :hall-options="hallOptions" @success="loadList" />
		<BankCardDialog ref="bankCardDialogRef" @success="loadList" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, toRefs, watch } from 'vue';
import EditAnchor from '/@/views/anchor/manage/component/editAnchor.vue';
import BankCardDialog from '/@/views/anchor/manage/component/bankCardDialog.vue';
import { getAnchorList } from '/@/api/anchor';
import { getUpFileUrl } from '/@/utils/gfast';

defineOptions({ name: 'anchorList' });

const props = defineProps({
	query: {
		type: Object,
		default: () => ({}),
	},
	hallOptions: {
		type: Array,
		default: () => [],
	},
});

const editAnchorRef = ref();
const bankCardDialogRef = ref();

const statusMap: Record<string, { label: string; type: string }> = {
	normal: { label: '正常', type: 'success' },
	banned: { label: '封号', type: 'danger' },
	left: { label: '离职', type: 'info' },
};

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

const { tableData } = toRefs(state);

const normalizeDate = (value: string) => {
	if (!value) return '';
	return value.substring(0, 10);
};

const loadList = () => {
	const params = {
		...state.tableData.param,
		...props.query,
	};
	getAnchorList(params).then((res: any) => {
		const list = res.data.list ?? [];
		state.tableData.data = list.map((item: any) => ({
			...item,
			entryDate: normalizeDate(item.entryDate || ''),
			leaveDate: normalizeDate(item.leaveDate || ''),
		}));
		state.tableData.total = res.data.total ?? 0;
	});
};

const openAddDialog = () => {
	editAnchorRef.value?.openDialog();
};

const openEditDialog = (row: any) => {
	editAnchorRef.value?.openDialog(row);
};

const openBankCardDialog = (row: any) => {
	bankCardDialogRef.value?.openDialog(row);
};

watch(
	() => props.query,
	() => {
		state.tableData.param.pageNum = 1;
		loadList();
	},
	{ deep: true }
);

onMounted(() => {
	loadList();
});

defineExpose({
	loadList,
	openAddDialog,
});
</script>
