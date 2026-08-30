<template>
	<div class="flow-data-room-container">
		<el-card shadow="hover" class="mb15">
			<template #header><span>VV 登录配置</span></template>
			<el-form label-position="top">
				<el-row :gutter="16">
					<el-col :xs="24" :md="8"><el-form-item label="账号"><el-input v-model="config.account" type="text" autocomplete="off" /></el-form-item></el-col>
					<el-col :xs="24" :md="8"><el-form-item label="密码"><el-input v-model="config.password" type="text" autocomplete="off" /></el-form-item></el-col>
					<el-col :xs="24" :md="8"><el-form-item label="vvToken"><el-input v-model="config.vvToken" type="text" autocomplete="off" /></el-form-item></el-col>
				</el-row>
				<div class="config-actions">
					<el-button type="primary" :loading="savingConfig" @click="saveConfig">保存配置</el-button>
					<el-button :loading="loadingCaptcha" @click="loadCaptcha">获取验证码</el-button>
					<el-button type="success" :loading="loggingIn" :disabled="!captcha.sessionId" @click="loginVV">VV 登录</el-button>
					<el-button type="warning" :loading="syncing" @click="runSync">同步厅数据</el-button>
				</div>
				<div v-if="captcha.sessionId" class="captcha-row">
					<img :src="captcha.imageDataUrl" alt="VV 验证码" class="captcha-image" @click="loadCaptcha" />
					<el-input v-model="verifyCode" type="text" maxlength="8" placeholder="输入验证码" class="captcha-input" @keyup.enter="loginVV" />
					<span class="captcha-tip">点击图片可刷新</span>
				</div>
			</el-form>
		</el-card>

		<el-card shadow="hover" class="mb15">
			<template #header><span>最近成功批次</span></template>
			<el-empty v-if="!summary.batchId" description="暂无成功同步批次" :image-size="64" />
			<el-descriptions v-else :column="4" border>
				<el-descriptions-item label="批次">{{ summary.batchId }}</el-descriptions-item>
				<el-descriptions-item label="日期范围">{{ summary.startDate }} 至 {{ summary.endDate }}</el-descriptions-item>
				<el-descriptions-item label="完成时间">{{ summary.finishedAt }}</el-descriptions-item>
				<el-descriptions-item label="新增 / 更新">{{ summary.insertedCount }} / {{ summary.updatedCount }}</el-descriptions-item>
				<el-descriptions-item label="每日流水">{{ summary.dailyCount }}</el-descriptions-item>
				<el-descriptions-item label="厅任务数据">{{ summary.taskCount }}</el-descriptions-item>
				<el-descriptions-item label="健康分">{{ summary.hallScoreCount }}</el-descriptions-item>
				<el-descriptions-item label="分值记录">{{ summary.scoreLogCount }}</el-descriptions-item>
			</el-descriptions>
		</el-card>

		<el-card shadow="hover">
			<el-tabs v-model="activeTab" @tab-change="onTabChange">
				<el-tab-pane label="每日流水" name="daily">
					<el-table v-loading="tables.daily.loading" :data="tables.daily.list" border stripe>
						<el-table-column prop="statDate" label="日期" width="110" fixed />
						<el-table-column prop="hallName" label="厅名" min-width="150" show-overflow-tooltip />
						<el-table-column prop="hallId" label="厅号" width="90" />
						<el-table-column prop="roomId" label="roomId" width="115" />
						<el-table-column prop="rank" label="排名" width="75" />
						<el-table-column prop="totalFlow" label="总流水" width="110" />
						<el-table-column prop="totalLiveDiamond" label="钻石流水" width="110" />
						<el-table-column prop="enterRoomUser" label="进房人数" width="95" />
						<el-table-column prop="sendGiftPersonNum" label="送礼人数" width="95" />
						<el-table-column prop="enterRoomNewUser" label="新进房用户" width="110" />
						<el-table-column prop="roomPayNewUser" label="新进房送礼" width="110" />
						<el-table-column prop="enterRoomNewUser24h" label="24h进房新用户" width="130" />
						<el-table-column prop="roomPayNewUser24h" label="24h新用户送礼" width="130" />
						<el-table-column prop="newUserTotalFlow24h" label="24h新用户流水" width="130" />
					</el-table>
					<pagination v-show="tables.daily.total > 0" v-model:page="tables.daily.pageNum" v-model:limit="tables.daily.pageSize" :total="tables.daily.total" @pagination="loadActiveTable" />
				</el-tab-pane>

				<el-tab-pane label="厅任务数据" name="tasks">
					<el-table v-loading="tables.tasks.loading" :data="tables.tasks.list" border stripe>
						<el-table-column prop="startDate" label="开始日期" width="110" />
						<el-table-column prop="endDate" label="结束日期" width="110" />
						<el-table-column prop="hallName" label="厅名" min-width="150" show-overflow-tooltip />
						<el-table-column prop="hallId" label="厅号" width="90" />
						<el-table-column prop="roomId" label="roomId" width="115" />
						<el-table-column prop="rank" label="排名" width="75" />
						<el-table-column prop="effectiveAnchorNum" label="有效主播" width="95" />
						<el-table-column prop="effectiveNum" label="有效个播" width="95" />
						<el-table-column prop="effectiveOpenDayNum" label="有效开播天数" width="115" />
						<el-table-column prop="openLiveTimeText" label="开播时长" width="110" />
						<el-table-column prop="totalFlow" label="总流水" width="110" />
						<el-table-column prop="luckyBagFlow" label="福袋流水" width="110" />
						<el-table-column prop="crossPkNum" label="跨厅PK" width="85" />
						<el-table-column prop="roomPkNum" label="同房PK" width="85" />
					</el-table>
					<pagination v-show="tables.tasks.total > 0" v-model:page="tables.tasks.pageNum" v-model:limit="tables.tasks.pageSize" :total="tables.tasks.total" @pagination="loadActiveTable" />
				</el-tab-pane>

				<el-tab-pane label="健康分" name="health">
					<el-table v-loading="tables.health.loading" :data="tables.health.list" border stripe>
						<el-table-column prop="hallId" label="厅号" width="100" />
						<el-table-column prop="hallName" label="厅名" min-width="180" show-overflow-tooltip />
						<el-table-column prop="roomId" label="roomId" width="130" />
						<el-table-column prop="hallScore" label="健康分" width="100" />
					</el-table>
					<pagination v-show="tables.health.total > 0" v-model:page="tables.health.pageNum" v-model:limit="tables.health.pageSize" :total="tables.health.total" @pagination="loadActiveTable" />
				</el-tab-pane>

				<el-tab-pane label="分值记录" name="scoreLogs">
					<el-table v-loading="tables.scoreLogs.loading" :data="tables.scoreLogs.list" border stripe>
						<el-table-column prop="optTime" label="操作时间" width="165" />
						<el-table-column prop="hallName" label="厅名" min-width="150" show-overflow-tooltip />
						<el-table-column prop="hallId" label="厅号" width="90" />
						<el-table-column prop="roomId" label="roomId" width="115" />
						<el-table-column prop="optUser" label="操作人" width="120" show-overflow-tooltip />
						<el-table-column prop="reasonDesc" label="原因" min-width="220" show-overflow-tooltip />
						<el-table-column prop="anchorId" label="主播ID" width="120" />
						<el-table-column prop="anchorName" label="主播昵称" width="140" show-overflow-tooltip />
						<el-table-column prop="scoreValue" label="分值" width="90" />
						<el-table-column prop="sourceId" label="sourceId" width="110" />
					</el-table>
					<pagination v-show="tables.scoreLogs.total > 0" v-model:page="tables.scoreLogs.pageNum" v-model:limit="tables.scoreLogs.pageSize" :total="tables.scoreLogs.total" @pagination="loadActiveTable" />
				</el-tab-pane>
			</el-tabs>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
	getFlowDataCaptcha,
	getFlowDataConfig,
	getFlowDataDaily,
	getFlowDataHealth,
	getFlowDataScoreLogs,
	getFlowDataSummary,
	getFlowDataTasks,
	loginFlowDataVV,
	saveFlowDataConfig,
	syncFlowData,
	type FlowDataConfig,
} from '/@/api/system/flowData';

