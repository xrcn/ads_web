<template>
	<section v-loading="loading" class="queue-notice" aria-label="麦序说明">
		<h4>麦序说明</h4>
		<p>后台和群命令共同维护当前群的说明，下次定时麦序播报生效。修改文字不会改变实际排档规则。</p>
		<template v-if="config">
			<el-alert v-if="!config.compatible" :title="config.reason" type="warning" :closable="false" show-icon />
			<el-form label-position="top" class="mt15" @submit.prevent>
				<el-form-item label="说明内容">
					<el-input v-model="content" type="textarea" :rows="12" :disabled="!canSave || !config.compatible || saving" placeholder="请输入麦序说明，支持多行" aria-label="说明内容" />
				</el-form-item>
				<p :class="{ 'text-danger': tooLong }">{{ characterCount }} / {{ config.maxLength }} 字符 · {{ config.source === 'GROUP' ? '群自定义' : '系统默认' }}</p>
				<p>可用变量：<code v-text="'{{minimumTaskAmount}}'" />（起始任务值）、<code v-text="'{{reportMinutes}}'" />（报备分钟数）。</p>
				<div class="notice-actions">
					<el-button v-if="canPreview" :loading="previewing" :disabled="!valid || !config.compatible || saving" @click="preview">预览整条播报</el-button>
					<el-button v-if="canSave" type="primary" :loading="saving" :disabled="!valid || !config.compatible || loading" @click="save(false)">保存说明</el-button>
					<el-button v-if="canSave" :disabled="saving || loading || config.source !== 'GROUP'" @click="reset">恢复默认说明</el-button>
				</div>
			</el-form>
			<el-alert v-if="saveFailed" title="保存失败，输入已保留。请确认错误后重试。" type="error" :closable="false" class="mt15" />
			<div v-if="previewText" class="mt15"><h4>播报示例</h4><p>群名、厅号和报备时间来自当前群，主持、日期和麦位使用示例数据。</p><pre class="notice-preview">{{ previewText }}</pre></div>
			<p class="mt15">群内管理员可发送“设置麦序说明”后换行填写正文，或发送“查看麦序说明”“恢复默认麦序说明”。</p>
		</template>
		<el-empty v-else-if="!loading" description="麦序说明加载失败"><el-button @click="load">重新加载</el-button></el-empty>
	</section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getQueueNotice, previewQueueNotice, saveQueueNotice, type QueueNoticeConfig } from '/@/api/wechatRobotGroup/queueNotice';
import { auth } from '/@/utils/authFunction';

const props = defineProps<{ groupId: number }>();
const canSave = auth('api/v1/system/wechatRobotGroup/queueNoticeSave');
const canPreview = auth('api/v1/system/wechatRobotGroup/queueNoticePreview');
const config = ref<QueueNoticeConfig>();
const content = ref('');
const previewText = ref('');
const loading = ref(false);
const saving = ref(false);
const previewing = ref(false);
const saveFailed = ref(false);
const characterCount = computed(() => Array.from(content.value.trim().replace(/\r\n/g, '\n')).length);
const tooLong = computed(() => characterCount.value > (config.value?.maxLength || 1000));
const valid = computed(() => characterCount.value > 0 && !tooLong.value);
let alive = true;
let previewGeneration = 0;

async function load() {
	loading.value = true;
	try {
		const response = await getQueueNotice(props.groupId);
		if (!alive) return;
		config.value = response.data;
		content.value = response.data.content;
	} catch {
		// The request layer reports the API error; this block preserves the editable draft.
	} finally {
		if (alive) loading.value = false;
	}
}

async function preview() {
	const generation = ++previewGeneration;
	const draft = content.value;
	previewing.value = true;
	try {
		const response = await previewQueueNotice(props.groupId, draft);
		if (alive && generation === previewGeneration && draft === content.value) previewText.value = response.data.content;
	} catch {
		if (alive && generation === previewGeneration) previewText.value = '';
	} finally {
		if (alive && generation === previewGeneration) previewing.value = false;
	}
}

async function save(reset: boolean) {
	if (saving.value) return;
	saving.value = true;
	saveFailed.value = false;
	try {
		await saveQueueNotice(props.groupId, content.value, reset);
		if (!alive) return;
		ElMessage.success(reset ? '麦序说明已恢复默认，下次播报生效' : '麦序说明已保存，下次播报生效');
		await load();
	} catch {
		if (alive) saveFailed.value = true;
	} finally {
		if (alive) saving.value = false;
	}
}

async function reset() {
	try { await ElMessageBox.confirm('将当前群的麦序说明恢复为系统默认？', '恢复默认说明', { type: 'warning' }); }
	catch { return; }
	if (alive) await save(true);
}

watch(content, () => { previewGeneration++; previewText.value = ''; previewing.value = false; });
onMounted(load);
onBeforeUnmount(() => { alive = false; previewGeneration++; });
</script>

<style scoped>
.queue-notice p { color: var(--el-text-color-secondary); line-height: 1.7; }
.notice-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.notice-actions .el-button { margin-left: 0; }
.notice-preview { white-space: pre-wrap; overflow-wrap: anywhere; padding: 16px; background: var(--el-fill-color-light); border-radius: 6px; }
.queue-notice .text-danger { color: var(--el-color-danger); }
</style>
