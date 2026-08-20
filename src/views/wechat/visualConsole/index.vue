<template>
	<div class="wechat-visual-console-page">
		<iframe
			v-if="!loadFailed"
			ref="frameRef"
			class="console-frame"
			:src="consoleSrc"
			title="微信 API 可视化控制台"
			@load="sendBootstrap"
			@error="loadFailed = true"
		/>
		<el-result v-else icon="error" title="控制台加载失败">
			<template #extra>
				<el-button type="primary" @click="reload">重新加载</el-button>
			</template>
		</el-result>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { Session } from '/@/utils/storage';

const frameRef = ref<HTMLIFrameElement>();
const loadFailed = ref(false);
const consoleSrc = new URL(`${import.meta.env.BASE_URL}wechat-visual-console/index.html`, window.location.origin).toString();

function sendBootstrap() {
	frameRef.value?.contentWindow?.postMessage(
		{
			type: 'wechat-console:bootstrap',
			apiBase: import.meta.env.VITE_API_URL,
			authorization: `Bearer ${Session.get('token') || ''}`,
		},
		window.location.origin
	);
}

function onFrameMessage(event: MessageEvent) {
	if (event.origin !== window.location.origin || event.source !== frameRef.value?.contentWindow || event.data?.type !== 'wechat-console:ready') return;
	sendBootstrap();
}

function reload() {
	loadFailed.value = false;
	nextTick(sendBootstrap);
}

onMounted(() => window.addEventListener('message', onFrameMessage));
onUnmounted(() => window.removeEventListener('message', onFrameMessage));
</script>

<style scoped lang="scss">
.wechat-visual-console-page {
	min-height: 640px;
	height: calc(100vh - 105px);
	background: #071321;
}

.console-frame {
	width: 100%;
	height: 100%;
	border: 0;
	display: block;
}
</style>