defineOptions({ name: 'flowDataRoom' });

type TabName = 'daily' | 'tasks' | 'health' | 'scoreLogs';
type TableState = { list: any[]; total: number; pageNum: number; pageSize: number; loading: boolean; loaded: boolean };

const activeTab = ref<TabName>('daily');
const savingConfig = ref(false);
const loadingCaptcha = ref(false);
const loggingIn = ref(false);
const syncing = ref(false);
const verifyCode = ref('');
const config = reactive<FlowDataConfig>({ account: '', password: '', vvToken: '' });
const captcha = reactive({ sessionId: '', imageDataUrl: '' });
const summary = reactive({ batchId: 0, startDate: '', endDate: '', finishedAt: '', dailyCount: 0, taskCount: 0, hallScoreCount: 0, scoreLogCount: 0, insertedCount: 0, updatedCount: 0 });
const newTable = (): TableState => ({ list: [], total: 0, pageNum: 1, pageSize: 20, loading: false, loaded: false });
const tables = reactive<Record<TabName, TableState>>({ daily: newTable(), tasks: newTable(), health: newTable(), scoreLogs: newTable() });
const listRequests = { daily: getFlowDataDaily, tasks: getFlowDataTasks, health: getFlowDataHealth, scoreLogs: getFlowDataScoreLogs };

