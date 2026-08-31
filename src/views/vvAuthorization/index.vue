<template>
	<div class="vv-authorization-container">
		<el-card shadow="hover" class="mb15">
			<template #header>授权账号</template>
			<el-form :model="accountQuery" inline label-width="80px" class="mb15">
				<el-form-item label="授权账号"><el-input v-model="accountQuery.username" clearable @keyup.enter="searchAccounts" /></el-form-item>
				<el-form-item label="状态"><el-select v-model="accountQuery.status" clearable><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select></el-form-item>
				<el-form-item><el-button type="primary" @click="searchAccounts">查询</el-button><el-button @click="resetAccountQuery">重置</el-button><el-button v-auth="'api/v1/system/vvRobotAuthorizedAccount/add'" type="success" plain @click="openAdd">新增</el-button></el-form-item>
			</el-form>
			<el-table v-loading="accountLoading" :data="accounts" border stripe>
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="username" label="授权账号" min-width="150" />
				<el-table-column prop="displayName" label="显示名称" min-width="150" />
				<el-table-column label="状态" width="100" align="center"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
				<el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
				<el-table-column prop="updatedAt" label="更新时间" min-width="170" />
				<el-table-column label="操作" width="160" fixed="right"><template #default="{ row }"><el-button v-auth="'api/v1/system/vvRobotAuthorizedAccount/edit'" text type="primary" @click="openEdit(row)">编辑</el-button><el-button v-auth="'api/v1/system/vvRobotAuthorizedAccount/status'" text type="primary" @click="toggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button></template></el-table-column>
			</el-table>
			<pagination v-show="accountTotal > 0" v-model:page="accountQuery.pageNum" v-model:limit="accountQuery.pageSize" :total="accountTotal" @pagination="loadAccounts" />
		</el-card>

		<el-card shadow="hover">
			<template #header>登录历史</template>
			<el-form :model="historyQuery" inline label-width="80px" class="mb15">
				<el-form-item label="授权账号"><el-input v-model="historyQuery.username" clearable @keyup.enter="searchHistory" /></el-form-item>
				<el-form-item label="VV账号"><el-input v-model="historyQuery.vvAccount" clearable @keyup.enter="searchHistory" /></el-form-item>
				<el-form-item label="登录时间"><el-date-picker v-model="historyDateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
				<el-form-item><el-button type="primary" @click="searchHistory">查询</el-button><el-button @click="resetHistoryQuery">重置</el-button></el-form-item>
			</el-form>
			<el-table v-loading="historyLoading" :data="history" border stripe>
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="username" label="授权账号" min-width="150" />
				<el-table-column prop="vvAccount" label="VV账号" min-width="150" />
				<el-table-column prop="displayName" label="显示名称" min-width="150" />
				<el-table-column prop="loggedInAt" label="登录时间" min-width="170" />
				<el-table-column prop="clientVersion" label="登录端版本" min-width="180" show-overflow-tooltip />
			</el-table>
			<pagination v-show="historyTotal > 0" v-model:page="historyQuery.pageNum" v-model:limit="historyQuery.pageSize" :total="historyTotal" @pagination="loadHistory" />
		</el-card>

		<el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-form-item label="授权账号" prop="username"><el-input v-model="form.username" /></el-form-item>
				<el-form-item label="授权密码" prop="password"><el-input v-model="form.password" show-password :placeholder="form.id ? '留空保持原密码' : '8 到 72 个字节'" /></el-form-item>
				<el-form-item label="显示名称" prop="displayName"><el-input v-model="form.displayName" /></el-form-item>
				<el-form-item label="状态" prop="status"><el-select v-model="form.status" class="w100"><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select></el-form-item>
				<el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
			</el-form>
			<template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveAccount">保存</el-button></template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
	addAuthorizedAccount,
	changeAuthorizedAccountStatus,
	editAuthorizedAccount,
	listAuthorizedAccounts,
	listVVLoginHistory,
	type AuthorizedAccount,
	type AuthorizedAccountQuery,
	type AuthorizedAccountSave,
	type VVLoginHistory,
	type VVLoginHistoryQuery,
} from '/@/api/vvAuthorization';

defineOptions({ name: 'vvAuthorization' });

const formRef = ref<FormInstance>();
const accountLoading = ref(false);
const historyLoading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增授权账号');
const accounts = ref<AuthorizedAccount[]>([]);
const history = ref<VVLoginHistory[]>([]);
const accountTotal = ref(0);
const historyTotal = ref(0);
const historyDateRange = ref<string[]>([]);

