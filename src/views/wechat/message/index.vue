<template>
	<div class="wechat-message-container">
		<el-card shadow="hover">
			<el-form :model="query" inline label-width="78px" class="mb15">
				<el-form-item label="接收日期">
					<el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
				</el-form-item>
				<el-form-item label="微信群">
					<el-select v-model="query.groupId" clearable filterable placeholder="全部" style="width: 220px">
						<el-option v-for="item in groups" :key="item.id" :label="item.groupName" :value="item.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="发送者">
					<el-input v-model="query.senderWxid" clearable placeholder="请输入发送者wxid" style="width: 220px" />
				</el-form-item>
				<el-form-item label="命令">
					<el-select v-model="query.commandName" clearable placeholder="全部" style="width: 170px">
						<el-option label="排麦" value="QUEUE_SELF" />
						<el-option label="当前麦序" value="CURRENT_QUEUE" />
					</el-select>
				</el-form-item>
				<el-form-item label="状态">
					<el-select v-model="query.status" clearable placeholder="全部" style="width: 170px">
						<el-option v-for="status in statuses" :key="status" :label="status" :value="status" />
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="search">查询</el-button>
					<el-button @click="reset">重置</el-button>
				</el-form-item>
			</el-form>

			<el-table v-loading="loading" :data="list" border stripe>
				<el-table-column prop="receivedAt" label="接收时间" width="170" />
				<el-table-column prop="groupName" label="微信群" min-width="150" show-overflow-tooltip>
					<template #default="{ row }">{{ row.groupName || row.groupWxid }}</template>
				</el-table-column>
				<el-table-column prop="senderWxid" label="发送者wxid" min-width="150" show-overflow-tooltip />
				<el-table-column prop="content" label="消息内容" min-width="180" show-overflow-tooltip />
				<el-table-column prop="commandName" label="命令" width="130">
					<template #default="{ row }">{{ commandLabel(row.commandName) }}</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="120">
					<template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
				</el-table-column>
				<el-table-column prop="replyContent" label="回复内容" min-width="220" show-overflow-tooltip />
				<el-table-column prop="errorMessage" label="错误" min-width="180" show-overflow-tooltip />
				<el-table-column label="操作" width="90" fixed="right">
					<template #default="{ row }"><el-button text type="primary" @click="openDetail(row.id)">详情</el-button></template>
				</el-table-column>
			</el-table>
			<pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
		</el-card>

		<el-dialog v-model="detailVisible" title="微信消息详情" width="860px" destroy-on-close>
			<el-descriptions v-if="detail" :column="2" border>
				<el-descriptions-item label="接收时间">{{ detail.receivedAt }}</el-descriptions-item>
				<el-descriptions-item label="处理时间">{{ detail.processedAt || '-' }}</el-descriptions-item>
				<el-descriptions-item label="微信群">{{ detail.groupName || detail.groupWxid }}</el-descriptions-item>
				<el-descriptions-item label="发送者">{{ detail.senderWxid }}</el-descriptions-item>
				<el-descriptions-item label="消息类型">{{ detail.messageType }}</el-descriptions-item>
				<el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
				<el-descriptions-item label="消息内容" :span="2">{{ detail.content }}</el-descriptions-item>
			</el-descriptions>
			<div class="detail-title">原始回调</div>
			<el-input :model-value="formatJson(detail?.rawPayload)" type="textarea" :rows="10" readonly />
			<div v-for="item in detail?.outbounds || []" :key="item.id">
				<div class="detail-title">出站响应（{{ item.status }}）</div>
				<el-input :model-value="formatJson(item.providerResponse)" type="textarea" :rows="8" readonly />
			</div>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { getWechatMessageDetail, getWechatMessageList } from '/@/api/wechatMessage';
import { getWechatRobotGroupList } from '/@/api/wechatRobotGroup';

defineOptions({ name: 'wechatMessage' });
const statuses = ['RECEIVED', 'PROCESSING', 'PROCESSED', 'IGNORED', 'REPLY_FAILED', 'FAILED'];
const loading = ref(false);
const list = ref<any[]>([]);
const groups = ref<any[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const detailVisible = ref(false);
const detail = ref<any>();
const query = reactive({ groupId: '', senderWxid: '', commandName: '', status: '', pageNum: 1, pageSize: 10 });

const loadList = () => {
	loading.value = true;
	getWechatMessageList({ ...query, startDate: dateRange.value?.[0] || '', endDate: dateRange.value?.[1] || '' })
		.then((res: any) => { list.value = res.data.list ?? []; total.value = res.data.total ?? 0; })
		.finally(() => { loading.value = false; });
};
const search = () => { query.pageNum = 1; loadList(); };
const reset = () => { Object.assign(query, { groupId: '', senderWxid: '', commandName: '', status: '', pageNum: 1, pageSize: 10 }); dateRange.value = []; loadList(); };
const openDetail = (id: number) => getWechatMessageDetail(id).then((res: any) => { detail.value = res.data; detailVisible.value = true; });
const commandLabel = (value: string) => ({ QUEUE_SELF: '排麦', CURRENT_QUEUE: '当前麦序' }[value] || '-');
const statusType = (value: string) => value === 'PROCESSED' ? 'success' : value === 'IGNORED' ? 'info' : value.includes('FAILED') ? 'danger' : 'warning';
const formatJson = (value: string) => { try { return JSON.stringify(JSON.parse(value || '{}'), null, 2); } catch { return value || ''; } };

onMounted(() => {
	getWechatRobotGroupList({ pageNum: 1, pageSize: 1000 }).then((res: any) => { groups.value = res.data.list ?? []; });
	loadList();
});
</script>

<style scoped>
.detail-title { margin: 18px 0 8px; font-weight: 600; }
</style>
