import request from '/@/utils/request';

export function postWechatApiText(data: object) {
	return request({
		url: '/api/v1/system/wechatApi/postText',
		method: 'post',
		data,
	});
}

export function getWechatApiBriefInfo(data: object) {
	return request({
		url: '/api/v1/system/wechatApi/getBriefInfo',
		method: 'post',
		data,
	});
}

export function getWechatApiDetailInfo(data: object) {
	return request({
		url: '/api/v1/system/wechatApi/getDetailInfo',
		method: 'post',
		data,
	});
}

export function fetchWechatApiChatrooms(data: object) {
	return request({
		url: '/api/v1/system/wechatApi/fetchChatrooms',
		method: 'post',
		data,
	});
}
