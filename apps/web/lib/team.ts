import type{Role}from"./auth/types";
export type TeamRole=Role;
export type MembershipStatus="INVITED"|"ACTIVE"|"SUSPENDED"|"REVOKED";
export type Member={id:string;role:TeamRole;status:MembershipStatus;invitedAt:string|null;acceptedAt:string|null;createdAt:string;updatedAt:string;user:{id:string;name:string;email:string;status:string}};
export type Invitation={id:string;email:string;role:Exclude<TeamRole,"OWNER">;status:"PENDING"|"ACCEPTED"|"CANCELLED"|"EXPIRED";expiresAt:string;sentAt:string|null;lastSentAt:string|null;acceptedAt?:string|null;cancelledAt?:string|null;createdAt:string};
export type Envelope<T>={data:T;meta:Record<string,unknown>;requestId:string};
export const teamRoles:TeamRole[]=["OWNER","ADMIN","LAWYER","ASSISTANT","FINANCIAL","VIEWER"];
export const memberStatuses:MembershipStatus[]=["ACTIVE","SUSPENDED","REVOKED"];
export const roleLabel:Record<TeamRole,string>={OWNER:"Proprietário",ADMIN:"Administrador",LAWYER:"Advogado",ASSISTANT:"Assistente",FINANCIAL:"Financeiro",VIEWER:"Leitor"};
export const statusLabel:Record<MembershipStatus,string>={INVITED:"Convidado",ACTIVE:"Ativo",SUSPENDED:"Suspenso",REVOKED:"Revogado"};
export function canAccessTeam(role:TeamRole){return role==="OWNER"||role==="ADMIN"||role==="LAWYER"}
export function canManageTeam(role:TeamRole){return role==="OWNER"||role==="ADMIN"}
export function manageableRoles(role:TeamRole):Exclude<TeamRole,"OWNER">[]{return role==="OWNER"?["ADMIN","LAWYER","ASSISTANT","FINANCIAL","VIEWER"]:role==="ADMIN"?["LAWYER","ASSISTANT"]:[]}
export function canManageMember(actor:TeamRole,target:TeamRole){return actor==="OWNER"?target!=="OWNER":actor==="ADMIN"?(target==="LAWYER"||target==="ASSISTANT"):false}