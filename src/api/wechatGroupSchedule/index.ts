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
