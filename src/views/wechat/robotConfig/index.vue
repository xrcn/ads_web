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
						<template v-else-if="tab.name === 'queue'">
							<div class="panel-heading"><div><h4>麦序规则</h4><p>保存后只影响后续新命令，不自动重排当前麦序。</p></div><el-button v-if="canSaveQueueRules" type="primary" :loading="queueSaving" @click="saveQueueRuleForm">保存本页</el-button></div>
							<el-form :model="queueRules" label-width="130px" class="queue-form">
								<el-row :gutter="18"><el-col :xs="24" :md="12"><el-form-item label="扣排人数"><el-input-number v-model="queueRules.slotCount" :min="1" :max="8" /></el-form-item></el-col><el-col :xs="24" :md="12"><el-form-item label="手速优先人数"><el-input-number v-model="queueRules.speedPriorityCount" :min="0" :max="queueRules.slotCount" /></el-form-item></el-col></el-row>
								<el-row :gutter="18"><el-col :xs="24" :md="12"><el-form-item label="特殊置顶人数"><el-input-number v-model="queueRules.specialTopCount" :min="0" :max="queueRules.slotCount" /></el-form-item></el-col><el-col :xs="24" :md="12"><el-form-item label="普通自排仅管理员"><el-switch v-model="queueRules.queueSelfAdminOnly" :active-value="1" :inactive-value="0" /></el-form-item></el-col></el-row>
								<el-row :gutter="18"><el-col :xs="24" :md="12"><el-form-item label="手速排允许取排"><el-switch v-model="queueRules.speedTakeEnabled" :active-value="1" :inactive-value="0" /></el-form-item></el-col><el-col :xs="24" :md="12"><el-form-item label="任务排允许取排"><el-switch v-model="queueRules.taskTakeEnabled" :active-value="1" :inactive-value="0" /></el-form-item></el-col></el-row>
								<el-row :gutter="18"><el-col :xs="24" :md="12"><el-form-item label="P8模式"><el-select v-model="queueRules.p8Mode"><el-option label="普通麦位" value="NORMAL" /><el-option label="保留麦位" value="RESERVED" /><el-option label="仅任务排老板位" value="TASK_ONLY" /></el-select></el-form-item></el-col><el-col :xs="24" :md="12"><el-form-item label="P8名称"><el-input v-model="queueRules.p8Name" maxlength="32" /></el-form-item></el-col></el-row>
							</el-form>
							<el-alert title="特殊置顶人数与手速优先人数之和不能超过扣排人数" type="info" :closable="false" class="mb15" />
							<el-divider content-position="left">新人一次性特殊置顶资格</el-divider>
							<div class="qualification-toolbar"><el-select v-if="canGrantSpecialTop" v-model="grantMemberWxid" filterable placeholder="选择当前在群成员" style="width:260px"><el-option v-for="member in specialCandidates" :key="member.memberWxid" :label="member.memberName" :value="member.memberWxid" /></el-select><el-button v-if="canGrantSpecialTop" type="primary" @click="grantSpecialTop">发放资格</el-button><el-select v-model="specialStatus" style="width:150px" @change="loadSpecialTop"><el-option label="可用" value="AVAILABLE" /><el-option label="已使用" value="CONSUMED" /><el-option label="已取消" value="CANCELLED" /></el-select></div>
							<el-table :data="specialList" border stripe><el-table-column prop="memberName" label="成员" min-width="150" /><el-table-column prop="memberWxid" label="wxid" min-width="200" /><el-table-column prop="status" label="状态" width="100" /><el-table-column prop="grantedAt" label="发放时间" width="170" /><el-table-column label="操作" width="90"><template #default="{row}"><el-button v-if="row.status==='AVAILABLE' && canCancelSpecialTop" text type="danger" @click="cancelSpecialTop(row)">取消</el-button></template></el-table-column></el-table>
						</template>
						<template v-else-if="tab.name === 'timing'">
							<div class="panel-heading"><div><h4>定时排档</h4><p>时间配置真实控制自动消息与命令窗口。</p></div><el-button v-if="canSaveTiming" type="primary" :loading="timingSaving" @click="saveTimingForm">保存本页</el-button></div>
							<el-form :model="timing" label-width="150px"><el-row :gutter="18"><el-col v-for="field in timingFields" :key="field.key" :xs="24" :md="12"><el-form-item :label="field.label"><el-input-number v-model="timing[field.key]" :min="field.min" :max="field.max" /></el-form-item></el-col></el-row></el-form>
							<el-divider content-position="left">麦排小时</el-divider><div class="hour-actions"><el-button @click="timing.activeHours=allHours.slice()">全选</el-button><el-button @click="timing.activeHours=[]">清空</el-button></div><el-checkbox-group v-model="timing.activeHours" class="hour-grid"><el-checkbox v-for="hour in allHours" :key="hour" :value="hour" border><strong>{{hour}}-{{hour+1}}</strong><small>{{hostStateText(hour)}}</small></el-checkbox></el-checkbox-group>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute } from 'vue-router';
