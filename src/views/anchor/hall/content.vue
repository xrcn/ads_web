<template>
	<div class="anchor-hall-container">
		<el-card shadow="hover">
			<VVSyncProgress sync-type="HALL_SCORE" :active="syncingScore" />
			<MobileRecordList :data="tableData.list" :loading="tableData.loading" row-key="hallId" filter-summary="全部厅" data-mobile-view="anchor-hall">
				<template #filters>
					<el-form ref="queryRef" :model="query" inline label-width="86px" class="mb15">
						<el-form-item label="厅 ID" prop="hallId"><el-input v-model="query.hallId" clearable placeholder="请输入厅 ID" @keyup.enter="search" /></el-form-item>
						<el-form-item label="厅名" prop="hallName"><el-input v-model="query.hallName" clearable placeholder="请输入厅名" @keyup.enter="search" /></el-form-item>
						<el-form-item label="关联微信群" prop="wechatRobotGroupId">
							<el-select v-model="query.wechatRobotGroupId" clearable filterable placeholder="全部微信群">
								<el-option v-for="group in groupOptions" :key="group.id" :label="groupLabel(group)" :value="group.id" />
							</el-select>
						</el-form-item>
						<el-form-item label="状态" prop="status">
							<el-select v-model="query.status" clearable placeholder="全部状态"><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select>
						</el-form-item>
						<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button><el-button v-auth="'api/v1/system/anchor/hall/add'" type="success" plain @click="openAdd">新增厅</el-button><el-button v-auth="'api/v1/system/anchor/hall/vvScoreSync'" type="warning" :loading="syncingScore" @click="syncHallScores">同步厅健康分</el-button></el-form-item>
					</el-form>
				</template>

				<template #desktop>
					<el-table ref="hallTableRef" v-loading="tableData.loading" :data="tableData.list" border stripe @sort-change="handleSortChange">
						<el-table-column prop="hallId" label="厅 ID" min-width="100" sortable="custom" />
						<el-table-column prop="hallName" label="厅名" min-width="130" show-overflow-tooltip sortable="custom" />
						<el-table-column prop="hallBadge" label="马甲" width="80" align="center"><template #default="{ row }">{{ row.hallBadge || '-' }}</template></el-table-column>
						<el-table-column prop="hallManager" label="厅管" min-width="110"><template #default="{ row }">{{ row.hallManager || '-' }}</template></el-table-column>
						<el-table-column prop="hallAssistant" label="厅助理" min-width="110"><template #default="{ row }">{{ row.hallAssistant || '-' }}</template></el-table-column>
						<el-table-column prop="hallScore" label="健康分" width="100" align="center" sortable="custom"><template #default="{ row }"><el-button text type="primary" @click="openScoreLogs(row)">{{ row.hallScore ?? '0.00' }}</el-button></template></el-table-column>
						<el-table-column label="关联微信群" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ hallGroupLabel(row) }}</template></el-table-column>
						<el-table-column prop="status" label="状态" width="90" align="center" sortable="custom"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
						<el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip><template #default="{ row }">{{ row.remark || '-' }}</template></el-table-column>
						<el-table-column prop="updatedAt" label="更新时间" min-width="165" sortable="custom" />
						<el-table-column label="转移状态" min-width="185"><template #default="{ row }"><span v-if="row.transferStatus">{{ row.transferStatus === 'BLOCKED' ? '受阻' : '已预约' }} · 客户 {{ row.transferTargetId }} · {{ row.transferDate }}<el-tooltip v-if="row.transferError" :content="row.transferError"><el-icon><InfoFilled /></el-icon></el-tooltip></span><span v-else>-</span></template></el-table-column>
						<el-table-column label="操作" width="190" fixed="right"><template #default="{ row }"><el-button v-if="!row.transferredOutDate" v-auth="'api/v1/system/anchor/hall/edit'" text type="primary" @click="openEdit(row)">编辑</el-button><el-button v-if="row.status === 1 && !row.transferStatus" v-auth="'api/v1/system/anchor/hall/transfer'" text type="primary" @click="openTransfer(row)">转移</el-button><el-button v-if="row.transferStatus" v-auth="'api/v1/system/anchor/hall/transferCancel'" text type="danger" @click="cancelTransfer(row)">取消预约</el-button></template></el-table-column>
					</el-table>
				</template>

				<template #default="{ row }">
					<div class="mobile-record-card__header"><div><h3 class="mobile-record-card__title">{{ row.hallName }}</h3><p class="mobile-record-card__subtitle">厅 ID {{ row.hallId }}</p></div><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></div>
					<dl class="mobile-record-card__fields"><div><dt>马甲</dt><dd>{{ row.hallBadge || '-' }}</dd></div><div><dt>厅管</dt><dd>{{ row.hallManager || '-' }}</dd></div><div><dt>厅助理</dt><dd>{{ row.hallAssistant || '-' }}</dd></div><div><dt>健康分</dt><dd><el-button text type="primary" @click="openScoreLogs(row)">{{ row.hallScore ?? '0.00' }}</el-button></dd></div><div><dt>关联微信群</dt><dd>{{ hallGroupLabel(row) }}</dd></div></dl>
					<details class="mobile-record-card__details"><summary>查看完整信息</summary><dl class="mobile-record-card__fields"><div><dt>备注</dt><dd>{{ row.remark || '-' }}</dd></div><div><dt>更新时间</dt><dd>{{ row.updatedAt || '-' }}</dd></div></dl></details>
						<div class="mobile-record-card__actions"><el-button v-if="!row.transferredOutDate" v-auth="'api/v1/system/anchor/hall/edit'" type="primary" @click="openEdit(row)">编辑</el-button><el-button v-if="row.status === 1 && !row.transferStatus" v-auth="'api/v1/system/anchor/hall/transfer'" @click="openTransfer(row)">转移</el-button><el-button v-if="row.transferStatus" v-auth="'api/v1/system/anchor/hall/transferCancel'" type="danger" @click="cancelTransfer(row)">取消预约</el-button></div>
				</template>
			</MobileRecordList>

			<pagination v-show="tableData.total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="tableData.total" @pagination="loadList" />
		</el-card>
		<el-dialog v-model="scoreDialogVisible" :title="`${scoreHall.hallName || ''} 分值记录`" width="900px" destroy-on-close>
			<el-table v-loading="scoreLogs.loading" :data="scoreLogs.list" border stripe><el-table-column prop="optTime" label="操作时间" width="165"/><el-table-column prop="optUser" label="操作人" width="120"/><el-table-column prop="reasonDesc" label="原因" min-width="220"/><el-table-column prop="anchorId" label="主播ID" width="120"/><el-table-column prop="anchorName" label="主播昵称" width="140"/><el-table-column prop="scoreValue" label="分值" width="90"/></el-table>
			<pagination v-show="scoreLogs.total>0" v-model:page="scoreLogs.pageNum" v-model:limit="scoreLogs.pageSize" :total="scoreLogs.total" @pagination="loadScoreLogs"/>
		</el-dialog>

		<el-dialog v-model="dialogVisible" :title="editing ? '编辑厅' : '新增厅'" width="680px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-row :gutter="20">
					<el-col :span="12"><el-form-item label="厅 ID" prop="hallId"><el-input-number v-model="form.hallId" :min="1" :precision="0" :disabled="editing" class="w100" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="厅名" prop="hallName"><el-input v-model="form.hallName" maxlength="100" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="厅马甲"><el-input v-model="form.hallBadge" maxlength="16" placeholder="如 🍁，主播昵称里的厅标识" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="厅管"><el-input v-model="form.hallManager" maxlength="100" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="厅助理"><el-input v-model="form.hallAssistant" maxlength="100" /></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="关联微信群"><el-select v-model="form.wechatRobotGroupId" clearable filterable placeholder="允许暂不关联" class="w100"><el-option v-for="group in formGroupOptions" :key="group.id" :label="groupLabel(group)" :value="group.id" /></el-select></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio :value="1">启用</el-radio><el-radio :value="0">停用</el-radio></el-radio-group></el-form-item></el-col>
					<el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item></el-col>
				</el-row>
			</el-form>
			<template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template>
		</el-dialog>
		<el-dialog v-model="transferVisible" title="转移厅" width="520px" destroy-on-close>
			<p>厅 {{ transferHall.hallId }} · {{ transferHall.hallName }} 预约在 {{ transferDate }} 00:00（北京时间）转给目标客户。原客户保留历史，目标客户仅从生效后的周期同步。</p>
			<el-form-item label="目标客户"><el-select v-model="transferTargetId" filterable placeholder="请选择已配置VV账号的客户" class="w100"><el-option v-for="customer in transferOptions" :key="customer.id" :value="customer.id" :label="`${customer.customerNo} · ${customer.customerName}`" /></el-select></el-form-item>
			<el-alert title="仅支持同一已核验VV家族的客户。请先解除原客户的关联微信群及群默认厅；新客户的群在生效后另行关联。" type="warning" :closable="false" />
			<template #footer><el-button @click="transferVisible = false">取消</el-button><el-button type="primary" :loading="transferSaving" :disabled="!transferTargetId" @click="submitTransfer">确认预约</el-button></template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';
