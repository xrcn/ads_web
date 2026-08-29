<template>
	<div class="wechat-robot-account-container">
		<el-card shadow="hover">
			<MobileRecordList :data="list" :loading="loading" row-key="id" filter-summary="当前筛选" data-mobile-view="wechat-account">
			<template #filters>
			<el-form :model="query" inline label-width="80px" class="mb15">
				<el-form-item label="机器人名称">
					<el-input v-model="query.robotName" placeholder="请输入机器人名称" clearable style="width: 220px" @keyup.enter="loadList" />
				</el-form-item>
				<el-form-item label="appId">
					<el-input v-model="query.appId" placeholder="请输入 appId" clearable style="width: 220px" @keyup.enter="loadList" />
				</el-form-item>
				<el-form-item label="wxid">
					<el-input v-model="query.wxid" placeholder="请输入 wxid" clearable style="width: 220px" @keyup.enter="loadList" />
				</el-form-item>
				<el-form-item label="状态">
					<el-select v-model="query.status" placeholder="全部" clearable style="width: 220px">
						<el-option label="启用" :value="1" />
						<el-option label="停用" :value="0" />
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="loadList">查询</el-button>
					<el-button @click="resetQuery">重置</el-button>
					<el-button v-auth="'api/v1/system/wechatRobotAccount/add'" type="success" plain @click="openAdd">新增微信账号</el-button>
				</el-form-item>
			</el-form>
			</template>

			<template #desktop>
			<el-table v-loading="loading" :data="list" border stripe>
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="robotName" label="机器人名称" min-width="140" show-overflow-tooltip />
				<el-table-column prop="appId" label="appId" min-width="170" show-overflow-tooltip />
				<el-table-column prop="wxid" label="wxid" min-width="150" show-overflow-tooltip />
				<el-table-column prop="wechatNo" label="微信号" min-width="150" show-overflow-tooltip />
				<el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip />
				<el-table-column label="是否在线" width="110" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.isOnline === 1" type="success">在线</el-tag>
						<el-tag v-else type="info">离线</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="状态" width="100" align="center">
					<template #default="{ row }">
						<el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="默认" width="90" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.isDefault === 1" type="warning">默认</el-tag>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="updatedAt" label="更新时间" min-width="170" show-overflow-tooltip />
				<el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
				<el-table-column label="操作" width="260" fixed="right">
					<template #default="{ row }">
						<el-button v-auth="'api/v1/system/wechatRobotAccount/edit'" text type="primary" @click="openEdit(row)">编辑</el-button>
						<el-button v-auth="'api/v1/system/wechatRobotAccount/default'" text type="primary" @click="handleDefault(row)">设默认</el-button>
						<el-button v-auth="'api/v1/system/wechatRobotAccount/status'" text type="primary" @click="handleToggleStatus(row)">
							{{ row.status === 1 ? '停用' : '启用' }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>
			</template>
			<template #default="{ row }">
				<div class="mobile-record-card__header"><div><h3 class="mobile-record-card__title">{{ row.robotName || '-' }}</h3><p class="mobile-record-card__subtitle">{{ row.nickname || '-' }}</p></div><el-tag :type="row.isOnline === 1 ? 'success' : 'info'">{{ row.isOnline === 1 ? '在线' : '离线' }}</el-tag></div>
				<dl class="mobile-record-card__fields"><div><dt>appId</dt><dd>{{ row.appId || '-' }}</dd></div><div><dt>wxid</dt><dd>{{ row.wxid || '-' }}</dd></div><div><dt>微信号</dt><dd>{{ row.wechatNo || '-' }}</dd></div></dl>
				<details class="mobile-record-card__details"><summary>查看完整信息</summary><dl class="mobile-record-card__fields"><div><dt>状态</dt><dd>{{ row.status === 1 ? '启用' : '停用' }}</dd></div><div><dt>默认</dt><dd>{{ row.isDefault === 1 ? '默认账号' : '-' }}</dd></div><div><dt>更新时间</dt><dd>{{ row.updatedAt || '-' }}</dd></div><div><dt>备注</dt><dd>{{ row.remark || '-' }}</dd></div></dl></details>
				<div class="mobile-record-card__actions"><el-button v-auth="'api/v1/system/wechatRobotAccount/edit'" type="primary" @click="openEdit(row)">编辑</el-button><el-button v-auth="'api/v1/system/wechatRobotAccount/default'" @click="handleDefault(row)">设默认</el-button><el-dropdown><el-button>更多</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item><el-button v-auth="'api/v1/system/wechatRobotAccount/status'" text @click="handleToggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button></el-dropdown-item></el-dropdown-menu></template></el-dropdown></div>
			</template>
			</MobileRecordList>

			<pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
		</el-card>

		<el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="机器人名称" prop="robotName">
							<el-input v-model="form.robotName" placeholder="请输入机器人名称" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="appId" prop="appId">
							<el-input v-model="form.appId" placeholder="请输入 appId" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="apiToken" prop="apiToken">
							<el-input v-model="form.apiToken" placeholder="请输入 apiToken" show-password />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="baseURL" prop="baseURL">
							<el-input v-model="form.baseURL" placeholder="请输入 baseURL" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="wxid" prop="wxid">
							<el-input v-model="form.wxid" placeholder="可空" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="微信号" prop="wechatNo">
							<el-input v-model="form.wechatNo" placeholder="请输入微信号" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="昵称" prop="nickname">
							<el-input v-model="form.nickname" placeholder="请输入昵称" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="头像" prop="avatar">
							<el-input v-model="form.avatar" placeholder="请输入头像地址" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" placeholder="请选择状态" class="w100">
								<el-option label="启用" :value="1" />
								<el-option label="停用" :value="0" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="默认账号" prop="isDefault">
							<el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" inline-prompt active-text="是" inactive-text="否" />
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="备注" prop="remark">
							<el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, getCurrentInstance } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addWechatRobotAccount, changeWechatRobotAccountStatus, editWechatRobotAccount, getWechatRobotAccountDetail, getWechatRobotAccountList, setDefaultWechatRobotAccount } from '/@/api/wechatRobotAccount';

