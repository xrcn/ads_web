import { ref } from 'vue';
import { CanceledError, type AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import request from '/@/utils/request';

export const selectedVVCustomerId = ref(0);
let generation = 0;
let controller = new AbortController();
export function selectVVCustomer(customerId: number) {
	if (customerId === selectedVVCustomerId.value) return;
	controller.abort();
	controller = new AbortController();
	++generation;
	selectedVVCustomerId.value = customerId;
}

// Freeze identity before dispatch; a changed selection cancels every request from the old scope.
export async function vvCustomerRequest(config: AxiosRequestConfig & { __skipGlobalErrorMessage?: boolean }) {
	const customerId = selectedVVCustomerId.value;
	const requestGeneration = generation;
	if (!customerId) throw new CanceledError('请选择 VV 客户');
	const scoped = { ...config, params: { ...config.params, customerId }, signal: controller.signal, __skipGlobalErrorMessage: true };
	if (config.method && config.method.toLowerCase() !== 'get') scoped.data = { ...config.data, customerId };
	try {
		const result = await request(scoped);
		if (requestGeneration !== generation) throw new CanceledError('VV 客户已切换');
		return result;
	} catch (error: any) {
		if (requestGeneration !== generation || error?.code === 'ERR_CANCELED') throw new CanceledError('VV 客户已切换');
		if (!config.__skipGlobalErrorMessage) ElMessage.error(error?.message || 'VV 请求失败');
		throw error;
	}
}
