import request from '/@/utils/request';

export const getWechatMonitorOverview = () => request({ url: '/api/v1/system/wechatMonitor/overview', method: 'get' });

export const saveWechatMonitorConfig = (data: object) => request({ url: '/api/v1/system/wechatMonitor/config', method: 'put', data });

export const testWechatMonitorAlert = () => request({ url: '/api/v1/system/wechatMonitor/testAlert', method: 'post' });

export const getWechatMonitorEvents = (params: object) => request({ url: '/api/v1/system/wechatMonitor/eventList', method: 'get', params });

export const checkWechatMonitorsNow = () => request({ url: '/api/v1/system/wechatMonitor/checkNow', method: 'post' });
