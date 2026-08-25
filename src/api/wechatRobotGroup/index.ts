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
export const getWechatRobotGroupQueueRules=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/queueRules',method:'get',params:{groupId}});
export const saveWechatRobotGroupQueueRules=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/queueRulesSave',method:'put',data});
export const getWechatRobotGroupSpecialTopList=(groupId:number,status:string)=>request({url:'/api/v1/system/wechatRobotGroup/specialTopList',method:'get',params:{groupId,status}});
export const grantWechatRobotGroupSpecialTop=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/specialTopGrant',method:'post',data});
export const cancelWechatRobotGroupSpecialTop=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/specialTopCancel',method:'delete',data});
export const getWechatRobotGroupScheduleTiming=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/scheduleTiming',method:'get',params:{groupId}});
export const saveWechatRobotGroupScheduleTiming=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/scheduleTimingSave',method:'put',data});
export const getWechatRobotGroupSchedulePlan=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/schedulePlan',method:'get',params:{groupId}});
export const saveWechatRobotGroupSchedulePlan=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/schedulePlanSave',method:'put',data});
export const batchSaveWechatRobotGroupSchedulePlan=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/schedulePlanBatchSave',method:'post',data});
export const batchClearWechatRobotGroupSchedulePlan=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/schedulePlanBatchClear',method:'post',data});
export const getWechatRobotGroupScheduleExceptions=(groupId:number,businessDate:string)=>request({url:'/api/v1/system/wechatRobotGroup/scheduleExceptions',method:'get',params:{groupId,businessDate}});
export const saveWechatRobotGroupFixedException=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/fixedExceptionSave',method:'post',data});
export const restoreWechatRobotGroupFixedException=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/fixedExceptionRestore',method:'delete',data});
export const saveWechatRobotGroupHostException=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/hostExceptionSave',method:'post',data});
export const restoreWechatRobotGroupHostException=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/hostExceptionRestore',method:'delete',data});
export const getWechatRobotGroupSchedulePlanAudit=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/schedulePlanAudit',method:'get',params:{groupId}});
export const getWechatRobotGroupReportConfig=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/reportConfig',method:'get',params:{groupId}});
export const saveWechatRobotGroupReportConfig=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/reportConfigSave',method:'put',data});
export const getWechatRobotGroupActiveReports=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/activeReports',method:'get',params:{groupId}});
export const closeWechatRobotGroupReport=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/reportClose',method:'post',data});
export const getWechatRobotGroupReportConfigAudit=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/reportConfigAudit',method:'get',params:{groupId}});
