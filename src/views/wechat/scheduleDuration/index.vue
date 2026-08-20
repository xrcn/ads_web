<template>
	<div class="wechat-schedule-duration-container">
		<el-card shadow="hover">
			<el-form :model="query" inline label-width="78px" class="mb15">
				<el-form-item label="统计日期"><el-date-picker v-model="query.startDate" value-format="YYYY-MM-DD" /><span class="date-separator">至</span><el-date-picker v-model="query.endDate" value-format="YYYY-MM-DD" /></el-form-item>
				<el-form-item label="微信群"><el-select v-model="query.groupId" clearable filterable placeholder="全部" style="width: 220px"><el-option v-for="item in groups" :key="item.id" :label="item.groupName" :value="item.id" /></el-select></el-form-item>
				<el-form-item label="主播"><el-input v-model="query.keyword" clearable placeholder="昵称或 wxid" @keyup.enter="loadData" /></el-form-item>
				<el-form-item label="状态"><el-select v-model="query.status" style="width: 120px"><el-option label="有效" value="ACTIVE" /><el-option label="全部" value="ALL" /><el-option label="已作废" value="VOIDED" /></el-select></el-form-item>
				<el-form-item><el-button type="primary" @click="loadData"><el-icon><ele-Search /></el-icon>查询</el-button><el-button @click="resetQuery"><el-icon><ele-Refresh /></el-icon>重置</el-button><el-button type="success" plain @click="openManual"><el-icon><ele-FolderAdd /></el-icon>补录时长</el-button></el-form-item>
			</el-form>

			<el-row :gutter="15" class="mb15">
				<el-col :xs="12" :sm="6"><el-statistic title="主播数" :value="summary.anchorCount" /></el-col>
				<el-col :xs="12" :sm="6"><el-statistic title="有效记录" :value="summary.recordCount" /></el-col>
				<el-col :xs="12" :sm="6"><el-statistic title="总时长（分钟）" :value="summary.totalMinutes" /></el-col>
				<el-col :xs="12" :sm="6"><el-statistic title="总时长（小时）" :value="hours(summary.totalMinutes)" :precision="2" /></el-col>
			</el-row>

			<el-table v-loading="loading" :data="details" border stripe>
				<el-table-column prop="businessDate" label="日期" width="110" />
				<el-table-column prop="groupName" label="微信群" min-width="150" show-overflow-tooltip />
				<el-table-column prop="memberName" label="主播昵称" min-width="130" show-overflow-tooltip />
				<el-table-column prop="memberWxid" label="主播 wxid" min-width="160" show-overflow-tooltip />
				<el-table-column prop="enteredAt" label="上麦时间" width="170" />
				<el-table-column prop="leftAt" label="下麦时间" width="170" />
				<el-table-column label="时长" width="105" align="right"><template #default="{ row }">{{ row.minutes }} 分钟</template></el-table-column>
				<el-table-column label="来源" width="90" align="center"><template #default="{ row }"><el-tag :type="row.source === 'MANUAL' ? 'warning' : 'success'">{{ row.source === 'MANUAL' ? '手工补录' : '自动统计' }}</el-tag></template></el-table-column>
				<el-table-column label="状态" width="85" align="center"><template #default="{ row }"><el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{ row.status === 'ACTIVE' ? '有效' : '已作废' }}</el-tag></template></el-table-column>
				<el-table-column prop="lastReason" label="最后原因" min-width="140" show-overflow-tooltip />
				<el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button text type="primary" @click="openDetail(row)">详情</el-button><el-button v-if="row.status === 'ACTIVE'" text type="primary" @click="openEdit(row)">修正</el-button><el-button v-if="row.status === 'ACTIVE'" text type="danger" @click="voidRecord(row)">作废</el-button></template></el-table-column>
			</el-table>
		</el-card>

		<el-drawer v-model="detailVisible" title="主播麦序时长详情" size="520px">
			<el-descriptions v-if="selected" :column="1" border>
				<el-descriptions-item label="日期">{{ selected.businessDate }}</el-descriptions-item>
				<el-descriptions-item label="微信群">{{ selected.groupName }}</el-descriptions-item>
				<el-descriptions-item label="主播">{{ selected.memberName }}（{{ selected.memberWxid }}）</el-descriptions-item>
				<el-descriptions-item label="生效时段">{{ selected.enteredAt }} 至 {{ selected.leftAt }}</el-descriptions-item>
				<el-descriptions-item label="生效时长">{{ selected.minutes }} 分钟</el-descriptions-item>
				<el-descriptions-item label="来源">{{ selected.source === 'MANUAL' ? '手工补录' : '自动统计' }}</el-descriptions-item>
				<el-descriptions-item label="状态">{{ selected.status === 'ACTIVE' ? '有效' : '已作废' }}</el-descriptions-item>
				<el-descriptions-item v-if="selected.originalEnteredAt" label="原始上麦时间">{{ selected.originalEnteredAt }}</el-descriptions-item>
				<el-descriptions-item v-if="selected.originalLeftAt" label="原始下麦时间">{{ selected.originalLeftAt }}</el-descriptions-item>
				<el-descriptions-item label="最后操作原因">{{ selected.lastReason || '-' }}</el-descriptions-item>
			</el-descriptions>
			<el-divider>操作审计</el-divider>
			<el-table :data="audits" border size="small" empty-text="尚无人工操作记录">
				<el-table-column prop="action" label="操作" width="110" />
				<el-table-column prop="reason" label="原因" min-width="130" show-overflow-tooltip />
				<el-table-column prop="operatorName" label="操作人" width="100" />
				<el-table-column prop="createdAt" label="时间" width="170" />
				<el-table-column label="快照" width="70"><template #default="{ row }"><el-popover placement="left" width="460" trigger="click"><template #reference><el-button text type="primary">查看</el-button></template><p class="snapshot-label">变更前</p><pre>{{ formatSnapshot(row.beforeSnapshot) }}</pre><p class="snapshot-label">变更后</p><pre>{{ formatSnapshot(row.afterSnapshot) }}</pre></el-popover></template></el-table-column>
			</el-table>
		</el-drawer>

		<el-dialog v-model="formVisible" :title="formMode === 'MANUAL' ? '补录主播麦序时长' : '修正主播麦序时长'" width="620px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-form-item label="微信群" prop="groupId"><el-select v-model="form.groupId" :disabled="formMode === 'EDIT'" filterable class="w100" placeholder="请选择微信群"><el-option v-for="item in groups" :key="item.id" :label="item.groupName" :value="item.id" /></el-select></el-form-item>
				<el-form-item label="主播 wxid" prop="memberWxid"><el-input v-model="form.memberWxid" :disabled="formMode === 'EDIT'" placeholder="请输入主播 wxid" /></el-form-item>
				<el-form-item label="主播昵称" prop="memberName"><el-input v-model="form.memberName" placeholder="请输入主播昵称" /></el-form-item>
				<el-form-item label="上麦时间" prop="enteredAt"><el-date-picker v-model="form.enteredAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w100" /></el-form-item>
				<el-form-item label="下麦时间" prop="leftAt"><el-date-picker v-model="form.leftAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w100" /></el-form-item>
				<el-form-item :label="formMode === 'MANUAL' ? '补录原因' : '修正原因'" prop="reason"><el-input v-model="form.reason" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
			</el-form>
			<template #footer><el-button @click="formVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submitForm">保存</el-button></template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getWechatRobotGroupList } from '/@/api/wechatRobotGroup';
