<template>
	<div class="anchor-manage-container"><el-card shadow="hover">
		<el-button class="mobile-record-list__filter-toggle" @click="mobileFilterOpen = !mobileFilterOpen"><el-icon><ele-Filter /></el-icon><span>筛选条件</span><el-icon><ele-ArrowDown v-if="!mobileFilterOpen" /><ele-ArrowUp v-else /></el-icon></el-button>
		<div :class="['mobile-record-list__filter-content', { 'is-open': mobileFilterOpen }]">
		<el-form :model="query" ref="queryRef" :inline="true" label-width="76px" class="mb15">
			<el-form-item label="关键词"><el-input v-model="query.nickname" placeholder="主播/微信/群昵称或姓名" clearable /></el-form-item>
			<el-form-item label="主播ID"><el-input v-model="query.anchorId" clearable /></el-form-item>
			<el-form-item label="平台"><el-select v-model="query.platformCode" clearable placeholder="全部平台"><el-option v-for="item in platformOptions" :key="item.code" :label="item.name" :value="item.code" /></el-select></el-form-item>
			<el-form-item label="所属厅"><el-select v-model="query.hallId" clearable placeholder="全部厅"><el-option v-for="item in hallOptions" :key="item.hallId" :label="item.hallName" :value="item.hallId" /></el-select></el-form-item>
			<el-form-item label="微信群"><el-select v-model="query.groupId" clearable filterable placeholder="全部微信群"><el-option v-for="item in groupOptions" :key="item.id" :label="item.groupName" :value="item.id" /></el-select></el-form-item>
			<el-form-item label="绑定状态"><el-select v-model="query.bindingStatus" clearable placeholder="全部绑定状态"><el-option label="待绑定" value="PENDING"/><el-option label="已绑定" value="BOUND"/><el-option label="未关联微信" value="UNLINKED_WECHAT"/></el-select></el-form-item>
			<el-form-item label="群状态"><el-select v-model="query.presenceStatus" clearable placeholder="全部群状态"><el-option label="至少一群在群" value="PRESENT"/><el-option label="全部已离群" value="LEFT"/></el-select></el-form-item>
			<el-form-item label="资料状态"><el-select v-model="query.completeness" clearable placeholder="全部资料状态"><el-option label="已完善" value="COMPLETE"/><el-option label="待完善" value="INCOMPLETE"/></el-select></el-form-item>
			<el-form-item label="记录状态"><el-select v-model="query.recordState"><el-option label="正常" value="ACTIVE"/><el-option label="已删除" value="DELETED"/><el-option label="已忽略" value="IGNORED"/></el-select></el-form-item>
			<el-form-item label="开播状态"><el-select v-model="query.vvCurrentLiveStatus" clearable placeholder="全部开播状态"><el-option label="未开播" value="未开播"/><el-option label="开播中" value="开播中"/></el-select></el-form-item>
			<el-form-item label="账号状态"><el-select v-model="query.vvForbidStatus" clearable placeholder="全部账号状态"><el-option label="正常" value="0"/><el-option label="禁播中（官方）" value="1"/><el-option label="禁播中（公会）" value="2"/></el-select></el-form-item>
			<el-form-item><el-button type="primary" @click="loadList">查询</el-button><el-button @click="resetQuery">重置</el-button><el-button type="success" plain @click="openAddDialog">新增主播</el-button><el-button type="warning" :loading="syncingVV" @click="syncAnchors">同步主播</el-button></el-form-item>
		</el-form>
		</div>
		<div class="vv-sync-summary">最近成功同步时间：{{ vvSyncSummary.finishedAt || '-' }}</div>
		<VVSyncProgress sync-type="ANCHOR_LIST" :active="syncingVV" />
		<div class="mb15"><el-button v-auth="'api/v1/system/anchor/profile/batchDelete'" type="danger" plain @click="batch('DELETE')">批量删除</el-button><el-button v-auth="'api/v1/system/anchor/profile/batchIgnore'" type="warning" plain @click="batch('IGNORE')">批量忽略</el-button><el-button v-auth="'api/v1/system/anchor/profile/batchCancelIgnore'" plain @click="batch('CANCEL_IGNORE')">取消忽略</el-button></div>
		<AnchorList ref="anchorListRef" :query="query" :hall-options="hallOptions" :platform-options="platformOptions" />
	</el-card></div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import AnchorList from '/@/views/anchor/manage/component/anchorList.vue';
import VVSyncProgress from '/@/components/vvSyncProgress/index.vue';
import { getAnchorHallOptions, getAnchorPlatformOptions, getVVAnchorSyncSummary, syncVVAnchors } from '/@/api/anchor';
import { getWechatRobotGroupList } from '/@/api/wechatRobotGroup';
defineOptions({ name: 'anchorManage' });
const queryRef=ref<FormInstance>(); const anchorListRef=ref(); const hallOptions=ref<any[]>([]); const platformOptions=ref<any[]>([]); const groupOptions=ref<any[]>([]); const mobileFilterOpen=ref(false);
const syncingVV=ref(false);const vvSyncSummary=reactive({finishedAt:''});
const defaults={anchorId:'',nickname:'',mobile:'',hallId:'',platformCode:'',groupId:'',bindingStatus:'',presenceStatus:'',completeness:'',recordState:'ACTIVE',status:'',vvCurrentLiveStatus:'',vvForbidStatus:''}; const query=reactive({...defaults});
const loadList=()=>anchorListRef.value?.loadList(); const openAddDialog=()=>anchorListRef.value?.openAddDialog(); const batch=(action:string)=>anchorListRef.value?.runBatch(action);
const resetQuery=()=>{ queryRef.value?.resetFields(); Object.assign(query,defaults); loadList(); };
const loadVVSummary=async()=>Object.assign(vvSyncSummary,(await getVVAnchorSyncSummary()as any).data);
const syncAnchors=async()=>{syncingVV.value=true;try{const r:any=await syncVVAnchors();const d=r.data;ElMessage.success(`同步成功：新增 ${d.insertedCount}，更新 ${d.updatedCount}，未变化 ${d.unchangedCount}，未返回 ${d.missingCount}，冲突 ${d.conflictCount}`);await Promise.all([loadVVSummary(),loadList()]);}finally{syncingVV.value=false;}};
onMounted(async()=>{ const [h,p,groups]:any[]=await Promise.all([getAnchorHallOptions(),getAnchorPlatformOptions(),getWechatRobotGroupList({pageNum:1,pageSize:1000})]); hallOptions.value=h.data.list??[]; platformOptions.value=p.data.list??[]; groupOptions.value=groups.data.list??[];await loadVVSummary(); });
</script>

<style scoped>
.mobile-record-list__filter-content :deep(.el-form-item .el-select) { width: 160px; }
.vv-sync-summary { margin-bottom: 12px; color: var(--el-text-color-secondary); }
</style>
