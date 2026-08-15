<template>
	<div class="edit-bank-card-dialog">
		<el-dialog :title="form.id ? '编辑工资卡' : '新增工资卡'" v-model="visible" width="680px">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="95px">
				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="开户人" prop="accountName">
							<el-input v-model="form.accountName" placeholder="请输入开户人" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="身份证号" prop="idCardNo">
							<el-input v-model="form.idCardNo" placeholder="请输入身份证号" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="开户行" prop="bankName">
							<el-input v-model="form.bankName" placeholder="请输入开户行" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="支行名称" prop="bankBranch">
							<el-input v-model="form.bankBranch" placeholder="请输入支行名称" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="银行卡号" prop="bankCardNo">
							<el-input v-model="form.bankCardNo" placeholder="请输入银行卡号" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" placeholder="请选择状态" class="w100">
								<el-option label="启用" value="enabled" />
								<el-option label="停用" value="disabled" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="默认卡">
							<el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="备注">
							<el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { addAnchorBankCard, editAnchorBankCard, getAnchorBankCardDetail } from '/@/api/anchor';

defineOptions({ name: 'editBankCard' });

const emit = defineEmits(['success']);
const visible = ref(false);
const formRef = ref<FormInstance>();

const createForm = () => ({
	id: 0,
	anchorInfoId: 0,
	accountName: '',
	idCardNo: '',
	bankName: '',
	bankBranch: '',
	bankCardNo: '',
	isDefault: 0,
	status: 'enabled',
	remark: '',
});

const form = reactive(createForm());

const rules = {
	accountName: [{ required: true, message: '请输入开户人', trigger: 'blur' }],
	idCardNo: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
	bankName: [{ required: true, message: '请输入开户行', trigger: 'blur' }],
	bankCardNo: [{ required: true, message: '请输入银行卡号', trigger: 'blur' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const resetForm = () => {
	Object.assign(form, createForm());
	formRef.value?.clearValidate();
};

const openDialog = (anchorRow: any, row?: any) => {
	resetForm();
	form.anchorInfoId = anchorRow.id;
	visible.value = true;
	if (!row) return;
	getAnchorBankCardDetail(row.id).then((res: any) => {
		Object.assign(form, res.data);
	});
};

const submit = () => {
	formRef.value?.validate((valid) => {
		if (!valid) return;
		const requestData = { ...form };
		const request = form.id ? editAnchorBankCard(requestData) : addAnchorBankCard(requestData);
		request.then(() => {
			ElMessage.success(form.id ? '工资卡修改成功' : '工资卡新增成功');
			visible.value = false;
			emit('success');
		});
	});
};

defineExpose({ openDialog });
</script>
