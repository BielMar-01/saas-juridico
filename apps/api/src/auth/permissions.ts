import { AppError } from "../errors/app-error.js";
export const roles=["OWNER","ADMIN","LAWYER","ASSISTANT","FINANCIAL","VIEWER"] as const; export type Role=typeof roles[number];
export type Permission="clients.read"|"clients.create"|"clients.update"|"clients.status"|"organization.manage"|"team.read"|"team.update"|"invitations.read"|"invitations.manage";
const matrix:Record<Permission,readonly Role[]>={"clients.read":roles,"clients.create":["OWNER","ADMIN","LAWYER","ASSISTANT"],"clients.update":["OWNER","ADMIN","LAWYER","ASSISTANT"],"clients.status":["OWNER","ADMIN","LAWYER","ASSISTANT"],"organization.manage":["OWNER","ADMIN"],"team.read":["OWNER","ADMIN","LAWYER"],"team.update":["OWNER","ADMIN"],"invitations.read":["OWNER","ADMIN"],"invitations.manage":["OWNER","ADMIN"]};
export function hasPermission(role:Role,permission:Permission){return matrix[permission].includes(role);}
export function requirePermission(role:Role,permission:Permission,aal:"aal1"|"aal2"){if(!hasPermission(role,permission))throw new AppError("FORBIDDEN","Acesso negado.",403);if((role==="OWNER"||role==="ADMIN")&&aal!=="aal2")throw new AppError("FORBIDDEN","Autenticação reforçada necessária.",403);}
