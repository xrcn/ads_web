<template>
	<div class="edit-mic-dialog">
		<el-dialog :title="form.id ? '编辑麦序记录' : '新增麦序记录'" v-model="visible" width="680px">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="主播" prop="anchorInfoId">
							<el-input v-if="isEditMode" v-model="form.nickname" readonly />
							<el-select v-else v-model="form.anchorInfoId" filterable placeholder="请选择主播" class="w100">
								<el-option
									v-for="item in anchorOptions"
									:key="item.anchorInfoId"
									:label="item.nickname"
									:value="item.anchorInfoId"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="日期" prop="statDate">
							<el-date-picker v-model="form.statDate" type="date" value-format="YYYY-MM-DD" class="w100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="所属厅" prop="hallId">
							<el-select v-model="form.hallId" filterable clearable placeholder="请选择所属厅" class="w100">
								<el-option v-for="item in hallOptions" :key="item.hallId" :label="item.hallName" :value="item.hallId" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="主持时段">
							<el-input v-model="form.hostSlots" placeholder="例如 13-18,20-21" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="接档时段">
							<el-input v-model="form.shiftSlots" placeholder="例如 13-18,20-21" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="作业数量">
							<el-input-number v-model="form.jobCount" :min="0" :precision="0" class="w100" />
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
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { addAnchorMic, editAnchorMic, getAnchorMicAnchorOptions, getAnchorMicDetail } from '/@/api/anchorMic';
import { getAnchorHallOptions } from '/@/api/anchor';

defineOptions({ name: 'editMic' });

const emit = defineEmits(['success']);
const formRef = ref<FormInstance>();
const visible = ref(false);
const anchorOptions = ref<any[]>([]);
const hallOptions = ref<any[]>([]);
let dialogRequestId = 0;
const isEditMode = computed(() => !!form.id);

const createForm = () => ({
	id: 0,
	anchorInfoId: '',
	nickname: '',
	statDate: '',
	hallId: '',
	hostSlots: '',
	shiftSlots: '',
	jobCount: 0,
	remark: '',
});

const form = reactive(createForm());

const rules = {
	anchorInfoId: [{ required: true, message: '请选择主播', trigger: 'change' }],
	statDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
	hallId: [{ required: true, message: '请选择所属厅', trigger: 'change' }],
};

const normalizeDate = (value: string) => {
	if (!value) return '';
	return value.substring(0, 10);
};

const formatSlots = (slots: any[], slotType: string) => {
	return (slots ?? [])
		.filter((item) => item.slotType === slotType)
		.map((item) => item.sourceRaw)
		.join(',');
};

const validateSlotText = (raw: string): string => {
	const value = raw.trim();
	if (!value) return '';
	if (value.includes(':')) return '第一版只支持整点时段';
	if (!/^(?:\d{1,2}-\d{1,2})(?:,\d{1,2}-\d{1,2})*$/.test(value)) return '时段格式错误，请使用 13-18 这种格式';
	return '';
};

const validateMicForm = (currentForm: typeof form): string => {
	const hostSlots = currentForm.hostSlots.trim();
	const shiftSlots = currentForm.shiftSlots.trim();
	if (!hostSlots && !shiftSlots) return '主持时段和接档时段不能同时为空';
	return validateSlotText(hostSlots) || validateSlotText(shiftSlots);
};

const resetForm = () => {
	Object.assign(form, createForm());
	formRef.value?.clearValidate();
};

const loadAnchorOptions = () => {
	getAnchorMicAnchorOptions().then((res: any) => {
		anchorOptions.value = res.data.list ?? [];
	});
};

const loadHallOptions = () => {
	getAnchorHallOptions().then((res: any) => {
		hallOptions.value = res.data.list ?? [];
	});
};

const syncAnchorMetaByAnchor = () => {
	const currentAnchor = anchorOptions.value.find((item: any) => item.anchorInfoId === form.anchorInfoId);
	if (currentAnchor) {
		form.nickname = currentAnchor.nickname || '';
		form.hallId = currentAnchor.hallId || '';
	}
};

const openDialog = (row?: any) => {
	const requestId = ++dialogRequestId;
	resetForm();
	visible.value = true;
	loadAnchorOptions();
	loadHallOptions();
	if (!row) return;
	getAnchorMicDetail(row.id).then((res: any) => {
		if (requestId !== dialogRequestId) return;
		const data = res.data;
		Object.assign(form, {
			id: data.id,
			anchorInfoId: data.anchorInfoId,
			nickname: data.nickname || '',
			statDate: normalizeDate(data.statDate || ''),
			hallId: data.hallId || '',
			hostSlots: formatSlots(data.slots, 'host'),
			shiftSlots: formatSlots(data.slots, 'shift'),
			jobCount: data.jobCount,
			remark: data.remark || '',
		});
	});
};

const submit = () => {
	formRef.value?.validate((valid) => {
		if (!valid) return;
		const error = validateMicForm(form);
		if (error) {
			ElMessage.error(error);
			return;
		}
		const requestData = {
			...form,
			hostSlots: form.hostSlots.trim(),
			shiftSlots: form.shiftSlots.trim(),
		};
		const request = form.id ? editAnchorMic(requestData) : addAnchorMic(requestData);
		request.then(() => {
			ElMessage.success(form.id ? '麦序记录修改成功' : '麦序记录新增成功');
			visible.value = false;
			emit('success');
		});
	});
};

watch(
	() => form.anchorInfoId,
	() => {
		if (!visible.value) return;
		if (isEditMode.value) return;
		syncAnchorMetaByAnchor();
	}
);

defineExpose({ openDialog, validateSlotText, validateMicForm });
</script>