const accountQuery = reactive<AuthorizedAccountQuery>({ username: '', status: '', pageNum: 1, pageSize: 10 });
const historyQuery = reactive<VVLoginHistoryQuery>({ username: '', vvAccount: '', startDate: '', endDate: '', pageNum: 1, pageSize: 10 });
let accountRequestGeneration = 0;
let historyRequestGeneration = 0;

const createForm = (): AuthorizedAccountSave => ({ username: '', password: '', displayName: '', status: 1, remark: '' });
const form = reactive<AuthorizedAccountSave>(createForm());
const passwordByteLength = (value: string) => new TextEncoder().encode(value).byteLength;
const rules: FormRules = {
	username: [{ required: true, message: '授权账号不能为空', trigger: 'blur' }],
	password: [{ validator: (_rule, value, callback) => {
		const passwordValue = String(value ?? '');
		const byteLength = passwordByteLength(passwordValue);
		if ((!form.id && !passwordValue) || (passwordValue && (byteLength < 8 || byteLength > 72))) callback(new Error('授权密码必须为 8 到 72 个字节'));
		else callback();
	}, trigger: 'blur' }],
	displayName: [{ required: true, message: '显示名称不能为空', trigger: 'blur' }],
	status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
};

const loadAccounts = async () => {
	const generation = ++accountRequestGeneration;
	accountLoading.value = true;
	try {
		const response = await listAuthorizedAccounts({ ...accountQuery });
		if (generation !== accountRequestGeneration) return;
		accounts.value = response.data.list ?? [];
		accountTotal.value = response.data.total ?? 0;
	} catch {
	} finally {
		if (generation === accountRequestGeneration) accountLoading.value = false;
	}
};
const searchAccounts = () => { accountQuery.pageNum = 1; void loadAccounts(); };
const loadHistory = async () => {
	const generation = ++historyRequestGeneration;
	[historyQuery.startDate, historyQuery.endDate] = historyDateRange.value || ['', ''];
	historyLoading.value = true;
	try {
		const response = await listVVLoginHistory({ ...historyQuery });
		if (generation !== historyRequestGeneration) return;
		history.value = response.data.list ?? [];
		historyTotal.value = response.data.total ?? 0;
	} catch {
	} finally {
		if (generation === historyRequestGeneration) historyLoading.value = false;
	}
};
const searchHistory = () => { historyQuery.pageNum = 1; void loadHistory(); };
const resetAccountQuery = () => { Object.assign(accountQuery, { username: '', status: '', pageNum: 1, pageSize: 10 }); void loadAccounts(); };
const resetHistoryQuery = () => { Object.assign(historyQuery, { username: '', vvAccount: '', startDate: '', endDate: '', pageNum: 1, pageSize: 10 }); historyDateRange.value = []; void loadHistory(); };
const resetForm = () => { Object.assign(form, createForm()); formRef.value?.clearValidate(); };
const openAdd = () => { resetForm(); dialogTitle.value = '新增授权账号'; dialogVisible.value = true; };
const openEdit = (row: AuthorizedAccount) => { resetForm(); Object.assign(form, row, { password: '' }); dialogTitle.value = '编辑授权账号'; dialogVisible.value = true; };
const saveAccount = async () => {
	if (!formRef.value) return;
	try {
		await formRef.value.validate();
	} catch {
		return;
	}
	saving.value = true;
	const editing = Boolean(form.id);
	const data = { ...form };
	if (data.id && !data.password) delete data.password;
	try {
		await (editing ? editAuthorizedAccount : addAuthorizedAccount)(data);
		ElMessage.success(editing ? '编辑成功' : '新增成功');
		dialogVisible.value = false;
		void loadAccounts();
	} catch {
	} finally {
		saving.value = false;
	}
};
const toggleStatus = async (row: AuthorizedAccount) => {
	const status = row.status === 1 ? 0 : 1;
	const text = status === 1 ? '启用' : '停用';
	try {
		await ElMessageBox.confirm(`确认要${text}授权账号“${row.username}”吗？`, '提示', { type: 'warning' });
		await changeAuthorizedAccountStatus(row.id, status);
		ElMessage.success(`${text}成功`);
		void loadAccounts();
	} catch {
	}
};

onMounted(() => { void loadAccounts(); void loadHistory(); });
</script>
