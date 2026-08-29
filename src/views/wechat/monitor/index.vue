<template>
	<div v-auth="'api/v1/system/wechatMonitor/overview'" class="wechat-monitor-container">
		<el-card shadow="hover" class="mb15">
			<template #header>
				<div class="card-header">
					<span>监控配置</span>
					<div>
						<el-button v-auth="'api/v1/system/wechatMonitor/checkNow'" type="primary" :loading="checking" @click="handleCheckNow">立即检查</el-button>
						<el-button v-auth="'api/v1/system/wechatMonitor/testAlert'" :loading="testingAlert" @click="handleTestAlert">发送测试告警</el-button>
						<el-button v-auth="'api/v1/system/wechatMonitor/config'" type="success" :loading="saving" :disabled="!configReady || saving" @click="saveConfig">保存配置</el-button>
					</div>
				</div>
			</template>

			<el-form :model="configForm" :disabled="!configReady || saving" inline label-width="112px">
				<el-form-item label="启用监控">
					<el-switch v-model="configForm.enabled" :active-value="1" :inactive-value="0" inline-prompt active-text="是" inactive-text="否" />
				</el-form-item>
				<el-form-item label="检查间隔">
					<el-input-number v-model="configForm.checkIntervalSeconds" :min="30" :step="30" controls-position="right" />
					<span class="form-suffix">秒</span>
				</el-form-item>
				<el-form-item label="未知状态阈值">
					<el-input-number v-model="configForm.unknownAlertThreshold" :min="1" controls-position="right" />
					<span class="form-suffix">次</span>
				</el-form-item>
				<el-form-item label="告警机器人">
					<el-select v-model="configForm.alertRobotAccountId" clearable filterable placeholder="请选择告警机器人" style="width: 220px" @change="handleAlertRobotChange">
						<el-option v-for="item in accountOptions" :key="item.value" :label="item.label" :value="item.value" />
					</el-select>
				</el-form-item>
				<el-form-item label="告警群">
					<el-select v-model="configForm.alertGroupId" clearable filterable placeholder="请选择告警群" style="width: 220px" :disabled="!configForm.alertRobotAccountId">
						<el-option v-for="item in groupOptions" :key="item.id" :label="item.groupName || item.groupWxid" :value="item.id" />
					</el-select>
				</el-form-item>
			</el-form>
			<el-divider content-position="left">发送防封设置</el-divider>
			<el-form :model="configForm" :disabled="!configReady || saving" inline label-width="112px">
				<el-form-item label="启用随机延迟">
					<el-switch v-model="configForm.sendJitterEnabled" :active-value="1" :inactive-value="0" inline-prompt active-text="开" inactive-text="关" />
				</el-form-item>
				<el-form-item label="最小延迟">
					<el-input-number v-model="configForm.sendJitterMinMs" :min="0" :max="5000" :disabled="configForm.sendJitterEnabled !== 1" controls-position="right" />
					<span class="form-suffix">毫秒</span>
				</el-form-item>
				<el-form-item label="最大延迟">
					<el-input-number v-model="configForm.sendJitterMaxMs" :min="0" :max="5000" :disabled="configForm.sendJitterEnabled !== 1" controls-position="right" />
					<span class="form-suffix">毫秒</span>
				</el-form-item>
				<el-form-item><span class="form-suffix">开启后仅生产机器人文本发送生效；同一机器人串行随机等待。</span></el-form-item>
			</el-form>
			<el-divider content-position="left">群成员同步</el-divider>
			<el-form :model="configForm" :disabled="!configReady || saving" inline label-width="112px">
				<el-form-item label="兜底同步间隔">
					<el-input-number v-model="configForm.memberSyncFallbackIntervalMinutes" :min="30" :max="1440" :step="30" controls-position="right" />
					<span class="form-suffix">分钟（默认 360 分钟）</span>
				</el-form-item>
				<el-form-item><span class="form-suffix">仅同步启用且已绑定机器人的微信群；成员变更回调仍会优先触发同步。</span></el-form-item>
			</el-form>
		</el-card>

		<el-row :gutter="15" class="mb15">
			<el-col :xs="12" :sm="8" :md="4"><el-card shadow="hover"><el-statistic title="机器人总数" :value="overview.accountCount" /></el-card></el-col>
			<el-col :xs="12" :sm="8" :md="4"><el-card shadow="hover"><el-statistic title="在线" :value="overview.onlineCount" :value-style="{ color: 'var(--el-color-success)' }" /></el-card></el-col>
			<el-col :xs="12" :sm="8" :md="4"><el-card shadow="hover"><el-statistic title="离线" :value="overview.offlineCount" :value-style="{ color: 'var(--el-color-danger)' }" /></el-card></el-col>
			<el-col :xs="12" :sm="8" :md="4"><el-card shadow="hover"><el-statistic title="未知" :value="overview.unknownCount" :value-style="{ color: 'var(--el-color-warning)' }" /></el-card></el-col>
			<el-col :xs="12" :sm="8" :md="4"><el-card shadow="hover"><el-statistic title="未恢复事件" :value="overview.openEventCount" /></el-card></el-col>
		</el-row>

		<el-card shadow="hover" class="mb15">
			<template #header><span>机器人状态</span></template>
			<MobileRecordList :data="overview.accounts" :loading="overviewLoading" row-key="id" data-mobile-view="wechat-monitor-accounts"><template #desktop><el-table v-loading="overviewLoading" :data="overview.accounts" border stripe>
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="robotName" label="机器人名称" min-width="140" show-overflow-tooltip />
				<el-table-column prop="wechatNo" label="微信号" min-width="140" show-overflow-tooltip />
				<el-table-column label="健康状态" width="110" align="center">
					<template #default="{ row }"><el-tag :type="healthTagType(row.healthStatus)">{{ healthLabel(row.healthStatus) }}</el-tag></template>
				</el-table-column>
				<el-table-column prop="consecutiveFailures" label="连续失败" width="100" align="center" />
				<el-table-column label="离线时长" min-width="120"><template #default="{ row }">{{ formatDuration(row.offlineSince) }}</template></el-table-column>
				<el-table-column label="最后检查" min-width="170"><template #default="{ row }">{{ formatTime(row.lastCheckedAt) }}</template></el-table-column>
				<el-table-column label="最后重连" min-width="170"><template #default="{ row }">{{ formatTime(row.lastReconnectAt) }}</template></el-table-column>
				<el-table-column label="Callback 配置时间" min-width="180"><template #default="{ row }">{{ formatTime(row.callbackConfiguredAt) }}</template></el-table-column>
				<el-table-column prop="callbackError" label="Callback 错误" min-width="200" show-overflow-tooltip>
					<template #default="{ row }">{{ row.callbackError || '-' }}</template>
				</el-table-column>
			</el-table></template><template #default="{ row }"><div class="mobile-record-card__header"><h3 class="mobile-record-card__title">{{ row.robotName }}</h3><el-tag :type="healthTagType(row.healthStatus)">{{ healthLabel(row.healthStatus) }}</el-tag></div><dl class="mobile-record-card__fields"><div><dt>微信号</dt><dd>{{ row.wechatNo || '-' }}</dd></div><div><dt>连续失败</dt><dd>{{ row.consecutiveFailures }}</dd></div><div><dt>最后检查</dt><dd>{{ formatTime(row.lastCheckedAt) }}</dd></div><div><dt>Callback</dt><dd>{{ formatTime(row.callbackConfiguredAt) }}</dd></div></dl><details class="mobile-record-card__details"><summary>查看完整状态</summary><dl class="mobile-record-card__fields"><div><dt>离线时长</dt><dd>{{ formatDuration(row.offlineSince) }}</dd></div><div><dt>最后重连</dt><dd>{{ formatTime(row.lastReconnectAt) }}</dd></div><div><dt>Callback 错误</dt><dd>{{ row.callbackError || '-' }}</dd></div></dl></details></template></MobileRecordList>
		</el-card>

		<el-card shadow="hover">
			<template #header><span>健康事件</span></template>
			<el-form :model="eventQuery" inline label-width="76px" class="mb15">
				<el-form-item label="机器人">
					<el-select v-model="eventQuery.robotAccountId" clearable filterable placeholder="全部" style="width: 200px">
						<el-option v-for="item in accountOptions" :key="item.value" :label="item.label" :value="item.value" />
					</el-select>
				</el-form-item>
				<el-form-item label="事件类型">
					<el-select v-model="eventQuery.eventType" clearable placeholder="全部" style="width: 180px">
						<el-option label="机器人离线" value="ROBOT_OFFLINE" />
						<el-option label="机器人恢复" value="ROBOT_RECOVERED" />
						<el-option label="接口异常" value="API_UNKNOWN" />
						<el-option label="Callback 配置失败" value="CALLBACK_FAILED" />
					</el-select>
				</el-form-item>
				<el-form-item label="事件状态">
					<el-select v-model="eventQuery.status" clearable placeholder="全部" style="width: 140px">
						<el-option label="未恢复" value="OPEN" />
						<el-option label="已恢复" value="RESOLVED" />
					</el-select>
				</el-form-item>
				<el-form-item label="发生时间">
					<el-date-picker v-model="eventQuery.timeRange" type="datetimerange" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" />
				</el-form-item>
				<el-form-item><el-button type="primary" @click="loadEvents">查询</el-button><el-button @click="resetEventQuery">重置</el-button></el-form-item>
			</el-form>

			<MobileRecordList :data="eventList" :loading="eventsLoading" row-key="id" data-mobile-view="wechat-monitor-events"><template #desktop><el-table v-loading="eventsLoading" :data="eventList" border stripe>
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="robotName" label="机器人名称" min-width="140" show-overflow-tooltip />
				<el-table-column label="事件类型" min-width="140"><template #default="{ row }">{{ eventTypeLabel(row.eventType) }}</template></el-table-column>
				<el-table-column label="事件状态" width="100" align="center"><template #default="{ row }"><el-tag :type="row.status === 'OPEN' ? 'danger' : 'success'">{{ row.status === 'OPEN' ? '未恢复' : '已恢复' }}</el-tag></template></el-table-column>
				<el-table-column prop="message" label="事件摘要" min-width="220" show-overflow-tooltip />
				<el-table-column label="发生时间" min-width="170"><template #default="{ row }">{{ formatTime(row.startedAt) }}</template></el-table-column>
				<el-table-column label="恢复时间" min-width="170"><template #default="{ row }">{{ formatTime(row.resolvedAt) }}</template></el-table-column>
				<el-table-column label="通知状态" min-width="110" align="center"><template #default="{ row }"><el-tag :type="notifyTagType(row.notifyStatus)">{{ row.notifyStatus || '-' }}</el-tag></template></el-table-column>
				<el-table-column label="通知错误摘要" min-width="200" show-overflow-tooltip><template #default="{ row }">{{ row.notifyError || '-' }}</template></el-table-column>
			</el-table></template><template #default="{ row }"><div class="mobile-record-card__header"><h3 class="mobile-record-card__title">{{ eventTypeLabel(row.eventType) }}</h3><el-tag :type="row.status === 'OPEN' ? 'danger' : 'success'">{{ row.status === 'OPEN' ? '未恢复' : '已恢复' }}</el-tag></div><dl class="mobile-record-card__fields"><div><dt>机器人</dt><dd>{{ row.robotName || '-' }}</dd></div><div><dt>发生时间</dt><dd>{{ formatTime(row.startedAt) }}</dd></div><div><dt>摘要</dt><dd>{{ row.message || '-' }}</dd></div></dl><details class="mobile-record-card__details"><summary>查看事件详情</summary><dl class="mobile-record-card__fields"><div><dt>恢复时间</dt><dd>{{ formatTime(row.resolvedAt) }}</dd></div><div><dt>通知状态</dt><dd>{{ row.notifyStatus || '-' }}</dd></div><div><dt>通知错误</dt><dd>{{ row.notifyError || '-' }}</dd></div></dl></details></template></MobileRecordList>
			<pagination v-show="eventTotal > 0" v-model:page="eventQuery.pageNum" v-model:limit="eventQuery.pageSize" :total="eventTotal" @pagination="loadEvents" />
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getWechatRobotGroupList } from '/@/api/wechatRobotGroup';
import { checkWechatMonitorsNow, getWechatMonitorEvents, getWechatMonitorOverview, saveWechatMonitorConfig, testWechatMonitorAlert } from '/@/api/wechatMonitor';

