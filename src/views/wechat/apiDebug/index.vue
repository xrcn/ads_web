<template>
	<div class="wechat-api-debug-container">
		<el-card shadow="hover">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="132px">
				<el-row :gutter="20">
					<el-col :xs="24" :sm="12">
						<el-form-item label="微信账号">
							<el-select
								v-model="selectedAccountId"
								placeholder="请选择微信账号"
								clearable
								filterable
								class="w100"
								@change="handleAccountChange"
							>
								<el-option
									v-for="item in accountOptions"
									:key="item.value"
									:label="item.displayLabel"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="baseURL" prop="baseURL">
							<el-input v-model="form.baseURL" placeholder="留空则使用服务端配置" clearable />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="apiToken" prop="apiToken">
							<el-input v-model="form.apiToken" placeholder="留空则使用服务端配置" clearable show-password />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="appId" prop="appId">
							<el-input v-model="form.appId" placeholder="请输入 appId" clearable />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="toWxid" prop="toWxid">
							<el-input v-model="form.toWxid" placeholder="请输入好友或群ID" clearable />
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item label="content" prop="content">
							<el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入消息内容" />
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item label="ats">
							<el-input v-model="form.ats" placeholder="可选，多个英文逗号分隔，群主或管理员全部 @ 时填 notify@all" clearable />
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item>
							<el-button type="primary" :loading="sending" @click="handleSend">
								<el-icon><ele-Position /></el-icon>
								发送文字消息
							</el-button>
							<el-button @click="resetForm">
								<el-icon><ele-Refresh /></el-icon>
								重置
							</el-button>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</el-card>

		<el-card shadow="hover" class="mt15">
			<template #header>
				<div class="card-header">响应结果</div>
			</template>
			<el-alert
				v-if="result.statusCode"
				:title="`HTTP ${result.statusCode} ${result.success ? '成功' : '失败'}`"
				:type="result.success ? 'success' : 'error'"
				:closable="false"
				class="mb15"
			/>
			<el-descriptions :column="1" border>
				<el-descriptions-item label="请求地址">{{ result.requestUrl || '-' }}</el-descriptions-item>
				<el-descriptions-item label="原始响应">
					<el-input v-model="result.rawBody" type="textarea" :rows="12" readonly />
				</el-descriptions-item>
				<el-descriptions-item label="格式化响应">
					<el-input v-model="result.prettyResponse" type="textarea" :rows="16" readonly />
				</el-descriptions-item>
			</el-descriptions>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { postWechatApiText } from '/@/api/wechatApi';
import { getWechatRobotAccountOptions } from '/@/api/wechatRobotAccount';

defineOptions({ name: 'wechatApiDebug' });

const formRef = ref<FormInstance>();
const sending = ref(false);
const accountOptions = ref<any[]>([]);
const selectedAccountId = ref<string | number>('');

const createForm = () => ({
	baseURL: '',
	apiToken: '',
	appId: '',
	toWxid: '',
	content: '',
	ats: '',
});

const form = reactive(createForm());
const result = reactive({
	requestUrl: '',
	statusCode: 0,
	success: false,
	rawBody: '',
	prettyResponse: '',
});

const rules = {
	appId: [{ required: true, message: 'appId不能为空', trigger: 'blur' }],
	toWxid: [{ required: true, message: 'toWxid不能为空', trigger: 'blur' }],
	content: [{ required: true, message: '消息内容不能为空', trigger: 'blur' }],
};

const applyAccountOption = (accountId: string | number) => {
	const option = accountOptions.value.find((item: any) => String(item.value) === String(accountId));
	if (!option) {
		form.baseURL = '';
		form.apiToken = '';
		form.appId = '';
		return;
	}
	form.baseURL = option.baseURL || '';
	form.apiToken = option.apiToken || '';
	form.appId = option.appId || '';
};

const handleAccountChange = (accountId: string | number | undefined) => {
	if (!accountId) {
		applyAccountOption('');
		return;
	}
	applyAccountOption(accountId);
};

const loadAccountOptions = () => {
	getWechatRobotAccountOptions().then((res: any) => {
		accountOptions.value = (res.data.list ?? []).map((item: any) => ({
			...item,
			displayLabel: `${item.label}${Number(item.isDefault) === 1 ? '（默认）' : ''}${Number(item.isOnline) === 1 ? '（在线）' : ''}`,
		}));
		const defaultAccount = accountOptions.value.find((item: any) => Number(item.isDefault) === 1) || accountOptions.value.find((item: any) => Number(item.isOnline) === 1) || accountOptions.value[0];
		if (defaultAccount) {
			selectedAccountId.value = defaultAccount.value;
			applyAccountOption(defaultAccount.value);
		}
	});
};

const resetForm = () => {
	Object.assign(form, createForm());
	selectedAccountId.value = '';
	formRef.value?.clearValidate();
	Object.assign(result, {
		requestUrl: '',
		statusCode: 0,
		success: false,
		rawBody: '',
		prettyResponse: '',
	});
};

const handleSend = () => {
	formRef.value?.validate((valid) => {
		if (!valid) return;
		sending.value = true;
		postWechatApiText(form)
			.then((res: any) => {
				const data = res.data ?? {};
				Object.assign(result, {
					requestUrl: data.requestUrl || '',
					statusCode: data.statusCode || 0,
					success: !!data.success,
					rawBody: data.rawBody || '',
					prettyResponse: data.response ? JSON.stringify(data.response, null, 2) : '',
				});
				ElMessage.success(data.success ? '消息发送完成' : '请求已返回失败结果');
			})
			.finally(() => {
				sending.value = false;
			});
	});
};

onMounted(() => {
	loadAccountOptions();
});
</script>

<style scoped lang="scss">
.wechat-api-debug-container {
	.card-header {
		font-weight: 600;
	}
}
</style>
