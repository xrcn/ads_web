import request from '/@/utils/request';

export interface WechatRobotGroupAIChatConfig {
	groupId: number;
	enabled: 0 | 1;
	followupEnabled: 0 | 1;
	businessQueryEnabled: 0 | 1;
	memoryEnabled: 0 | 1;
	businessAccess: 'OPERATORS_ONLY' | 'ALL_MEMBERS';
	assistantActionEnabled: 0 | 1;
	assistantActionAccess: 'OPERATORS_ONLY' | 'ALL_MEMBERS';
	robotGroupNickname: string;
	configurationReady: boolean;
	memoryConfigurationReady: boolean;
}

interface WechatRobotGroupApiResponse<T> {
	code: number;
	message: string;
	data: T;
}

export type WechatRobotGroupAIChatConfigSave = Pick<WechatRobotGroupAIChatConfig, 'groupId' | 'enabled' | 'followupEnabled' | 'businessQueryEnabled' | 'memoryEnabled' | 'businessAccess' | 'assistantActionEnabled' | 'assistantActionAccess'>;

export type AnchorCustomQueueMode = 'NORMAL' | 'ANCHOR_CUSTOM';

export interface AnchorCustomCommandConfig {
	groupId: number;
	queueMode: AnchorCustomQueueMode;
	bindTimeoutSeconds: number;
}

export interface AnchorCustomCommandItem {
	memberId: number;
	bindingId: number;
	anchorName: string;
	isPresent: 0 | 1;
	bound: boolean;
	messageType: 0 | 3 | 47;
	mediaStatus: 'READY' | 'NEEDS_REBIND' | '';
	updatedAt: string;
	previewUrl: string;
}

export interface WechatRobotGroupServicePeriodSaveRequest {
	groupId: number;
	mode: 'SET' | 'ADD';
	days: number;
}

export interface WechatRobotGroupServicePeriodChange {
	serviceStartedAt: string;
	serviceExpiresAt: string;
	serviceRemainingSeconds: number;
	runningStatus: 0 | 1;
	openingMissing: string[];
}

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

export function changeWechatRobotGroupRunningStatus(groupId: number, runningStatus: number) {
	return request({ url: '/api/v1/system/wechatRobotGroup/runningStatus', method: 'put', data: { groupId, runningStatus } });
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
export const saveWechatRobotGroupServicePeriod=(data:WechatRobotGroupServicePeriodSaveRequest)=>request({url:'/api/v1/system/wechatRobotGroup/servicePeriodSave',method:'put',data}) as unknown as Promise<WechatRobotGroupApiResponse<WechatRobotGroupServicePeriodChange>>;
export const getWechatRobotGroupAIChatConfig=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/aiChatConfig',method:'get',params:{groupId}}) as unknown as Promise<WechatRobotGroupApiResponse<WechatRobotGroupAIChatConfig>>;
export const saveWechatRobotGroupAIChatConfig=(data:WechatRobotGroupAIChatConfigSave)=>request({url:'/api/v1/system/wechatRobotGroup/aiChatConfigSave',method:'put',data}) as unknown as Promise<WechatRobotGroupApiResponse<WechatRobotGroupAIChatConfig>>;
export const getWechatRobotGroupQueueRules=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/queueRules',method:'get',params:{groupId}});
export const saveWechatRobotGroupQueueRules=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/queueRulesSave',method:'put',data});
export const getWechatRobotGroupSpecialTopList=(groupId:number,status:string)=>request({url:'/api/v1/system/wechatRobotGroup/specialTopList',method:'get',params:{groupId,status}});
export const grantWechatRobotGroupSpecialTop=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/specialTopGrant',method:'post',data});
export const cancelWechatRobotGroupSpecialTop=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/specialTopCancel',method:'delete',data});
export const getWechatRobotGroupScheduleTiming=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/scheduleTiming',method:'get',params:{groupId}});
export const saveWechatRobotGroupScheduleTiming=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/scheduleTimingSave',method:'put',data});
export const saveWechatRobotGroupTaskReminderMinutes=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/taskReminderMinutesSave',method:'put',data});
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
export const getWechatRobotGroupStatisticsConfig=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/statisticsConfig',method:'get',params:{groupId}});
export const saveWechatRobotGroupStatisticsConfig=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/statisticsConfigSave',method:'put',data});
export const getWechatRobotGroupStatisticsConfigAudit=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/statisticsConfigAudit',method:'get',params:{groupId}});
export const getWechatRobotGroupTemplateCommands=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/templateCommands',method:'get',params:{groupId}});
export const saveWechatRobotGroupTemplateCommand=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/templateCommandSave',method:'put',data});
export const resetWechatRobotGroupTemplateCommand=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/templateCommandReset',method:'delete',data});
export const getWechatRobotGroupTemplateCommandAudit=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/templateCommandAudit',method:'get',params:{groupId}});
export const getWechatRobotGroupPermissionAdmins=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/permissionAdmins',method:'get',params:{groupId}});
export const saveWechatRobotGroupPermanentAdmin=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/permanentAdminSave',method:'post',data});
export const deleteWechatRobotGroupPermanentAdmin=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/permanentAdminDelete',method:'delete',data});
export const getWechatRobotGroupReminderConfig=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/reminderConfig',method:'get',params:{groupId}});
export const saveWechatRobotGroupReminderConfig=(data:object)=>request({url:'/api/v1/system/wechatRobotGroup/reminderConfigSave',method:'put',data});
export const getWechatRobotGroupPermissionReminderAudit=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/permissionReminderAudit',method:'get',params:{groupId}});
export const getAnchorCustomCommandConfig=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/anchorCustomCommand/config',method:'get',params:{groupId}}) as unknown as Promise<WechatRobotGroupApiResponse<AnchorCustomCommandConfig>>;
export const saveAnchorCustomCommandConfig=(data:AnchorCustomCommandConfig)=>request({url:'/api/v1/system/wechatRobotGroup/anchorCustomCommand/configSave',method:'put',data});
export const getAnchorCustomCommandList=(groupId:number)=>request({url:'/api/v1/system/wechatRobotGroup/anchorCustomCommand/list',method:'get',params:{groupId}}) as unknown as Promise<WechatRobotGroupApiResponse<{list:AnchorCustomCommandItem[]}>>;
export const deleteAnchorCustomCommand=(data:{groupId:number;bindingId:number})=>request({url:'/api/v1/system/wechatRobotGroup/anchorCustomCommand/delete',method:'delete',data});
export const getAnchorCustomCommandPreview=(groupId:number,bindingId:number)=>request({url:'/api/v1/system/wechatRobotGroup/anchorCustomCommand/preview',method:'get',params:{groupId,bindingId}}) as unknown as Promise<WechatRobotGroupApiResponse<{previewUrl:string}>>;
