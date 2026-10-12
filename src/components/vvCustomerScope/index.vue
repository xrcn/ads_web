<template>
	<div class="vv-customer-scope">
		<el-card class="mb15" shadow="never" style="min-height: 0"><el-space wrap><span>VV 客户</span><el-select :model-value="selectedVVCustomerId || undefined" filterable clearable placeholder="请选择客户" :loading="loading" style="width:280px" @change="selectVVCustomer(Number($event)||0)"><el-option v-for="item in customers" :key="item.id" :value="item.id" :label="`${item.customerNo} · ${item.customerName}${item.isDefault?'（默认）':''}${item.status===0?'（已停用）':''}`" :disabled="item.status!==1"/></el-select><el-button v-if="failed" @click="load">重试客户列表</el-button></el-space></el-card>
		<component :is="content" v-if="!loading && selectedCustomer?.hasVVAccount" :key="selectedVVCustomerId" />
		<el-empty v-else-if="!loading && selectedCustomer" description="该客户未配置 VV 账号，配置后可查看 VV 数据" />
		<el-empty v-else-if="!loading" :description="failed?'客户列表加载失败，请重试':'请选择客户后查看 VV 数据；可在客户列表设置默认客户'" />
	</div>
</template>
<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, type Component } from 'vue';
import { getVVCustomerOptions, type VVCustomerOption } from '/@/api/system/vvCustomer';
import { selectedVVCustomerId, selectVVCustomer, initializeDefaultVVCustomer } from '/@/utils/vvCustomerScope';
defineProps<{ content: Component }>();
const customers=ref<VVCustomerOption[]>([]);const loading=ref(false);const failed=ref(false);
const selectedCustomer=computed(()=>customers.value.find(item=>item.id===selectedVVCustomerId.value&&item.status===1));
let loadGeneration=0;
let needsRefresh=false;
const load=async()=>{const generation=++loadGeneration;loading.value=true;failed.value=false;try{const res:any=await getVVCustomerOptions();if(generation!==loadGeneration)return;customers.value=res.data.list??[];if(selectedVVCustomerId.value&&!customers.value.some(item=>item.id===selectedVVCustomerId.value&&item.status===1))selectVVCustomer(0);initializeDefaultVVCustomer(customers.value);}catch{if(generation===loadGeneration)failed.value=true;}finally{if(generation===loadGeneration)loading.value=false;}};
onMounted(load);
onDeactivated(()=>{++loadGeneration;needsRefresh=true;loading.value=true;});
onActivated(()=>{if(needsRefresh){needsRefresh=false;void load();}});
onBeforeUnmount(()=>{++loadGeneration;});
</script>
