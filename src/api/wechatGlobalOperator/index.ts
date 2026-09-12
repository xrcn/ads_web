import request from '/@/utils/request';

export type WechatGlobalOperator = {
	id: number;
	wxid: string;
	displayName: string;
	remark: string;
	status: number;
	createdAt?: string;
	updatedAt?: string;
};

export type WechatGlobalOperatorQuery = {
	wxid: string;
	displayName: string;
	status: number | string;
	pageNum: number;
	pageSize: number;
};

export type WechatGlobalOperatorSave = Pick<WechatGlobalOperator, 'wxid' | 'displayName' | 'remark' | 'status'> & { id?: number };

export const listWechatGlobalOperators = (params: WechatGlobalOperatorQuery) => request({ url: '/api/v1/system/wechatGlobalOperator/list', method: 'get', params });
export const addWechatGlobalOperator = (data: WechatGlobalOperatorSave) => request({ url: '/api/v1/system/wechatGlobalOperator/add', method: 'post', data });
export const editWechatGlobalOperator = (data: Omit<WechatGlobalOperatorSave, 'wxid' | 'status'> & { id: number }) => request({ url: '/api/v1/system/wechatGlobalOperator/edit', method: 'put', data });
export const changeWechatGlobalOperatorStatus = (id: number, status: number) => request({ url: '/api/v1/system/wechatGlobalOperator/status', method: 'put', data: { id, status } });
