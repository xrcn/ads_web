import request from '/@/utils/request';
export interface VVCustomer { id:number; customerNo:string; customerName:string; account:string; status:0|1; authStatus:'UNCONFIGURED'|'MISSING'|'VALID'|'EXPIRED'|'UNKNOWN'|'CONFLICT'; checkedAt:string; message:string; groupCount:number; hasPassword:boolean; hasVVAccount:boolean; isDefault:boolean; version:number; operatorWxids:string[]; }
export type VVCustomerOption=Pick<VVCustomer,'id'|'customerNo'|'customerName'|'status'|'hasVVAccount'|'isDefault'>;
export type VVCustomerSave=Pick<VVCustomer,'id'|'customerName'|'account'|'status'|'version'|'operatorWxids'>&{password:string};
export const getVVCustomers=(params:{keyword:string;status:number|'';pageNum:number;pageSize:number})=>request({url:'/api/v1/system/vvAuth/customers',method:'get',params:{...params}});
export const saveVVCustomer=(data:VVCustomerSave)=>request({url:'/api/v1/system/vvAuth/customer',method:'post',data});
export const setVVCustomerStatus=(data:{id:number;status:0|1;version:number})=>request({url:'/api/v1/system/vvAuth/customerStatus',method:'put',data});
export const setDefaultVVCustomer=(data:{id:number;version:number})=>request({url:'/api/v1/system/vvAuth/customerDefault',method:'put',data});
export const getVVCustomerOptions=()=>request({url:'/api/v1/system/vvAuth/customerOptions',method:'get'});
export const getVVCustomerCaptcha=(customerId:number)=>request({url:'/api/v1/system/vvAuth/captcha',method:'get',params:{customerId}});
export const loginVVCustomer=(data:{customerId:number;sessionId:string;verifyCode:string})=>request({url:'/api/v1/system/vvAuth/login',method:'post',data});
export const getVVCustomerStatus=(customerId:number)=>request({url:'/api/v1/system/vvAuth/status',method:'get',params:{customerId}});
