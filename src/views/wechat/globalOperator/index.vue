<template>
	<div v-auth="'api/v1/system/wechatGlobalOperator/list'" class="wechat-global-operator-container">
		<el-card shadow="hover">
			<template #header>运维白名单</template>
			<el-alert v-if="loadError" :title="loadError" type="error" show-icon class="mb15" @close="loadError = ''" />
			<el-form :model="query" inline class="mb15">
				<el-form-item label="wxid"><el-input v-model="query.wxid" clearable @keyup.enter="search" /></el-form-item>
				<el-form-item label="显示名称"><el-input v-model="query.displayName" clearable @keyup.enter="search" /></el-form-item>
				<el-form-item label="状态"><el-select v-model="query.status" clearable style="width: 120px"><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select></el-form-item>
				<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button><el-button v-auth="'api/v1/system/wechatGlobalOperator/add'" type="success" plain @click="openAdd">新增</el-button></el-form-item>
			</el-form>
			<el-table v-loading="loading" :data="rows" border stripe empty-text="暂无运维白名单记录">
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="wxid" label="wxid" min-width="220" show-overflow-tooltip />
				<el-table-column prop="displayName" label="显示名称" min-width="140" />
				<el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
				<el-table-column label="状态" width="100" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
				<el-table-column prop="updatedAt" label="更新时间" min-width="170" />
				<el-table-column label="操作" width="160" fixed="right"><template #default="{ row }"><el-button v-auth="'api/v1/system/wechatGlobalOperator/edit'" text type="primary" @click="openEdit(row)">编辑</el-button><el-button v-auth="'api/v1/system/wechatGlobalOperator/status'" text type="primary" @click="toggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button></template></el-table-column>
			</el-table>
			<pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
		</el-card>

		<el-dialog v-model="dialogVisible" :title="form.id ? '编辑运维人员' : '新增运维人员'" width="560px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-form-item label="wxid" prop="wxid"><el-input v-model="form.wxid" :disabled="Boolean(form.id)" /></el-form-item>
				<el-form-item label="显示名称" prop="displayName"><el-input v-model="form.displayName" /></el-form-item>
				<el-form-item v-if="!form.id" label="初始状态" prop="status"><el-select v-model="form.status" class="w100"><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select></el-form-item>
				<el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
			</el-form>
			<template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addWechatGlobalOperator, changeWechatGlobalOperatorStatus, editWechatGlobalOperator, listWechatGlobalOperators, type WechatGlobalOperator, type WechatGlobalOperatorQuery, type WechatGlobalOperatorSave } from '/@/api/wechatGlobalOperator';

defineOptions({ name: 'wechatGlobalOperator' });

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const loadError = ref('');
const rows = ref<WechatGlobalOperator[]>([]);
const total = ref(0);
const query = reactive<WechatGlobalOperatorQuery>({ wxid: '', displayName: '', status: '', pageNum: 1, pageSize: 10 });
const emptyForm = (): WechatGlobalOperatorSave => ({ wxid: '', displayName: '', remark: '', status: 1 });
const form = reactive<WechatGlobalOperatorSave>(emptyForm());
const rules: FormRules = {
	wxid: [{ required: true, message: 'wxid 不能为空', trigger: 'blur' }, { max: 128, message: 'wxid 不能超过 128 个字符', trigger: 'blur' }],
	displayName: [{ max: 128, message: '显示名称不能超过 128 个字符', trigger: 'blur' }],
	remark: [{ max: 500, message: '备注不能超过 500 个字符', trigger: 'blur' }],
};
let requestGeneration = 0;

const load = async () => {
	const generation = ++requestGeneration;
	loading.value = true;
	loadError.value = '';
	try {
		const response = await listWechatGlobalOperators({ ...query });
		if (generation !== requestGeneration) return;
		rows.value = response.data.list ?? [];
		total.value = response.data.total ?? 0;
	} catch {
		if (generation === requestGeneration) loadError.value = '运维白名单加载失败，请重试';
	} finally {
		if (generation === requestGeneration) loading.value = false;
	}
};
const search = () => { query.pageNum = 1; void load(); };
const resetQuery = () => { Object.assign(query, { wxid: '', displayName: '', status: '', pageNum: 1, pageSize: 10 }); void load(); };
const openAdd = () => { Object.assign(form, emptyForm()); dialogVisible.value = true; };
const openEdit = (row: WechatGlobalOperator) => { Object.assign(form, row); dialogVisible.value = true; };
const save = async () => {
	if (!formRef.value) return;
	try { await formRef.value.validate(); } catch { return; }
	saving.value = true;
	try {
		if (form.id) await editWechatGlobalOperator({ id: form.id, displayName: form.displayName, remark: form.remark });
		else await addWechatGlobalOperator({ ...form });
		ElMessage.success('保存成功');
		dialogVisible.value = false;
		void load();
	} finally { saving.value = false; }
};
const toggleStatus = async (row: WechatGlobalOperator) => {
	const status = row.status === 1 ? 0 : 1;
	const action = status === 1 ? '启用' : '停用';
	try {
		await ElMessageBox.confirm(`确认${action}“${row.displayName || row.wxid}”吗？`, '提示', { type: 'warning' });
		await changeWechatGlobalOperatorStatus(row.id, status);
		ElMessage.success(`${action}成功`);
		void load();
	} catch { }
};

onMounted(() => { void load(); });
</script>
