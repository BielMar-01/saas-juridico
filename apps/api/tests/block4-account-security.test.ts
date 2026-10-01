import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../src/app.js";
import type { AuthIdentityProvider } from "../src/auth/identity-provider.js";
import type { AuthService, Principal } from "../src/auth/service.js";
import { AppError } from "../src/errors/app-error.js";
import { AccountService } from "../src/account/service.js";

const userId="11111111-1111-4111-8111-111111111111";
const current:Principal={authUserId:userId,userId,name:"Pessoa",email:"old@example.invalid",aal:"aal2",authenticatedAt:Math.floor(Date.now()/1000),organization:undefined,organizations:[]};

describe("account security contracts",()=>{
  it("rejects systemEnabled=false at the HTTP boundary with 422",async()=>{
    const authService={authenticate:vi.fn().mockResolvedValue(current)} as unknown as AuthService;
    const accountService={updatePreferences:vi.fn()} as unknown as AccountService;
    const app=await buildApp({authService,clientService:{} as never,accountService});
    const response=await app.inject({method:"PUT",url:"/api/v1/account/notification-preferences",headers:{authorization:"Bearer token"},payload:{teamEnabled:true,officeEnabled:true,systemEnabled:false,caseUpdatesEnabled:true}});
    expect(response.statusCode).toBe(422);expect(accountService.updatePreferences).not.toHaveBeenCalled();await app.close();
  });
  it("synchronizes only a confirmed matching identity",async()=>{
    const identityProvider:AuthIdentityProvider={getVerifiedIdentity:vi.fn().mockResolvedValue({authUserId:userId,email:"new@example.invalid",name:"Pessoa"})};
    const tx={$executeRaw:vi.fn(),$queryRaw:vi.fn().mockResolvedValue([{id:userId,name:"Pessoa",email:"new@example.invalid",status:"ACTIVE",updated_at:new Date()}])};const prisma={$transaction:vi.fn(async(operation:(value:typeof tx)=>unknown)=>operation(tx))};
    const result=await new AccountService(prisma as never,identityProvider,900).syncVerifiedEmail(current,"token");
    expect(result.email).toBe("new@example.invalid");expect(tx.$queryRaw).toHaveBeenCalledOnce();
  });
  it.each([
    ["unconfirmed",new AppError("FORBIDDEN","E-mail verificado é obrigatório.",403)],
    ["invalid",new AppError("UNAUTHORIZED","Credenciais inválidas.",401)],
  ])("rejects %s Supabase identity",async(_label,error)=>{
    const provider:AuthIdentityProvider={getVerifiedIdentity:vi.fn().mockRejectedValue(error)};
    await expect(new AccountService({} as never,provider).syncVerifiedEmail(current,"token")).rejects.toBe(error);
  });
  it("rejects identity mismatch and email conflict",async()=>{
    const mismatch:AuthIdentityProvider={getVerifiedIdentity:vi.fn().mockResolvedValue({authUserId:"22222222-2222-4222-8222-222222222222",email:"new@example.invalid",name:"X"})};
    await expect(new AccountService({} as never,mismatch).syncVerifiedEmail(current,"token")).rejects.toMatchObject({statusCode:403});
    const provider:AuthIdentityProvider={getVerifiedIdentity:vi.fn().mockResolvedValue({authUserId:userId,email:"used@example.invalid",name:"X"})};
    const tx={$executeRaw:vi.fn(),$queryRaw:vi.fn().mockRejectedValue({code:"23505"})};const prisma={$transaction:vi.fn(async(operation:(value:typeof tx)=>unknown)=>operation(tx))};
    await expect(new AccountService(prisma as never,provider).syncVerifiedEmail(current,"token")).rejects.toMatchObject({statusCode:409});
  });
  it("requires AAL2 with recent authentication evidence",async()=>{
    const provider:AuthIdentityProvider={getVerifiedIdentity:vi.fn()};
    await expect(new AccountService({} as never,provider,900).syncVerifiedEmail({...current,aal:"aal1"},"token")).rejects.toMatchObject({statusCode:403});
    await expect(new AccountService({} as never,provider,900).syncVerifiedEmail({...current,authenticatedAt:1},"token")).rejects.toMatchObject({statusCode:403});
    expect(provider.getVerifiedIdentity).not.toHaveBeenCalled();
  });
});