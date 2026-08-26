import request from '/@/utils/request';

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

export const getAnchorPlatformOptions = () => request({ url: '/api/v1/system/anchor/platformOptions', method: 'get' });
export const getAnchorProfileDetail = (profileId: number) => request({ url: '/api/v1/system/anchor/profile/detail', method: 'get', params: { profileId } });
export const editAnchorProfile = (data: object) => request({ url: '/api/v1/system/anchor/profile/edit', method: 'put', data });
export const saveAnchorBinding = (data: object) => request({ url: '/api/v1/system/anchor/binding/save', method: 'post', data });
export const deleteAnchorBinding = (anchorRecordId: number) => request({ url: '/api/v1/system/anchor/binding/delete', method: 'delete', data: { anchorRecordId } });
export const previewAnchorBatch = (data: object) => request({ url: '/api/v1/system/anchor/profile/batchPreview', method: 'post', data });
export const deleteAnchorProfiles = (data: object) => request({ url: '/api/v1/system/anchor/profile/batchDelete', method: 'post', data });
export const ignoreAnchorProfiles = (data: object) => request({ url: '/api/v1/system/anchor/profile/batchIgnore', method: 'post', data });
export const cancelIgnoreAnchorProfiles = (data: object) => request({ url: '/api/v1/system/anchor/profile/batchCancelIgnore', method: 'post', data });

export function getAnchorBankCardList(anchorInfoId: number) {
	return request({
		url: '/api/v1/system/anchor/bankCard/list',
		method: 'get',
		params: { anchorInfoId },
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
