<template>
	<div class="edit-anchor-dialog">
		<el-dialog :title="form.id ? '编辑主播' : '新增主播'" v-model="visible" width="760px">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
				<el-row :gutter="20">
					<el-col :span="24">
						<el-form-item label="主播头像">
							<el-upload
								class="anchor-avatar-uploader"
								:action="uploadAction"
								:show-file-list="false"
								:headers="uploadHeaders"
								name="file"
								:on-success="handleUploadSuccess"
							>
								<img v-if="form.avatar" :src="getUpFileUrl(form.avatar)" class="anchor-avatar" />
								<el-icon v-else class="anchor-avatar-icon"><ele-Plus /></el-icon>
							</el-upload>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="主播ID" prop="anchorId">
							<el-input v-model="form.anchorId" placeholder="请输入主播ID" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="主播昵称" prop="nickname">
							<el-input v-model="form.nickname" placeholder="请输入主播昵称" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="入职时间" prop="entryDate">
							<el-date-picker v-model="form.entryDate" type="date" value-format="YYYY-MM-DD" class="w100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="姓名" prop="realName">
							<el-input v-model="form.realName" placeholder="请输入姓名" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="手机号" prop="mobile">
							<el-input v-model="form.mobile" placeholder="请输入手机号" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="所属厅" prop="hallId">
							<el-select v-model="form.hallId" placeholder="请选择所属厅" class="w100">
								<el-option v-for="item in hallOptions" :key="item.hallId" :label="item.hallName" :value="item.hallId" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" placeholder="请选择状态" class="w100">
								<el-option label="正常" value="normal" />
								<el-option label="封号" value="banned" />
								<el-option label="离职" value="left" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12" v-if="form.id || form.status === 'left'">
						<el-form-item label="离职时间" prop="leaveDate">
							<el-date-picker
								v-model="form.leaveDate"
								type="date"
								value-format="YYYY-MM-DD"
								class="w100"
								:disabled="form.status !== 'left'"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="备注">
							<el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<el-button @click="visible = false">取消</el-button>
				<el-button type="primary" @click="submit">保存</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { addAnchor, editAnchor, getAnchorDetail } from '/@/api/anchor';
import { baseURL, getToken, getUpFileUrl } from '/@/utils/gfast';

defineOptions({ name: 'editAnchor' });

const props = defineProps({
	hallOptions: {
		type: Array,
		default: () => [],
	},
});

const emit = defineEmits(['success']);

const formRef = ref<FormInstance>();
const visible = ref(false);
const uploadAction = `${baseURL}/api/v1/system/upload/singleImg`;
const uploadHeaders = {
	Authorization: `Bearer ${getToken()}`,
};

const createForm = () => ({
	id: 0,
	anchorId: '',
	nickname: '',
	avatar: '',
	entryDate: '',
	realName: '',
	mobile: '',
	hallId: '',
	status: 'normal',
	leaveDate: '',
	remark: '',
});

const form = reactive(createForm());

const rules = {
	anchorId: [{ required: true, message: '请输入主播ID', trigger: 'blur' }],
	nickname: [{ required: true, message: '请输入主播昵称', trigger: 'blur' }],
	entryDate: [{ required: true, message: '请选择入职时间', trigger: 'change' }],
	realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
	mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
	hallId: [{ required: true, message: '请选择所属厅', trigger: 'change' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const resetForm = () => {
	Object.assign(form, createForm());
	formRef.value?.clearValidate();
};

const normalizeDate = (value: string) => {
	if (!value) return '';
	return value.substring(0, 10);
};

const openDialog = (row?: any) => {
	resetForm();
	visible.value = true;
	if (!row) return;
	getAnchorDetail(row.id).then((res: any) => {
		const data = res.data;
		Object.assign(form, {
			id: data.id,
			anchorId: data.anchorId,
			nickname: data.nickname,
			avatar: data.avatar || '',
			entryDate: normalizeDate(data.entryDate || ''),
			realName: data.realName,
			mobile: data.mobile,
			hallId: data.hallId,
			status: data.status,
			leaveDate: normalizeDate(data.leaveDate || ''),
			remark: data.remark || '',
		});
	});
};

const handleUploadSuccess = (response: any) => {
	if (response.code !== 0) {
		ElMessage.error(response.message || '头像上传失败');
		return;
	}
	form.avatar = response.data.path;
	ElMessage.success('头像上传成功');
};

const submit = () => {
	formRef.value?.validate((valid) => {
		if (!valid) return;
		const requestData = { ...form };
		const request = form.id ? editAnchor(requestData) : addAnchor(requestData);
		request.then(() => {
			ElMessage.success(form.id ? '主播修改成功' : '主播新增成功');
			visible.value = false;
			emit('success');
		});
	});
};

defineExpose({ openDialog });
</script>

<style scoped>
.anchor-avatar-uploader :deep(.el-upload) {
	border: 1px dashed var(--el-border-color);
	border-radius: 6px;
	cursor: pointer;
	width: 120px;
	height: 120px;
	overflow: hidden;
}

.anchor-avatar {
	width: 120px;
	height: 120px;
	display: block;
	object-fit: cover;
}

.anchor-avatar-icon {
	font-size: 28px;
	color: var(--el-text-color-secondary);
	width: 120px;
	height: 120px;
	text-align: center;
}
</style>
