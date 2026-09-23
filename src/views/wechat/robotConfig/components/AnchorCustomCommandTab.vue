<template>
	<div class="anchor-custom-command-tab">
		<div class="panel-heading">
			<div><h4>专属扣排配置</h4><p>绑定只能在微信群内完成；普通图片和表情不会被下载。</p></div>
			<div class="actions"><span v-if="lastSyncAt" class="sync-time">最近同步：{{lastSyncAt}}</span><el-button :loading="loading" @click="load">刷新</el-button><el-button v-if="canSyncMembers" :loading="syncing" @click="syncMembers">同步群成员</el-button></div>
		</div>
		<el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="mb15" />
		<el-form v-if="canRead" label-width="130px" class="config-form">
			<el-form-item label="扣排模式">
				<el-radio-group v-model="config.queueMode" :disabled="!canSave"><el-radio value="NORMAL">普通模式</el-radio><el-radio value="ANCHOR_CUSTOM">主播专属模式</el-radio></el-radio-group>
			</el-form-item>
			<el-form-item label="绑定等待时间"><el-input-number v-model="config.bindTimeoutSeconds" :min="10" :max="120" :disabled="!canSave"/><span class="form-tip">秒，默认30秒</span></el-form-item>
			<el-form-item v-if="canSave"><el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button></el-form-item>
		</el-form>
		<el-alert v-if="canRead&&config.queueMode==='NORMAL'" title="普通模式下仅允许切换模式和设置等待时间；专属指令操作不可用。" type="info" :closable="false" class="mb15" />
		<el-table v-if="canRead" v-loading="loading" :data="items" border stripe empty-text="当前群没有主播档案">
			<el-table-column prop="anchorName" label="主播" min-width="130" />
			<el-table-column label="在群状态" width="100"><template #default="{row}"><el-tag :type="row.isPresent===1?'success':'info'">{{row.isPresent===1?'在群':'已离群'}}</el-tag></template></el-table-column>
			<el-table-column label="绑定状态" width="120"><template #default="{row}"><el-tag :type="row.bound&&row.mediaStatus==='READY'?'success':row.bound?'warning':'info'">{{row.bound?(row.mediaStatus==='READY'?'已绑定':'需重新绑定'):'未绑定'}}</el-tag></template></el-table-column>
			<el-table-column label="专属内容" min-width="170"><template #default="{row}"><el-image v-if="customMode&&row.bound&&row.previewUrl" :src="row.previewUrl" :preview-src-list="[row.previewUrl]" fit="contain" class="media-preview"/><template v-else><span>{{row.messageType===47?'表情':row.messageType===3?'图片':'-'}}</span><el-button v-if="customMode&&canPreview&&row.bound&&row.mediaStatus==='READY'" text type="primary" @click="loadPreview(row)">预览</el-button></template></template></el-table-column>
			<el-table-column prop="updatedAt" label="更新时间" width="170" />
			<el-table-column label="操作" width="190"><template #default="{row}"><el-button text type="primary" :disabled="!customMode||!canSave" @click="openCommand(row)">{{row.bound?'修改':'配置'}}</el-button><el-button v-if="row.bound&&canDelete" text type="danger" :disabled="!customMode" @click="remove(row)">删除</el-button></template></el-table-column>
		</el-table>
		<el-empty v-else description="没有查看专属扣排配置的权限" />
		<el-dialog v-model="commandDialog" title="群内配置指引" width="520px">
			<p>复制下列口令到对应微信群，再在等待时间内由当前管理员发送目标表情或图片：</p>
			<el-input :model-value="commandText" readonly><template #append><el-button @click="copyCommand">复制</el-button></template></el-input>
			<template #footer><el-button @click="commandDialog=false">关闭</el-button></template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import useClipboard from 'vue-clipboard3';
import { deleteAnchorCustomCommand, getAnchorCustomCommandConfig, getAnchorCustomCommandList, getAnchorCustomCommandPreview, saveAnchorCustomCommandConfig, syncWechatRobotGroupMembers, type AnchorCustomCommandConfig, type AnchorCustomCommandItem } from '/@/api/wechatRobotGroup';

