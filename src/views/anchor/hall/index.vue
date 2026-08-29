<template>
	<div class="anchor-hall-container">
		<el-card shadow="hover">
			<MobileRecordList :data="tableData.list" :loading="tableData.loading" row-key="hallId" filter-summary="全部厅" data-mobile-view="anchor-hall">
				<template #filters>
					<el-form ref="queryRef" :model="query" inline label-width="86px" class="mb15">
						<el-form-item label="厅 ID" prop="hallId"><el-input v-model="query.hallId" clearable placeholder="请输入厅 ID" @keyup.enter="search" /></el-form-item>
						<el-form-item label="厅名" prop="hallName"><el-input v-model="query.hallName" clearable placeholder="请输入厅名" @keyup.enter="search" /></el-form-item>
						<el-form-item label="关联微信群" prop="wechatRobotGroupId">
							<el-select v-model="query.wechatRobotGroupId" clearable filterable placeholder="全部微信群">
								<el-option v-for="group in groupOptions" :key="group.id" :label="groupLabel(group)" :value="group.id" />
							</el-select>
						</el-form-item>
						<el-form-item label="状态" prop="status">
							<el-select v-model="query.status" clearable placeholder="全部状态"><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select>
						</el-form-item>
						<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button><el-button v-auth="'api/v1/system/anchor/hall/add'" type="success" plain @click="openAdd">新增厅</el-button></el-form-item>
					</el-form>
				</template>

				<template #desktop>
					<el-table v-loading="tableData.loading" :data="tableData.list" border stripe>
						<el-table-column prop="hallId" label="厅 ID" min-width="100" />
						<el-table-column prop="hallName" label="厅名" min-width="130" show-overflow-tooltip />
						<el-table-column prop="hallManager" label="厅管" min-width="110"><template #default="{ row }">{{ row.hallManager || '-' }}</template></el-table-column>
						<el-table-column prop="hallAssistant" label="厅助理" min-width="110"><template #default="{ row }">{{ row.hallAssistant || '-' }}</template></el-table-column>
						<el-table-column label="关联微信群" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ hallGroupLabel(row) }}</template></el-table-column>
						<el-table-column label="状态" width="90" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
						<el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip><template #default="{ row }">{{ row.remark || '-' }}</template></el-table-column>
						<el-table-column prop="updatedAt" label="更新时间" min-width="165" />
						<el-table-column label="操作" width="90" fixed="right"><template #default="{ row }"><el-button v-auth="'api/v1/system/anchor/hall/edit'" text type="primary" @click="openEdit(row)">编辑</el-button></template></el-table-column>
					</el-table>
				</template>

				<template #default="{ row }">
					<div class="mobile-record-card__header"><div><h3 class="mobile-record-card__title">{{ row.hallName }}</h3><p class="mobile-record-card__subtitle">厅 ID {{ row.hallId }}</p></div><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></div>
					<dl class="mobile-record-card__fields"><div><dt>厅管</dt><dd>{{ row.hallManager || '-' }}</dd></div><div><dt>厅助理</dt><dd>{{ row.hallAssistant || '-' }}</dd></div><div><dt>关联微信群</dt><dd>{{ hallGroupLabel(row) }}</dd></div></dl>
					<details class="mobile-record-card__details"><summary>查看完整信息</summary><dl class="mobile-record-card__fields"><div><dt>备注</dt><dd>{{ row.remark || '-' }}</dd></div><div><dt>更新时间</dt><dd>{{ row.updatedAt || '-' }}</dd></div></dl></details>
					<div class="mobile-record-card__actions"><el-button v-auth="'api/v1/system/anchor/hall/edit'" type="primary" @click="openEdit(row)">编辑</el-button></div>
				</template>
			</MobileRecordList>

			<pagination v-show="tableData.total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="tableData.total" @pagination="loadList" />
		</el-card>

		<el-dialog v-model="dialogVisible" :title="editing ? '编辑厅' : '新增厅'" width="680px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-row :gutter="20">
					<el-col :span="12"><el-form-item label="厅 ID" prop="hallId"><el-input-number v-model="form.hallId" :min="1" :precision="0" :disabled="editing" class="w100" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="厅名" prop="hallName"><el-input v-model="form.hallName" maxlength="100" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="厅管"><el-input v-model="form.hallManager" maxlength="100" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="厅助理"><el-input v-model="form.hallAssistant" maxlength="100" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="关联微信群"><el-select v-model="form.wechatRobotGroupId" clearable filterable placeholder="允许暂不关联" class="w100"><el-option v-for="group in formGroupOptions" :key="group.id" :label="groupLabel(group)" :value="group.id" /></el-select></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio :value="1">启用</el-radio><el-radio :value="0">停用</el-radio></el-radio-group></el-form-item></el-col>
					<el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item></el-col>
				</el-row>
			</el-form>
			<template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addAnchorHall, editAnchorHall, getAnchorHallDetail, getAnchorHallList } from '/@/api/anchor';