import { addWechatGroupScheduleDurationManual, getWechatGroupScheduleDurationAudit, getWechatGroupScheduleDurationDetail, getWechatGroupScheduleDurationSummary, updateWechatGroupScheduleDuration, voidWechatGroupScheduleDuration } from '/@/api/wechatGroupSchedule';

defineOptions({ name: 'wechatScheduleDuration' });

const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = formatDate(new Date());
const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const detailVisible = ref(false);
const formVisible = ref(false);
const formMode = ref<'MANUAL' | 'EDIT'>('MANUAL');
const selected = ref<any>();
const audits = ref<any[]>([]);
const editing = ref<any>();
const groups = ref<any[]>([]);
const details = ref<any[]>([]);
const summary = reactive({ anchorCount: 0, recordCount: 0, totalMinutes: 0 });
const query = reactive({ startDate: today, endDate: today, groupId: '' as number | '', keyword: '', status: 'ACTIVE' });
const createForm = () => ({ groupId: '' as number | '', memberWxid: '', memberName: '', enteredAt: '', leftAt: '', reason: '' });
const form = reactive(createForm());
const rules: FormRules = { groupId: [{ required: true, message: '请选择微信群', trigger: 'change' }], memberWxid: [{ required: true, message: '请输入主播 wxid', trigger: 'blur' }], memberName: [{ required: true, message: '请输入主播昵称', trigger: 'blur' }], enteredAt: [{ required: true, message: '请选择上麦时间', trigger: 'change' }], leftAt: [{ required: true, message: '请选择下麦时间', trigger: 'change' }], reason: [{ required: true, message: '请输入操作原因', trigger: 'blur' }] };
const hours = (minutes: number) => Number((minutes / 60).toFixed(2));
const requestParams = () => ({ ...query, groupId: query.groupId || undefined });
const loadGroups = () => getWechatRobotGroupList({ pageNum: 1, pageSize: 1000, status: 1 }).then((res: any) => { groups.value = res.data.list || []; });
const loadData = () => { loading.value = true; Promise.all([getWechatGroupScheduleDurationSummary(requestParams()), getWechatGroupScheduleDurationDetail(requestParams())]).then(([summaryRes, detailRes]: any[]) => { Object.assign(summary, summaryRes.data || {}); details.value = detailRes.data.list || []; }).finally(() => { loading.value = false; }); };
const resetQuery = () => { Object.assign(query, { startDate: today, endDate: today, groupId: '', keyword: '', status: 'ACTIVE' }); loadData(); };
const formatSnapshot = (value: string) => { try { return JSON.stringify(JSON.parse(value || '{}'), null, 2); } catch { return value || '{}'; } };
const openDetail = (row: any) => { selected.value = row; audits.value = []; detailVisible.value = true; getWechatGroupScheduleDurationAudit({ id: row.id, recordType: row.source }).then((res: any) => { audits.value = res.data.list || []; }); };
const openManual = () => { Object.assign(form, createForm()); formMode.value = 'MANUAL'; formVisible.value = true; };
const openEdit = (row: any) => { editing.value = row; Object.assign(form, { groupId: row.groupId, memberWxid: row.memberWxid, memberName: row.memberName, enteredAt: row.enteredAt, leftAt: row.leftAt, reason: '' }); formMode.value = 'EDIT'; formVisible.value = true; };
const submitForm = () => formRef.value?.validate((valid) => { if (!valid) return; saving.value = true; const request = formMode.value === 'MANUAL' ? addWechatGroupScheduleDurationManual(form) : updateWechatGroupScheduleDuration(editing.value.id, { recordType: editing.value.source, memberName: form.memberName, enteredAt: form.enteredAt, leftAt: form.leftAt, reason: form.reason }); request.then(() => { ElMessage.success('保存成功'); formVisible.value = false; loadData(); }).finally(() => { saving.value = false; }); });
const voidRecord = (row: any) => ElMessageBox.prompt('请输入作废原因', '作废主播麦序时长', { inputType: 'textarea', inputPattern: /\S+/, inputErrorMessage: '作废原因不能为空', confirmButtonText: '确认作废', cancelButtonText: '取消', type: 'warning' }).then(({ value }) => voidWechatGroupScheduleDuration(row.id, { recordType: row.source, reason: value }).then(() => { ElMessage.success('已作废'); loadData(); })).catch(() => {});

onMounted(() => { loadGroups(); loadData(); });
</script>

<style scoped lang="scss">
.date-separator { margin: 0 10px; color: var(--el-text-color-secondary); }
.w100 { width: 100%; }
.snapshot-label { margin: 8px 0 4px; font-weight: 600; }
pre { max-height: 220px; margin: 0; overflow: auto; white-space: pre-wrap; word-break: break-all; }
</style>
