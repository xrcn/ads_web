<template>
	<div class="audit-panel">
		<el-form :model="query" inline class="mb15">
			<el-form-item label="主播ID"><el-input v-model="query.targetUserId" clearable placeholder="输入主播ID" /></el-form-item>
			<el-form-item label="状态"><el-select v-model="query.status" placeholder="全部"><el-option label="全部" value=""/><el-option label="待审核" value="0"/><el-option label="已通过" value="1"/><el-option label="未通过" value="2"/></el-select></el-form-item>
			<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
		</el-form>
		<el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" class="mb15"><el-button text type="primary" @click="load">重试</el-button></el-alert>
		<MobileRecordList :data="table.list" row-key="id" data-mobile-view="vv-hall-audit">
			<template #desktop>
				<el-table v-loading="loading" :data="table.list">
					<el-table-column prop="userId" label="主播ID" min-width="125" />
					<el-table-column prop="nickname" label="主播昵称" min-width="120" />
					<el-table-column label="原所属厅" min-width="200"><template #default="{row}"><div>{{ row.oldHallName||'-' }}</div><div class="subtext">ID：{{ row.oldHallId||'-' }}</div></template></el-table-column>
					<el-table-column label="申请所属厅" min-width="200"><template #default="{row}"><div>{{ row.newHallName||'-' }}</div><div class="subtext">ID：{{ row.newHallId||'-' }}</div></template></el-table-column>
					<el-table-column prop="applyTime" label="申请日期" min-width="165" />
					<el-table-column label="状态" width="105"><template #default="{row}"><el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag></template></el-table-column>
					<el-table-column label="操作" width="145" fixed="right"><template #default="{row}"><template v-if="row.status===0"><el-button v-auth="'api/v1/system/anchor/vvAudit/hall/decision'" text type="success" :loading="rowLoading===row.id" :disabled="rowLoading===row.id" @click="decide(row,'APPROVE')">同意</el-button><el-button v-auth="'api/v1/system/anchor/vvAudit/hall/decision'" text type="danger" :disabled="rowLoading===row.id" @click="decide(row,'REJECT')">拒绝</el-button></template><span v-else>-</span></template></el-table-column>
				</el-table>
			</template>
			<template #default="{row}">
				<div class="mobile-record-card__header"><h3 class="mobile-record-card__title">{{ row.nickname||row.userId }}</h3><el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag></div>
				<dl class="mobile-record-card__fields"><div><dt>主播ID</dt><dd>{{ row.userId }}</dd></div><div><dt>原所属厅</dt><dd>{{ row.oldHallName||'-' }}（{{ row.oldHallId||'-' }}）</dd></div><div><dt>申请所属厅</dt><dd>{{ row.newHallName||'-' }}（{{ row.newHallId||'-' }}）</dd></div><div><dt>申请日期</dt><dd>{{ row.applyTime||'-' }}</dd></div></dl>
				<div v-if="row.status===0" class="mobile-record-card__actions"><el-button v-auth="'api/v1/system/anchor/vvAudit/hall/decision'" type="success" :disabled="rowLoading===row.id" @click="decide(row,'APPROVE')">同意</el-button><el-button v-auth="'api/v1/system/anchor/vvAudit/hall/decision'" type="danger" :disabled="rowLoading===row.id" @click="decide(row,'REJECT')">拒绝</el-button></div>
			</template>
		</MobileRecordList>
		<pagination v-show="table.total>0" :total="table.total" v-model:page="table.pageNum" v-model:limit="table.pageSize" @pagination="load" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { decideVVHallAudit, getVVHallAuditList } from '/@/api/anchor';
import type { VVAuditDecision, VVHallAuditListItem } from '/@/api/anchor';

defineOptions({ name: 'hallAuditList' });
const query=reactive({targetUserId:'',status:''});
const table=reactive({list:[] as VVHallAuditListItem[],total:0,pageNum:1,pageSize:10});
const loading=ref(false); const loadError=ref(''); const rowLoading=ref<number>();
const load=async()=>{loading.value=true;loadError.value='';try{const res:any=await getVVHallAuditList({...query,pageNum:table.pageNum,pageSize:table.pageSize});table.list=res.data.list??[];table.total=res.data.total??0;}catch(error:any){loadError.value=error?.message||'主播所属厅审核加载失败';}finally{loading.value=false;}};
const search=()=>{table.pageNum=1;load();};
const reset=()=>{query.targetUserId='';query.status='';search();};
const statusText=(value:number)=>value===0?'待审核':value===1?'已通过':value===2?'未通过':'未知';
const statusTag=(value:number)=>value===0?'warning':value===1?'success':value===2?'danger':'info';
const decide=async(row:VVHallAuditListItem,decision:VVAuditDecision)=>{try{await ElMessageBox.confirm(`确认${decision==='APPROVE'?'同意':'拒绝'} ${row.nickname||row.userId} 的所属厅变更？`,'所属厅审核',{type:'warning'});}catch{return;}rowLoading.value=row.id;try{await decideVVHallAudit({auditId:row.id,targetUserId:row.userId,decision});ElMessage.success('操作成功');await load();}finally{rowLoading.value=undefined;}};
onMounted(load);
</script>

<style scoped>
.subtext { color: var(--el-text-color-secondary); font-size: 12px; }
.audit-panel :deep(.el-form-item .el-select) { width: 150px; }
</style>
