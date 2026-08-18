import request from '/@/utils/request';

export function getAnchorMicList(params: object) {
	return request({
		url: '/api/v1/system/anchorMic/list',
		method: 'get',
		params,
	});
}

export function getAnchorMicSummary(params: object) {
	return request({
		url: '/api/v1/system/anchorMic/summary',
		method: 'get',
		params,
	});
}

export function getAnchorMicDetail(id: number) {
	return request({
		url: '/api/v1/system/anchorMic/detail',
		method: 'get',
		params: { id },
	});
}

export function getAnchorMicAnchorOptions() {
	return request({
		url: '/api/v1/system/anchorMic/anchorOptions',
		method: 'get',
	});
}

export function addAnchorMic(data: object) {
	return request({
		url: '/api/v1/system/anchorMic/add',
		method: 'post',
		data,
	});
}

export function editAnchorMic(data: object) {
	return request({
		url: '/api/v1/system/anchorMic/edit',
		method: 'put',
		data,
	});
}
