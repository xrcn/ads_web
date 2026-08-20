<template>
	<div class="wechat-group-schedule-container">
		<el-card shadow="hover">
			<div class="schedule-header">
				<div>
					<h3>群麦序管理</h3>
					<p>配置只作用于当前微信群，群成员仍通过群内原始口令操作麦序。</p>
				</div>
				<el-select v-model="selectedGroupId" filterable placeholder="请选择微信群" style="width: 280px" @change="loadOverview">
					<el-option v-for="item in groupOptions" :key="item.id" :label="item.groupName" :value="item.id" />
				</el-select>
			</div>

			<el-tabs v-model="activeTab">
				<el-tab-pane label="群规则" name="config">
					<el-row :gutter="20">
						<el-col :xs="24" :lg="14">
							<el-form :model="config" label-width="115px" style="max-width: 680px">
								<el-form-item label="主播麦位数">
									<el-input-number v-model="config.slotCount" :min="1" :max="8" />
									<span class="form-tip">默认 8 位；启用 P8 客麦位后固定为 7 个可排主播位。</span>
								</el-form-item>
								<el-form-item label="P8 客麦位"><el-switch v-model="guestSlotEnabled" active-text="启用" inactive-text="关闭" /><span class="form-tip">启用后 P1-P7 可排，P8 固定留作客麦位。</span></el-form-item>
								<el-form-item label="运行状态"><el-switch v-model="running" active-text="运行" inactive-text="停止" /></el-form-item>
								<el-form-item label="任务可否取排"><el-switch v-model="taskTake" active-text="可以取排" inactive-text="不可取排" /></el-form-item>
								<el-form-item label="发排分钟"><el-input-number v-model="config.scheduleCreateMinute" :min="0" :max="59" /></el-form-item>
								<el-form-item label="定排分钟"><el-input-number v-model="config.scheduleLockMinute" :min="0" :max="59" /></el-form-item>
								<el-form-item label="补位截止分钟"><el-input-number v-model="config.supplementCloseMinute" :min="0" :max="59" /></el-form-item>
								<el-form-item label="群麦序文档"><el-input v-model="config.queueDocument" type="textarea" :rows="4" placeholder="请输入群内发送的麦序文档" /></el-form-item>
								<el-form-item><el-button type="primary" :loading="saving" :disabled="!selectedGroupId" @click="saveConfig">保存群规则</el-button></el-form-item>
							</el-form>
						</el-col>
						<el-col :xs="24" :lg="10">
							<div class="timeline-panel"><h4>自动排档时间线</h4><el-timeline><el-timeline-item timestamp=":45" type="primary">先发送上一档汇总，再创建下一小时麦序。</el-timeline-item><el-timeline-item timestamp=":58" type="primary">锁定普通排和任务顶位。</el-timeline-item><el-timeline-item timestamp=":00 - :30" type="primary">普通排按补位处理；30 分钟后停止受理。</el-timeline-item></el-timeline></div>
						</el-col>
					</el-row>
				</el-tab-pane>
				<el-tab-pane label="当前麦序" name="current">
					<div class="round-toolbar"><span>{{ overview?.groupName || '未选择微信群' }}</span><el-tag :type="running ? 'success' : 'info'">{{ running ? '运行中' : '已停止' }}</el-tag></div>
					<div class="host-slot">主持位：{{ overview?.currentRound?.hostName || '暂未设置' }}</div>
					<el-row :gutter="12"><el-col v-for="slot in overview?.currentRound?.slots || emptySlots" :key="slot.slotNo" :xs="12" :sm="8" :md="6"><div class="anchor-slot" :class="[slot.entryType?.toLowerCase(), { 'guest-slot': slot.isGuestSlot }] "><strong>P{{ slot.slotNo }}</strong><span>{{ slot.memberName || '空位' }}</span><small>{{ slotLabel(slot) }}</small></div></el-col></el-row>
				</el-tab-pane>
			</el-tabs>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getWechatRobotGroupList } from '/@/api/wechatRobotGroup';
