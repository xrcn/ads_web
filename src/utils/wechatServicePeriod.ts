export interface WechatServicePeriodSummary {
	serviceStatus?: 'UNSET' | 'ACTIVE' | 'EXPIRED' | string;
	serviceStartedAt?: string;
	serviceExpiresAt?: string;
	serviceRemainingSeconds?: number;
}

const remainingDuration = (seconds = 0) => {
	const value = Math.max(0, Math.floor(seconds));
	if (value < 60) return '不足1分钟';
	const days = Math.floor(value / 86400);
	const hours = Math.floor((value % 86400) / 3600);
	const minutes = Math.floor((value % 3600) / 60);
	return `${days}天 ${hours}小时 ${minutes}分钟`;
};

export const servicePeriodValue = (summary?: WechatServicePeriodSummary) => {
	if (summary?.serviceStatus === 'ACTIVE') return remainingDuration(summary.serviceRemainingSeconds);
	if (summary?.serviceStatus === 'EXPIRED') return '已到期';
	return '未设置';
};

export const servicePeriodText = (summary?: WechatServicePeriodSummary) =>
	summary?.serviceStatus === 'ACTIVE' ? `剩余 ${servicePeriodValue(summary)}` : servicePeriodValue(summary);

export const servicePeriodTagType = (summary?: WechatServicePeriodSummary) => {
	if (summary?.serviceStatus === 'ACTIVE') return 'success';
	if (summary?.serviceStatus === 'EXPIRED') return 'danger';
	return 'info';
};

export const servicePeriodTooltip = (summary?: WechatServicePeriodSummary) =>
	`开始：${summary?.serviceStartedAt || '未设置'}；结束：${summary?.serviceExpiresAt || '未设置'}`;
