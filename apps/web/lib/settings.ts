export type Envelope<T>={data:T;meta:Record<string,unknown>;requestId:string};
export type Profile={id:string;name:string;email:string;status:string;createdAt:string;updatedAt:string};
export type NotificationPreferences={teamEnabled:boolean;officeEnabled:boolean;systemEnabled:boolean;caseUpdatesEnabled:boolean;updatedAt:string};
export type OrganizationDetail={id:string;name:string;slug:string;status:"ACTIVE"|"SUSPENDED"|"ARCHIVED";statusReason:string|null;suspendedAt:string|null;archivedAt:string|null;updatedAt:string;memberships:{user:{id:string;name:string;email:string}}[]};
export type AdminOrganization={id:string;name:string;slug:string;status:"ACTIVE"|"SUSPENDED"|"ARCHIVED";status_reason?:string|null;created_at:string;updated_at:string;active_memberships?:number;total_count?:number};
export type AdminUser={id:string;name:string;email:string;status:string;membership_count?:number;created_at?:string;memberships?:{organizationId:string;role:string;status:string}[];total_count?:number};
export const maskEmail=(email:string)=>{const[local,domain]=email.split("@");if(!local||!domain)return"—";return`${local.slice(0,2)}***@${domain}`};