defineOptions({ name: 'wechatMonitor' });

type SelectOption = { value: number; label: string };
type GroupOption = { id: number; groupName: string; groupWxid: string };

const overviewLoading = ref(false);
const eventsLoading = ref(false);
const saving = ref(false);
const configReady = ref(false);
const checking = ref(false);
const testingAlert = ref(false);
const accountOptions = ref<SelectOption[]>([]);
const groupOptions = ref<GroupOption[]>([]);
const eventList = ref<any[]>([]);
const eventTotal = ref(0);
const overview = reactive({ accountCount: 0, onlineCount: 0, offlineCount: 0, unknownCount: 0, openEventCount: 0, accounts: [] as any[] });

const createConfig = (config: any = {}) => ({
	enabled: config.enabled ?? 0,
	checkIntervalSeconds: config.checkIntervalSeconds ?? 60,
	unknownAlertThreshold: config.unknownAlertThreshold ?? 3,
	alertRobotAccountId: config.alertRobotAccountId ?? 0,
	alertGroupId: config.alertGroupId ?? 0,
	sendJitterEnabled: config.sendJitterEnabled ?? 0,
	sendJitterMinMs: config.sendJitterMinMs ?? 800,
	sendJitterMaxMs: config.sendJitterMaxMs ?? 1800,
	memberSyncFallbackIntervalMinutes: config.memberSyncFallbackIntervalMinutes ?? 360,
});

