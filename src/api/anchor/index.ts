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
