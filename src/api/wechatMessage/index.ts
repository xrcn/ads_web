import request from '/@/utils/request';

export function getWechatMessageList(query: object) {
	return request({ url: '/api/v1/system/wechatMessage/list', method: 'get', params: query });
}

export function getWechatMessageDetail(id: number) {
	return request({ url: '/api/v1/system/wechatMessage/detail', method: 'get', params: { id } });
}