const configForm = reactive(createConfig());
const eventQuery = reactive({
	robotAccountId: '' as number | string,
	eventType: '',
	status: '',
	timeRange: [] as string[],
	pageNum: 1,
	pageSize: 10,
});

let refreshTimer: ReturnType<typeof window.setInterval> | undefined;
let checkRefreshTimer: ReturnType<typeof window.setTimeout> | undefined;
let isMounted = false;
let overviewRequestId = 0;
let eventRequestId = 0;
let groupRequestId = 0;

const loadGroups = (accountId: number | string) => {
	const requestId = ++groupRequestId;
	if (!isMounted) return Promise.resolve();
	groupOptions.value = [];
	if (!accountId) return Promise.resolve();
	const selectedAccountId = Number(accountId);
	return getWechatRobotGroupList({ wechatRobotAccountId: selectedAccountId, status: 1, pageNum: 1, pageSize: 1000 })
		.then((res: any) => {
			if (isMounted && requestId === groupRequestId && Number(configForm.alertRobotAccountId) === selectedAccountId) {
				groupOptions.value = res.data.list ?? [];
			}
		})
		.catch(() => undefined);
};

const loadOverview = ({ syncConfig = false }: { syncConfig?: boolean } = {}) => {
	const shouldSyncConfig = syncConfig || !configReady.value;
	const requestId = ++overviewRequestId;
	overviewLoading.value = true;
	return getWechatMonitorOverview()
		.then((res: any) => {
			if (!isMounted || requestId !== overviewRequestId) return;
			const data = res.data ?? {};
			const accounts = data.accounts ?? [];
			Object.assign(overview, data, { accounts });
			accountOptions.value = accounts.map((account: any) => ({ value: account.id, label: account.robotName }));
			if (shouldSyncConfig) {
				Object.assign(configForm, createConfig(data.config));
				configReady.value = true;
				loadGroups(configForm.alertRobotAccountId);
			}
		})
		.catch(() => undefined)
		.finally(() => {
			if (isMounted && requestId === overviewRequestId) overviewLoading.value = false;
		});
};

