<template>
	<div v-if="visible && progress.status" class="vv-sync-progress">
		<div class="vv-sync-progress__text">
			<span>{{ displayText }}</span>
			<span v-if="progress.total > 0">{{ progress.current }}/{{ progress.total }}</span>
		</div>
		<el-progress
			v-if="progress.total > 0"
			:percentage="percentage"
			:status="progressStatus"
			:stroke-width="8"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { getVVSyncProgress, type VVSyncProgress, type VVSyncType } from '/@/api/system/flowData';

const props = defineProps<{ syncType: VVSyncType; active: boolean; loader?: () => Promise<any> }>();
const emit = defineEmits<{ progress: [value: VVSyncProgress] }>();
const progress = reactive<VVSyncProgress>({ batchId: 0, syncType: props.syncType, status: '', stage: '', current: 0, total: 0, message: '', startedAt: '', finishedAt: '' });
const visible = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
let loading = false;
let pollingEnabled = true;

const percentage = computed(() => progress.total > 0 ? Math.min(100, Math.round(progress.current * 100 / progress.total)) : 0);
const progressStatus = computed(() => progress.status === 'SUCCEEDED' ? 'success' : progress.status === 'FAILED' ? 'exception' : undefined);
const stageText = computed(() => ({ PREPARING: '准备同步', FETCHING: '拉取远端数据', VALIDATING: '校验数据', WRITING: '写入数据库', COMPLETED: '同步完成', FAILED: '同步失败' } as Record<string, string>)[progress.stage] || '同步中');
const displayText = computed(() => progress.message || (progress.status === 'SUCCEEDED' ? '上次同步已完成' : progress.status === 'FAILED' ? '上次同步失败' : stageText.value));

const stopPolling = () => {
	if (timer) clearInterval(timer);
	timer = undefined;
};
const startPolling = () => {
	if (pollingEnabled && !timer) timer = setInterval(loadProgress, 1000);
};
const loadProgress = async () => {
	if (loading) return;
	loading = true;
	try {
		const response: any = props.loader ? await props.loader() : await getVVSyncProgress(props.syncType);
		if (!pollingEnabled) return;
		Object.assign(progress, response.data);
		emit('progress', { ...progress });
		if (progress.status === 'RUNNING') {
			visible.value = true;
			startPolling();
		}
		else if (!props.active) stopPolling();
	} catch {
		if (!props.active && progress.status !== 'RUNNING') stopPolling();
	} finally {
		loading = false;
	}
};

watch(() => props.active, (active) => {
	if (!pollingEnabled) return;
	if (active) {
		visible.value = true;
		startPolling();
	}
	void loadProgress();
});
const activatePolling = () => {
	pollingEnabled = true;
	visible.value = false;
	void loadProgress();
};
const deactivatePolling = () => {
	pollingEnabled = false;
	visible.value = false;
	stopPolling();
};
onMounted(activatePolling);
onActivated(activatePolling);
onDeactivated(deactivatePolling);
onUnmounted(deactivatePolling);
</script>

<style scoped>
.vv-sync-progress { margin: 0 0 14px; padding: 10px 12px; border-radius: 4px; background: var(--el-fill-color-light); }
.vv-sync-progress__text { display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--el-text-color-regular); }
</style>