const loadConfig = async () => {
	const res: any = await getFlowDataConfig();
	Object.assign(config, res.data);
};

const saveConfig = async () => {
	savingConfig.value = true;
	try {
		await saveFlowDataConfig({ ...config });
		ElMessage.success('VV 登录配置已保存');
	} finally {
		savingConfig.value = false;
	}
};

const loadCaptcha = async () => {
	loadingCaptcha.value = true;
	try {
		const res: any = await getFlowDataCaptcha();
		Object.assign(captcha, res.data);
		verifyCode.value = '';
	} finally {
		loadingCaptcha.value = false;
	}
};

const loginVV = async () => {
	if (!captcha.sessionId || !config.account || !config.password || !verifyCode.value.trim()) {
		ElMessage.warning('请填写账号、密码和验证码');
		return;
	}
	loggingIn.value = true;
	try {
		const res: any = await loginFlowDataVV({ sessionId: captcha.sessionId, account: config.account, password: config.password, verifyCode: verifyCode.value.trim() });
		Object.assign(config, res.data);
		Object.assign(captcha, { sessionId: '', imageDataUrl: '' });
		verifyCode.value = '';
		ElMessage.success('VV 登录成功');
	} finally {
		loggingIn.value = false;
	}
};

const loadSummary = async () => {
	const res: any = await getFlowDataSummary();
	Object.assign(summary, res.data);
};

const loadTable = async (name: TabName) => {
	const table = tables[name];
	table.loading = true;
	try {
		const res: any = await listRequests[name]({ pageNum: table.pageNum, pageSize: table.pageSize });
		table.list = res.data.list ?? [];
		table.total = Number(res.data.total ?? 0);
		table.loaded = true;
	} finally {
		table.loading = false;
	}
};

const loadActiveTable = () => loadTable(activeTab.value);
const onTabChange = (name: string | number) => {
	const tab = name as TabName;
	if (!tables[tab].loaded) loadTable(tab);
};

const runSync = async () => {
	try {
		await ElMessageBox.confirm('将读取 VV 四类数据，全部校验后原子更新 11 个厅。确认同步？', '同步厅数据', { type: 'warning' });
	} catch {
		return;
	}
	syncing.value = true;
	try {
		const res: any = await syncFlowData();
		ElMessage.success(`同步成功：新增 ${res.data.insertedCount}，更新 ${res.data.updatedCount}`);
		for (const table of Object.values(tables)) table.loaded = false;
		await Promise.all([loadSummary(), loadActiveTable()]);
	} finally {
		syncing.value = false;
	}
};

onMounted(() => {
	Promise.allSettled([loadConfig(), loadSummary(), loadTable('daily')]);
});
</script>

<style scoped>
.config-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.captcha-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.captcha-image { width: 120px; height: 40px; border: 1px solid var(--el-border-color); cursor: pointer; object-fit: contain; }
.captcha-input { width: 180px; }
.captcha-tip { color: var(--el-text-color-secondary); font-size: 12px; }
.flow-data-room-container :deep(.el-descriptions__body) { overflow-x: auto; }
@media (max-width: 767px) {
	.config-actions .el-button { margin-left: 0; }
	.captcha-row { align-items: flex-start; flex-direction: column; }
}
</style>
