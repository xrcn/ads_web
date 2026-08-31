import request from '/@/utils/request';

export interface FlowDataConfig {
	account: string;
	password: string;
	vvToken: string;
}

export interface FlowDataLoginInput {
	sessionId: string;
	account: string;
	password: string;
	verifyCode: string;
}

export interface FlowDataPageQuery {
	pageNum: number;
	pageSize: number;
	hallId?: number | string;
	anchorId?: string;
	anchorName?: string;
	startDate?: string;
	endDate?: string;
}

export type VVSyncType = 'HALL_DATA' | 'HALL_SCORE' | 'ANCHOR_INCOME' | 'ANCHOR_ACTIVITY' | 'ANCHOR_LIST';

export interface VVSyncProgress {
	batchId: number;
	syncType: VVSyncType;
	status: '' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
	stage: '' | 'PREPARING' | 'FETCHING' | 'VALIDATING' | 'WRITING' | 'COMPLETED' | 'FAILED';
	current: number;
	total: number;
	message: string;
	errorMessage: string;
	startedAt: string;
	finishedAt: string;
}

export interface FlowDataHomeWindow {
	hasData: boolean;
	startDate: string;
	endDate: string;
	dayCount: number;
	availableStartDate: string;
	availableEndDate: string;
}

export interface FlowDataHomeMetrics {
	totalFlow: string;
	averageDailyFlow: string;
	revenueAnchorCount: number;
	activeAnchorRate: string;
	averageDailyActiveAnchorCount: string;
}

export interface FlowDataHomeFlowPoint { statDate: string; totalFlow: string; }
export interface FlowDataHomeHallFlowItem { hallId: number; hallName: string; totalFlow: string; }
export interface FlowDataHomeActivePoint { statDate: string; activeAnchorCount: number; activeAnchorRate: string; }
export interface FlowDataHomeAnchorFlowItem { anchorId: string; anchorName: string; hallId: number; hallName: string; totalFlow: string; }
export interface FlowDataHomeAnchorActivityItem { anchorId: string; anchorName: string; hallId: number; hallName: string; activeDayCount: number; activityRate: string; sayHiNum: number; }

export interface FlowDataHomeOverview {
	window: FlowDataHomeWindow;
	metrics: FlowDataHomeMetrics;
	flowTrend: FlowDataHomeFlowPoint[];
	hallFlowTop: FlowDataHomeHallFlowItem[];
	activeAnchorTrend: FlowDataHomeActivePoint[];
	anchorFlowTop: FlowDataHomeAnchorFlowItem[];
	anchorActivityTop: FlowDataHomeAnchorActivityItem[];
}

export interface FlowDataHomeOverviewQuery { startDate?: string; endDate?: string; }
export type FlowDataHomeRankingType = 'HALL_FLOW' | 'ANCHOR_FLOW' | 'ANCHOR_ACTIVITY';

export interface FlowDataHomeRankingItem {
	rank: number;
	hallId: number;
	hallName: string;
	anchorId: string;
	anchorName: string;
	totalFlow: string;
	activeDayCount: number;
	activityRate: string;
	sayHiNum: number;
}

export interface FlowDataHomeRanking {
	rankingType: FlowDataHomeRankingType;
	startDate: string;
	endDate: string;
	pageNum: number;
	pageSize: number;
	total: number;
	list: FlowDataHomeRankingItem[];
}

export interface FlowDataHomeRankingQuery {
	rankingType: FlowDataHomeRankingType;
	startDate: string;
	endDate: string;
	pageNum: number;
}

export const syncFlowData = () => request({ url: '/api/v1/system/flowData/sync', method: 'post', timeout: 180000 });
export const getFlowDataSummary = () => request({ url: '/api/v1/system/flowData/summary', method: 'get' });
export const getVVSyncProgress = (syncType: VVSyncType) => request({ url: '/api/v1/system/flowData/progress', method: 'get', params: { syncType } });
export const getFlowDataDaily = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/daily', method: 'get', params });
export const getFlowDataTasks = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/tasks', method: 'get', params });
export const getFlowDataHealth = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/health', method: 'get', params });
export const getFlowDataScoreLogs = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/scoreLogs', method: 'get', params });
export const getVVAuthConfig = () => request({ url: '/api/v1/system/vvAuth/config', method: 'get' });
export const saveVVAuthConfig = (data: FlowDataConfig) => request({ url: '/api/v1/system/vvAuth/config', method: 'put', data });
export const getVVAuthCaptcha = () => request({ url: '/api/v1/system/vvAuth/captcha', method: 'get' });
export const loginVVAuth = (data: FlowDataLoginInput) => request({ url: '/api/v1/system/vvAuth/login', method: 'post', data });
export const getVVAuthStatus = () => request({ url: '/api/v1/system/vvAuth/status', method: 'get' });
export const syncAnchorIncome = () => request({ url: '/api/v1/system/flowData/anchorIncome/sync', method: 'post', timeout: 180000 });
export const getAnchorIncomeSummary = () => request({ url: '/api/v1/system/flowData/anchorIncome/summary', method: 'get' });
export const getAnchorIncomeList = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/anchorIncome/list', method: 'get', params });
export const syncAnchorActivity = () => request({ url: '/api/v1/system/flowData/anchorActivity/sync', method: 'post', timeout: 180000 });
export const getAnchorActivitySummary = () => request({ url: '/api/v1/system/flowData/anchorActivity/summary', method: 'get' });
export const getAnchorActivityList = (params: FlowDataPageQuery) => request({ url: '/api/v1/system/flowData/anchorActivity/list', method: 'get', params });
export const getAnchorActivityProgress = () => request({ url: '/api/v1/system/flowData/anchorActivity/progress', method: 'get' });
export const getAnchorActivityHallOptions = () => request({ url: '/api/v1/system/flowData/anchorActivity/hallOptions', method: 'get' });
export const getFlowDataHomeOverview = (params: FlowDataHomeOverviewQuery = {}) => request({ url: '/api/v1/system/flowData/homeOverview', method: 'get', params, __skipGlobalErrorMessage: true } as any);
export const getFlowDataHomeRanking = (params: FlowDataHomeRankingQuery) => request({ url: '/api/v1/system/flowData/homeRanking', method: 'get', params, __skipGlobalErrorMessage: true } as any);
