<template>
	<div class="wechat-contact-info-container">
		<el-card shadow="hover">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-row :gutter="20">
					<el-col :xs="24" :sm="12">
						<el-form-item label="微信账号" prop="accountId">
							<el-select v-model="form.accountId" placeholder="请选择微信账号" filterable class="w100">
								<el-option v-for="item in accountOptions" :key="item.value" :label="item.displayLabel" :value="item.value" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item label="wxid" prop="wxidsText">
							<el-input v-model="form.wxidsText" type="textarea" :rows="4" placeholder="请输入好友或群 wxid；支持换行、逗号或英文分号分隔" />
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item>
							<el-button type="primary" :loading="querying" @click="handleQuery">
								<el-icon><ele-Search /></el-icon>
								查询{{ pageTitle }}
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
				<div class="card-header">返回数据</div>
			</template>
			<el-alert
				v-if="result.statusCode"
				:title="`HTTP ${result.statusCode} ${result.success ? '成功' : '失败'}${result.message ? `：${result.message}` : ''}`"
				:type="result.success ? 'success' : 'error'"
				:closable="false"
				class="mb15"
			/>
			<el-descriptions :column="1" border class="mb15">
				<el-descriptions-item label="请求地址">{{ result.requestUrl || '-' }}</el-descriptions-item>
				<el-descriptions-item label="联系人数量">{{ result.contacts.length }}</el-descriptions-item>
			</el-descriptions>
			<el-table :data="result.contacts" border stripe>
				<el-table-column prop="userName" label="wxid" min-width="170" />
				<el-table-column prop="nickName" label="昵称" min-width="120" />
				<el-table-column prop="alias" label="微信号" min-width="140" />
				<el-table-column prop="remark" label="备注" min-width="120" />
				<el-table-column prop="sex" label="性别" width="80">
					<template #default="scope">{{ sexLabel(scope.row.sex) }}</template>
				</el-table-column>
				<el-table-column label="地区" min-width="150">
					<template #default="scope">{{ [scope.row.country, scope.row.province, scope.row.city].filter(Boolean).join(' / ') || '-' }}</template>
				</el-table-column>
				<el-table-column prop="labelList" label="标签" min-width="120" />
				<el-table-column label="手机号" min-width="150">
					<template #default="scope">{{ scope.row.phoneNumList?.join('，') || '-' }}</template>
				</el-table-column>
				<el-table-column prop="signature" label="签名" min-width="220" show-overflow-tooltip />
			</el-table>
			<div class="raw-response mt15">
				<div class="raw-response__title">原始响应</div>
				<el-input v-model="result.prettyResponse" type="textarea" :rows="14" readonly />
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
import { getWechatApiBriefInfo, getWechatApiDetailInfo } from '/@/api/wechatApi';
import { getWechatRobotAccountOptions } from '/@/api/wechatRobotAccount';

defineOptions({ name: 'wechatContactInfo' });

const route = useRoute();
const formRef = ref<FormInstance>();
const querying = ref(false);
const accountOptions = ref<any[]>([]);
const pageTitle = computed(() => String(route.meta.title || '联系人信息'));
const isDetail = computed(() => route.path.endsWith('/getDetailInfo'));
const form = reactive({ accountId: '', wxidsText: '' });
const result = reactive({ requestUrl: '', statusCode: 0, success: false, message: '', contacts: [] as any[], prettyResponse: '' });
const rules = {
	accountId: [{ required: true, message: '请选择微信账号', trigger: 'change' }],
	wxidsText: [{ required: true, message: '请输入至少一个 wxid', trigger: 'blur' }],
};

const parseWxids = () => form.wxidsText.split(/[\n,，;；]/).map((value) => value.trim()).filter(Boolean);

const loadAccountOptions = () => {
	getWechatRobotAccountOptions().then((res: any) => {
		accountOptions.value = (res.data.list ?? []).map((item: any) => ({
			...item,
			displayLabel: `${item.label}${Number(item.isDefault) === 1 ? '（默认）' : ''}${Number(item.isOnline) === 1 ? '（在线）' : ''}`,
		}));
		const account = accountOptions.value.find((item: any) => Number(item.isDefault) === 1) || accountOptions.value.find((item: any) => Number(item.isOnline) === 1) || accountOptions.value[0];
		if (account) form.accountId = account.value;
	});
};

const handleQuery = () => {
	formRef.value?.validate((valid) => {
		if (!valid) return;
		const wxids = parseWxids();
		if (!wxids.length) {
			ElMessage.warning('请输入至少一个 wxid');
			return;
		}
		querying.value = true;
		const request = isDetail.value ? getWechatApiDetailInfo : getWechatApiBriefInfo;
		request({ accountId: form.accountId, wxids })
			.then((res: any) => {
				const data = res.data ?? {};
				Object.assign(result, {
					requestUrl: data.requestUrl || '',
					statusCode: data.statusCode || 0,
					success: !!data.success,
					message: data.message || '',
					contacts: data.contacts || [],
					prettyResponse: data.response ? JSON.stringify(data.response, null, 2) : data.rawBody || '',
				});
				ElMessage.success(data.success ? '查询完成' : '请求已返回失败结果');
			})
			.finally(() => { querying.value = false; });
	});
};

const resetForm = () => {
	form.wxidsText = '';
	formRef.value?.clearValidate();
	Object.assign(result, { requestUrl: '', statusCode: 0, success: false, message: '', contacts: [], prettyResponse: '' });
};

const sexLabel = (sex: number) => ({ 1: '男', 2: '女' }[Number(sex)] || '未知');

onMounted(loadAccountOptions);
</script>

<style scoped lang="scss">
.wechat-contact-info-container {
	.card-header, .raw-response__title { font-weight: 600; }
	.raw-response__title { margin-bottom: 10px; }
}
</style>
