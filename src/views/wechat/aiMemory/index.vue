<template>
	<div class="wechat-ai-memory-container">
		<el-card shadow="hover">
			<el-tabs v-model="query.memoryType" @tab-change="changeType">
				<el-tab-pane label="对话记忆" name="CONVERSATION" />
				<el-tab-pane label="人物记忆" name="PERSON" />
				<el-tab-pane label="知识记忆" name="KNOWLEDGE" />
			</el-tabs>
			<el-form :model="query" inline label-width="74px">
				<el-form-item label="微信群"><el-select v-model="query.groupId" clearable filterable placeholder="全部" style="width:220px"><el-option v-for="group in groups" :key="group.id" :label="group.groupName" :value="group.id" /></el-select></el-form-item>
				<el-form-item label="范围"><el-select v-model="query.scopeType" clearable style="width:120px"><el-option label="群级" value="GROUP" /><el-option label="全局" value="GLOBAL" /></el-select></el-form-item>
				<el-form-item label="状态"><el-select v-model="query.status" clearable style="width:120px"><el-option label="生效" value="ACTIVE" /><el-option label="停用" value="DISABLED" /><el-option label="过期" value="EXPIRED" /></el-select></el-form-item>
				<el-form-item label="可信度"><el-select v-model="query.evidenceKind" clearable style="width:150px"><el-option v-for="item in evidenceOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
				<el-form-item label="敏感级别"><el-select v-model="query.sensitivity" clearable style="width:120px"><el-option label="普通" value="NORMAL" /><el-option label="敏感" value="SENSITIVE" /></el-select></el-form-item>
				<el-form-item label="冲突"><el-select v-model="query.conflict" style="width:120px"><el-option label="全部" :value="-1" /><el-option label="无冲突" :value="0" /><el-option label="有冲突" :value="1" /></el-select></el-form-item>
				<el-form-item label="关键字"><el-input v-model="query.keyword" clearable placeholder="主题、内容或成员" @keyup.enter="search" /></el-form-item>
				<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button><el-button type="success" plain @click="openAdd">新增记忆</el-button></el-form-item>
			</el-form>

			<MobileRecordList :data="list" :loading="loading" row-key="id" data-mobile-view="wechat-ai-memory">
				<template #desktop><el-table v-loading="loading" :data="list" border stripe>
					<el-table-column prop="groupName" label="范围" min-width="140"><template #default="{row}">{{row.scopeType==='GLOBAL'?'全局':row.groupName||'-'}}</template></el-table-column>
					<el-table-column prop="subjectName" label="成员" min-width="110"><template #default="{row}">{{row.subjectName||'-'}}</template></el-table-column>
					<el-table-column prop="topicKey" label="主题" min-width="130" show-overflow-tooltip />
					<el-table-column prop="displayValue" label="记忆内容" min-width="240" show-overflow-tooltip />
					<el-table-column label="来源" width="120"><template #default="{row}">{{evidenceLabel(row.evidenceKind)}}</template></el-table-column>
					<el-table-column label="状态" width="100"><template #default="{row}"><el-tag :type="row.status==='ACTIVE'?'success':'info'">{{statusLabel(row.status)}}</el-tag><el-tag v-if="row.conflict===1" type="danger" class="ml5">冲突</el-tag></template></el-table-column>
					<el-table-column prop="updatedAt" label="更新时间" width="170" />
					<el-table-column label="操作" width="310" fixed="right"><template #default="{row}"><el-button text type="primary" @click="openDetail(row)">详情</el-button><el-button text type="primary" @click="openEdit(row)">编辑</el-button><el-button v-if="row.sensitivity==='SENSITIVE'" text type="warning" @click="reveal(row)">原值</el-button><el-button v-if="row.conflict===1" text type="warning" @click="resolveConflict(row)">确认当前值</el-button><el-button v-if="row.memoryType==='KNOWLEDGE'&&row.scopeType==='GROUP'" text type="success" @click="promote(row)">提升全局</el-button><el-dropdown><el-button text>更多</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item><el-button text @click="toggleStatus(row)">{{row.status==='ACTIVE'?'停用':'恢复'}}</el-button></el-dropdown-item><el-dropdown-item><el-button text type="danger" @click="remove(row)">删除</el-button></el-dropdown-item></el-dropdown-menu></template></el-dropdown></template></el-table-column>
				</el-table></template>
				<template #default="{row}"><div class="mobile-record-card__header"><div><h3 class="mobile-record-card__title">{{row.topicKey}}</h3><p class="mobile-record-card__subtitle">{{row.scopeType==='GLOBAL'?'全局':row.groupName||'-'}}</p></div><el-tag :type="row.status==='ACTIVE'?'success':'info'">{{statusLabel(row.status)}}</el-tag></div><dl class="mobile-record-card__fields"><div><dt>成员</dt><dd>{{row.subjectName||'-'}}</dd></div><div><dt>内容</dt><dd>{{row.displayValue}}</dd></div><div><dt>来源</dt><dd>{{evidenceLabel(row.evidenceKind)}}</dd></div><div><dt>更新时间</dt><dd>{{row.updatedAt}}</dd></div></dl><div class="mobile-record-card__actions"><el-button type="primary" @click="openDetail(row)">详情</el-button><el-button @click="openEdit(row)">编辑</el-button><el-button v-if="row.sensitivity==='SENSITIVE'" type="warning" @click="reveal(row)">查看原值</el-button><el-button type="danger" @click="remove(row)">删除</el-button></div></template>
			</MobileRecordList>
			<pagination v-show="total>0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
		</el-card>

		<el-dialog v-model="formVisible" :title="form.id?'编辑记忆':'新增记忆'" width="640px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-form-item label="类型" prop="memoryType"><el-select v-model="form.memoryType" :disabled="!!form.id" class="w100"><el-option label="对话记忆" value="CONVERSATION" /><el-option label="人物记忆" value="PERSON" /><el-option label="知识记忆" value="KNOWLEDGE" /></el-select></el-form-item>
				<el-form-item label="范围" prop="scopeType"><el-radio-group v-model="form.scopeType" :disabled="!!form.id"><el-radio value="GROUP">群级</el-radio><el-radio value="GLOBAL" :disabled="form.memoryType!=='KNOWLEDGE'">全局</el-radio></el-radio-group></el-form-item>
				<el-form-item v-if="form.scopeType==='GROUP'" label="微信群" prop="groupId"><el-select v-model="form.groupId" :disabled="!!form.id" filterable class="w100" @change="loadMembers"><el-option v-for="group in groups" :key="group.id" :label="group.groupName" :value="group.id" /></el-select></el-form-item>
				<el-form-item v-if="form.memoryType==='PERSON'" label="成员" prop="subjectWxid"><el-select v-model="form.subjectWxid" :disabled="!!form.id" filterable class="w100"><el-option v-for="member in members" :key="member.wxid" :label="member.displayName||member.nickName||member.wxid" :value="member.wxid" /></el-select></el-form-item>
				<el-form-item label="主题" prop="topicKey"><el-input v-model="form.topicKey" :disabled="!!form.id" maxlength="128" /></el-form-item>
				<el-form-item label="标签"><el-input v-model="form.tagsText" placeholder="多个标签用逗号分隔" /></el-form-item>
				<el-form-item label="内容" prop="value"><el-input v-model="form.value" type="textarea" :rows="5" maxlength="1000" show-word-limit /></el-form-item>
				<el-form-item label="敏感级别" prop="sensitivity"><el-radio-group v-model="form.sensitivity"><el-radio value="NORMAL">普通</el-radio><el-radio value="SENSITIVE">敏感</el-radio></el-radio-group></el-form-item>
				<el-form-item label="操作原因" prop="reason"><el-input v-model="form.reason" type="textarea" :rows="2" maxlength="500" /></el-form-item>
			</el-form>
			<template #footer><el-button @click="formVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
		</el-dialog>

		<el-drawer v-model="detailVisible" title="AI记忆详情" size="620px">
			<el-descriptions v-if="detail.memory" :column="1" border><el-descriptions-item label="主题">{{detail.memory.topicKey}}</el-descriptions-item><el-descriptions-item label="内容">{{detail.memory.displayValue}}</el-descriptions-item><el-descriptions-item label="来源摘录">{{detail.memory.sourceExcerpt||'敏感来源已加密'}}</el-descriptions-item><el-descriptions-item label="可信度">{{evidenceLabel(detail.memory.evidenceKind)}}</el-descriptions-item></el-descriptions>
			<el-divider>版本与访问审计</el-divider>
			<el-table :data="detail.revisions||[]" border size="small"><el-table-column prop="action" label="动作" width="120" /><el-table-column prop="reason" label="原因" min-width="130" show-overflow-tooltip /><el-table-column prop="actorType" label="来源" width="90" /><el-table-column prop="createdAt" label="时间" width="170" /></el-table>
		</el-drawer>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import MobileRecordList from '/@/components/mobileRecordList/index.vue';
