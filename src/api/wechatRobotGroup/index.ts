import request from '/@/utils/request';

export function getWechatRobotGroupList(query: object) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/list',
		method: 'get',
		params: query,
	});
}

export function getWechatRobotGroupDetail(id: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/detail',
		method: 'get',
		params: { id },
	});
}

export function addWechatRobotGroup(data: object) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/add',
		method: 'post',
		data,
	});
}

export function editWechatRobotGroup(data: object) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/edit',
		method: 'put',
		data,
	});
}

export function changeWechatRobotGroupStatus(id: number, status: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/status',
		method: 'put',
		data: { id, status },
	});
}
