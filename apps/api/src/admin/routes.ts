import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { principal } from "../auth/plugin.js";
import { AppError } from "../errors/app-error.js";
import type { AdminService } from "./service.js";

const pageQuery=z.object({search:z.string().trim().max(120).optional(),status:z.enum(["ACTIVE","SUSPENDED","ARCHIVED"]).optional(),page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)});
const idParams=z.object({id:z.uuid()});
const statusBody=z.object({status:z.enum(["ACTIVE","SUSPENDED"]),reason:z.string().trim().min(8).max(500)});
function parse<T extends z.ZodTypeAny>(schema:T,value:unknown):z.output<T>{const result=schema.safeParse(value);if(!result.success)throw new AppError("VALIDATION_ERROR","Dados inválidos.",400,result.error.issues);return result.data;}
export async function adminRoutes(app:FastifyInstance,service:AdminService){
 const auth={preHandler:app.authenticatePlatform,config:{rateLimit:{max:30,timeWindow:"1 minute"}}};
 app.get("/api/v1/admin/overview",auth,async request=>({data:await service.overview(principal(request)),meta:{},requestId:request.id}));
 app.get("/api/v1/admin/organizations",auth,async request=>{const q=parse(pageQuery,request.query);return{data:await service.organizations(principal(request),q),meta:{page:q.page,pageSize:q.pageSize},requestId:request.id};});
 app.get("/api/v1/admin/organizations/:id",auth,async request=>({data:await service.organization(principal(request),parse(idParams,request.params).id),meta:{},requestId:request.id}));
 app.patch("/api/v1/admin/organizations/:id/status",auth,async request=>{const b=parse(statusBody,request.body);return{data:await service.setOrganizationStatus(principal(request),parse(idParams,request.params).id,b.status,b.reason),meta:{},requestId:request.id};});
 app.get("/api/v1/admin/users",auth,async request=>{const q=parse(pageQuery.omit({status:true}),request.query);return{data:await service.users(principal(request),q),meta:{page:q.page,pageSize:q.pageSize},requestId:request.id};});
 app.get("/api/v1/admin/users/:id",auth,async request=>({data:await service.user(principal(request),parse(idParams,request.params).id),meta:{},requestId:request.id}));
 app.get("/api/v1/admin/audit",auth,async request=>{const q=parse(pageQuery.omit({search:true,status:true}),request.query);return{data:await service.audit(principal(request),q.page,q.pageSize),meta:q,requestId:request.id};});
 app.get("/api/v1/admin/emails",auth,async request=>{const q=parse(pageQuery.omit({search:true,status:true}),request.query);return{data:await service.emails(principal(request),q.page,q.pageSize),meta:q,requestId:request.id};});
 app.get("/api/v1/admin/health",auth,async request=>({data:await service.health(principal(request)),meta:{},requestId:request.id}));
}