const loadEvents = () => {
	const requestId = ++eventRequestId;
	eventsLoading.value = true;
	const [startTime = '', endTime = ''] = eventQuery.timeRange;
	return getWechatMonitorEvents({
		robotAccountId: eventQuery.robotAccountId,
		eventType: eventQuery.eventType,
		status: eventQuery.status,
		startTime,
		endTime,
		pageNum: eventQuery.pageNum,
		pageSize: eventQuery.pageSize,
	})
		.then((res: any) => {
			if (!isMounted || requestId !== eventRequestId) return;
			eventList.value = res.data.list ?? [];
			eventTotal.value = res.data.total ?? 0;
		})
		.catch(() => undefined)
		.finally(() => {
			if (isMounted && requestId === eventRequestId) eventsLoading.value = false;
		});
};

const handleAlertRobotChange = (accountId: number | string) => {
	configForm.alertGroupId = 0;
	loadGroups(accountId);
};

const saveConfig = () => {
	if (!configReady.value || saving.value) return;
	if (configForm.enabled === 1 && (!configForm.alertRobotAccountId || !configForm.alertGroupId)) {
		ElMessage.error('启用监控时请选择告警机器人和告警群');
		return;
	}
	if (configForm.sendJitterMinMs > configForm.sendJitterMaxMs) {
		ElMessage.error('最小延迟不能大于最大延迟');
		return;
	}
	if (configForm.memberSyncFallbackIntervalMinutes < 30 || configForm.memberSyncFallbackIntervalMinutes > 1440) {
		ElMessage.error('成员同步兜底间隔必须在30到1440分钟之间');
		return;
	}
	saving.value = true;
	saveWechatMonitorConfig(configForm)
		.then(() => {
			if (!isMounted) return;
			ElMessage.success('监控配置已保存');
			return loadOverview({ syncConfig: true });
		})
		.catch(() => undefined)
		.finally(() => {
			if (isMounted) saving.value = false;
		});
};

