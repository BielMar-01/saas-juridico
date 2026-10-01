import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { principal } from "../auth/plugin.js";
import { AppError } from "../errors/app-error.js";
import type { AccountService } from "./service.js";

const name = z.object({ name: z.string().trim().min(2).max(120) });
const preferences = z.object({
  teamEnabled: z.boolean(),
  officeEnabled: z.boolean(),
  systemEnabled: z.literal(true),
  caseUpdatesEnabled: z.boolean(),
});
function parse<T extends z.ZodTypeAny>(schema:T,value:unknown):z.output<T>{
  const result=schema.safeParse(value);
  if(!result.success) throw new AppError("VALIDATION_ERROR","Dados inválidos.",422,result.error.issues);
  return result.data;
}
export async function accountRoutes(app:FastifyInstance,service:AccountService){
  const auth={preHandler:app.authenticateWithoutOrganization,config:{rateLimit:{max:60,timeWindow:"1 minute"}}};
  app.get("/api/v1/account/profile",auth,async req=>({data:await service.getProfile(principal(req)),meta:{},requestId:req.id}));
  app.patch("/api/v1/account/profile",auth,async req=>({data:await service.updateProfile(principal(req),parse(name,req.body)),meta:{},requestId:req.id}));
  app.post("/api/v1/account/sync-email",auth,async req=>{
    const authorization=req.headers.authorization;
    if(typeof authorization!=="string"||!authorization.startsWith("Bearer ")) throw new AppError("UNAUTHORIZED","Credenciais ausentes.",401);
    const data=await service.syncVerifiedEmail(principal(req),authorization.slice(7).trim());
    return{data,meta:{synced:true},requestId:req.id};
  });
  app.get("/api/v1/account/notification-preferences",auth,async req=>({data:await service.getPreferences(principal(req)),meta:{securityMandatory:true},requestId:req.id}));
  app.put("/api/v1/account/notification-preferences",auth,async req=>({data:await service.updatePreferences(principal(req),parse(preferences,req.body)),meta:{securityMandatory:true},requestId:req.id}));
}