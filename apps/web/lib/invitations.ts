import{safeNext}from"./auth/navigation.ts";
export const invitationCookie="jv_invitation";
export function validInvitationToken(value:string|null|undefined){return Boolean(value&&/^[A-Za-z0-9_-]{40,128}$/.test(value))}
export function invitationNext(value:string|null|undefined){return safeNext(value,"/app")}
export type InvitationAcceptState="ready"|"success"|"unavailable"|"invalid"|"missing";