import { addAnchorHall, editAnchorHall, getAnchorHallDetail, getAnchorHallList, transferAnchorHall, cancelAnchorHallTransfer } from '/@/api/anchor';
import { getVVCustomerOptions, type VVCustomerOption } from '/@/api/system/vvCustomer';
import { selectedVVCustomerId } from '/@/utils/vvCustomerScope';
import { syncVVHallScores } from '/@/api/anchor';
import { getWechatRobotGroupList } from '/@/api/wechatRobotGroup';
import { getFlowDataScoreLogs } from '/@/api/system/flowData';
import VVSyncProgress from '/@/components/vvSyncProgress/index.vue';

defineOptions({ name: 'anchorHallContent' });

const queryRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const editing = ref(false);
const originalStatus = ref(1);
const saving = ref(false);
const syncingScore = ref(false);
const hallTableRef = ref();
const scoreDialogVisible=ref(false);const scoreHall=reactive({hallId:0,hallName:''});const scoreLogs=reactive({list:[]as any[],total:0,pageNum:1,pageSize:20,loading:false});
const groupOptions = ref<any[]>([]);
const transferVisible=ref(false);const transferSaving=ref(false);const transferHall=reactive({hallId:0,hallName:''});const transferTargetId=ref<number>();const transferOptions=ref<VVCustomerOption[]>([]);const transferDate=ref('');
const query = reactive({ hallId: '', hallName: '', wechatRobotGroupId: '', status: '' as string | number, sortBy: '', sortOrder: '', pageNum: 1, pageSize: 10 });
const tableData = reactive({ list: [] as any[], total: 0, loading: false });
const emptyForm = () => ({ hallId: undefined as number | undefined, hallName: '', hallBadge: '', hallManager: '', hallAssistant: '', wechatRobotGroupId: '' as string | number, groupName: '', groupWxid: '', status: 1, remark: '' });
const form = reactive(emptyForm());
const rules: FormRules = {
	hallId: [{ required: true, message: '厅 ID 不能为空', trigger: 'change' }],
	hallName: [{ required: true, message: '厅名不能为空', trigger: 'blur' }],
};

