<template>
	<div class="audit-panel">
		<el-row :gutter="12" class="audit-summary">
			<el-col :xs="24" :sm="8"><el-card shadow="never"><div class="summary-label">待审核</div><div class="summary-value">{{ summary.waitCount }}</div><el-button text type="primary" @click="filterPending">筛选</el-button></el-card></el-col>
			<el-col :xs="24" :sm="8"><el-card shadow="never"><div class="summary-label">已通过</div><div class="summary-value">{{ summary.passCount }}</div></el-card></el-col>
			<el-col :xs="24" :sm="8"><el-card shadow="never"><div class="summary-label">未通过</div><div class="summary-value">{{ summary.refuseCount }}</div></el-card></el-col>
		</el-row>
		<el-form :model="query" inline class="mb15">
			<el-form-item label="主播ID"><el-input v-model="query.targetUserId" clearable placeholder="输入主播ID（含靓号）" /></el-form-item>
			<el-form-item label="状态"><el-select v-model="query.status" placeholder="全部"><el-option label="全部" value=""/><el-option label="待审核" value="0"/><el-option label="未通过" value="2"/></el-select></el-form-item>
			<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
		</el-form>
		<el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" class="mb15"><el-button text type="primary" @click="load">重试</el-button></el-alert>
		<MobileRecordList :data="table.list" row-key="recordKey" data-mobile-view="vv-anchor-audit">
			<template #desktop>
				<el-table v-loading="loading" :data="table.list">
					<el-table-column prop="userId" label="用户ID" min-width="125" />
					<el-table-column label="头像" width="82"><template #default="{row}"><el-avatar :src="row.avatar">{{ row.nickname?.slice(0,1)||'-' }}</el-avatar></template></el-table-column>
					<el-table-column prop="nickname" label="主播昵称" min-width="120" />
					<el-table-column prop="charmLevel" label="魅力等级" width="95" />
					<el-table-column prop="liveLevel" label="直播等级" width="95" />
					<el-table-column label="申请签约形式" min-width="125"><template #default="{row}">{{ anchorTypeText(row.anchorType) }}</template></el-table-column>
					<el-table-column prop="applyTime" label="申请日期" min-width="165" />
					<el-table-column label="所属厅" min-width="180"><template #default="{row}"><div>{{ row.hallName||'-' }}</div><div class="subtext">ID：{{ row.hallId||'-' }}</div></template></el-table-column>
					<el-table-column prop="updaterName" label="审核人" min-width="100" />
					<el-table-column label="状态" width="105"><template #default="{row}"><el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag></template></el-table-column>
					<el-table-column label="操作" width="210" fixed="right"><template #default="{row}"><el-button text type="primary" @click="openDetail(row)">查看主播资料</el-button><template v-if="row.status===0"><el-button v-auth="'api/v1/system/anchor/vvAudit/anchor/decision'" text type="success" :loading="rowLoading===row.userId" :disabled="rowLoading===row.userId" @click="decide(row,'APPROVE')">同意</el-button><el-button v-auth="'api/v1/system/anchor/vvAudit/anchor/decision'" text type="danger" :disabled="rowLoading===row.userId" @click="decide(row,'REJECT')">拒绝</el-button></template></template></el-table-column>
				</el-table>
			</template>
			<template #default="{row}">
				<div class="mobile-record-card__header"><h3 class="mobile-record-card__title">{{ row.nickname||row.userId }}</h3><el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag></div>
				<dl class="mobile-record-card__fields"><div><dt>主播ID</dt><dd>{{ row.userId }}</dd></div><div><dt>所属厅</dt><dd>{{ row.hallName||'-' }}（{{ row.hallId||'-' }}）</dd></div><div><dt>申请日期</dt><dd>{{ row.applyTime||'-' }}</dd></div><div><dt>签约形式</dt><dd>{{ anchorTypeText(row.anchorType) }}</dd></div></dl>
				<div class="mobile-record-card__actions"><el-button type="primary" @click="openDetail(row)">查看主播资料</el-button><template v-if="row.status===0"><el-button v-auth="'api/v1/system/anchor/vvAudit/anchor/decision'" type="success" :disabled="rowLoading===row.userId" @click="decide(row,'APPROVE')">同意</el-button><el-button v-auth="'api/v1/system/anchor/vvAudit/anchor/decision'" type="danger" :disabled="rowLoading===row.userId" @click="decide(row,'REJECT')">拒绝</el-button></template></div>
			</template>
		</MobileRecordList>
		<pagination v-show="table.total>0" :total="table.total" v-model:page="table.pageNum" v-model:limit="table.pageSize" @pagination="load" />
		<el-drawer v-model="detailVisible" title="主播资料" size="480px">
			<div v-loading="detailLoading"><el-descriptions v-if="detail" :column="1" border><el-descriptions-item label="用户ID">{{ detail.userId||'-' }}</el-descriptions-item><el-descriptions-item label="主播昵称">{{ detail.nickname||'-' }}</el-descriptions-item><el-descriptions-item label="真实姓名">{{ detail.realName||'-' }}</el-descriptions-item><el-descriptions-item label="身份号码">{{ detail.idCardNo||'-' }}</el-descriptions-item><el-descriptions-item label="手机号">{{ detail.phone||'-' }}</el-descriptions-item><el-descriptions-item label="QQ">{{ detail.qq||'-' }}</el-descriptions-item></el-descriptions></div>
		</el-drawer>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { decideVVAnchorAudit, getVVAnchorAuditDetail, getVVAnchorAuditList } from '/@/api/anchor';
