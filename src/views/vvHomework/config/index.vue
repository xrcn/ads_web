<template>
	<el-card shadow="never" class="homework-config">
		<template #header><strong>自动作业配置</strong><el-button class="reload" :loading="loading" @click="load">重新加载</el-button></template>
		<el-alert title="仅用于首次登记的新用户，保存不会覆盖已有用户的授权和额度。" type="info" :closable="false" show-icon />
		<div v-if="error" class="load-error" role="alert">{{ error }}<el-button text @click="load">重试</el-button></div>
		<el-skeleton v-if="loading && !loaded" :rows="4" animated /><el-form v-if="loaded" v-loading="loading" :disabled="loading || saving" label-position="top" class="form">
			<el-form-item label="允许新用户登记"><el-switch v-model="form.allowRegistration" /><span class="hint">关闭后已登记用户仍可登录。</span></el-form-item>
			<el-form-item label="首次登录自动授权"><el-switch v-model="form.autoGrant" /><span class="hint">关闭时新用户进入待授权状态，由后台单独开通。</span></el-form-item>
			<el-form-item label="首次可用时长（小时）"><el-input-number v-model="form.durationHours" :min="form.autoGrant ? 1 : 0" :max="87600" :precision="0" /><span class="hint">自动授权开启时必须大于0，已有用户的到期时间不变。</span></el-form-item>
			<el-form-item label="默认每日成功触达上限"><el-input-number v-model="form.dailyLimit" :min="0" :max="10000" :precision="0" /><span class="hint">按不同收件 ID 计数，自动与指定作业共享；0表示禁止发送。</span></el-form-item>
			<el-form-item label="配置说明"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
			<el-form-item><el-button v-auth="'api/v1/system/vvHomework/config'" type="primary" :loading="saving" @click="save">保存首登配置</el-button></el-form-item>
		</el-form>
	</el-card>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getHomeworkConfig, saveHomeworkConfig, homeworkError, type HomeworkConfig } from '/@/api/vvHomework';
defineOptions({ name: 'vvHomeworkConfig' });
const form = reactive<HomeworkConfig>({ allowRegistration: true, autoGrant: false, durationHours: 0, dailyLimit: 200, revision: 0, description: '' });
const loading = ref(false), saving = ref(false), loaded = ref(false), error = ref('');
let generation = 0, requestController: AbortController | undefined;
const lifetime = new AbortController();
async function load() {
	const current = ++generation; requestController?.abort(); requestController = new AbortController(); loading.value = true; error.value = '';
	try { const res = await getHomeworkConfig(requestController.signal); if (current === generation && !lifetime.signal.aborted) { Object.assign(form, res.data); loaded.value = true; } }
	catch { if (current === generation && !lifetime.signal.aborted) error.value = '配置加载失败，请检查权限和连接后重试。'; }
	finally { if (current === generation) loading.value = false; }
}
async function save() {
	if (!Number.isInteger(form.dailyLimit) || !Number.isInteger(form.durationHours)) { ElMessage.warning('请完整填写时长和每日上限'); return; }
	if (form.autoGrant && form.durationHours <= 0) { ElMessage.warning('自动授权时请填写正数小时'); return; }
	saving.value = true;
	try { await saveHomeworkConfig({ ...form }, lifetime.signal); if (!lifetime.signal.aborted) { ElMessage.success('首登配置已保存，已有用户保持原授权'); await load(); } }
	catch (problem) { if (!lifetime.signal.aborted) error.value = homeworkError(problem) + ' 编辑内容已保留，可重新加载核对修订号。'; }
	finally { saving.value = false; }
}
onMounted(load);
onBeforeUnmount(() => { ++generation; requestController?.abort(); lifetime.abort(); });
</script>

<style scoped>
.homework-config{min-height:480px}.form{max-width:700px;margin-top:24px}.hint{color:var(--el-text-color-secondary);font-size:12px;margin-left:16px}.reload{float:right}.load-error{margin-top:16px;color:var(--el-color-danger)}
</style>
