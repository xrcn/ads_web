import request from '/@/utils/request';

export function getWechatGroupScheduleOverview(groupId: number) {
	return request({
		url: '/api/v1/system/wechatGroupSchedule/overview',
		method: 'get',
		params: { groupId },
	});
}

export function saveWechatGroupScheduleConfig(data: object) {
	return request({
		url: '/api/v1/system/wechatGroupSchedule/config',
		method: 'put',
		data,
	});
}

export function getWechatGroupScheduleDurationSummary(params: object) {
	return request({
		url: '/api/v1/system/wechatGroupSchedule/duration/summary',
		method: 'get',
		params,
	});
}

export function getWechatGroupScheduleDurationDetail(params: object) {
	return request({
		url: '/api/v1/system/wechatGroupSchedule/duration/detail',
		method: 'get',
		params,
	});
}

export function getWechatGroupScheduleDurationAudit(params: object) {
	return request({
		url: '/api/v1/system/wechatGroupSchedule/duration/audit/list',
		method: 'get',
		params,
	});
}

export function addWechatGroupScheduleDurationManual(data: object) {
	return request({
		url: '/api/v1/system/wechatGroupSchedule/duration/manual',
		method: 'post',
		data,
	});
}

export function updateWechatGroupScheduleDuration(id: number, data: object) {
	return request({
		url: `/api/v1/system/wechatGroupSchedule/duration/${id}`,
		method: 'put',
		data,
	});
}

export function voidWechatGroupScheduleDuration(id: number, data: object) {
	return request({
		url: `/api/v1/system/wechatGroupSchedule/duration/${id}/void`,
		method: 'post',
		data,
	});
}
