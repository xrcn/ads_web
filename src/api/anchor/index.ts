import request from '/@/utils/request';

export interface AnchorVVSyncAccepted {
	batchId: number;
}

export function getAnchorList(params: object) {
	return request({
		url: '/api/v1/system/anchor/list',
		method: 'get',
		params,
	});
}

export function getAnchorDetail(id: number) {
	return request({
		url: '/api/v1/system/anchor/detail',
		method: 'get',
		params: { id },
	});
}

export function addAnchor(data: object) {
	return request({
		url: '/api/v1/system/anchor/add',
		method: 'post',
		data,
	});
}

export function editAnchor(data: object) {
	return request({
		url: '/api/v1/system/anchor/edit',
		method: 'put',
		data,
	});
}

export function changeAnchorStatus(data: object) {
	return request({
		url: '/api/v1/system/anchor/status',
		method: 'put',
		data,
	});
}

export function getAnchorHallOptions() {
	return request({
		url: '/api/v1/system/anchor/hallOptions',
		method: 'get',
	});
}

export const getAnchorHallList = (params: object) => request({ url: '/api/v1/system/anchor/hall/list', method: 'get', params });
export const getAnchorHallDetail = (hallId: number) => request({ url: '/api/v1/system/anchor/hall/detail', method: 'get', params: { hallId } });
export const addAnchorHall = (data: object) => request({ url: '/api/v1/system/anchor/hall/add', method: 'post', data });
export const editAnchorHall = (data: object) => request({ url: '/api/v1/system/anchor/hall/edit', method: 'put', data });
export const syncVVHallScores = () => request({ url: '/api/v1/system/anchor/hall/vvScoreSync', method: 'post', timeout: 180000 });
export const syncVVAnchors = () => request({ url: '/api/v1/system/anchor/vvSync', method: 'post' }) as unknown as Promise<{ data: AnchorVVSyncAccepted }>;
export const getVVAnchorSyncSummary = () => request({ url: '/api/v1/system/anchor/vvSyncSummary', method: 'get' });

export type VVAuditDecision = 'APPROVE' | 'REJECT';
export interface VVAnchorAuditSummary { waitCount: number; passCount: number; refuseCount: number }
export interface VVAnchorAuditListItem { id: number; recordKey: string; userId: string; nickname: string; avatar: string; hallId: string; hallName: string; charmLevel: number; liveLevel: number; anchorType: number; applyTime: string; updaterName: string; status: number; sex: number; age: number }
export interface VVAnchorAuditDetail { userId: string; nickname: string; avatar: string; realName: string; idCardNo: string; phone: string; qq: string; sex: number; age: number }
export interface VVHallAuditListItem { id: number; userId: string; nickname: string; oldHallId: string; oldHallName: string; newHallId: string; newHallName: string; applyTime: string; status: number }
export const getVVAnchorAuditList = (params: object) => request({ url: '/api/v1/system/anchor/vvAudit/anchor/list', method: 'get', params, __skipGlobalErrorMessage: true } as any);
export const getVVAnchorAuditDetail = (targetUserId: string) => request({ url: '/api/v1/system/anchor/vvAudit/anchor/detail', method: 'get', params: { targetUserId } });
export const decideVVAnchorAudit = (data: { targetUserId: string; decision: VVAuditDecision }) => request({ url: '/api/v1/system/anchor/vvAudit/anchor/decision', method: 'post', data });
export const getVVHallAuditList = (params: object) => request({ url: '/api/v1/system/anchor/vvAudit/hall/list', method: 'get', params, __skipGlobalErrorMessage: true } as any);
export const decideVVHallAudit = (data: { auditId: number; targetUserId: string; decision: VVAuditDecision }) => request({ url: '/api/v1/system/anchor/vvAudit/hall/decision', method: 'post', data });

export const getAnchorPlatformOptions = () => request({ url: '/api/v1/system/anchor/platformOptions', method: 'get' });
export const getAnchorProfileDetail = (profileId: number) => request({ url: '/api/v1/system/anchor/profile/detail', method: 'get', params: { profileId } });
export const editAnchorProfile = (data: object) => request({ url: '/api/v1/system/anchor/profile/edit', method: 'put', data });
export const saveAnchorBinding = (data: object) => request({ url: '/api/v1/system/anchor/binding/save', method: 'post', data });
export const deleteAnchorBinding = (anchorRecordId: number) => request({ url: '/api/v1/system/anchor/binding/delete', method: 'delete', data: { anchorRecordId } });
export const previewAnchorBatch = (data: object) => request({ url: '/api/v1/system/anchor/profile/batchPreview', method: 'post', data });
export const deleteAnchorProfiles = (data: object) => request({ url: '/api/v1/system/anchor/profile/batchDelete', method: 'post', data });
export const ignoreAnchorProfiles = (data: object) => request({ url: '/api/v1/system/anchor/profile/batchIgnore', method: 'post', data });
export const cancelIgnoreAnchorProfiles = (data: object) => request({ url: '/api/v1/system/anchor/profile/batchCancelIgnore', method: 'post', data });
export const deleteLegacyAnchor = (id: number) => request({ url: '/api/v1/system/anchor/delete', method: 'delete', data: { id } });

export type AnchorBankCardOwner = { profileId: number; anchorInfoId: number };

export function getAnchorBankCardList(params: AnchorBankCardOwner) {
	return request({
		url: '/api/v1/system/anchor/bankCard/list',
		method: 'get',
		params,
	});
}

export function getAnchorBankCardDetail(id: number) {
	return request({
		url: '/api/v1/system/anchor/bankCard/detail',
		method: 'get',
		params: { id },
	});
}

export function addAnchorBankCard(data: object) {
	return request({
		url: '/api/v1/system/anchor/bankCard/add',
		method: 'post',
		data,
	});
}

export function editAnchorBankCard(data: object) {
	return request({
		url: '/api/v1/system/anchor/bankCard/edit',
		method: 'put',
		data,
	});
}

export function setAnchorBankCardDefault(id: number) {
	return request({
		url: '/api/v1/system/anchor/bankCard/default',
		method: 'put',
		data: { id },
	});
}

export function changeAnchorBankCardStatus(data: object) {
	return request({
		url: '/api/v1/system/anchor/bankCard/status',
		method: 'put',
		data,
	});
}
