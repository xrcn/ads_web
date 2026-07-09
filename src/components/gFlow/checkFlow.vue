<template>
  <div class="check-flow-container">
    <!--发起工作流-->
    <el-dialog title="发起审批" v-model="startWfOpen" width="500px" append-to-body :close-on-click-modal="false" destroy-on-close>
      <el-form ref="wfStartFormRef" :model="wfStartForm" :rules="wfStartRules" label-width="120px">
        <el-form-item label="项目名称" prop="title">
          <el-input v-model="startWfTitle" disabled />
        </el-form-item>
        <el-form-item label="选择工作流" prop="wfId">
          <el-select v-model="wfStartForm.wfId" @change="setSelectedFlow" clearable>
            <el-option
                v-for="item in wfOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="流程图" v-if="wfStartForm.wfId && wfStartForm.wfId!=='0'">
          <el-link type="primary" :underline="false" @click="showFlowDesign(wfStartForm.wfId,0,'start')">点击查看 {{ selectedFlow }} 的流程图</el-link>
        </el-form-item>
        <el-form-item label="紧急程度" prop="newType">
          <el-select v-model="wfStartForm.newType" >
            <el-option
                v-for="item in flow_level"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="审核意见" prop="checkCon">
          <el-input v-model="wfStartForm.checkCon" />
        </el-form-item>
      </el-form>
      <template v-slot:footer>
<div  class="dialog-footer">
        <el-button type="primary" @click="submitWfStart">确 定</el-button>
        <el-button @click="cancelWfStart">取 消</el-button>
      </div>
</template>
      <el-dialog title="流程图" v-model="isShowFlowDesignStart" @opened="showFlowDesignOpen" width="90%" append-to-body destroy-on-close>
        <ShowFlowDesign ref="showFlowDesignRef" />
      </el-dialog>
    </el-dialog>
    <!--流程审批-->
    <el-dialog title="流程审批" v-model="checkWfOpen" width="900px" append-to-body :close-on-click-modal="false" destroy-on-close>
      <el-form ref="wfCheckFormRef" :model="wfCheckForm" :rules="wfCheckRules" label-width="120px">
        <el-form-item label="项目名称" prop="title">
          <el-input v-model="checkWfTitle" disabled />
        </el-form-item>
        <el-form-item label="审批意见" prop="checkCon">
          <el-input v-model="wfCheckForm.checkCon"  type="textarea" :rows="3"/>
        </el-form-item>
        <el-form-item label="流程图" >
          <el-button @click="showFlowDesign(flowId,processId,'check')" type="success" plain>点击查看流程图</el-button>
        </el-form-item>
        <el-form-item label="下一步骤" prop="nextStep" v-show="nextProcess&&!backProcess">
          <template v-if="checkFlowInfo.nodeInfo && checkFlowInfo.nodeInfo.nextNode.length>0">
            <el-tag v-for="(item,index) in checkFlowInfo.nodeInfo.nextNode" :key="'nextStep_'+index">{{item.nodeText.value}}【{{item.todo.join('，')}}】</el-tag>
          </template>
          <template v-else>
            <el-tag>审批完成</el-tag>
          </template>
        </el-form-item>
        <el-form-item label="回退步骤" v-if="backProcess" prop="wfBackFlow">
          <el-select placeholder="请选择回退步骤" v-model="wfCheckForm.wfBackFlow">
            <template v-if="checkFlowInfo">
              <el-option v-for="(item) of checkFlowInfo.preprocess"
                         :key="''+item.nodeId"
                         :label="item.nodeText.value"
                         :value="''+item.nodeId"
              ></el-option>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="附件">
          <upload-file :action="baseURL+'api/v1/system/upload/singleFile'" v-model="upFileInfo" @upFileData="upFile" :limit="1"></upload-file>
        </el-form-item>
      </el-form>
      <template v-slot:footer>
<div  class="dialog-footer">
        <el-button v-show="doCheck && !doBack" type="primary" @click="submitWfCheck('ok')">提交审批</el-button>
        <el-button type="danger" v-if="checkFlowInfo?.nodeInfo?.rollback===1" @click="submitWfCheck('back')">回  退</el-button>
        <el-button type="info" @click="checkLogs">审批记录</el-button>
      </div>