import { getWechatGroupScheduleOverview, saveWechatGroupScheduleConfig } from '/@/api/wechatGroupSchedule';

defineOptions({ name: 'wechatGroupSchedule' });

const activeTab = ref('config');
const selectedGroupId = ref<number>();
const groupOptions = ref<any[]>([]);
const overview = ref<any>();
const saving = ref(false);
const config = reactive({ slotCount: 8, guestSlotEnabled: 0, runningStatus: 1, taskTakeEnabled: 0, queueDocument: '', scheduleCreateMinute: 45, scheduleLockMinute: 58, supplementCloseMinute: 30 });
const running = computed({ get: () => config.runningStatus === 1, set: (value: boolean) => (config.runningStatus = value ? 1 : 0) });
const taskTake = computed({ get: () => config.taskTakeEnabled === 1, set: (value: boolean) => (config.taskTakeEnabled = value ? 1 : 0) });
const guestSlotEnabled = computed({ get: () => config.guestSlotEnabled === 1, set: (value: boolean) => { config.guestSlotEnabled = value ? 1 : 0; if (value && config.slotCount === 8) config.slotCount = 7; } });
const emptySlots = Array.from({ length: 8 }, (_, index) => ({ slotNo: index + 1, memberName: '', entryType: '', taskAmount: '' }));

const slotLabel = (slot: any) => {
	if (slot.isGuestSlot) return '不参与机器人排麦';
	if (!slot.memberName) return '暂无排档';
	if (slot.entryType === 'TASK') return `任务 ${slot.taskAmount || ''}`;
	if (slot.entryType === 'FIXED') return '固定档';
	if (slot.entryType === 'SUPPLEMENT') return '补位';
	return '普通排';
};

const loadOverview = () => {
	if (!selectedGroupId.value) return;
	getWechatGroupScheduleOverview(selectedGroupId.value).then((res: any) => {
		overview.value = res.data;
		Object.assign(config, res.data);
	});
};

const saveConfig = () => {
	if (!selectedGroupId.value) return;
	saving.value = true;
	saveWechatGroupScheduleConfig({ groupId: selectedGroupId.value, ...config }).then(() => {
		ElMessage.success('群规则已保存');
		loadOverview();
	}).finally(() => { saving.value = false; });
};

onMounted(() => {
	getWechatRobotGroupList({ pageNum: 1, pageSize: 999, status: 1 }).then((res: any) => {
		groupOptions.value = res.data.list || [];
		if (groupOptions.value.length) { selectedGroupId.value = groupOptions.value[0].id; loadOverview(); }
	});
});
</script>

<style scoped lang="scss">
.schedule-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; h3 { margin: 0 0 6px; } p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; } }
.form-tip { margin-left: 10px; color: var(--el-text-color-secondary); font-size: 12px; }
.timeline-panel { border-left: 1px solid var(--el-border-color-light); padding-left: 22px; h4 { margin-top: 0; } }
.round-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; font-weight: 600; }
.host-slot { max-width: 280px; margin: 0 auto 14px; text-align: center; padding: 11px; border: 1px solid #f3d19e; border-radius: 6px; background: #fdf6ec; color: #8c4a10; }
.anchor-slot { min-height: 82px; margin-bottom: 12px; padding: 12px; border: 1px solid var(--el-border-color); border-radius: 6px; display: flex; flex-direction: column; gap: 5px; strong { color: var(--el-color-primary); } small { color: var(--el-text-color-secondary); } &.fixed { border-color: var(--el-color-success-light-5); background: var(--el-color-success-light-9); } &.task { border-color: var(--el-color-warning-light-5); background: var(--el-color-warning-light-9); } &.guest-slot { border-style: dashed; border-color: var(--el-color-info-light-5); background: var(--el-fill-color-light); strong { color: var(--el-color-info); } } }
@media (max-width: 768px) { .schedule-header { align-items: flex-start; flex-direction: column; } .timeline-panel { border-left: 0; padding-left: 0; margin-top: 16px; } }
</style>
