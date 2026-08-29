<template>
	<div><MobileRecordList :data="tableData.data" row-key="profileId" data-mobile-view="anchor-list"><template #desktop><el-table :data="tableData.data" @selection-change="selection=$event">
		<el-table-column type="selection" width="48" :selectable="(row:any)=>row.recordType==='PROFILE'"/><el-table-column type="index" label="序号" width="60"/>
		<el-table-column label="头像" width="76"><template #default="{row}"><el-avatar :src="row.avatar?getUpFileUrl(row.avatar):''">-</el-avatar></template></el-table-column>
		<el-table-column prop="nickname" label="主播昵称" min-width="130"/>
		<el-table-column label="平台" min-width="110"><template #default="{row}"><div v-for="b in row.bindings" :key="b.id">{{b.platformName||b.platformCode}}</div><el-tag v-if="!row.bindings?.length" type="warning">待绑定</el-tag></template></el-table-column>
		<el-table-column label="主播ID" min-width="135"><template #default="{row}"><div v-for="b in row.bindings" :key="b.id">{{b.anchorId}}</div><span v-if="!row.bindings?.length">待绑定</span></template></el-table-column>
		<el-table-column label="所属厅" min-width="120"><template #default="{row}"><div v-for="b in row.bindings" :key="b.id">{{b.hallName||b.hallId}}</div><span v-if="!row.bindings?.length">-</span></template></el-table-column>
		<el-table-column label="微信群" min-width="180"><template #default="{row}"><div v-for="g in row.groups" :key="g.groupId"><el-tag :type="g.isPresent?'success':'info'" size="small">{{g.groupName}}·{{g.groupNickname||'-'}}</el-tag></div><span v-if="!row.groups?.length">-</span></template></el-table-column>
		<el-table-column label="绑定" width="90"><template #default="{row}"><el-tag :type="row.bindingStatus==='BOUND'?'success':'warning'">{{bindingText[row.bindingStatus]||row.bindingStatus}}</el-tag></template></el-table-column>
		<el-table-column label="资料" width="90"><template #default="{row}">{{row.profileCompleteness==='COMPLETE'?'已完善':'待完善'}}</template></el-table-column>
		<el-table-column prop="updatedAt" label="更新时间" min-width="165"><template #default="{row}">{{row.updatedAt||'-'}}</template></el-table-column>
		<el-table-column label="操作" width="250" fixed="right"><template #default="{row}"><el-button text type="primary" @click="openEditDialog(row)">编辑</el-button><el-button text type="primary" @click="openBankCardDialog(row)">工资卡</el-button><el-button v-if="row.recordType==='PROFILE'&&row.recordState==='ACTIVE'" v-auth="'api/v1/system/anchor/profile/batchDelete'" text type="danger" @click="deleteRow(row)">删除</el-button><el-button v-if="row.recordType==='LEGACY_ANCHOR'" v-auth="'api/v1/system/anchor/delete'" text type="danger" @click="deleteRow(row)">删除</el-button><el-button v-if="row.recordType==='PROFILE'&&row.recordState==='ACTIVE'" v-auth="'api/v1/system/anchor/profile/batchIgnore'" text type="warning" @click="runBatch('IGNORE',[row.profileId])">忽略</el-button><el-button v-if="row.recordState==='IGNORED'" v-auth="'api/v1/system/anchor/profile/batchCancelIgnore'" text @click="runBatch('CANCEL_IGNORE',[row.profileId])">取消忽略</el-button></template></el-table-column>
	</el-table></template><template #default="{ row }">
		<div class="mobile-record-card__header"><div class="anchor-mobile-identity"><el-avatar class="anchor-mobile-avatar" :src="row.avatar?getUpFileUrl(row.avatar):''">{{ row.nickname?.slice(0,1)||'-' }}</el-avatar><h3 class="mobile-record-card__title">{{ row.nickname }}</h3></div></div>
		<dl class="mobile-record-card__fields"><div><dt>主播ID</dt><dd>{{ row.bindings?.map((item:any)=>item.anchorId).join('、')||'待绑定' }}</dd></div><div><dt>微信群</dt><dd>{{ row.groups?.map((item:any)=>item.groupName).join('、')||'-' }}</dd></div></dl>
		<div class="mobile-record-card__actions"><el-button type="primary" @click="openEditDialog(row)">编辑</el-button><el-button @click="openBankCardDialog(row)">工资卡</el-button><el-dropdown><el-button>更多</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item v-if="row.recordType==='PROFILE'&&row.recordState==='ACTIVE'"><el-button v-auth="'api/v1/system/anchor/profile/batchDelete'" text type="danger" @click="deleteRow(row)">删除</el-button></el-dropdown-item><el-dropdown-item v-if="row.recordType==='LEGACY_ANCHOR'"><el-button v-auth="'api/v1/system/anchor/delete'" text type="danger" @click="deleteRow(row)">删除</el-button></el-dropdown-item><el-dropdown-item v-if="row.recordType==='PROFILE'&&row.recordState==='ACTIVE'"><el-button v-auth="'api/v1/system/anchor/profile/batchIgnore'" text @click="runBatch('IGNORE',[row.profileId])">忽略</el-button></el-dropdown-item><el-dropdown-item v-if="row.recordState==='IGNORED'"><el-button v-auth="'api/v1/system/anchor/profile/batchCancelIgnore'" text @click="runBatch('CANCEL_IGNORE',[row.profileId])">取消忽略</el-button></el-dropdown-item></el-dropdown-menu></template></el-dropdown></div>
	</template></MobileRecordList>
	<pagination v-show="tableData.total>0" :total="tableData.total" v-model:page="tableData.param.pageNum" v-model:limit="tableData.param.pageSize" @pagination="loadList"/>
	<EditAnchor ref="editAnchorRef" :hall-options="hallOptions" :platform-options="platformOptions" @success="loadList"/><BankCardDialog ref="bankCardDialogRef" @success="loadList"/>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, toRefs, watch } from 'vue'; import { ElMessage,ElMessageBox } from 'element-plus';