</template>
      <el-dialog title="流程图" v-model="isShowFlowDesignCheck" @opened="showFlowCheckingOpen" width="90%" append-to-body destroy-on-close>
        <ShowFlowDesign ref="showFlowCheckRef" />
      </el-dialog>
    </el-dialog>
    <el-drawer
        v-model="showLog"
        title="审批记录"
        direction="rtl"
        @opened="showLogs"
        destroy-on-close
    >
      <FlowLog ref="flowLogRef" :form-id="runInfo?.formId" :form-table="runInfo?.formTable"/>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">

import {getCurrentInstance, ref} from "vue";
import {
  checkFlowInfoData,
  FlowRunInfo,
  WfCheckFormData,
  WfOptionsData,
  wfStartFormData
} from "/@/components/gFlow/model";
import {FlowDemoTableColumns} from "/@/views/flow/flowDemo/list/component/model";
import {ElMessage, FormInstance} from "element-plus";
import {getCheckData, saveCheckWf, saveStartWf, wfStart} from "/@/api/flow/flowModel";
import ShowFlowDesign from "/@/components/gFlow/showDesign.vue"
import UploadFile from "/@/components/uploadFile/index.vue";
import FlowLog from "/@/components/gFlow/flowLog.vue";
const props = defineProps({
  saveCheckWfAttr:{
    type:Function,
    default:saveCheckWf
  }
})
defineOptions({ name: "checkFlow"})
const baseURL:string|undefined|boolean = import.meta.env.VITE_API_URL
const startWfOpen = ref(false)
const startWfTitle =ref('')
const wfStartForm = ref<wfStartFormData>({} as wfStartFormData)
const showFlowDesignRef = ref()
const showFlowCheckRef = ref()
const wfStartRules = ref({
  wfId: [
    { required: true, message: "请选择工作流", trigger: "change" }
  ],
  newType: [
    { required: true, message: "请选择紧急程度", trigger: "change" }
  ]
})
const wfStartFormRef = ref<FormInstance>()
const wfOptions = ref<Array<WfOptionsData>>([])
const isShowFlowDesignStart = ref(false)
const isShowFlowDesignCheck = ref(false)
const wfCheckForm = ref<WfCheckFormData>({} as WfCheckFormData)
const checkWfOpen = ref(false)
const wfCheckRules = ref({
  checkCon: [
    { required: true, message: "请填写审批意见", trigger: "input" }
  ],
  wfBackFlow: [
    { required: true, message: "请选择回退步骤", trigger: "change" }
  ],
})
const wfCheckFormRef = ref()
const designInfo = ref({})
const selectedFlow = ref('')
const {proxy} = <any>getCurrentInstance()
const checkWfTitle = ref('')
const checkFlowInfo = ref<checkFlowInfoData>({} as checkFlowInfoData)
const flowId = ref(0)
const processId = ref(0)
const nextProcess = ref(true)
const backProcess = ref(false)
const doCheck = ref(true)
const doBack = ref(false)
const upFileInfo = ref<any[]>([])
const runInfo = ref<FlowRunInfo>()
const showLog = ref(false)
const flowLogRef = ref()
// 字典选项数据
const {
  flow_level
} = proxy.useDict(
    'flow_level',
)
const emit = defineEmits(['getList'])
const showFlowDesignOpen = ()=>{
  showFlowDesignRef.value.showDesign(designInfo.value)
}
const showFlowCheckingOpen = ()=>{
  showFlowCheckRef.value.showDesign(designInfo.value)
}
const setSelectedFlow = ()=>{
  wfOptions.value.some(item => {
    if (item.id === parseInt(wfStartForm.value.wfId as string)) {
      selectedFlow.value = item.name
      return false
    }
  })
}
const showFlowDesign =  (flowId:string|number, processId = 0,tp='') => {
  if(tp=='start'){
    isShowFlowDesignStart.value = true
  }else{
    isShowFlowDesignCheck.value = true
  }
  designInfo.value = {flowId:flowId,processId:processId,runId: wfCheckForm.value.runId};
}
const submitWfStart = ()=>{
  wfStartFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      console.log(wfStartForm.value)
      saveStartWf(wfStartForm.value).then((res:any)=>{
        ElMessage.success("发起成功")
        startWfOpen.value = false
        emit("getList")
      })
    }
  })
}
const cancelWfStart = ()=>{
  startWfOpen.value = false
}
const handleStartFlow = (row: FlowDemoTableColumns|null)=>{
  const btn = row?.actionBtn
  if(btn.title.indexOf('无审批权限')>-1){
    ElMessage.error("您没有审批权限")
    return
  }
  switch(btn.type){
    case 'link':
      if(btn.api=='wfStart'){
        resetWfForm()
        //获取流程数据
        wfStart({wfType:btn.wfType,wfModelType:btn.wfModelType,wfTitle:btn.wfTitle,wfStatusField:btn.wfStatusField,wfFid:btn.wfFid}).then((response:any)=>{
          wfOptions.value =response.data.flow?response.data.flow:[]
          startWfTitle.value = row?(row as any)[btn.wfTitle]:''
          wfStartForm.value.wfType = response.data.info.wfType
          wfStartForm.value.wfTitle = response.data.info.wfTitle
          wfStartForm.value.wfStatusField = response.data.info.wfStatusField
          wfStartForm.value.wfFid = response.data.info.wfFid
        })
        startWfOpen.value = true
      }else if(btn.api=='wfCheck'){
        resetCheckForm()
        getCheckData({wfType:btn.wfType,wfModelType:btn.wfModelType,wfTitle:btn.wfTitle,wfStatusField:btn.wfStatusField,wfFid:btn.wfFid,isProxy:btn?.isProxy}).then((response:any)=>{
          checkWfTitle.value = response.data.data.runInfo.runName
          flowId.value = response.data.data.runInfo.flowId
          processId.value = response.data.data.nodeInfo.nodeId
          wfCheckForm.value.runId = response.data.data.runInfo.id
          wfCheckForm.value.nodeId = response.data.data.nodeInfo.nodeId
          checkFlowInfo.value.nodeInfo = response.data.data.nodeInfo
          checkFlowInfo.value.preprocess = response.data.data.preProcess
          runInfo.value = response.data.data.runInfo
          wfCheckForm.value.isProxy = btn?.isProxy
        })
        checkWfOpen.value = true
      }
      break;
  }
}
const resetWfForm = ()=>{
  wfOptions.value = []
  startWfTitle.value = ''
  wfStartForm.value = {
    wfType:'',
    wfTitle:'',
    wfStatusField:'',
    wfFid:'',
    wfId:undefined,
    newType:undefined,
    checkCon:'',
  };
  wfStartFormRef.value?.resetFields()
}
const resetCheckForm = ()=>{
  checkWfTitle.value = ""
  checkFlowInfo.value = {
    nodeInfo:{
      nextNode:[],
      nodeId:'',
      nodeText:'',
      todo:[],
      rollback:0
    },
    preprocess:[],
  }
  wfCheckForm.value = {
    art:null,
    checkCon:'',
    flowId:'',
    flowProcess:'',
    nodeId:'',
    npid:'',
    runId:'',
    runProcess:'',
    submitToSave:'',
    sup:'',
    wfBackFlow:'',
    wfFid:'',
    wfMode:'',
    wfStatusField:'',
    wfTitle:'',
    wfType:'',
    isProxy:false
  }
  doBack.value =false
  backProcess.value = false
  wfCheckFormRef.value?.resetFields()
}
const upFile = (data:any)=>{
  if(data&&data.length>0) {
    wfCheckForm.value.art = JSON.stringify(data)
    upFileInfo.value = data
  }else{
    wfCheckForm.value.art = ""
  }
}
const submitWfCheck = (type:string)=>{
  wfCheckForm.value.submitToSave = type
  switch(type){
    case 'ok':
      props.saveCheckWfAttr(wfCheckForm.value).then((response:any)=>{
        if (response.code === 0) {
          ElMessage.success("审批成功")
          checkWfOpen.value = false
          emit("getList")
        }
      })
      break
    case 'back':
      doBack.value = true
      backProcess.value=true
      if(!wfCheckForm.value.wfBackFlow){
        ElMessage.error('请选择回退步骤')
        return
      }
      props.saveCheckWfAttr(wfCheckForm.value).then((response:any)=>{
        if (response.code === 0) {
          ElMessage.success("回退成功")
          checkWfOpen.value = false
          emit("getList")
        }
      })
      break
  }
}
const checkLogs = ()=>{
  showLog.value = true
}
const showLogs = ()=>{
  flowLogRef.value.getLogList()
}
defineExpose({handleStartFlow})
</script>
<style scoped lang="scss">
.dialog-footer{
  display: flex;
  justify-content: flex-end;
}
</style>
