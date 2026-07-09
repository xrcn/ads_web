<template>
	<div class="up-img" v-if="limit > 1">
		<el-upload
			v-model:file-list="dataFileList"
			:limit="limit"
			:action="action"
			:multiple="multiple"
			:list-type="listType"
			:on-success="handleAvatarSuccess"
			:on-preview="handlePictureCardPreview"
			:on-remove="handleRemove"
			:on-exceed="handleExceed"
			:before-upload="beforeAvatarUpload"
			:data="dataParam"
			ref="upImageRef"
		>
			<el-icon><ele-Plus /></el-icon>
		</el-upload>

		<el-dialog v-model="dialogVisible">
			<el-image :src="dialogImageUrl" fit="contain" />
		</el-dialog>
	</div>
	<div class="up-img" v-else>
		<el-upload
			v-model:file-list="dataFileList"
			class="avatar-uploader"
			:action="action"
			:show-file-list="false"
			:on-success="handleAvatarSuccess"
			:before-upload="beforeAvatarUpload"
			:on-preview="handlePictureCardPreview"
			:on-remove="handleRemove"
			:data="dataParam"
		>
			<img v-if="imageUrl" :src="imageUrl" class="avatar" />
			<el-icon v-else class="avatar-uploader-icon"><ele-Plus /></el-icon>
		</el-upload>
	</div>
</template>

