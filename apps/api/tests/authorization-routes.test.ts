import type { AuthService,Principal } from "../src/auth/service.js";
import type { Role } from "../src/auth/permissions.js";
import type { ClientService } from "../src/clients/service.js";
import { afterEach,describe,expect,it } from "vitest";
import { buildApp } from "../src/app.js";

const organizationId="22222222-2222-4222-8222-222222222222";
const clientId="33333333-3333-4333-8333-333333333333";
const apps:Awaited<ReturnType<typeof buildApp>>[]=[];
afterEach(async()=>{await Promise.all(apps.splice(0).map(app=>app.close()));});

const operations=[
  {name:"read",method:"GET",url:"/api/v1/clients",allowed:(role:Role)=>["OWNER","ADMIN","LAWYER","ASSISTANT","FINANCIAL","VIEWER"].includes(role),status:200},
  {name:"create",method:"POST",url:"/api/v1/clients",payload:{type:"INDIVIDUAL",name:"Cliente Fictício"},allowed:(role:Role)=>["OWNER","ADMIN","LAWYER","ASSISTANT"].includes(role),status:201},
  {name:"update",method:"PATCH",url:`/api/v1/clients/${clientId}`,payload:{name:"Cliente Atualizado"},allowed:(role:Role)=>["OWNER","ADMIN","LAWYER","ASSISTANT"].includes(role),status:200},
  {name:"status",method:"PATCH",url:`/api/v1/clients/${clientId}/status`,payload:{status:"INACTIVE"},allowed:(role:Role)=>["OWNER","ADMIN","LAWYER","ASSISTANT"].includes(role),status:200},
] as const;

async function appFor(role:Role,aal:"aal1"|"aal2"){
  const principal:Principal={authUserId:clientId,userId:clientId,name:"Fixture",email:"fixture@example.invalid",aal,organization:{organizationId,name:"Fixture",slug:"fixture",role},organizations:[]};
  const authService={authenticate:async()=>principal} as unknown as AuthService;
  const row={id:clientId,type:"INDIVIDUAL",name:"Fixture",status:"ACTIVE"};
  const clientService={create:async()=>row,list:async()=>({items:[row],total:1}),get:async()=>row,patch:async()=>row,status:async()=>row} as unknown as ClientService;
  const app=await buildApp({authService,clientService});apps.push(app);return app;
}

async function invoke(role:Role,aal:"aal1"|"aal2",operation:typeof operations[number]){
  const app=await appFor(role,aal);
  return app.inject({method:operation.method,url:operation.url,headers:{authorization:"Bearer fixture-token","x-organization-id":organizationId},...("payload" in operation?{payload:operation.payload}:{})});
}

describe("direct API AAL and role enforcement",()=>{
  it.each(["OWNER","ADMIN"] as const)("denies every client operation for %s at AAL1",async role=>{for(const operation of operations){const response=await invoke(role,"aal1",operation);expect(response.statusCode,operation.name).toBe(403);expect(response.json()).toMatchObject({error:{code:"FORBIDDEN",message:"Autenticação reforçada necessária."}});expect(response.body).not.toContain("fixture-token");}});
  it.each(["OWNER","ADMIN"] as const)("allows every client operation for %s at AAL2",async role=>{for(const operation of operations){const response=await invoke(role,"aal2",operation);expect(response.statusCode,operation.name).toBe(operation.status);}});
  it.each(["LAWYER","ASSISTANT","FINANCIAL","VIEWER"] as const)("applies the permission matrix to %s at AAL1",async role=>{for(const operation of operations){const response=await invoke(role,"aal1",operation);expect(response.statusCode,operation.name).toBe(operation.allowed(role)?operation.status:403);}});
});
