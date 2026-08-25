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

export function getWechatRobotGroupAdmins(groupId: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/adminList',
		method: 'get',
		params: { groupId },
	});
}

export function saveWechatRobotGroupAdmin(data: { groupId: number; memberWxid: string; memberName: string }) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/adminSave',
		method: 'post',
		data,
	});
}

export function deleteWechatRobotGroupAdmin(groupId: number, memberWxid: string) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/adminDelete',
		method: 'delete',
		data: { groupId, memberWxid },
	});
}

export function getWechatRobotGroupQueuePolicy(groupId: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/queuePolicy',
		method: 'get',
		params: { groupId },
	});
}

export function saveWechatRobotGroupQueuePolicy(groupId: number, adminOnly: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/queuePolicySave',
		method: 'put',
		data: { groupId, adminOnly },
	});
}

export function getWechatRobotGroupMemberList(groupId: number, includeLeft: boolean) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/memberList',
		method: 'get',
		params: { groupId, includeLeft },
	});
}

export function syncWechatRobotGroupMembers(groupId: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/memberSync',
		method: 'post',
		data: { groupId },
	});
}

export function getWechatRobotGroupFixedSchedule(groupId: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/fixedSchedule',
		method: 'get',
		params: { groupId },
	});
}

export function saveWechatRobotGroupFixedSchedule(groupId: number, enabled: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/fixedScheduleSave',
		method: 'put',
		data: { groupId, enabled },
	});
}

export function getWechatRobotGroupConfigOverview(groupId: number) {
	return request({
		url: '/api/v1/system/wechatRobotGroup/configOverview',
		method: 'get',
		params: { groupId },
	});
}
