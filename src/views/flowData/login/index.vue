<template>
	<div class="vv-login-container">
		<el-card shadow="hover" class="mb15"><template #header><span>当前登录状态</span></template>
			<el-space><el-tag :type="statusType">{{ statusText }}</el-tag><span>最近检测：{{ authStatus.checkedAt || '-' }}</span><el-button :loading="checking" @click="loadStatus">刷新状态</el-button></el-space>
		</el-card>
		<el-card shadow="hover"><template #header><span>VV 家族登录</span></template>
			<el-form label-position="top"><el-row :gutter="16">
				<el-col :xs="24" :md="8"><el-form-item label="账号"><el-input v-model="config.account" autocomplete="off" /></el-form-item></el-col>
				<el-col :xs="24" :md="8"><el-form-item label="密码"><el-input v-model="config.password" type="password" autocomplete="off" /></el-form-item></el-col>
				<el-col :xs="24" :md="8"><el-form-item label="vvToken"><el-input v-model="config.vvToken" autocomplete="off" /></el-form-item></el-col>
			</el-row>
			<el-space wrap><el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button><el-button :loading="captchaLoading" @click="loadCaptcha">获取验证码</el-button><el-button type="success" :loading="loggingIn" :disabled="!captcha.sessionId" @click="login">VV 登录</el-button></el-space>
			<div v-if="captcha.sessionId" class="captcha-row"><img :src="captcha.imageDataUrl" alt="VV验证码" @click="loadCaptcha" /><el-input v-model="verifyCode" maxlength="8" placeholder="输入验证码" @keyup.enter="login" /></div>
			</el-form>
		</el-card>
	</div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getVVAuthCaptcha,getVVAuthConfig,getVVAuthStatus,loginVVAuth,saveVVAuthConfig,type FlowDataConfig } from '/@/api/system/flowData';
defineOptions({name:'flowDataLogin'});
const config=reactive<FlowDataConfig>({account:'',password:'',vvToken:''});const captcha=reactive({sessionId:'',imageDataUrl:''});const authStatus=reactive({status:'UNKNOWN',checkedAt:'',message:''});const verifyCode=ref('');const saving=ref(false);const captchaLoading=ref(false);const loggingIn=ref(false);const checking=ref(false);
const statusText=computed(()=>({VALID:'已登录',EXPIRED:'token已过期',MISSING:'未配置同步参数',UNKNOWN:'检测失败'} as Record<string,string>)[authStatus.status]||'检测失败');const statusType=computed(()=>authStatus.status==='VALID'?'success':authStatus.status==='UNKNOWN'?'info':'danger');
const loadConfig=async()=>Object.assign(config,(await getVVAuthConfig() as any).data);const loadStatus=async()=>{checking.value=true;try{Object.assign(authStatus,(await getVVAuthStatus() as any).data);}finally{checking.value=false;}};
const saveConfig=async()=>{saving.value=true;try{await saveVVAuthConfig({...config});ElMessage.success('配置已保存');}finally{saving.value=false;}};
const loadCaptcha=async()=>{captchaLoading.value=true;try{Object.assign(captcha,(await getVVAuthCaptcha() as any).data);verifyCode.value='';}finally{captchaLoading.value=false;}};
const login=async()=>{if(!config.account||!config.password||!verifyCode.value.trim()){ElMessage.warning('请填写账号、密码和验证码');return;}loggingIn.value=true;try{Object.assign(config,(await loginVVAuth({sessionId:captcha.sessionId,account:config.account,password:config.password,verifyCode:verifyCode.value.trim()}) as any).data);Object.assign(captcha,{sessionId:'',imageDataUrl:''});verifyCode.value='';ElMessage.success('VV 登录成功');await loadStatus();}finally{loggingIn.value=false;}};
onMounted(()=>Promise.allSettled([loadConfig(),loadStatus()]));
</script>
<style scoped>.captcha-row{display:flex;align-items:center;gap:12px;margin-top:16px}.captcha-row img{width:120px;height:40px;border:1px solid var(--el-border-color);cursor:pointer;object-fit:contain}.captcha-row .el-input{width:180px}</style>
