import request from '/@/utils/request';

export interface QueueNoticeConfig {
	groupId: number;
	content: string;
	source: string;
	compatible: boolean;
	reason: string;
	maxLength: number;
}

type Response<T> = { data: T };
const base = '/api/v1/system/wechatRobotGroup';

export const getQueueNotice = (groupId: number) =>
	request({ url: `${base}/queueNotice`, method: 'get', params: { groupId } }) as unknown as Promise<Response<QueueNoticeConfig>>;
export const previewQueueNotice = (groupId: number, content: string) =>
	request({ url: `${base}/queueNoticePreview`, method: 'post', data: { groupId, content } }) as unknown as Promise<Response<{ content: string }>>;
export const saveQueueNotice = (groupId: number, content: string, reset = false) =>
	request({ url: `${base}/queueNoticeSave`, method: 'put', data: { groupId, content, reset } });
