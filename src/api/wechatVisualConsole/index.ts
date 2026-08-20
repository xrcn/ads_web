import request from '/@/utils/request';

export function getWechatVisualConsoleAccounts() {
	return request({
		url: '/api/v1/system/wechatVisualConsole/accounts',
		method: 'get',
	});
}

export function proxyWechatVisualConsole(data: object) {
	return request({
		url: '/api/v1/system/wechatVisualConsole/proxy',
		method: 'post',
		data,
	});
}

export function syncWechatVisualConsoleAccount(data: object) {
	return request({
		url: '/api/v1/system/wechatVisualConsole/syncAccount',
		method: 'put',
		data,
	});
}
