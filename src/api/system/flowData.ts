import request from '/@/utils/request';

export interface FlowDataConfig {
	account: string;
	password: string;
	vvToken: string;
}

export interface FlowDataLoginInput {
	sessionId: string;
	account: string;
	password: string;
	verifyCode: string;
}

export interface FlowDataPageQuery {
	pageNum: number;
	pageSize: number;
}

export const getFlowDataConfig = () => request({ url: '/api/v1/system/flowData/config', method: 'get' });
export const saveFlowDataConfig = (data: FlowDataConfig) => request({ url: '/api/v1/system/flowData/config', method: 'put', data });
export const getFlowDataCaptcha = () => request({ url: '/api/v1/system/flowData/captcha', method: 'get' });
export const loginFlowDataVV = (data: FlowDataLoginInput) => request({ url: '/api/v1/system/flowData/login', method: 'post', data });
export const syncFlowData = () => request({ url: '/api/v1/system/flowData/sync', method: 'post', timeout: 180000 });
export const getFlowDataSummary = () => request({ url: '/api/v1/system/flowData/summary', method: 'get' });
export const getFlowDataDaily = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/daily', method: 'get', params });
export const getFlowDataTasks = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/tasks', method: 'get', params });
export const getFlowDataHealth = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/health', method: 'get', params });
export const getFlowDataScoreLogs = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/scoreLogs', method: 'get', params });
