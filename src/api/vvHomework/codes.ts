import request from '/@/utils/request';

export interface CodeRecord {
 id: number;
 batchId: number;
 kind: string;
 days: number;
 tail: string;
 code?: string;
 status: string;
 account?: string;
 nickname?: string;
 copiedAt?: string;
 issuedAt?: string;
 issuedBy?: number;
 issueNote?: string;
 userDeleted?: boolean;
 createdAt: string;
 deadline: string | null;
 usedAt: string | null;
 expiresAt: string | null;
}

export interface CodeBatch { id: number; codes: string[]; codeIds: number[] }
export interface CodeBatchInput { requestId: string; kind: string; count: number; deadline: string | null }

function codes<T>(path: string, method: 'get' | 'post' | 'put', signal: AbortSignal, data?: object, params?: object) {
 return request({ url: '/api/v1/system/vvHomework/codes/' + path, method, signal, data, params, __skipGlobalErrorMessage: true } as any) as unknown as Promise<{data: T}>;
}

export const listCodes = (params: object, signal: AbortSignal) => codes<{list: CodeRecord[]; total: number}>('list','get',signal,undefined,params);
export const loadCodeConfig = (signal: AbortSignal) => codes<{days: number}>('config','get',signal);
export const saveCodeConfig = (days: number, signal: AbortSignal) => codes<void>('config','put',signal,{days});
export const generateCodes = (input: CodeBatchInput, signal: AbortSignal) => codes<CodeBatch>('generate','post',signal,input);
export const copyCodeBatch = (id: number, signal: AbortSignal) => codes<CodeBatch>('copy','post',signal,{id});
export const revokeCode = (id: number, signal: AbortSignal) => codes<void>('revoke','post',signal,{id});
export const recordCodeDispatch = (ids: number[], action: 'COPIED' | 'SENT', signal: AbortSignal, note = '') =>
 codes<void>('dispatch','post',signal,{ids,action,note});
