import { buildApp } from "./app.js";
import { AuthService } from "./auth/service.js";
import { SupabaseAuthIdentityProvider } from "./auth/identity-provider.js";
import { createJwtVerifier } from "./auth/jwt.js";
import { ClientService } from "./clients/service.js";
import { AccountService } from "./account/service.js";
import { OrganizationService } from "./organizations/service.js";
import { AdminService } from "./admin/service.js";
import type { ApiEnv } from "./env/index.js";
import { getPrismaClient } from "./lib/prisma.js";
import { SafeDevelopmentInvitationDelivery, UnavailableInvitationDelivery } from "./team/delivery.js";
import { EmailInvitationDelivery } from "./email/delivery.js";
import { EmailService,ResendEmailProvider } from "./email/service.js";
import { TeamService } from "./team/service.js";
export async function createRuntime(env:ApiEnv){
 const prisma=getPrismaClient(env.DATABASE_URL);const issuer=env.SUPABASE_URL.replace(/\/$/,"")+"/auth/v1";const verifier=createJwtVerifier({jwksUrl:env.SUPABASE_JWKS_URL,issuer,audience:"authenticated"});const authService=new AuthService(prisma,verifier,env.SENSITIVE_AUTH_MAX_AGE_SECONDS);
 const emailConfigured=Boolean(env.RESEND_API_KEY&&env.EMAIL_FROM_ACCESS&&env.EMAIL_FROM_INVITATIONS&&env.EMAIL_FROM_NOTIFICATIONS);
 const email=emailConfigured?new EmailService(prisma,new ResendEmailProvider(env.RESEND_API_KEY!),{access:env.EMAIL_FROM_ACCESS!,invitations:env.EMAIL_FROM_INVITATIONS!,notifications:env.EMAIL_FROM_NOTIFICATIONS!,...(env.EMAIL_REPLY_TO?{replyTo:env.EMAIL_REPLY_TO}:{})}):undefined;
 const delivery=email?new EmailInvitationDelivery(email,env.APP_PUBLIC_URL):(env.NODE_ENV==="production"?new UnavailableInvitationDelivery():new SafeDevelopmentInvitationDelivery());
 const teamService=new TeamService(prisma,delivery,new SupabaseAuthIdentityProvider(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY),env.INVITATION_TOKEN_SECRET,env.INVITATION_TTL_HOURS,env.INVITATION_RESEND_COOLDOWN_SECONDS);
 const app=await buildApp({database:{async check(){await prisma.$queryRawUnsafe("SELECT 1");}},environment:env.NODE_ENV,logger:{level:env.LOG_LEVEL,redact:["req.headers.authorization","req.headers.cookie","req.headers.x-organization-id","req.body.token","req.body.code","req.body.secret"]},webOrigin:env.WEB_ORIGIN,authService,clientService:new ClientService(prisma),teamService,accountService:new AccountService(prisma,new SupabaseAuthIdentityProvider(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY),env.SENSITIVE_AUTH_MAX_AGE_SECONDS),organizationService:new OrganizationService(prisma,env.INVITATION_TOKEN_SECRET,env.OWNERSHIP_TRANSFER_TTL_HOURS,env.SENSITIVE_AUTH_MAX_AGE_SECONDS),adminService:new AdminService(prisma),...(env.RESEND_WEBHOOK_SECRET?{resendWebhook:{prisma,secret:env.RESEND_WEBHOOK_SECRET}}:{}),trustProxy:env.NODE_ENV==="production"});return{app,prisma};
}
export function createRuntimeCache(factory:typeof createRuntime=createRuntime){let applicationPromise:ReturnType<typeof createRuntime>|undefined;return(env:ApiEnv)=>{applicationPromise??=factory(env);return applicationPromise;};}
export const getServerlessRuntime=createRuntimeCache();