import EditAnchor from './editAnchor.vue'; import BankCardDialog from './bankCardDialog.vue';
import { cancelIgnoreAnchorProfiles,deleteAnchorProfiles,deleteLegacyAnchor,getAnchorList,ignoreAnchorProfiles,previewAnchorBatch } from '/@/api/anchor'; import { getUpFileUrl } from '/@/utils/gfast';
defineOptions({name:'anchorList'}); const props=defineProps({query:{type:Object,default:()=>({})},hallOptions:{type:Array,default:()=>[]},platformOptions:{type:Array,default:()=>[]}});
const editAnchorRef=ref(); const bankCardDialogRef=ref(); const selection=ref<any[]>([]); const bindingText:Record<string,string>={BOUND:'已绑定',PENDING:'待绑定',UNLINKED_WECHAT:'未关联微信'};
const state=reactive({tableData:{data:[] as any[],total:0,param:{pageNum:1,pageSize:10}}}); const {tableData}=toRefs(state);
const loadList=()=>getAnchorList({...state.tableData.param,...props.query}).then((res:any)=>{state.tableData.data=res.data.list??[];state.tableData.total=res.data.total??0;});
const openAddDialog=()=>editAnchorRef.value?.openDialog(); const openEditDialog=(row:any)=>editAnchorRef.value?.openDialog(row);
const bankCardOwner=(row:any)=>({profileId:row.recordType==='PROFILE'?row.profileId:0,anchorInfoId:row.recordType==='LEGACY_ANCHOR'?row.id:0,nickname:row.nickname});
const openBankCardDialog=(row:any)=>bankCardDialogRef.value?.openDialog(bankCardOwner(row));
const deleteRow=async(row:any)=>{if(row.recordType==='PROFILE'){await runBatch('DELETE',[row.profileId]);return;}await ElMessageBox.confirm(`确认删除历史主播 ${row.nickname}？存在工资卡或麦序历史时将拒绝删除。`,'删除确认',{type:'warning'});await deleteLegacyAnchor(row.id);ElMessage.success('删除成功');loadList();};
const runBatch=async(action:string,ids?:number[])=>{const profileIds=ids??selection.value.map(r=>r.profileId);const filter=profileIds.length?{}:{...props.query};const narrowed=filter.nickname||filter.anchorId||filter.platformCode||filter.hallId||filter.groupId||filter.bindingStatus||filter.presenceStatus||filter.completeness||(filter.recordState&&filter.recordState!=='ACTIVE');if(!profileIds.length&&!narrowed){ElMessage.warning('请先勾选成员或设置昵称、主播ID、平台、厅、群或状态筛选');return;}const preview:any=await previewAnchorBatch({action,profileIds,filter});const p=preview.data;await ElMessageBox.confirm(`命中 ${p.matched}，可操作 ${p.actionable}，受阻 ${p.blocked}${p.blockedReason?'：'+p.blockedReason:''}`,'批量操作确认',{type:'warning'});const requests:Record<string,any>={DELETE:deleteAnchorProfiles,IGNORE:ignoreAnchorProfiles,CANCEL_IGNORE:cancelIgnoreAnchorProfiles};const result:any=await requests[action]({profileIds,filter});ElMessage.success(`成功 ${result.data.success}，受阻 ${result.data.blocked}`);loadList();};
watch(()=>props.query,()=>{state.tableData.param.pageNum=1;loadList();},{deep:true}); onMounted(loadList); defineExpose({loadList,openAddDialog,runBatch});
</script>

<style scoped>
.anchor-mobile-identity { display: flex; align-items: center; min-width: 0; gap: 12px; }
</style>