<script lang="ts">
/* eslint-disable vue/no-side-effects-in-computed-properties,no-console */
import { defineComponent, ref, computed, getCurrentInstance, reactive, onMounted } from 'vue';
import type { UploadProps, UploadUserFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { getToken } from '/@/utils/gfast';
import _ from 'lodash';
import { getBatchByKey } from '/@/api/system/config';
export default defineComponent({
	name: 'uploadImg',
	props: {
		action: { type: String, default: '' }, //上传地址
		name: { type: String, default: 'file' }, //上传文件类型
		limit: { type: Number, default: 1 }, //上传最大数量
		method: { type: String, default: 'post' }, //设置上传请求方法
		multiple: { type: Boolean, default: true }, //是否支持多选文件
		showFileList: { type: Boolean, default: true }, //是否显示已上传文件列表
		drag: { type: Boolean, default: false }, //是否启用拖拽上传
		disabled: { type: Boolean, default: false }, //是否是否禁止上传
		listType: { type: String, default: 'picture-card' }, //是否启用拖拽上传
		uploadSize: { type: Number, default: 10 }, //上传文件大小
		imageTypeFromServer: { type: Boolean, default: true }, //是否从服务器获取图片类型配置
		modelValue: {
			type: Array,
			default: function () {
				return [];
			},
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const upImageRef = ref();
		const baseURL: string | undefined | boolean = import.meta.env.VITE_API_URL;
		const { proxy } = <any>getCurrentInstance();
		const dialogImageUrl = ref('');
		const dialogVisible = ref(false);
		const imageUrl = ref('');
		const dataParam = reactive({
			token: getToken(),
		});
		const serverConfig = reactive({
			imageType: [] as string[],
			imageSize: 10240,
			loaded: false,
		});
		let uploadedFile: Array<any> = [];
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
				if (props.limit == 1) {
					uploadedFile = [];
					imageUrl.value = (value[0] ? value[0].url : '') as string;
				}
				return value;
			},
			set: (val) => {
				emit('update:modelValue', val);
			},
		});

		const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
			if (rawFile.type.substring(0, 5) !== 'image') {
				ElMessage.error('请上传图片文件');
				return false;
			}
			const fileSizeKB = rawFile.size / 1024;
			console.log('文件大小检查:', {
				'文件大小 KB': fileSizeKB,
				'限制 KB': serverConfig.imageSize,
				'限制 MB': serverConfig.imageSize / 1024,
				是否超标: fileSizeKB > serverConfig.imageSize,
			});
			if (fileSizeKB > serverConfig.imageSize) {
				if (serverConfig.imageSize < 1024) {
					ElMessage.error('上传文件超过' + serverConfig.imageSize.toFixed(0) + 'KB');
				} else {
					ElMessage.error('上传文件超过' + (serverConfig.imageSize / 1024).toFixed(0) + 'M');
				}
				return false;
			}
			if (serverConfig.imageType.length > 0) {
				const fileExt = rawFile.name.substring(rawFile.name.lastIndexOf('.') + 1).toLowerCase();
				console.log('文件类型检查:', {
					文件扩展名: fileExt,
					允许类型: serverConfig.imageType,
					是否匹配: serverConfig.imageType.includes(fileExt),
				});
				const isValidType = serverConfig.imageType.some((type) => type === fileExt);
				if (!isValidType) {
					ElMessage.error('不支持该图片格式，请上传：' + serverConfig.imageType.join(', '));
					return false;
				}
			}
			return true;
		};
		const handleRemove: UploadProps['onRemove'] = (file) => {
			uploadedFile.splice(
				uploadedFile.findIndex((item: any) => item.name === file.name),
				1
			);
			setDataFileList();
		};
		const handleExceed = () => {
			ElMessage.error('最多可上传' + props.limit + '个文件，已超出最大限制数。');
		};
		const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
			dialogImageUrl.value = uploadFile.url!;
			dialogVisible.value = true;
		};
		const handleAvatarSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
			if (props.limit == 1) {
				uploadedFile = [];
				imageUrl.value = URL.createObjectURL(uploadFile.raw!);
			}
			uploadedFile = uploadedFile.filter((item: UploadUserFile) => {
				return item.raw?.uid != uploadFile.raw?.uid;
			});
			if (response.code === 0) {
				uploadedFile.push({
					name: response.data.name,
					url: response.data.path,
					fileType: response.data.type,
					size: response.data.size,
				});
			} else {
				ElMessage.error(response.message);
			}
			setDataFileList();
		};
		const setDataFileList = () => {
			dataFileList.value = uploadedFile;
		};
		const parseFileSize = (sizeStr: string): number => {
			const match = sizeStr.match(/^(\d+)\s*(KB|MB|M|K|B)?$/i);
			if (!match) return 10240;
			const value = parseInt(match[1], 10);
			const unit = (match[2] || 'MB').toUpperCase();
			if (unit === 'KB' || unit === 'K') {
				return value;
			} else if (unit === 'B') {
				return value / 1024;
			} else {
				return value * 1024;
			}
		};
		const loadServerConfig = async () => {
			if (!props.imageTypeFromServer) {
				serverConfig.imageSize = props.uploadSize * 1024;
				serverConfig.loaded = true;
				return;
			}
			try {
				const res = await getBatchByKey(['sys.uploadFile.imageType', 'sys.uploadFile.imageSize']);
				console.log('服务端配置响应:', res);
				if (res.code === 0 && res.data && res.data.data) {
					const configList = res.data.data;
					const imageTypeConfig = configList.find((item: any) => item.configKey === 'sys.uploadFile.imageType');
					const imageSizeConfig = configList.find((item: any) => item.configKey === 'sys.uploadFile.imageSize');
					if (imageTypeConfig && imageTypeConfig.configValue) {
						serverConfig.imageType = imageTypeConfig.configValue.split(',').map((s: string) => s.trim().toLowerCase());
					}
					if (imageSizeConfig && imageSizeConfig.configValue) {
						serverConfig.imageSize = parseFileSize(imageSizeConfig.configValue);
					}
				}
				console.log('服务端配置加载完成:', {
					图片类型: serverConfig.imageType,
					'图片大小 KB': serverConfig.imageSize,
					'图片大小 MB': serverConfig.imageSize / 1024,
				});
				serverConfig.loaded = true;
			} catch (error) {
				console.error('加载服务端配置失败:', error);
				serverConfig.imageSize = props.uploadSize * 1024;
				serverConfig.loaded = true;
			}
		};
		onMounted(() => {
			loadServerConfig();
		});
		const stopUpImage = () => {
			upImageRef.value.abort();
		};
		return {
			upImageRef,
			dataFileList,
			imageUrl,
			baseURL,
			dialogVisible,
			dialogImageUrl,
			handleExceed,
			beforeAvatarUpload,
			handleRemove,
			handlePictureCardPreview,
			handleAvatarSuccess,
			stopUpImage,
			dataParam,
		};
	},
});
/* eslint-enable vue/no-side-effects-in-computed-properties */
</script>

<style scoped>
.up-img :deep(.avatar-uploader .avatar) {
	width: 178px;
	height: 178px;
	display: block;
}
.up-img :deep(.avatar-uploader .el-upload) {
	border: 1px dashed var(--el-border-color);
	border-radius: 6px;
	cursor: pointer;
	position: relative;
	overflow: hidden;
	transition: var(--el-transition-duration-fast);
}

.up-img :deep(.avatar-uploader .el-upload:hover) {
	border-color: var(--el-color-primary);
}

.up-img :deep(.el-icon.avatar-uploader-icon) {
	font-size: 28px;
	color: #8c939d;
	width: 178px;
	height: 178px;
	text-align: center;
}
</style>
