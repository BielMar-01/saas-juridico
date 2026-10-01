export type EmailSyncState="success"|"conflict"|"pending"|"error";
export function emailSyncState(status:number):EmailSyncState{if(status>=200&&status<300)return"success";if(status===409)return"conflict";if(status===403)return"pending";return"error"}
