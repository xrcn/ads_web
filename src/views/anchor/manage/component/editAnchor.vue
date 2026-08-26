<template><el-dialog :title="profileMode?'编辑主播档案':(form.id?'编辑主播':'新增主播')" v-model="visible" width="850px">
	<el-form ref="formRef" :model="form" label-width="92px"><el-row :gutter="18">
		<el-col v-if="!profileMode" :span="8"><el-form-item label="平台"><el-select v-model="form.platformCode"><el-option v-for="p in platformOptions" :key="p.code" :label="p.name" :value="p.code"/></el-select></el-form-item></el-col><el-col v-if="!profileMode" :span="8"><el-form-item label="主播ID"><el-input v-model="form.anchorId"/></el-form-item></el-col><el-col v-if="!profileMode" :span="8"><el-form-item label="所属厅"><el-select v-model="form.hallId"><el-option v-for="h in hallOptions" :key="h.hallId" :label="h.hallName" :value="h.hallId"/></el-select></el-form-item></el-col>
		<el-col :span="12"><el-form-item label="主播昵称"><el-input v-model="form.nickname" placeholder="留空时同步群昵称/微信昵称"/></el-form-item></el-col>
		<el-col :span="12"><el-form-item label="微信wxid"><el-input v-model="form.memberWxid" disabled/></el-form-item></el-col>
		<el-col :span="12"><el-form-item label="真实姓名"><el-input v-model="form.realName"/></el-form-item></el-col><el-col :span="12"><el-form-item label="手机号"><el-input v-model="form.mobile"/></el-form-item></el-col>
		<el-col :span="12"><el-form-item label="入职日期"><el-date-picker v-model="form.entryDate" value-format="YYYY-MM-DD"/></el-form-item></el-col><el-col :span="12"><el-form-item label="状态"><el-select v-model="form.status"><el-option label="正常" value="normal"/><el-option label="封号" value="banned"/><el-option label="离职" value="left"/></el-select></el-form-item></el-col>
		<el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea"/></el-form-item></el-col>
	</el-row></el-form>
	<template v-if="profileMode"><el-divider content-position="left">主播ID绑定</el-divider>
		<div v-for="(binding,index) in bindings" :key="binding.localKey" class="binding-row"><el-select v-model="binding.platformCode" placeholder="平台"><el-option v-for="p in platformOptions" :key="p.code" :label="p.name" :value="p.code"/></el-select><el-input v-model="binding.anchorId" placeholder="主播ID"/><el-select v-model="binding.hallId" placeholder="所属厅"><el-option v-for="h in hallOptions" :key="h.hallId" :label="h.hallName" :value="h.hallId"/></el-select><el-button v-if="binding.id" type="danger" text @click="removeBinding(binding,index)">解绑</el-button><el-button v-else text @click="bindings.splice(index,1)">移除</el-button></div>
		<el-button plain @click="addBinding">新增主播ID</el-button>
	</template>
	<template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template>
</el-dialog></template>

<script setup lang="ts">
import { reactive,ref } from 'vue'; import { ElMessage,ElMessageBox } from 'element-plus';
import { addAnchor,deleteAnchorBinding,editAnchor,editAnchorProfile,getAnchorDetail,getAnchorProfileDetail,saveAnchorBinding } from '/@/api/anchor';
const props=defineProps({hallOptions:{type:Array,default:()=>[]},platformOptions:{type:Array,default:()=>[]}}); const emit=defineEmits(['success']); const visible=ref(false);const saving=ref(false);const profileMode=ref(false);const bindings=ref<any[]>([]);
const empty=()=>({id:0,profileId:0,memberWxid:'',platformCode:'vvxqiu',anchorId:'',nickname:'',avatar:'',entryDate:'',realName:'',mobile:'',hallId:'',status:'normal',leaveDate:'',remark:''});const form=reactive(empty());
const loadProfile=async(profileId:number)=>{const res:any=await getAnchorProfileDetail(profileId);Object.assign(form,res.data);bindings.value=(res.data.bindings??[]).map((b:any)=>({...b,localKey:`id-${b.id}`}));};
const openDialog=async(row?:any)=>{Object.assign(form,empty());bindings.value=[];profileMode.value=!!row?.profileId;visible.value=true;if(!row)return;if(profileMode.value){await loadProfile(row.profileId);return;}const res:any=await getAnchorDetail(row.id);Object.assign(form,res.data);};
const addBinding=()=>bindings.value.push({id:0,localKey:`new-${Date.now()}-${bindings.value.length}`,platformCode:'vvxqiu',anchorId:'',hallId:''});
const removeBinding=async(binding:any,index:number)=>{await ElMessageBox.confirm(`确认解绑主播ID ${binding.anchorId}？`,'解绑确认',{type:'warning'});await deleteAnchorBinding(binding.id);bindings.value.splice(index,1);ElMessage.success('解绑成功');};
const submit=async()=>{saving.value=true;try{if(profileMode.value){await editAnchorProfile({...form});for(const b of bindings.value){if(!b.platformCode||!b.anchorId||!b.hallId)throw new Error('每条主播ID都必须填写平台、主播ID和所属厅');await saveAnchorBinding({profileId:form.profileId,anchorRecordId:b.id||0,platformCode:b.platformCode,anchorId:b.anchorId,hallId:b.hallId});}}else{const request=form.id?editAnchor:addAnchor;await request({...form});}ElMessage.success('保存成功');visible.value=false;emit('success');}catch(e:any){ElMessage.error(e?.message||'保存失败');}finally{saving.value=false;}};
defineExpose({openDialog});
</script>
<style scoped>.binding-row{display:grid;grid-template-columns:180px 1fr 180px 70px;gap:10px;margin-bottom:10px}</style>
