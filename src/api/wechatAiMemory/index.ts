import request from '/@/utils/request';

export interface WechatAIMemoryQuery {
	groupId?: number;
	memoryType?: string;
	scopeType?: string;
	status?: string;
	evidenceKind?: string;
	sensitivity?: string;
	conflict?: number;
	keyword?: string;
	pageNum: number;
	pageSize: number;
}

export interface WechatAIMemoryMutation {
	id?: number;
	memoryType: string;
	scopeType: string;
	groupId?: number;
	subjectWxid?: string;
	topicKey: string;
	tags: string[];
	value: string;
	sensitivity: string;
	reason: string;
}

export const getWechatAIMemoryList = (params: WechatAIMemoryQuery) => request({ url: '/api/v1/system/wechatAiMemory/list', method: 'get', params });
export const getWechatAIMemoryDetail = (id: number) => request({ url: '/api/v1/system/wechatAiMemory/detail', method: 'get', params: { id } });
export const addWechatAIMemory = (data: WechatAIMemoryMutation) => request({ url: '/api/v1/system/wechatAiMemory/add', method: 'post', data });
export const editWechatAIMemory = (data: WechatAIMemoryMutation) => request({ url: '/api/v1/system/wechatAiMemory/edit', method: 'put', data });
export const setWechatAIMemoryStatus = (data: { id: number; enabled: number; reason: string }) => request({ url: '/api/v1/system/wechatAiMemory/status', method: 'put', data });
export const deleteWechatAIMemory = (data: { id: number; reason: string }) => request({ url: '/api/v1/system/wechatAiMemory/delete', method: 'delete', data });
export const resolveWechatAIMemoryConflict = (data: { id: number; revisionId?: number; reason: string }) => request({ url: '/api/v1/system/wechatAiMemory/resolveConflict', method: 'put', data });
export const promoteWechatAIMemory = (data: { id: number; reason: string }) => request({ url: '/api/v1/system/wechatAiMemory/promote', method: 'put', data });
export const revealWechatAIMemory = (data: { id: number; reason: string }) => request({ url: '/api/v1/system/wechatAiMemory/reveal', method: 'post', data });
