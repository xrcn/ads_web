import request from '/@/utils/request';

export function getWechatRobotAccountList(query: object) {
	return request({
		url: '/api/v1/system/wechatRobotAccount/list',
		method: 'get',
		params: query,
	});
}

export function getWechatRobotAccountDetail(id: number) {
	return request({
		url: '/api/v1/system/wechatRobotAccount/detail',
		method: 'get',
		params: { id },
	});
}

export function addWechatRobotAccount(data: object) {
	return request({
		url: '/api/v1/system/wechatRobotAccount/add',
		method: 'post',
		data,
	});
}

export function editWechatRobotAccount(data: object) {
	return request({
		url: '/api/v1/system/wechatRobotAccount/edit',
		method: 'put',
		data,
	});
}

export function changeWechatRobotAccountStatus(id: number, status: number) {
	return request({
		url: '/api/v1/system/wechatRobotAccount/status',
		method: 'put',
		data: { id, status },
	});
}

export function setDefaultWechatRobotAccount(id: number) {
	return request({
		url: '/api/v1/system/wechatRobotAccount/default',
		method: 'put',
		data: { id },
	});
}

export function getWechatRobotAccountOptions() {
	return request({
		url: '/api/v1/system/wechatRobotAccount/options',
		method: 'get',
	});
}