import { cancelWechatRobotGroupSpecialTop, getWechatRobotGroupConfigOverview, getWechatRobotGroupList, getWechatRobotGroupQueueRules, getWechatRobotGroupScheduleTiming, getWechatRobotGroupSpecialTopList, grantWechatRobotGroupSpecialTop, saveWechatRobotGroupQueueRules, saveWechatRobotGroupScheduleTiming } from '/@/api/wechatRobotGroup';
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
const queueSaving=ref(false);const specialStatus=ref('AVAILABLE');const specialList=ref<any[]>([]);const specialCandidates=ref<any[]>([]);const grantMemberWxid=ref('');
const queueRules=reactive({slotCount:8,speedPriorityCount:0,specialTopCount:0,speedTakeEnabled:1,taskTakeEnabled:0,guestSlotEnabled:0,p8Mode:'NORMAL',p8Name:'客麦位',queueSelfAdminOnly:0});
const canReadQueueRules=auth('api/v1/system/wechatRobotGroup/queueRules');const canSaveQueueRules=auth('api/v1/system/wechatRobotGroup/queueRulesSave');const canListSpecialTop=auth('api/v1/system/wechatRobotGroup/specialTopList');const canGrantSpecialTop=auth('api/v1/system/wechatRobotGroup/specialTopGrant');const canCancelSpecialTop=auth('api/v1/system/wechatRobotGroup/specialTopCancel');
const canReadTiming=auth('api/v1/system/wechatRobotGroup/scheduleTiming');const canSaveTiming=auth('api/v1/system/wechatRobotGroup/scheduleTimingSave');const timingSaving=ref(false);const allHours=Array.from({length:24},(_,i)=>i);const timing=reactive<any>({scheduleCreateMinute:45,scheduleLockMinute:58,supplementCloseMinutes:30,takeCloseMinutes:30,p8PurchaseCloseMinutes:60,activeHours:[],hostStates:[]});const timingFields=[{key:'scheduleCreateMinute',label:'麦序开始分钟',min:0,max:59},{key:'scheduleLockMinute',label:'麦序截止分钟',min:0,max:59},{key:'supplementCloseMinutes',label:'整点后补位时间',min:0,max:60},{key:'takeCloseMinutes',label:'整点后取排时间',min:0,max:60},{key:'p8PurchaseCloseMinutes',label:'整点后购买P8时间',min:0,max:60}];let savedCreateMinute=45;
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

const loadQueueRules=async()=>{if(!selectedGroupId.value||!canReadQueueRules)return;const res:any=await getWechatRobotGroupQueueRules(selectedGroupId.value);Object.assign(queueRules,res.data);};
const loadSpecialTop=async()=>{if(!selectedGroupId.value||!canListSpecialTop)return;const res:any=await getWechatRobotGroupSpecialTopList(selectedGroupId.value,specialStatus.value);specialList.value=res.data.list||[];specialCandidates.value=res.data.candidates||[];};
const loadQueueTab=async()=>{await Promise.all([loadQueueRules(),loadSpecialTop()]);};
const saveQueueRuleForm=async()=>{if(!selectedGroupId.value)return;if(queueRules.specialTopCount+queueRules.speedPriorityCount>queueRules.slotCount){ElMessage.error('特殊置顶人数与手速优先人数之和不能超过扣排人数');return;}queueSaving.value=true;try{const res:any=await saveWechatRobotGroupQueueRules({groupId:selectedGroupId.value,...queueRules});Object.assign(queueRules,res.data);ElMessage.success('麦序规则已保存');}finally{queueSaving.value=false;}};
const grantSpecialTop=async()=>{if(!selectedGroupId.value||!grantMemberWxid.value)return;const member=specialCandidates.value.find((item:any)=>item.memberWxid===grantMemberWxid.value);await grantWechatRobotGroupSpecialTop({groupId:selectedGroupId.value,memberWxid:grantMemberWxid.value,memberName:member?.memberName||''});grantMemberWxid.value='';ElMessage.success('特殊置顶资格已发放');await loadSpecialTop();};
const cancelSpecialTop=async(row:any)=>{if(!selectedGroupId.value)return;await ElMessageBox.confirm(`确认取消 ${row.memberName||row.memberWxid} 的特殊置顶资格？`,'提示',{type:'warning'});await cancelWechatRobotGroupSpecialTop({groupId:selectedGroupId.value,id:row.id});ElMessage.success('资格已取消');await loadSpecialTop();};
const loadTiming=async()=>{if(!selectedGroupId.value||!canReadTiming)return;const res:any=await getWechatRobotGroupScheduleTiming(selectedGroupId.value);Object.assign(timing,res.data);savedCreateMinute=timing.scheduleCreateMinute;};const hostStateText=(hour:number)=>{const state=timing.hostStates?.find((item:any)=>item.hour===hour);return state?.type==='REAL'?state.name:state?.type==='OPEN'?'开厅':'未设置'};const saveTimingForm=async()=>{if(!selectedGroupId.value)return;if(timing.scheduleCreateMinute!==savedCreateMinute)await ElMessageBox.confirm('修改麦序开始分钟可能跳过下一小时自动发排，保存后不会补发已错过消息。确认继续？','提示',{type:'warning'});timingSaving.value=true;try{const res:any=await saveWechatRobotGroupScheduleTiming({groupId:selectedGroupId.value,...timing});Object.assign(timing,res.data);savedCreateMinute=timing.scheduleCreateMinute;ElMessage.success('定时排档已保存');}finally{timingSaving.value=false;}};
watch(activeTab,(value)=>{if(value==='queue')loadQueueTab();if(value==='timing')loadTiming();});watch(selectedGroupId,()=>{if(activeTab.value==='queue')loadQueueTab();if(activeTab.value==='timing')loadTiming();});

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
.qualification-toolbar { display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap; }
.hour-actions{display:flex;gap:8px;margin-bottom:12px}.hour-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.hour-grid :deep(.el-checkbox){margin:0;height:48px}.hour-grid small{display:block;color:var(--el-text-color-secondary)}
@media (max-width: 768px) { .config-header { align-items: flex-start; flex-direction: column; } .config-tabs { :deep(.el-tabs__content) { padding: 10px 0 0; } } .overview-status { :deep(.el-descriptions__body) { overflow-x: auto; } } }
</style>
