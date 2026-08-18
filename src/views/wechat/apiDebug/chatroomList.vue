<template>
	<div class="wechat-chatroom-list-container">
		<el-card shadow="hover">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px" @submit.prevent>
				<el-row :gutter="20">
					<el-col :xs="24" :sm="12">
						<el-form-item label="微信账号" prop="accountId">
							<el-select v-model="form.accountId" placeholder="请选择微信账号" filterable class="w100">
								<el-option v-for="item in accountOptions" :key="item.value" :label="item.displayLabel" :value="item.value" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item>
							<el-button type="primary" :loading="querying" @click="handleQuery">
								<el-icon><ele-Search /></el-icon>
								获取群列表并补全详情
							</el-button>
							<span class="form-tip">通讯录查询可能耗时较长，群详情会自动按批补全。</span>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</el-card>

		<el-card shadow="hover" class="mt15">
			<template #header><div class="card-header">微信群列表</div></template>
			<el-alert
				v-if="result.statusCode"
				:title="`HTTP ${result.statusCode} ${result.success ? '成功' : '失败'}${result.message ? `：${result.message}` : ''}`"
				:type="result.success ? 'success' : 'error'"
				:closable="false"
				class="mb15"
			/>
			<el-descriptions :column="2" border class="mb15">
				<el-descriptions-item label="请求地址">{{ result.requestUrl || '-' }}</el-descriptions-item>
				<el-descriptions-item label="群数量">{{ result.groups.length }}</el-descriptions-item>
			</el-descriptions>
			<el-table :data="result.groups" border stripe>
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="groupName" label="群名称" min-width="180">
					<template #default="scope">{{ scope.row.groupName || '-' }}</template>
				</el-table-column>
				<el-table-column prop="groupWxid" label="群 ID" min-width="250" />
				<el-table-column label="群备注" min-width="150">
					<template #default="scope">{{ scope.row.detail?.remark || scope.row.brief?.remark || '-' }}</template>
				</el-table-column>
				<el-table-column label="微信号" min-width="150">
					<template #default="scope">{{ scope.row.detail?.alias || scope.row.brief?.alias || '-' }}</template>
				</el-table-column>
				<el-table-column label="详情状态" width="110">
					<template #default="scope"><el-tag :type="scope.row.detail?.userName ? 'success' : 'warning'">{{ scope.row.detail?.userName ? '已补全' : '未返回' }}</el-tag></template>
				</el-table-column>
			</el-table>
			<el-collapse class="mt15">
				<el-collapse-item title="通讯录原始响应" name="contact-list"><el-input v-model="result.contactListRaw" type="textarea" :rows="12" readonly /></el-collapse-item>
				<el-collapse-item title="简要信息原始响应" name="brief"><el-input v-model="result.briefRaw" type="textarea" :rows="12" readonly /></el-collapse-item>
				<el-collapse-item title="详细信息原始响应" name="detail"><el-input v-model="result.detailRaw" type="textarea" :rows="12" readonly /></el-collapse-item>
			</el-collapse>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { fetchWechatApiChatrooms } from '/@/api/wechatApi';
import { getWechatRobotAccountOptions } from '/@/api/wechatRobotAccount';

defineOptions({ name: 'wechatChatroomList' });

const formRef = ref<FormInstance>();
const querying = ref(false);
const accountOptions = ref<any[]>([]);
const form = reactive({ accountId: '' });
const result = reactive({ requestUrl: '', statusCode: 0, success: false, message: '', groups: [] as any[], contactListRaw: '', briefRaw: '', detailRaw: '' });
const rules = { accountId: [{ required: true, message: '请选择微信账号', trigger: 'change' }] };

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
		querying.value = true;
		fetchWechatApiChatrooms({ accountId: form.accountId })
			.then((res: any) => {
				const data = res.data ?? {};
				Object.assign(result, {
					requestUrl: data.requestUrl || '', statusCode: data.statusCode || 0, success: !!data.success, message: data.message || '',
					groups: data.groups || [], contactListRaw: data.contactListRaw || '',
					briefRaw: (data.briefRawBodies || []).join('\n\n'), detailRaw: (data.detailRawBodies || []).join('\n\n'),
				});
				ElMessage.success(data.success ? `查询完成，共 ${result.groups.length} 个群` : '请求已返回失败结果');
			})
			.finally(() => { querying.value = false; });
	});
};

onMounted(loadAccountOptions);
</script>

<style scoped lang="scss">
.wechat-chatroom-list-container {
	.card-header { font-weight: 600; }
	.form-tip { margin-left: 12px; color: var(--el-text-color-secondary); }
}
</style>
