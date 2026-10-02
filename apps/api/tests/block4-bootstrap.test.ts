import {describe,expect,it,vi} from "vitest";
import {bootstrapSuperAdmin,fetchConfirmedAuthIdentity,normalizeEmail,runBootstrapTransaction,validateBootstrapConfig} from "../scripts/bootstrap-super-admin-core.mjs";

const identity={authUserId:"11111111-1111-4111-8111-111111111111",email:"admin@example.com",name:"Admin Seguro"};
const adminRow={id:"admin-id",user_id:"user-id",active:true};

describe("SUPER_ADMIN bootstrap",()=>{
  it("requires credentials and explicit production confirmation only for apply",()=>{
    expect(()=>validateBootstrapConfig({email:identity.email,databaseUrl:"postgres://local",supabaseUrl:"https://project.supabase.co",supabaseSecretKey:"secret",production:true,mode:"apply"})).toThrow("CONFIRM_PRODUCTION");
    expect(()=>validateBootstrapConfig({email:identity.email,supabaseUrl:"https://project.supabase.co",supabaseSecretKey:"secret",production:true,mode:"verify"})).not.toThrow();
  });

  it("normalizes common ASCII addresses and rejects malformed or Unicode addresses",()=>{
    expect(normalizeEmail(" Susan.Santos@Example.COM ")).toBe("susan.santos@example.com");
    expect(()=>normalizeEmail("susan santos@example.com")).toThrow("invalid email");
    expect(()=>normalizeEmail("susan@example")).toThrow("invalid email");
    expect(()=>normalizeEmail("usuário@example.com")).toThrow("invalid email");
  });

  it("fetches the exact confirmed active Auth identity and normalizes safe profile data",async()=>{
    const fetchImpl=vi.fn().mockResolvedValue({ok:true,json:async()=>({users:[{id:"phone-only"},{id:identity.authUserId,email:"Admin@Example.COM",email_confirmed_at:"2030-01-01T00:00:00Z",user_metadata:{name:"  Admin   Seguro  "}}]})});
    await expect(fetchConfirmedAuthIdentity({baseUrl:"https://project.supabase.co",secretKey:"not-a-real-secret",email:"admin@example.com",fetchImpl})).resolves.toEqual(identity);
    const serialized=JSON.stringify(fetchImpl.mock.calls.map(call=>String(call[0])));
    expect(serialized).not.toContain("not-a-real-secret");
  });

  it.each([
    ["unconfirmed",{id:identity.authUserId,email:identity.email,email_confirmed_at:null}],
    ["inactive",{id:identity.authUserId,email:identity.email,email_confirmed_at:"2030-01-01T00:00:00Z",banned_until:"2999-01-01T00:00:00Z"}],
  ])("rejects %s Auth identities",async(_label,user)=>{
    const fetchImpl=vi.fn().mockResolvedValue({ok:true,json:async()=>({users:[user]})});
    await expect(fetchConfirmedAuthIdentity({baseUrl:"https://project.supabase.co",secretKey:"hidden",email:identity.email,fetchImpl})).rejects.toThrow();
  });

  it("creates User ACTIVE, PlatformAdministrator and one audit without tenant membership",async()=>{
    const db={query:vi.fn()
      .mockResolvedValueOnce({rows:[]})
      .mockResolvedValueOnce({rows:[{id:"user-id",email:identity.email,status:"ACTIVE",auth_user_id:identity.authUserId}]})
      .mockResolvedValueOnce({rows:[adminRow]})
      .mockResolvedValueOnce({rows:[]})
      .mockResolvedValueOnce({rows:[]})};
    await expect(bootstrapSuperAdmin(db,identity)).resolves.toMatchObject({created:true,replayed:false,administrator:{active:true}});
    const sql=db.query.mock.calls.map(call=>String(call[0])).join("\n");
    expect(sql).toContain("INSERT INTO public.users");
    expect(sql).toContain("INSERT INTO public.platform_administrators");
    expect(sql).toContain("INSERT INTO public.platform_audit_logs");
    expect(sql).not.toContain("organization_memberships");
    expect(sql).not.toContain("password");
  });

  it("replays idempotently without duplicating user or audit",async()=>{
    const user={id:"user-id",email:identity.email,status:"ACTIVE",auth_user_id:identity.authUserId};
    const db={query:vi.fn()
      .mockResolvedValueOnce({rows:[user]})
      .mockResolvedValueOnce({rows:[adminRow]})
      .mockResolvedValueOnce({rows:[{one:1}]})};
    await expect(bootstrapSuperAdmin(db,identity)).resolves.toMatchObject({created:false,replayed:true});
    const sql=db.query.mock.calls.map(call=>String(call[0])).join("\n");
    expect(sql).not.toContain("INSERT INTO public.users");
    expect(sql.match(/INSERT INTO public.platform_audit_logs/g)).toBeNull();
  });

  it.each([
    ["email mismatch",[{id:"user-id",email:"other@example.com",status:"ACTIVE",auth_user_id:identity.authUserId}]],
    ["auth mismatch",[{id:"user-id",email:identity.email,status:"ACTIVE",auth_user_id:"22222222-2222-4222-8222-222222222222"}]],
    ["split identity",[{id:"one",email:identity.email,status:"ACTIVE",auth_user_id:"22222222-2222-4222-8222-222222222222"},{id:"two",email:"other@example.com",status:"ACTIVE",auth_user_id:identity.authUserId}]],
  ])("fails closed on %s",async(_label,rows)=>{
    const db={query:vi.fn().mockResolvedValue({rows})};
    await expect(bootstrapSuperAdmin(db,identity)).rejects.toThrow("identity conflict");
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it("rolls back every write when bootstrap fails",async()=>{
    const db={query:vi.fn()
      .mockResolvedValueOnce({rows:[]})
      .mockResolvedValueOnce({rows:[{id:"user-id",email:identity.email,status:"ACTIVE",auth_user_id:identity.authUserId}]})
      .mockRejectedValueOnce(new Error("admin insert failed"))
      .mockResolvedValueOnce({rows:[]})};
    await expect(runBootstrapTransaction(db,identity)).rejects.toThrow("admin insert failed");
    expect(db.query.mock.calls[0]?.[0]).toBe("BEGIN");
    expect(db.query.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
  });
});