import type{SupabaseClient}from"@supabase/supabase-js";
export const RECENT_AUTH_SECONDS=900;
export type AuthClaims={auth_time?:number;iat?:number;aal?:string};
export function accessTokenClaims(token:string|undefined):AuthClaims{if(!token)return{};try{const part=token.split(".")[1];if(!part)return{};const normalized=part.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(part.length/4)*4,"=");return JSON.parse(atob(normalized))as AuthClaims}catch{return{}}}
export function isRecentAuth(claims:AuthClaims,now=Math.floor(Date.now()/1000)){return typeof claims.auth_time==="number"&&claims.auth_time>0&&now>=claims.auth_time&&now-claims.auth_time<=RECENT_AUTH_SECONDS}
export async function recentAuthState(client:SupabaseClient){const[{data},{data:assurance}]=await Promise.all([client.auth.getSession(),client.auth.mfa.getAuthenticatorAssuranceLevel()]),claims=accessTokenClaims(data.session?.access_token);return{aal2:assurance?.currentLevel==="aal2",recent:isRecentAuth(claims),claims}}
export const sensitiveLoginPath=(next:string)=>`/login?next=${encodeURIComponent(next.startsWith("/")&&!next.startsWith("//")?next:"/app")}`;