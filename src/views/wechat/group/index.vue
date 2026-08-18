<template>
	<div class="wechat-robot-group-container">
		<el-card shadow="hover">
			<el-form :model="query" inline label-width="92px" class="mb15">
				<el-form-item label="微信群名称">
					<el-input v-model="query.groupName" placeholder="请输入微信群名称" clearable style="width: 220px" @keyup.enter="loadList" />
				</el-form-item>
				<el-form-item label="微信群wxid">
					<el-input v-model="query.groupWxid" placeholder="请输入微信群wxid" clearable style="width: 220px" @keyup.enter="loadList" />
				</el-form-item>
				<el-form-item label="绑定机器人">
					<el-select v-model="query.wechatRobotAccountId" placeholder="全部" clearable filterable style="width: 220px">
						<el-option v-for="item in accountOptions" :key="item.value" :label="item.label" :value="item.value" />
					</el-select>
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
					<el-button v-auth="'api/v1/system/wechatRobotGroup/add'" type="success" plain @click="openAdd">新增微信群</el-button>
				</el-form-item>
			</el-form>

			<el-table v-loading="loading" :data="list" border stripe>
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="groupName" label="微信群名称" min-width="160" show-overflow-tooltip />
				<el-table-column prop="groupWxid" label="微信群wxid" min-width="180" show-overflow-tooltip />
				<el-table-column prop="robotName" label="绑定机器人" min-width="140" show-overflow-tooltip />
				<el-table-column prop="appId" label="机器人appId" min-width="170" show-overflow-tooltip />
				<el-table-column label="状态" width="100" align="center">
					<template #default="{ row }">
						<el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
				<el-table-column label="操作" width="180" fixed="right">
					<template #default="{ row }">
						<el-button v-auth="'api/v1/system/wechatRobotGroup/edit'" text type="primary" @click="openEdit(row)">编辑</el-button>
						<el-button v-auth="'api/v1/system/wechatRobotGroup/status'" text type="primary" @click="handleToggleStatus(row)">
							{{ row.status === 1 ? '停用' : '启用' }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
		</el-card>

		<el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="绑定机器人" prop="wechatRobotAccountId">
							<el-select v-model="form.wechatRobotAccountId" placeholder="请选择机器人" filterable class="w100">
								<el-option v-for="item in accountOptions" :key="item.value" :label="item.label" :value="item.value" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="微信群wxid" prop="groupWxid">
							<el-input v-model="form.groupWxid" placeholder="请输入微信群wxid" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="微信群名称" prop="groupName">
							<el-input v-model="form.groupName" placeholder="请输入微信群名称" />
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
import { reactive, ref, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addWechatRobotGroup, changeWechatRobotGroupStatus, editWechatRobotGroup, getWechatRobotGroupDetail, getWechatRobotGroupList } from '/@/api/wechatRobotGroup';
import { getWechatRobotAccountOptions } from '/@/api/wechatRobotAccount';

defineOptions({ name: 'wechatRobotGroup' });

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增微信群');
const accountOptions = ref<any[]>([]);

const query = reactive({
	groupName: '',
	groupWxid: '',
	wechatRobotAccountId: '' as string | number,
	status: '' as string | number,
	pageNum: 1,
	pageSize: 10,
});

const list = ref<any[]>([]);
const total = ref(0);

const createForm = () => ({
	id: 0,
	wechatRobotAccountId: '',
	groupWxid: '',
	groupName: '',
	status: 1,
	remark: '',
});

const form = reactive(createForm());

const rules: FormRules = {
	wechatRobotAccountId: [{ required: true, message: '机器人账号不能为空', trigger: 'change' }],
	groupWxid: [{ required: true, message: '微信群wxid不能为空', trigger: 'blur' }],
	groupName: [{ required: true, message: '微信群名称不能为空', trigger: 'blur' }],
	status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
};

const resetForm = () => {
	Object.assign(form, createForm());
	formRef.value?.clearValidate();
};

const loadAccounts = () => {
	getWechatRobotAccountOptions().then((res: any) => {
		accountOptions.value = res.data.list ?? [];
	});
};

const loadList = () => {
	loading.value = true;
	getWechatRobotGroupList(query)
		.then((res: any) => {
			list.value = res.data.list ?? [];
			total.value = res.data.total ?? 0;
		})
		.finally(() => {
			loading.value = false;
		});
};

const resetQuery = () => {
	query.groupName = '';
	query.groupWxid = '';
	query.wechatRobotAccountId = '';
	query.status = '';
	query.pageNum = 1;
	query.pageSize = 10;
	loadList();
};

const openAdd = () => {
	resetForm();
	dialogTitle.value = '新增微信群';
	dialogVisible.value = true;
};

const openEdit = (row: any) => {
	resetForm();
	dialogTitle.value = '编辑微信群';
	getWechatRobotGroupDetail(row.id).then((res: any) => {
		Object.assign(form, res.data.wechatRobotGroup || res.data || {});
		dialogVisible.value = true;
	});
};

const submitForm = () => {
	formRef.value?.validate((valid) => {
		if (!valid) return;
		saving.value = true;
		const request = form.id ? editWechatRobotGroup : addWechatRobotGroup;
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
	ElMessageBox.confirm(`确认要${text}微信群“${row.groupName}”吗？`, '提示', { type: 'warning' })
		.then(() => changeWechatRobotGroupStatus(row.id, nextStatus))
		.then(() => {
			ElMessage.success(text + '成功');
			loadList();
		})
		.catch(() => {});
};

onMounted(() => {
	loadAccounts();
	loadList();
});
</script>
