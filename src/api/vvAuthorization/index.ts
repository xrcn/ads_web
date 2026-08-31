import request from '/@/utils/request';

export interface AuthorizedAccountSave {
	id?: number;
	username: string;
	password?: string;
	displayName: string;
	status: 0 | 1;
	remark: string;
}

export interface AuthorizedAccountQuery {
	username: string;
	status: '' | 0 | 1;
	pageNum: number;
	pageSize: number;
}

export interface AuthorizedAccount {
	id: number;
	username: string;
	displayName: string;
	status: 0 | 1;
	remark: string;
	lastLoginAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface VVLoginHistoryQuery {
	username: string;
	vvAccount: string;
	startDate: string;
	endDate: string;
	pageNum: number;
	pageSize: number;
}

export interface VVLoginHistory {
	id: number;
	reportId: string;
	authorizedAccountId: number;
	username: string;
	displayName: string;
	vvAccount: string;
	clientVersion: string;
	loggedInAt: string;
	createdAt: string;
}

export interface PageResponse<T> {
	list: T[];
	total: number;
	currentPage: number;
}

export interface ApiResponse<T> {
	code: number;
	message: string;
	data: T;
}

export const listAuthorizedAccounts = (params: AuthorizedAccountQuery) =>
	request({ url: '/api/v1/system/vvRobotAuthorizedAccount/list', method: 'get', params }) as unknown as Promise<ApiResponse<PageResponse<AuthorizedAccount>>>;

export const addAuthorizedAccount = (data: AuthorizedAccountSave) =>
	request({ url: '/api/v1/system/vvRobotAuthorizedAccount/add', method: 'post', data }) as unknown as Promise<ApiResponse<null>>;

export const editAuthorizedAccount = (data: AuthorizedAccountSave) =>
	request({ url: '/api/v1/system/vvRobotAuthorizedAccount/edit', method: 'put', data }) as unknown as Promise<ApiResponse<null>>;

export const changeAuthorizedAccountStatus = (id: number, status: 0 | 1) =>
	request({ url: '/api/v1/system/vvRobotAuthorizedAccount/status', method: 'put', data: { id, status } }) as unknown as Promise<ApiResponse<null>>;

export const listVVLoginHistory = (params: VVLoginHistoryQuery) =>
	request({ url: '/api/v1/system/vvRobotAuthorizedAccount/history', method: 'get', params }) as unknown as Promise<ApiResponse<PageResponse<VVLoginHistory>>>;