const props=defineProps<{groupId?:number;lastSuccessfulSyncAt?:string;canRead:boolean;canSave:boolean;canDelete:boolean;canPreview:boolean;canSyncMembers:boolean}>();
const {toClipboard}=useClipboard();
const loading=ref(false);const saving=ref(false);const syncing=ref(false);const errorMessage=ref('');const items=ref<AnchorCustomCommandItem[]>([]);const commandDialog=ref(false);const commandText=ref('');const lastSyncAt=ref(props.lastSuccessfulSyncAt||'');
const config=reactive<AnchorCustomCommandConfig>({groupId:0,queueMode:'NORMAL',bindTimeoutSeconds:30});
const customMode=computed(()=>config.queueMode==='ANCHOR_CUSTOM');
let requestGeneration=0;
const load=async()=>{const groupId=props.groupId;const generation=++requestGeneration;items.value=[];errorMessage.value='';if(!groupId||!props.canRead)return;loading.value=true;try{const[configRes,listRes]=await Promise.all([getAnchorCustomCommandConfig(groupId),getAnchorCustomCommandList(groupId)]);if(generation!==requestGeneration)return;Object.assign(config,configRes.data);items.value=listRes.data.list||[];}catch(error:any){if(generation===requestGeneration)errorMessage.value=error?.message||'专属扣排配置加载失败';}finally{if(generation===requestGeneration)loading.value=false;}};
const saveConfig=async()=>{if(!props.groupId)return;if(config.queueMode==='ANCHOR_CUSTOM')await ElMessageBox.confirm('切换后普通 p / P / 排 / 补 将立即失效，即使当前没有已绑定主播。确认继续？','切换扣排模式',{type:'warning'});saving.value=true;try{await saveAnchorCustomCommandConfig({groupId:props.groupId,queueMode:config.queueMode,bindTimeoutSeconds:config.bindTimeoutSeconds});ElMessage.success('专属扣排配置已保存');await load();}finally{saving.value=false;}};
const syncMembers=async()=>{if(!props.groupId)return;syncing.value=true;try{const res:any=await syncWechatRobotGroupMembers(props.groupId);lastSyncAt.value=res.data.lastSuccessfulSyncAt||'';ElMessage.success('群成员已同步');await load();}finally{syncing.value=false;}};
const openCommand=(row:AnchorCustomCommandItem)=>{commandText.value=`设置${row.anchorName}扣排专属`;commandDialog.value=true;};
const copyCommand=async()=>{await toClipboard(commandText.value);ElMessage.success('口令已复制');};
const loadPreview=async(row:AnchorCustomCommandItem)=>{if(!props.groupId)return;const res=await getAnchorCustomCommandPreview(props.groupId,row.anchorProfileId);row.previewUrl=res.data.previewUrl;};
const remove=async(row:AnchorCustomCommandItem)=>{if(!props.groupId)return;await ElMessageBox.confirm(`确认删除 ${row.anchorName} 的专属扣排指令？`,'删除绑定',{type:'warning'});await deleteAnchorCustomCommand({groupId:props.groupId,anchorId:row.anchorProfileId});ElMessage.success('专属扣排指令已删除');await load();};
watch(()=>[props.groupId,props.canRead],load,{immediate:true});
watch(()=>props.lastSuccessfulSyncAt,(value)=>{lastSyncAt.value=value||'';},{immediate:true});
</script>

<style scoped lang="scss">
.panel-heading,.actions{display:flex;align-items:center;justify-content:space-between;gap:10px}.panel-heading{padding-bottom:12px;margin-bottom:14px;border-bottom:1px solid var(--el-border-color-lighter)}.panel-heading h4{margin:0 0 5px}.panel-heading p,.sync-time{margin:0;color:var(--el-text-color-secondary);font-size:12px}.form-tip{margin-left:12px;color:var(--el-text-color-secondary);font-size:12px}.media-preview{width:72px;height:72px}.config-form{max-width:720px}@media(max-width:768px){.panel-heading,.actions{align-items:stretch;flex-direction:column}.config-form{max-width:none}}
</style>