import type { VVAuditDecision, VVAnchorAuditDetail, VVAnchorAuditListItem, VVAnchorAuditSummary } from '/@/api/anchor';

defineOptions({ name: 'anchorAuditList' });
const query=reactive({targetUserId:'',status:''});
const table=reactive({list:[] as VVAnchorAuditListItem[],total:0,pageNum:1,pageSize:10});
const summary=reactive<VVAnchorAuditSummary>({waitCount:0,passCount:0,refuseCount:0});
const loading=ref(false); const loadError=ref(''); const rowLoading=ref('');
const detailVisible=ref(false); const detailLoading=ref(false); const detail=ref<VVAnchorAuditDetail>();
const load=async()=>{loading.value=true;loadError.value='';try{const res:any=await getVVAnchorAuditList({...query,pageNum:table.pageNum,pageSize:table.pageSize});table.list=res.data.list??[];table.total=res.data.total??0;Object.assign(summary,res.data.summary??{});}catch(error:any){loadError.value=error?.message||'主播审核加载失败';}finally{loading.value=false;}};
const search=()=>{table.pageNum=1;load();};
const reset=()=>{query.targetUserId='';query.status='';search();};
const filterPending=()=>{query.targetUserId='';query.status='0';search();};
const anchorTypeText=(value:number)=>value===1?'委托家族结算':value===2?'与家族分别结算':'-';
const auditStatusText:Record<number,string>={0:'待审核',1:'续约中',2:'审核不通过',3:'解约成功',4:'取消申请',5:'冻结',6:'解冻',7:'续约申请(续签中)',8:'续约通过',9:'续约不通过'};
const statusText=(value:number)=>auditStatusText[value]??'未知';
const statusTag=(value:number)=>value===0||value===7?'warning':value===2||value===9?'danger':value===3||value===6||value===8?'success':'info';
const openDetail=async(row:VVAnchorAuditListItem)=>{detailVisible.value=true;detailLoading.value=true;detail.value=undefined;try{const res:any=await getVVAnchorAuditDetail(row.userId);detail.value=res.data;}finally{detailLoading.value=false;}};
const decide=async(row:VVAnchorAuditListItem,decision:VVAuditDecision)=>{try{await ElMessageBox.confirm(`确认${decision==='APPROVE'?'同意':'拒绝'}主播 ${row.nickname||row.userId}？`,'主播审核',{type:'warning'});}catch{return;}rowLoading.value=row.userId;try{await decideVVAnchorAudit({targetUserId:row.userId,decision});ElMessage.success('操作成功');await load();}finally{rowLoading.value='';}};
onMounted(load);
</script>

<style scoped>
.audit-summary { margin-bottom: 16px; }
.audit-summary :deep(.el-card) { min-height: 0; }
.summary-label { color: var(--el-text-color-secondary); }
.summary-value { margin: 8px 0; font-size: 24px; font-weight: 600; }
.subtext { color: var(--el-text-color-secondary); font-size: 12px; }
.audit-panel :deep(.el-form-item .el-select) { width: 150px; }
</style>