const groupLabel = (group: any) => group.groupName || group.groupWxid || `微信群 ${group.id}`;
const hallGroupLabel = (row: any) => row.groupName || row.groupWxid || '未关联';
const formGroupOptions = computed(() => {
	if (!form.wechatRobotGroupId || groupOptions.value.some((group: any) => group.id === form.wechatRobotGroupId)) return groupOptions.value;
	return [...groupOptions.value, { id: form.wechatRobotGroupId, groupName: form.groupName, groupWxid: form.groupWxid }];
});

const loadGroups = () => getWechatRobotGroupList({ pageNum: 1, pageSize: 1000 }).then((res: any) => { groupOptions.value = res.data.list ?? []; });
const loadList = () => {
	tableData.loading = true;
	return getAnchorHallList(query).then((res: any) => {
		tableData.list = res.data.list ?? [];
		tableData.total = res.data.total ?? 0;
	}).finally(() => { tableData.loading = false; });
};
const search = () => { query.pageNum = 1; loadList(); };
const resetQuery = () => { queryRef.value?.resetFields(); hallTableRef.value?.clearSort(); Object.assign(query, { hallId: '', hallName: '', wechatRobotGroupId: '', status: '', sortBy: '', sortOrder: '', pageNum: 1, pageSize: 10 }); loadList(); };
const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => { Object.assign(query, { sortBy: order ? prop : '', sortOrder: order || '', pageNum: 1 }); loadList(); };
const openAdd = () => { editing.value = false; originalStatus.value = 1; Object.assign(form, emptyForm()); formRef.value?.clearValidate(); dialogVisible.value = true; };
const openEdit = (row: any) => getAnchorHallDetail(row.hallId).then((res: any) => {
	editing.value = true;
	Object.assign(form, res.data);
	form.wechatRobotGroupId = form.wechatRobotGroupId || '';
	originalStatus.value = form.status;
	formRef.value?.clearValidate();
	dialogVisible.value = true;
});
const nextShanghaiMonday=()=>{const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));const day=new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)));day.setUTCDate(day.getUTCDate()+((8-day.getUTCDay())%7||7));return day.toISOString().slice(0,10);};
const openTransfer=async(row:any)=>{const res:any=await getVVCustomerOptions();transferOptions.value=(res.data.list??[]).filter((item:VVCustomerOption)=>item.id!==selectedVVCustomerId.value&&item.status===1&&item.hasVVAccount);Object.assign(transferHall,{hallId:row.hallId,hallName:row.hallName});transferTargetId.value=undefined;transferDate.value=nextShanghaiMonday();transferVisible.value=true;};
const submitTransfer=async()=>{if(!transferTargetId.value)return;const target=transferOptions.value.find(item=>item.id===transferTargetId.value);if(!target)return;transferDate.value=nextShanghaiMonday();await ElMessageBox.confirm(`确认将 ${transferHall.hallName} 预约在 ${transferDate.value} 00:00（北京时间）转给 ${target.customerName}？生效前仍属原客户。`,'确认转移',{type:'warning'});transferSaving.value=true;try{const res:any=await transferAnchorHall({hallId:transferHall.hallId,targetCustomerId:target.id,effectiveDate:transferDate.value});transferVisible.value=false;ElMessage.success(`已预约，${res.data.effectiveDate} 00:00 生效`);await loadList();}finally{transferSaving.value=false;}};
const cancelTransfer=async(row:any)=>{await ElMessageBox.confirm(`确认取消 ${row.hallName} 的转移预约？`,'取消预约',{type:'warning'});await cancelAnchorHallTransfer({hallId:row.hallId});ElMessage.success('预约已取消');await loadList();};
const loadScoreLogs=async()=>{scoreLogs.loading=true;try{const r:any=await getFlowDataScoreLogs({hallId:scoreHall.hallId,pageNum:scoreLogs.pageNum,pageSize:scoreLogs.pageSize});scoreLogs.list=r.data.list??[];scoreLogs.total=r.data.total??0;}finally{scoreLogs.loading=false;}};
const openScoreLogs=(row:any)=>{Object.assign(scoreHall,{hallId:row.hallId,hallName:row.hallName});Object.assign(scoreLogs,{list:[],total:0,pageNum:1,pageSize:20});scoreDialogVisible.value=true;loadScoreLogs();};
const syncHallScores=async()=>{await ElMessageBox.confirm('确认同步当前启用厅的健康分和分值记录？','同步确认',{type:'warning'});syncingScore.value=true;try{const r:any=await syncVVHallScores();ElMessage.success(`同步成功：厅 ${r.data.hallScoreCount}，分值记录 ${r.data.scoreLogCount}`);await loadList();}finally{syncingScore.value=false;}};

const submit = async () => {
	const valid = await formRef.value?.validate().catch(() => false);
	if (!valid) return;
	if (editing.value && originalStatus.value === 1 && form.status === 0) {
		try {
			await ElMessageBox.confirm('停用后现有关联和历史记录不会被清除，确认停用？', '停用确认', { type: 'warning' });
		} catch {
			return;
		}
	}
	saving.value = true;
	try {
		const request = editing.value ? editAnchorHall : addAnchorHall;
		await request(form);
		ElMessage.success(editing.value ? '厅修改成功' : '厅新增成功');
		dialogVisible.value = false;
		await loadList();
	} finally {
		saving.value = false;
	}
};

onMounted(() => { loadGroups(); loadList(); });
</script>

<style scoped>
.anchor-hall-container :deep(.el-form-item .el-input),
.anchor-hall-container :deep(.el-form-item .el-select) { width: 220px; }
.anchor-hall-container :deep(.el-dialog .el-input),
.anchor-hall-container :deep(.el-dialog .el-select) { width: 100%; }
</style>