defineOptions({ name: 'wechatRobotAccount' });

const { proxy } = getCurrentInstance() as any;
const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增微信账号');

const query = reactive({
	robotName: '',
	appId: '',
	wxid: '',
	status: '' as string | number,
	pageNum: 1,
	pageSize: 10,
});

const list = ref<any[]>([]);
const total = ref(0);

const createForm = () => ({
	id: 0,
	robotName: '',
	appId: '',
	apiToken: '',
	baseURL: '',
	wxid: '',
	wechatNo: '',
	nickname: '',
	avatar: '',
	status: 1,
	isDefault: 0,
	remark: '',
});

const form = reactive(createForm());

const rules: FormRules = {
	robotName: [{ required: true, message: '机器人名称不能为空', trigger: 'blur' }],
	appId: [{ required: true, message: 'appId不能为空', trigger: 'blur' }],
	apiToken: [{ required: true, message: 'apiToken不能为空', trigger: 'blur' }],
	baseURL: [{ required: true, message: 'baseURL不能为空', trigger: 'blur' }],
	wechatNo: [{ required: true, message: '微信号不能为空', trigger: 'blur' }],
	status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
};

const resetForm = () => {
	Object.assign(form, createForm());
	formRef.value?.clearValidate();
};

const loadList = () => {
	loading.value = true;
	getWechatRobotAccountList(query)
		.then((res: any) => {
			list.value = res.data.list ?? [];
			total.value = res.data.total ?? 0;
		})
		.finally(() => {
			loading.value = false;
		});
};

const resetQuery = () => {
	query.robotName = '';
	query.appId = '';
	query.wxid = '';
	query.status = '';
	query.pageNum = 1;
	query.pageSize = 10;
	loadList();
};

const openAdd = () => {
	resetForm();
	dialogTitle.value = '新增微信账号';
	dialogVisible.value = true;
};

const openEdit = (row: any) => {
	resetForm();
	dialogTitle.value = '编辑微信账号';
	getWechatRobotAccountDetail(row.id).then((res: any) => {
		Object.assign(form, res.data.wechatRobotAccount || res.data || {});
		dialogVisible.value = true;
	});
};

const submitForm = () => {
	formRef.value?.validate((valid) => {
		if (!valid) return;
		saving.value = true;
		const request = form.id ? editWechatRobotAccount : addWechatRobotAccount;
		request(form)
			.then(() => {
				ElMessage.success(form.id ? '编辑成功' : '新增成功');
				dialogVisible.value = false;
				loadList();
			})
			.finally(() => {
				saving.value = false;
			});
	});
};

const handleToggleStatus = (row: any) => {
	const nextStatus = row.status === 1 ? 0 : 1;
	const text = nextStatus === 1 ? '启用' : '停用';
	ElMessageBox.confirm(`确认要${text}机器人账号“${row.robotName}”吗？`, '提示', { type: 'warning' })
		.then(() => changeWechatRobotAccountStatus(row.id, nextStatus))
		.then(() => {
			ElMessage.success(text + '成功');
			loadList();
		})
		.catch(() => {});
};

const handleDefault = (row: any) => {
	ElMessageBox.confirm(`确认要把“${row.robotName}”设为默认账号吗？`, '提示', { type: 'warning' })
		.then(() => setDefaultWechatRobotAccount(row.id))
		.then(() => {
			ElMessage.success('设置成功');
			loadList();
		})
		.catch(() => {});
};

onMounted(() => {
	loadList();
});
</script>
