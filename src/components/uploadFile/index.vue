<template>
	<el-upload
		v-model:file-list="dataFileList"
		class="upload-demo"
		:action="action"
		:multiple="multiple"
		:drag="drag"
		:on-remove="handleRemove"
		:before-remove="beforeRemove"
		:limit="limit"
		:on-exceed="handleExceed"
		:before-upload="beforeUpload"
		:on-change="handleChange"
		:on-success="handleSuccess"
		:data="dataParam"
		:on-preview="handlePreview"
		ref="upFileRef"
		:accept="accept"
	>
		<el-icon class="el-icon--upload"><ele-UploadFilled /></el-icon>
		<div class="el-upload__text">拖拽文件至此 或<em>点击上传</em></div>
		<template #tip>
			<div class="el-upload__tip">请上传{{ formatSizeTip }} 以内</div>
		</template>
	</el-upload>
</template>

<script lang="ts">
/* eslint-disable vue/no-side-effects-in-computed-properties,no-console */
import { computed, defineComponent, getCurrentInstance, reactive, ref, onMounted } from 'vue';
import type { UploadProps, UploadUserFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { getToken } from '/@/utils/gfast';
import _ from 'lodash';
import { getBatchByKey } from '/@/api/system/config';
export default defineComponent({
	name: 'uploadFile',
	props: {
		action: { type: String, default: '' }, //上传地址
		name: { type: String, default: 'file' }, //上传文件类型
		method: { type: String, default: 'post' }, //设置上传请求方法
		multiple: { type: Boolean, default: true }, //是否支持多选文件
		showFileList: { type: Boolean, default: true }, //是否显示已上传文件列表
		drag: { type: Boolean, default: true }, //是否启用拖拽上传
		accept: { type: String, default: '.txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar' }, //上传文件格式
		disabled: { type: Boolean, default: false }, //是否禁止
		listType: { type: String, default: 'picture-card' }, //
		uploadSize: { type: Number, default: 200 }, //上传文件大小 M
		limit: { type: Number, default: 5 }, //上传最大数量
		fileTypeFromServer: { type: Boolean, default: true }, //是否从服务器获取文件类型配置
		modelValue: {
			type: Array,
			default: function () {
				return [];
			},
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		let uploadedFile: Array<any> = [];
		const { proxy } = <any>getCurrentInstance();
		const upFileRef = ref();
		const dataParam = reactive({
			token: getToken(),
		});
		const serverConfig = reactive({
			fileType: [] as string[],
			fileSize: 204800, // 默认 200MB (单位 KB)
			loaded: false,
		});
		const dataFileList = computed({
			get: () => {
				let value: Array<UploadUserFile> = (props.modelValue as UploadUserFile[]) || [];
				value.map((item: UploadUserFile) => {
					if (item.url) {
						item.url = proxy.getUpFileUrl(item.url);
					}
					return item;
				});
				uploadedFile = _.cloneDeep(value);
				return value;
			},
			set: (val) => {
				emit('update:modelValue', val);
			},
		});
		const formatSizeTip = computed(() => {
			if (serverConfig.fileSize < 1024) {
				return serverConfig.fileSize.toFixed(0) + 'KB';
			} else if (serverConfig.fileSize < 1024 * 1024) {
				return (serverConfig.fileSize / 1024).toFixed(0) + 'M';
			} else {
				return (serverConfig.fileSize / 1024 / 1024).toFixed(0) + 'G';
			}
		});
		const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
			const fileSizeKB = rawFile.size / 1024;
			console.log('文件大小检查:', {
				'文件大小 KB': fileSizeKB,
				'限制 KB': serverConfig.fileSize,
				限制提示: formatSizeTip.value,
				是否超标: fileSizeKB > serverConfig.fileSize,
			});
			if (fileSizeKB > serverConfig.fileSize) {
				if (serverConfig.fileSize < 1024) {
					ElMessage.error('上传文件超过' + serverConfig.fileSize.toFixed(0) + 'KB');
				} else if (serverConfig.fileSize < 1024 * 1024) {
					ElMessage.error('上传文件超过' + (serverConfig.fileSize / 1024).toFixed(0) + 'M');
				} else {
					ElMessage.error('上传文件超过' + (serverConfig.fileSize / 1024 / 1024).toFixed(0) + 'G');
				}
				return false;
			}
			if (serverConfig.fileType.length > 0) {
				const fileExt = rawFile.name.substring(rawFile.name.lastIndexOf('.') + 1).toLowerCase();
				console.log('文件类型检查:', {
					文件扩展名: fileExt,
					允许类型: serverConfig.fileType,
					是否匹配: serverConfig.fileType.includes(fileExt),
				});
				const isValidType = serverConfig.fileType.some((type) => type === fileExt);
				if (!isValidType) {
					ElMessage.error('不支持该文件格式，请上传：' + serverConfig.fileType.join(', '));
					return false;
				}
			}
			return true;
		};
		const handleChange: UploadProps['onChange'] = () => {};
		const handleExceed = () => {
			ElMessage.error('最多可上传' + props.limit + '个文件，已超出最大限制数。');
		};
		const handleSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
			uploadedFile = uploadedFile.filter((item: UploadUserFile) => {
				return item.raw?.uid != uploadFile.raw?.uid;
			});
			if (response.code === 0) {
				uploadedFile.push({
					name: response.data.name,
					url: response.data.path,
					fullUrl: response.data.fullPath,
					fileType: response.data.type,
					size: response.data.size,
				});
			} else {
				ElMessage.error(response.message);
			}
			setDataFileList();
		};
		const beforeRemove: UploadProps['beforeRemove'] = () => {
			return true;
		};
		const handleRemove: UploadProps['onRemove'] = (file) => {
			//移除后
			uploadedFile.splice(
				uploadedFile.findIndex((item: any) => item.name === file.name),
				1
			);
			setDataFileList();
		};
		const setDataFileList = () => {
			dataFileList.value = uploadedFile;
		};
		const handlePreview = (file: UploadUserFile) => {
			window.open(file.url);
		};
		const stopUpFile = () => {
			upFileRef.value.abort();
		};
		const parseFileSize = (sizeStr: string): number => {
			const match = sizeStr.match(/^(\d+)\s*(KB|MB|M|K|B|GB|G)?$/i);
			if (!match) return 204800;
			const value = parseInt(match[1], 10);
			const unit = (match[2] || 'MB').toUpperCase();
			if (unit === 'KB' || unit === 'K') {
				return value;
			} else if (unit === 'B') {
				return value / 1024;
			} else if (unit === 'GB' || unit === 'G') {
				return value * 1024 * 1024;
			} else {
				return value * 1024;
			}
		};
		const loadServerConfig = async () => {
			if (!props.fileTypeFromServer) {
				serverConfig.fileSize = props.uploadSize * 1024;
				serverConfig.loaded = true;
				return;
			}
			try {
				const res = await getBatchByKey(['sys.uploadFile.fileType', 'sys.uploadFile.fileSize']);
				console.log('服务端配置响应:', res);
				if (res.code === 0 && res.data && res.data.data) {
					const configList = res.data.data;
					const fileTypeConfig = configList.find((item: any) => item.configKey === 'sys.uploadFile.fileType');
					const fileSizeConfig = configList.find((item: any) => item.configKey === 'sys.uploadFile.fileSize');
					if (fileTypeConfig && fileTypeConfig.configValue) {
						serverConfig.fileType = fileTypeConfig.configValue.split(',').map((s: string) => s.trim().toLowerCase());
					}
					if (fileSizeConfig && fileSizeConfig.configValue) {
						serverConfig.fileSize = parseFileSize(fileSizeConfig.configValue);
					}
				}
				console.log('服务端配置加载完成:', {
					文件类型: serverConfig.fileType,
					'文件大小 KB': serverConfig.fileSize,
					文件大小提示: formatSizeTip.value,
				});
				serverConfig.loaded = true;
			} catch (error) {
				console.error('加载服务端配置失败:', error);
				serverConfig.fileSize = props.uploadSize * 1024;
				serverConfig.loaded = true;
			}
		};
		onMounted(() => {
			loadServerConfig();
		});
		return {
			dataFileList,
			handleSuccess,
			beforeRemove,
			handleRemove,
			beforeUpload,
			handleChange,
			handleExceed,
			handlePreview,
			upFileRef,
			stopUpFile,
			dataParam,
			formatSizeTip,
		};
	},
});
</script>
<style>
.el-upload.is-drag {
	display: block;
	width: 200px;
	height: 200px;
}
</style>
