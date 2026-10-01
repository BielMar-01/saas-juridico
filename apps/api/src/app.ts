import Fastify,{type FastifyInstance,type FastifyServerOptions}from "fastify";
import rawBody from "fastify-raw-body";
import type { PrismaClient } from "./generated/prisma/client.js";
import { resendWebhookRoutes } from "./email/webhook-routes.js";
import type { AuthService } from "./auth/service.js";
import { registerAuth } from "./auth/plugin.js";
import type { ClientService } from "./clients/service.js";
import type { TeamService } from "./team/service.js";
import type { AccountService } from "./account/service.js";
import type { OrganizationService } from "./organizations/service.js";
import type { AdminService } from "./admin/service.js";
import { accountRoutes } from "./account/routes.js";
import { organizationRoutes } from "./organizations/routes.js";
import { adminRoutes } from "./admin/routes.js";
import { teamRoutes } from "./team/routes.js";
import { clientRoutes } from "./clients/routes.js";
import { registerErrorHandling } from "./plugins/errors.js";
import { registerInfrastructure } from "./plugins/infrastructure.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes,type DatabaseHealth } from "./routes/health.js";
import { sanitizeRequestId } from "./utils/request-id.js";
export interface BuildAppOptions{database?:DatabaseHealth;environment?:string;logger?:FastifyServerOptions["logger"];webOrigin?:string;authService?:AuthService;clientService?:ClientService;teamService?:TeamService;accountService?:AccountService;organizationService?:OrganizationService;adminService?:AdminService;resendWebhook?:{prisma:PrismaClient;secret:string};trustProxy?:boolean}
const unavailableDatabase:DatabaseHealth={async check(){throw new Error("Database dependency was not configured.");}};
export async function buildApp(options:BuildAppOptions={}):Promise<FastifyInstance>{
 const app=Fastify({logger:options.logger??false,trustProxy:options.trustProxy??false,requestIdHeader:false,genReqId:request=>sanitizeRequestId(request.headers["x-request-id"])});
 app.decorate("apiConfig",{service:"jurisvia-api",version:"0.2.0",environment:options.environment??"test"});
 app.addHook("onRequest",(request,reply,done)=>{reply.header("x-request-id",request.id);done();});
 registerErrorHandling(app);if(options.resendWebhook)await app.register(rawBody,{field:"rawBody",global:false,encoding:"utf8",runFirst:true});await registerInfrastructure(app,options.webOrigin??"http://localhost:3000",options.environment??"test");
 if(options.resendWebhook)await app.register(resendWebhookRoutes,options.resendWebhook);
 if(options.authService&&options.clientService){
  registerAuth(app,options.authService);await app.register(authRoutes);await app.register(clientRoutes,options.clientService);
  if(options.teamService)await app.register(async scoped=>teamRoutes(scoped,options.teamService!,options.authService!));
  if(options.accountService)await app.register(accountRoutes,options.accountService);
  if(options.organizationService)await app.register(organizationRoutes,options.organizationService);
  if(options.adminService)await app.register(adminRoutes,options.adminService);
 }
 await app.register(healthRoutes,options.database??unavailableDatabase);return app;
}
