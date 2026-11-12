import request from '/@/utils/request';

export interface HomeworkConfig { allowRegistration: boolean; autoGrant: boolean; durationHours: number; dailyLimit: number; revision: number; description: string }
export interface Usage { day: string; confirmed: number; reserved: number; remaining: number }
export interface HomeworkUser {
	id: number; registrationId: string; sex: number | null; vvAccount: string; nickname: string; avatarUrl: string; virtualRoleSex: number | null; profileSource: string;
	status: number; expiresAt: string | null; dailyLimit: number; revision: number; remark: string; hasPassword: boolean;
	softwareOnline: boolean; vvReady: boolean; createdAt: string; lastLoginAt: string; lastActiveAt: string | null; offlineAt: string | null; offlineReason: string;
	clientVersion: string; buildId: string; ip: string; totalSuccess: number; usage: Usage; authorization: { status: string; allowed: boolean };
}
export interface Pending { recordId: string; workDay: string; state: string; kind: string; at: string }
export interface Audit { id: number; actorId: number; event: string; detail: string; at: string }
interface Response<T> { code: number; message: string; data: T }
export interface UserQuery { keyword: string; status: string; online: string; authorization: string; pageNum: number; pageSize: number }
const prefix = '/api/v1/system/vvHomework';
const get = <T>(path: string, params: object, signal?: AbortSignal) => request({ url: prefix + path, method: 'get', params, signal, __skipGlobalErrorMessage: true } as any) as unknown as Promise<Response<T>>;
const write = <T>(path: string, method: 'put' | 'post', data: object, signal?: AbortSignal) => request({ url: prefix + path, method, data, signal, __skipGlobalErrorMessage: true } as any) as unknown as Promise<Response<T>>;
export const getHomeworkConfig = (signal?: AbortSignal) => get<HomeworkConfig>('/config', {}, signal);
export const saveHomeworkConfig = (data: HomeworkConfig, signal?: AbortSignal) => write('/config', 'put', data, signal);
export const listHomeworkUsers = (params: UserQuery, signal?: AbortSignal) => get<{ list: HomeworkUser[]; total: number }>('/user/list', params, signal);
export const getHomeworkUser = (id: number, signal?: AbortSignal) => get<HomeworkUser>('/user/detail', { id }, signal);
export const getHomeworkAudit = (id: number, pageNum: number, signal?: AbortSignal) => get<{ list: Audit[]; total: number; pending: Pending[] }>('/user/audit', { id, pageNum, pageSize: 20 }, signal);
export const saveHomeworkAuthorization = (data: Pick<HomeworkUser, 'registrationId' | 'id' | 'revision' | 'status' | 'expiresAt' | 'dailyLimit' | 'remark'>, signal?: AbortSignal) => write('/user/authorization', 'put', data, signal);
export const setHomeworkStatus = (u: HomeworkUser, signal?: AbortSignal) => write('/user/status', 'put', { registrationId: u.registrationId, id: u.id, revision: u.revision, status: u.status ? 0 : 1 }, signal);
export const logoutHomeworkUser = (u: HomeworkUser, signal?: AbortSignal) => write('/user/logout', 'post', { registrationId: u.registrationId, id: u.id, revision: u.revision }, signal);
export const viewHomeworkPassword = (id: number, signal?: AbortSignal, registrationId?: string) => write<{ password: string }>('/user/password', 'post', { id,registrationId }, signal);
export const resolveHomeworkAttempt = (data: { registrationId: string; id: number; recordId: string; status: string; messageId: string; reason: string }, signal?: AbortSignal) => write('/attempt/resolve', 'post', data, signal);

export function beijingTime(value: string | null): string { return value ? new Date(value).toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false }) : '—'; }
export const authorizationNames: Record<string, string> = { PENDING: '待授权', VALID: '有效', EXPIRED: '已到期', DISABLED: '已停用' };

export function homeworkError(error: unknown): string { const value = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message; return typeof value === 'string' ? value : '请求未完成，请检查连接后重试。'; }

export const deleteHomeworkUser = (data: { registrationId: string; id: number; revision: number; confirmationAccount: string }, signal?: AbortSignal) => write('/user/delete', 'post', data, signal);