import { getWechatRobotGroupList } from '/@/api/wechatRobotGroup';

defineOptions({ name: 'anchorHall' });

const queryRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const editing = ref(false);
const originalStatus = ref(1);
const saving = ref(false);
const groupOptions = ref<any[]>([]);
const query = reactive({ hallId: '', hallName: '', wechatRobotGroupId: '', status: '' as string | number, pageNum: 1, pageSize: 10 });
const tableData = reactive({ list: [] as any[], total: 0, loading: false });
const emptyForm = () => ({ hallId: undefined as number | undefined, hallName: '', hallManager: '', hallAssistant: '', wechatRobotGroupId: '' as string | number, groupName: '', groupWxid: '', status: 1, remark: '' });
const form = reactive(emptyForm());
const rules: FormRules = {
	hallId: [{ required: true, message: '厅 ID 不能为空', trigger: 'change' }],
	hallName: [{ required: true, message: '厅名不能为空', trigger: 'blur' }],
};

const groupLabel = (group: any) => group.groupName || group.groupWxid || `微信群 ${group.id}`;
const hallGroupLabel = (row: any) => row.groupName || row.groupWxid || '未关联';
const formGroupOptions = computed(() => {
	if (!form.wechatRobotGroupId || groupOptions.value.some((group: any) => group.id === form.wechatRobotGroupId)) return groupOptions.value;
	return [...groupOptions.value, { id: form.wechatRobotGroupId, groupName: form.groupName, groupWxid: form.groupWxid }];
});

const loadGroups = () => getWechatRobotGroupList({ pageNum: 1, pageSize: 1000 }).then((res: any) => { groupOptions.value = res.data.list ?? []; });
const loadList = () => {
	tableData.loading = true;
	return getAnchorHallList(query).then((res: any) => {
		tableData.list = res.data.list ?? [];
		tableData.total = res.data.total ?? 0;
	}).finally(() => { tableData.loading = false; });
};
const search = () => { query.pageNum = 1; loadList(); };
const resetQuery = () => { queryRef.value?.resetFields(); Object.assign(query, { hallId: '', hallName: '', wechatRobotGroupId: '', status: '', pageNum: 1, pageSize: 10 }); loadList(); };
const openAdd = () => { editing.value = false; originalStatus.value = 1; Object.assign(form, emptyForm()); formRef.value?.clearValidate(); dialogVisible.value = true; };
const openEdit = (row: any) => getAnchorHallDetail(row.hallId).then((res: any) => {
	editing.value = true;
	Object.assign(form, res.data);
	form.wechatRobotGroupId = form.wechatRobotGroupId || '';
	originalStatus.value = form.status;
	formRef.value?.clearValidate();
	dialogVisible.value = true;
});

const submit = async () => {
	const valid = await formRef.value?.validate().catch(() => false);
	if (!valid) return;
	if (editing.value && originalStatus.value === 1 && form.status === 0) {
		try {
			await ElMessageBox.confirm('停用后现有关联和历史记录不会被清除，确认停用？', '停用确认', { type: 'warning' });
		} catch {
			return;
		}
	}
	saving.value = true;
	try {
		const request = editing.value ? editAnchorHall : addAnchorHall;
		await request(form);
		ElMessage.success(editing.value ? '厅修改成功' : '厅新增成功');
		dialogVisible.value = false;
		await loadList();
	} finally {
		saving.value = false;
	}
};

onMounted(() => { loadGroups(); loadList(); });
</script>

<style scoped>
.anchor-hall-container :deep(.el-form-item .el-input),
.anchor-hall-container :deep(.el-form-item .el-select) { width: 220px; }
.anchor-hall-container :deep(.el-dialog .el-input),
.anchor-hall-container :deep(.el-dialog .el-select) { width: 100%; }
</style>