import { addWechatAIMemory, deleteWechatAIMemory, editWechatAIMemory, getWechatAIMemoryDetail, getWechatAIMemoryList, promoteWechatAIMemory, resolveWechatAIMemoryConflict, revealWechatAIMemory, setWechatAIMemoryStatus } from '/@/api/wechatAiMemory';
import { getWechatRobotGroupList, getWechatRobotGroupMemberList } from '/@/api/wechatRobotGroup';

defineOptions({ name: 'wechatAiMemory' });
const loading=ref(false),saving=ref(false),formVisible=ref(false),detailVisible=ref(false),formRef=ref<FormInstance>();
const list=ref<any[]>([]),groups=ref<any[]>([]),members=ref<any[]>([]),total=ref(0),detail=reactive<any>({memory:null,revisions:[]});
const evidenceOptions=[{value:'ADMIN_CONFIRMED',label:'管理员确认'},{value:'SELF_DECLARED',label:'本人说明'},{value:'THIRD_PARTY',label:'他人转述'},{value:'INFERRED',label:'模型推测'}];
const query=reactive({groupId:'' as number|'',memoryType:'CONVERSATION',scopeType:'',status:'ACTIVE',evidenceKind:'',sensitivity:'',conflict:-1,keyword:'',pageNum:1,pageSize:20});
const emptyForm=()=>({id:0,memoryType:query.memoryType,scopeType:'GROUP',groupId:'' as number|'',subjectWxid:'',topicKey:'',tagsText:'',value:'',sensitivity:'NORMAL',reason:''});
const form=reactive(emptyForm());
const rules:FormRules={memoryType:[{required:true,message:'请选择类型',trigger:'change'}],scopeType:[{required:true,message:'请选择范围',trigger:'change'}],groupId:[{required:true,message:'请选择微信群',trigger:'change'}],subjectWxid:[{required:true,message:'请选择成员',trigger:'change'}],topicKey:[{required:true,message:'请输入主题',trigger:'blur'}],value:[{required:true,message:'请输入内容',trigger:'blur'}],sensitivity:[{required:true,message:'请选择敏感级别',trigger:'change'}],reason:[{required:true,message:'请输入操作原因',trigger:'blur'}]};
const evidenceLabel=(value:string)=>evidenceOptions.find(item=>item.value===value)?.label||value;
const statusLabel=(value:string)=>({ACTIVE:'生效',DISABLED:'停用',EXPIRED:'过期',DELETED:'删除'} as Record<string,string>)[value]||value;
const params=()=>({...query,groupId:query.groupId||undefined});
const loadList=async()=>{loading.value=true;try{const res:any=await getWechatAIMemoryList(params());list.value=res.data.list||[];total.value=Number(res.data.total||0);}finally{loading.value=false;}};
const search=()=>{query.pageNum=1;loadList();};
const reset=()=>{Object.assign(query,{groupId:'',scopeType:'',status:'ACTIVE',evidenceKind:'',sensitivity:'',conflict:-1,keyword:'',pageNum:1,pageSize:20});loadList();};
const changeType=()=>{query.pageNum=1;loadList();};
const loadMembers=async(groupId:number)=>{members.value=[];if(!groupId)return;const res:any=await getWechatRobotGroupMemberList(groupId,false);members.value=res.data.list||res.data||[];};
const openAdd=()=>{Object.assign(form,emptyForm());members.value=[];formVisible.value=true;};
const openEdit=async(row:any)=>{Object.assign(form,{id:row.id,memoryType:row.memoryType,scopeType:row.scopeType,groupId:row.groupId||'',subjectWxid:row.subjectWxid||'',topicKey:row.topicKey,tagsText:row.tags||'',value:row.displayValue,sensitivity:row.sensitivity,reason:''});if(row.groupId)await loadMembers(row.groupId);formVisible.value=true;};
const payload=()=>({id:form.id||undefined,memoryType:form.memoryType,scopeType:form.scopeType,groupId:form.scopeType==='GROUP'?form.groupId||undefined:undefined,subjectWxid:form.memoryType==='PERSON'?form.subjectWxid:undefined,topicKey:form.topicKey,tags:form.tagsText.split(/[，,|]/).map(v=>v.trim()).filter(Boolean),value:form.value,sensitivity:form.sensitivity,reason:form.reason});
const save=()=>formRef.value?.validate(async valid=>{if(!valid)return;saving.value=true;try{form.id?await editWechatAIMemory(payload() as any):await addWechatAIMemory(payload() as any);ElMessage.success('记忆已保存');formVisible.value=false;loadList();}finally{saving.value=false;}});
const askReason=(title:string)=>ElMessageBox.prompt('请输入操作原因',title,{inputType:'textarea',inputPattern:/\S+/,inputErrorMessage:'原因不能为空',confirmButtonText:'确认',cancelButtonText:'取消'});
const openDetail=async(row:any)=>{const res:any=await getWechatAIMemoryDetail(row.id);Object.assign(detail,res.data||{});detailVisible.value=true;};
const toggleStatus=(row:any)=>askReason(row.status==='ACTIVE'?'停用记忆':'恢复记忆').then(({value})=>setWechatAIMemoryStatus({id:row.id,enabled:row.status==='ACTIVE'?0:1,reason:value}).then(()=>{ElMessage.success('状态已更新');loadList();})).catch(()=>{});
const remove=(row:any)=>askReason('删除记忆').then(({value})=>deleteWechatAIMemory({id:row.id,reason:value}).then(()=>{ElMessage.success('记忆已删除');loadList();})).catch(()=>{});
const promote=(row:any)=>askReason('提升为全局知识').then(({value})=>promoteWechatAIMemory({id:row.id,reason:value}).then(()=>{ElMessage.success('已提升为全局知识');loadList();})).catch(()=>{});
const resolveConflict=(row:any)=>askReason('确认当前值').then(({value})=>resolveWechatAIMemoryConflict({id:row.id,reason:value}).then(()=>{ElMessage.success('冲突已处理');loadList();})).catch(()=>{});
const reveal=(row:any)=>askReason('查看敏感原值').then(async({value})=>{const res:any=await revealWechatAIMemory({id:row.id,reason:value});await ElMessageBox.alert(res.data.value,'敏感原值',{confirmButtonText:'关闭',type:'warning'});}).catch(()=>{});
onMounted(async()=>{const res:any=await getWechatRobotGroupList({pageNum:1,pageSize:1000,status:1});groups.value=res.data.list||[];loadList();});
</script>

<style scoped lang="scss">
.wechat-ai-memory-container{.ml5{margin-left:5px}.w100{width:100%}}
</style>