const handleCheckNow = () => {
	checking.value = true;
	checkWechatMonitorsNow()
		.then(() => {
			if (!isMounted) return;
			ElMessage.success('已提交立即检查，2 秒后刷新状态');
			if (checkRefreshTimer) window.clearTimeout(checkRefreshTimer);
			checkRefreshTimer = window.setTimeout(() => loadOverview(), 2000);
		})
		.catch(() => undefined)
		.finally(() => {
			if (isMounted) checking.value = false;
		});
};

const handleTestAlert = () => {
	ElMessageBox.confirm('确认向当前告警群发送测试告警吗？', '提示', { type: 'warning' })
		.then(() => {
			if (!isMounted) return undefined;
			testingAlert.value = true;
			return testWechatMonitorAlert();
		})
		.then((res: any) => {
			if (!isMounted || !res) return;
			ElMessage.success(res?.message || res?.msg || '测试告警请求已完成');
		})
		.catch(() => undefined)
		.finally(() => {
			if (isMounted) testingAlert.value = false;
		});
};

const resetEventQuery = () => {
	eventQuery.robotAccountId = '';
	eventQuery.eventType = '';
	eventQuery.status = '';
	eventQuery.timeRange = [];
	eventQuery.pageNum = 1;
	eventQuery.pageSize = 10;
	loadEvents();
};

const healthTagType = (status: string) => ({ ONLINE: 'success', OFFLINE: 'danger', UNKNOWN: 'warning' }[status] ?? 'info');
const healthLabel = (status: string) => (({ ONLINE: '在线', OFFLINE: '离线', UNKNOWN: '未知' }[status] ?? status) || '-');
const notifyTagType = (status: string) => ({ SENT: 'success', FAILED: 'danger', SENDING: 'warning', PENDING: 'info' }[status] ?? 'info');
const eventTypeLabel = (eventType: string) => (({ ROBOT_OFFLINE: '机器人离线', ROBOT_RECOVERED: '机器人恢复', API_UNKNOWN: '接口异常', CALLBACK_FAILED: 'Callback 配置失败' }[eventType] ?? eventType) || '-');
const formatTime = (value?: string) => value || '-';
const formatDuration = (value?: string) => {
	if (!value) return '-';
	const start = new Date(value.replace(' ', 'T')).getTime();
	if (Number.isNaN(start)) return '-';
	const seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return `${days ? `${days}天` : ''}${hours ? `${hours}小时` : ''}${minutes}分钟`;
};

onMounted(() => {
	isMounted = true;
	loadOverview({ syncConfig: true });
	loadEvents();
	refreshTimer = window.setInterval(loadOverview, 30000);
});

onBeforeUnmount(() => {
	isMounted = false;
	overviewRequestId++;
	eventRequestId++;
	groupRequestId++;
	if (refreshTimer) window.clearInterval(refreshTimer);
	if (checkRefreshTimer) window.clearTimeout(checkRefreshTimer);
});
</script>

<style scoped lang="scss">
.wechat-monitor-container :deep(.el-card) {
	min-height: 0;
}

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.form-suffix {
	margin-left: 8px;
	color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
	.card-header {
		align-items: flex-start;
		flex-direction: column;
	}
}
</style>
