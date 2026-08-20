import request from '/@/utils/request';

export const getWechatMessageTemplateList = (params: object) => request({ url: '/api/v1/system/wechatMessageTemplate/list', method: 'get', params });
export const getWechatMessageTemplateGroupDetail = (id: number) => request({ url: '/api/v1/system/wechatMessageTemplate/groupDetail', method: 'get', params: { id } });
export const addWechatGroupMessageTemplateGroup = (data: object) => request({ url: '/api/v1/system/wechatMessageTemplate/groupAdd', method: 'post', data });
export const editWechatMessageTemplateGroup = (data: object) => request({ url: '/api/v1/system/wechatMessageTemplate/groupEdit', method: 'put', data });
export const changeWechatMessageTemplateGroupStatus = (data: object) => request({ url: '/api/v1/system/wechatMessageTemplate/groupStatus', method: 'put', data });
export const deleteWechatGroupMessageTemplateGroup = (id: number) => request({ url: '/api/v1/system/wechatMessageTemplate/groupDelete', method: 'delete', data: { id } });
export const resetWechatPublicMessageTemplateGroup = (id: number) => request({ url: '/api/v1/system/wechatMessageTemplate/groupReset', method: 'put', data: { id } });
export const getWechatMessageTemplateDetail = (id: number) => request({ url: '/api/v1/system/wechatMessageTemplate/detail', method: 'get', params: { id } });
export const addWechatGroupMessageTemplate = (data: object) => request({ url: '/api/v1/system/wechatMessageTemplate/addGroup', method: 'post', data });
export const editWechatMessageTemplate = (data: object) => request({ url: '/api/v1/system/wechatMessageTemplate/edit', method: 'put', data });
export const changeWechatMessageTemplateStatus = (data: object) => request({ url: '/api/v1/system/wechatMessageTemplate/status', method: 'put', data });
export const deleteWechatGroupMessageTemplate = (id: number) => request({ url: '/api/v1/system/wechatMessageTemplate/deleteGroup', method: 'delete', data: { id } });
export const resetWechatPublicMessageTemplate = (id: number) => request({ url: '/api/v1/system/wechatMessageTemplate/resetPublic', method: 'put', data: { id } });
export const previewWechatMessageTemplate = (data: object) => request({ url: '/api/v1/system/wechatMessageTemplate/preview', method: 'post', data });
export const getWechatMessageTemplateOptions = () => request({ url: '/api/v1/system/wechatMessageTemplate/options', method: 'get' });
