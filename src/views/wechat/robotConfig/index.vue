<template>
	<div class="wechat-robot-config-container">
		<el-card v-if="canViewConfig" shadow="hover">
			<div class="config-header">
				<div>
					<h3>微信群机器人配置</h3>
					<p>所有设置按微信群隔离，每个分类独立保存。</p>
				</div>
				<el-select v-model="selectedGroupId" filterable placeholder="请选择微信群" style="width: 320px" @change="loadOverview">
					<el-option v-for="group in groupOptions" :key="group.id" :label="groupOptionLabel(group)" :value="group.id" />
				</el-select>
			</div>

			<el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="mb15" />
			<el-skeleton v-if="loading && !overview" :rows="6" animated />

			<template v-else-if="overview">
				<el-descriptions :column="4" border class="mb15 overview-status">
					<el-descriptions-item label="绑定机器人">{{ overview.robotName || '-' }}</el-descriptions-item>
					<el-descriptions-item label="群状态">
						<el-tag :type="overview.groupStatus === 1 ? 'success' : 'info'">{{ overview.groupStatus === 1 ? '启用' : '停用' }}</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="机器人状态">
						<el-tag :type="robotAvailable ? 'success' : 'danger'">{{ robotAvailable ? '在线' : '不可用' }}</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="固定档">
						<el-tag :type="overview.fixedScheduleEnabled === 1 ? 'success' : 'info'">{{ overview.fixedScheduleEnabled === 1 ? '已开启' : '未开启' }}</el-tag>
					</el-descriptions-item>
				</el-descriptions>

				<el-tabs v-model="activeTab" :tab-position="tabPosition" class="config-tabs">
					<el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
						<template v-if="tab.name === 'basic'">
							<div class="panel-heading">
								<div><h4>基础信息</h4><p>本阶段仅展示数据库真实状态，不提供修改。</p></div>
							</div>
							<el-descriptions :column="2" border>
								<el-descriptions-item label="微信群名称">{{ overview.groupName || '-' }}</el-descriptions-item>
								<el-descriptions-item label="微信群 wxid">{{ overview.groupWxid || '-' }}</el-descriptions-item>
								<el-descriptions-item label="厅号">{{ overview.hallNo || '未设置' }}</el-descriptions-item>
								<el-descriptions-item label="群备注">{{ overview.remark || '-' }}</el-descriptions-item>
								<el-descriptions-item label="运行状态">{{ overview.runningStatus === 1 ? '运行中' : '已停止' }}</el-descriptions-item>
								<el-descriptions-item label="账号健康状态">{{ overview.healthStatus || 'UNKNOWN' }}</el-descriptions-item>
								<el-descriptions-item label="最近成员同步">{{ overview.lastSuccessfulMemberSyncAt || '-' }}</el-descriptions-item>
								<el-descriptions-item label="Callback">
									<span :class="{ 'error-text': overview.callbackError }">{{ overview.callbackError || overview.callbackConfiguredAt || '-' }}</span>
								</el-descriptions-item>
							</el-descriptions>
						</template>
						<template v-else>
							<div class="panel-heading"><div><h4>{{ tab.label }}</h4><p>{{ tab.description }}</p></div></div>
							<el-empty description="该分类将在业务规则确认并完成真实接入后开放" />
						</template>
					</el-tab-pane>
				</el-tabs>
			</template>
			<el-empty v-else description="请选择微信群" />
		</el-card>
		<el-result v-else icon="warning" title="没有权限" sub-title="当前账号没有查看机器人配置权限" />
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getWechatRobotGroupConfigOverview, getWechatRobotGroupList } from '/@/api/wechatRobotGroup';
import { auth } from '/@/utils/authFunction';

defineOptions({ name: 'wechatRobotConfig' });

const route = useRoute();
const canViewConfig = auth('api/v1/system/wechatRobotGroup/configOverview');
const loading = ref(false);
const errorMessage = ref('');
const selectedGroupId = ref<number>();
const groupOptions = ref<any[]>([]);
const overview = ref<any>();
const activeTab = ref('basic');
const tabPosition = ref<'left' | 'top'>('left');
const mobileMedia = window.matchMedia('(max-width: 768px)');
const tabs = [
	{ name: 'basic', label: '基础信息', description: '群、厅号、绑定机器人和启停状态。' },
	{ name: 'queue', label: '麦序规则', description: '扣排、手速、置顶、取排和 P8 规则。' },
	{ name: 'timing', label: '定时排档', description: '麦序生命周期分钟、麦排小时和 P8 购买时间。' },
	{ name: 'schedule', label: '固定档与主持', description: '24 小时固定成员、主持和虚拟主持开厅。' },
	{ name: 'report', label: '报备回厅', description: '报备开关、人数、时长和提示文字。' },
	{ name: 'checkin', label: '打卡统计', description: '麦序、任务排、黑麦、收光、全麦、冠厅和互动统计。' },
	{ name: 'random', label: '互动与随机', description: '普通、计算、图片、文本、引用和其他互动模式。' },
	{ name: 'permission', label: '权限与提醒', description: '三来源管理员、命令策略和全体提醒。' },
	{ name: 'template', label: '模板与口令', description: '当前群私有模板、触发口令和公共默认来源。' },
];
const robotAvailable = computed(() => overview.value?.accountStatus === 1 && overview.value?.isOnline === 1);

const syncTabPosition = () => {
	tabPosition.value = mobileMedia.matches ? 'top' : 'left';
};

const groupOptionLabel = (group: any) => `${group.groupName}${group.hallNo ? `（${group.hallNo}）` : ''}`;

const loadOverview = async () => {
	if (!selectedGroupId.value || !canViewConfig) return;
	loading.value = true;
	errorMessage.value = '';
	try {
		const res: any = await getWechatRobotGroupConfigOverview(selectedGroupId.value);
		overview.value = res.data;
	} catch (error: any) {
		overview.value = undefined;
		errorMessage.value = error?.message || '机器人配置加载失败';
	} finally {
		loading.value = false;
	}
};

const loadGroups = async () => {
	if (!canViewConfig) return;
	loading.value = true;
	try {
		const res: any = await getWechatRobotGroupList({ pageNum: 1, pageSize: 999 });
		groupOptions.value = res.data.list || [];
		const requestedGroupId = Number(route.query.groupId || 0);
		const requestedExists = groupOptions.value.some((group: any) => group.id === requestedGroupId);
		selectedGroupId.value = requestedExists ? requestedGroupId : groupOptions.value[0]?.id;
		if (selectedGroupId.value) {
			await loadOverview();
		}
	} catch (error: any) {
		errorMessage.value = error?.message || '微信群列表加载失败';
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	syncTabPosition();
	mobileMedia.addEventListener('change', syncTabPosition);
	loadGroups();
});
onBeforeUnmount(() => mobileMedia.removeEventListener('change', syncTabPosition));
</script>

<style scoped lang="scss">
.config-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; h3 { margin: 0 0 6px; } p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; } }
.config-tabs { min-height: 480px; :deep(.el-tabs__content) { padding: 0 18px; } }
.panel-heading { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; margin-bottom: 14px; border-bottom: 1px solid var(--el-border-color-lighter); h4 { margin: 0 0 5px; } p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; } }
.error-text { color: var(--el-color-danger); }
@media (max-width: 768px) { .config-header { align-items: flex-start; flex-direction: column; } .config-tabs { :deep(.el-tabs__content) { padding: 10px 0 0; } } .overview-status { :deep(.el-descriptions__body) { overflow-x: auto; } } }
</style>
