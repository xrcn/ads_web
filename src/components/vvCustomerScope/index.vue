<template>
	<div class="vv-customer-scope">
		<el-card class="mb15" shadow="never"><el-space wrap><span>VV 客户</span><el-select :model-value="selectedVVCustomerId || undefined" filterable clearable placeholder="请选择客户" :loading="loading" style="width:280px" @change="selectVVCustomer(Number($event)||0)"><el-option v-for="item in customers" :key="item.id" :value="item.id" :label="`${item.customerNo} · ${item.customerName}${item.status===0?'（已停用）':''}`" :disabled="item.status!==1"/></el-select><el-button v-if="failed" @click="load">重试客户列表</el-button></el-space></el-card>
		<component :is="content" v-if="selectedVVCustomerId" :key="selectedVVCustomerId" />
		<el-empty v-else description="请选择客户后查看 VV 数据" />
	</div>
</template>
<script setup lang="ts">
import { onMounted, ref, type Component } from 'vue';
import { getVVCustomerOptions, type VVCustomerOption } from '/@/api/system/vvCustomer';
import { selectedVVCustomerId, selectVVCustomer } from '/@/utils/vvCustomerScope';
defineProps<{ content: Component }>();
const customers=ref<VVCustomerOption[]>([]);const loading=ref(false);const failed=ref(false);
const load=async()=>{loading.value=true;failed.value=false;try{const res:any=await getVVCustomerOptions();customers.value=res.data.list??[];if(selectedVVCustomerId.value&&!customers.value.some(item=>item.id===selectedVVCustomerId.value&&item.status===1))selectVVCustomer(0);}catch{failed.value=true;}finally{loading.value=false;}};
onMounted(load);
</script>
