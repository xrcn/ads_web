<template>
	<div class="bank-card-dialog">
		<el-dialog v-model="visible" :title="`${currentAnchor.nickname || ''} 工资卡管理`" width="900px">
			<div class="mb15">
				<el-button type="primary" @click="openAddDialog">新增工资卡</el-button>
			</div>
			<el-table :data="list">
				<el-table-column type="index" label="序号" width="60" />
				<el-table-column prop="accountName" label="开户人" min-width="110" />
				<el-table-column prop="idCardNoMasked" label="身份证号" min-width="160" />
				<el-table-column prop="bankName" label="开户行" min-width="140" />
				<el-table-column prop="bankBranch" label="支行名称" min-width="140" />
				<el-table-column prop="bankCardNoMasked" label="银行卡号" min-width="170" />
				<el-table-column label="默认卡" width="90" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.isDefault === 1" type="success">是</el-tag>
						<el-tag v-else type="info">否</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="状态" width="90" align="center">
					<template #default="scope">
						<el-tag :type="scope.row.status === 'enabled' ? 'success' : 'info'">
							{{ scope.row.status === 'enabled' ? '启用' : '停用' }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
				<el-table-column label="操作" width="220" fixed="right">
					<template #default="scope">
						<el-button size="small" text type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
						<el-button size="small" text type="primary" @click="setDefault(scope.row)" :disabled="scope.row.isDefault === 1">设为默认</el-button>
						<el-button size="small" text type="primary" @click="toggleStatus(scope.row)">
							{{ scope.row.status === 'enabled' ? '停用' : '启用' }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>
			<EditBankCard ref="editBankCardRef" @success="handleChildSuccess" />
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import EditBankCard from '/@/views/anchor/manage/component/editBankCard.vue';
import { changeAnchorBankCardStatus, getAnchorBankCardList, setAnchorBankCardDefault } from '/@/api/anchor';

defineOptions({ name: 'bankCardDialog' });

const emit = defineEmits(['success']);
const editBankCardRef = ref();
const visible = ref(false);
const list = ref<any[]>([]);
const currentAnchor = reactive({
	profileId: 0,
	anchorInfoId: 0,
	nickname: '',
});

const loadList = () => {
	if (!currentAnchor.profileId && !currentAnchor.anchorInfoId) return;
	getAnchorBankCardList({ profileId: currentAnchor.profileId, anchorInfoId: currentAnchor.anchorInfoId }).then((res: any) => {
		list.value = res.data.list ?? [];
	});
};

const openDialog = (row: any) => {
	currentAnchor.profileId = row.profileId || 0;
	currentAnchor.anchorInfoId = row.anchorInfoId || 0;
	currentAnchor.nickname = row.nickname;
	visible.value = true;
	loadList();
};

const openAddDialog = () => {
	editBankCardRef.value?.openDialog({ ...currentAnchor });
};

const openEditDialog = (row: any) => {
	editBankCardRef.value?.openDialog({ ...currentAnchor }, row);
};

const setDefault = (row: any) => {
	setAnchorBankCardDefault(row.id).then(() => {
		ElMessage.success('默认工资卡设置成功');
		loadList();
		emit('success');
	});
};

const toggleStatus = (row: any) => {
	const status = row.status === 'enabled' ? 'disabled' : 'enabled';
	changeAnchorBankCardStatus({ id: row.id, status }).then(() => {
		ElMessage.success(status === 'enabled' ? '工资卡已启用' : '工资卡已停用');
		loadList();
		emit('success');
	});
};

const handleChildSuccess = () => {
	loadList();
	emit('success');
};

defineExpose({ openDialog });
</script>
