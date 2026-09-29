import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import dotenv from "dotenv";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const env = dotenv.parse(await readFile(resolve(process.cwd(), ".env"), "utf8"));
const ids = {
  organizationA: randomUUID(), organizationB: randomUUID(),
  userA: randomUUID(), userB: randomUUID(),
  membershipA: randomUUID(), membershipB: randomUUID(),
  clientA: randomUUID(), clientB: randomUUID(), caseA: randomUUID(),
  auditA: randomUUID(), publicationA: randomUUID(),
};
const suffix = randomUUID();
let admin: pg.Client;
let runtime: pg.Pool;

async function tenantQuery<T extends pg.QueryResultRow>(organizationId: string, userId: string, text: string, values: unknown[] = []) {
  const client = await runtime.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_organization_id', $1, true), set_config('app.current_user_id', $2, true)", [organizationId, userId]);
    const result = await client.query<T>(text, values);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally { client.release(); }
}

beforeAll(async () => {
  admin = new pg.Client({ connectionString: env.DIRECT_URL, connectionTimeoutMillis: 15_000 });
  runtime = new pg.Pool({ connectionString: env.DATABASE_URL, max: 3, connectionTimeoutMillis: 15_000 });
  await admin.connect();
  await admin.query("INSERT INTO public.users (id,name,email,status,updated_at) VALUES ($1,'Fixture A',$2,'ACTIVE',now()),($3,'Fixture B',$4,'ACTIVE',now())", [ids.userA, `a-${suffix}@example.invalid`, ids.userB, `b-${suffix}@example.invalid`]);
  await admin.query("INSERT INTO public.organizations (id,name,slug,status,updated_at) VALUES ($1,'Fixture A',$2,'ACTIVE',now()),($3,'Fixture B',$4,'ACTIVE',now())", [ids.organizationA, `fixture-a-${suffix}`, ids.organizationB, `fixture-b-${suffix}`]);
  await admin.query("INSERT INTO public.organization_memberships (id,organization_id,user_id,role,status,updated_at) VALUES ($1,$2,$3,'OWNER','ACTIVE',now()),($4,$5,$6,'OWNER','ACTIVE',now())", [ids.membershipA, ids.organizationA, ids.userA, ids.membershipB, ids.organizationB, ids.userB]);
  await admin.query("INSERT INTO public.clients (id,organization_id,type,name,status,updated_at) VALUES ($1,$2,'INDIVIDUAL','Client A','ACTIVE',now()),($3,$4,'INDIVIDUAL','Client B','ACTIVE',now())", [ids.clientA, ids.organizationA, ids.clientB, ids.organizationB]);
  await admin.query("INSERT INTO public.cases (id,organization_id,client_id,title,status,responsible_user_id,readiness_score,updated_at) VALUES ($1,$2,$3,'Case A','ACTIVE',$4,50,now())", [ids.caseA, ids.organizationA, ids.clientA, ids.userA]);
  await admin.query("INSERT INTO public.audit_logs (id,organization_id,user_id,action,entity_type,entity_id) VALUES ($1,$2,$3,'fixture.created','case',$4)", [ids.auditA, ids.organizationA, ids.userA, ids.caseA]);
  await admin.query("INSERT INTO public.client_portal_publications (id,organization_id,case_id,created_by_user_id,type,title,content,published_at,updated_at) VALUES ($1,$2,$3,$4,'STATUS_UPDATE','Fixture','Fixture',now(),now())", [ids.publicationA, ids.organizationA, ids.caseA, ids.userA]);
}, 30_000);

afterAll(async () => {
  await runtime?.end().catch(() => undefined);
  if (!admin) return;
  try {
    await admin.query("BEGIN");
    await admin.query("SELECT set_config('app.allow_admin_cleanup','on',true)");
    await admin.query("UPDATE public.organizations SET status='INACTIVE' WHERE id=ANY($1::uuid[])", [[ids.organizationA, ids.organizationB]]);
    await admin.query("DELETE FROM public.client_portal_publications WHERE id=$1", [ids.publicationA]);
    await admin.query("DELETE FROM public.audit_logs WHERE id=$1", [ids.auditA]);
    await admin.query("DELETE FROM public.cases WHERE id=$1", [ids.caseA]);
    await admin.query("DELETE FROM public.clients WHERE id=ANY($1::uuid[])", [[ids.clientA, ids.clientB]]);
    await admin.query("DELETE FROM public.organization_memberships WHERE id=ANY($1::uuid[])", [[ids.membershipA, ids.membershipB]]);
    await admin.query("DELETE FROM public.organizations WHERE id=ANY($1::uuid[])", [[ids.organizationA, ids.organizationB]]);
    await admin.query("DELETE FROM public.users WHERE id=ANY($1::uuid[])", [[ids.userA, ids.userB]]);
    await admin.query("COMMIT");
  } catch (error) { await admin.query("ROLLBACK").catch(() => undefined); throw error; }
  finally { await admin.end().catch(() => undefined); }
}, 30_000);

describe("real database tenant security", () => {
  it("fails closed without context and isolates tenants", async () => {
    const noContext = await runtime.query<{ count: string }>("SELECT count(*)::text AS count FROM public.clients");
    expect(noContext.rows[0]?.count).toBe("0");
    const own = await tenantQuery<{ id: string }>(ids.organizationA, ids.userA, "SELECT id FROM public.clients ORDER BY id");
    expect(own.rows.map((row) => row.id)).toEqual([ids.clientA]);
  });

  it("keeps concurrent pool contexts isolated and transaction-local", async () => {
    const [a, b] = await Promise.all([
      tenantQuery<{ id: string }>(ids.organizationA, ids.userA, "SELECT id FROM public.clients"),
      tenantQuery<{ id: string }>(ids.organizationB, ids.userB, "SELECT id FROM public.clients"),
    ]);
    expect(a.rows[0]?.id).toBe(ids.clientA);
    expect(b.rows[0]?.id).toBe(ids.clientB);
    const leaked = await runtime.query<{ count: string }>("SELECT count(*)::text AS count FROM public.clients");
    expect(leaked.rows[0]?.count).toBe("0");
  });

  it("rejects cross-tenant references and invalid readiness", async () => {
    await expect(tenantQuery(ids.organizationA, ids.userA,
      "INSERT INTO public.cases (id,organization_id,client_id,title,status,responsible_user_id,updated_at) VALUES ($1,$2,$3,'Cross','ACTIVE',$4,now())",
      [randomUUID(), ids.organizationA, ids.clientB, ids.userA])).rejects.toMatchObject({ code: "23503" });
    await expect(tenantQuery(ids.organizationA, ids.userA,
      "INSERT INTO public.cases (id,organization_id,client_id,title,status,responsible_user_id,readiness_score,updated_at) VALUES ($1,$2,$3,'Invalid','ACTIVE',$4,101,now())",
      [randomUUID(), ids.organizationA, ids.clientA, ids.userA])).rejects.toMatchObject({ code: "23514" });
  });

  it("serializes concurrent last-owner changes without hanging", async () => {
    const race = {
      organizationId: randomUUID(), userA: randomUUID(), userB: randomUUID(),
      membershipA: randomUUID(), membershipB: randomUUID(), marker: randomUUID(),
    };
    let first: pg.Client | undefined;
    let second: pg.Client | undefined;
    let firstOpen = false;
    let secondOpen = false;
    let secondUpdate: Promise<pg.QueryResult> | undefined;
    try {
      await admin.query("INSERT INTO public.users (id,name,email,status,updated_at) VALUES ($1,'Race A',$2,'ACTIVE',now()),($3,'Race B',$4,'ACTIVE',now())", [race.userA, `race-${race.marker}-a@example.invalid`, race.userB, `race-${race.marker}-b@example.invalid`]);
      await admin.query("INSERT INTO public.organizations (id,name,slug,status,updated_at) VALUES ($1,'Race fixture',$2,'ACTIVE',now())", [race.organizationId, `race-${race.marker}`]);
      await admin.query("INSERT INTO public.organization_memberships (id,organization_id,user_id,role,status,updated_at) VALUES ($1,$2,$3,'OWNER','ACTIVE',now()),($4,$2,$5,'OWNER','ACTIVE',now())", [race.membershipA, race.organizationId, race.userA, race.membershipB, race.userB]);
      first = new pg.Client({ connectionString: env.DIRECT_URL, connectionTimeoutMillis: 15_000 });
      second = new pg.Client({ connectionString: env.DIRECT_URL, connectionTimeoutMillis: 15_000 });
      await first.connect(); await second.connect();
      await first.query("BEGIN"); firstOpen = true;
      await second.query("BEGIN"); secondOpen = true;
      await first.query("SET LOCAL statement_timeout='5s'");
      await second.query("SET LOCAL statement_timeout='5s'");

      await first.query("UPDATE public.organization_memberships SET status='REVOKED' WHERE id=$1", [race.membershipA]);
      secondUpdate = second.query("UPDATE public.organization_memberships SET status='REVOKED' WHERE id=$1", [race.membershipB]);
      void secondUpdate.catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await first.query("COMMIT"); firstOpen = false;
      await expect(secondUpdate).rejects.toMatchObject({ code: "23514" });
      await second.query("ROLLBACK"); secondOpen = false;
    } finally {
      if (firstOpen) await first?.query("ROLLBACK").catch(() => undefined);
      if (secondUpdate) await secondUpdate.catch(() => undefined);
      if (secondOpen) await second?.query("ROLLBACK").catch(() => undefined);
      await first?.end().catch(() => undefined); await second?.end().catch(() => undefined);
      await admin.query("BEGIN");
      try {
        await admin.query("UPDATE public.organizations SET status='INACTIVE' WHERE id=$1", [race.organizationId]);
        await admin.query("DELETE FROM public.organization_memberships WHERE id=ANY($1::uuid[])", [[race.membershipA, race.membershipB]]);
        await admin.query("DELETE FROM public.organizations WHERE id=$1", [race.organizationId]);
        await admin.query("DELETE FROM public.users WHERE id=ANY($1::uuid[])", [[race.userA, race.userB]]);
        await admin.query("COMMIT");
      } catch { await admin.query("ROLLBACK").catch(() => undefined); }
    }
  }, 15_000);
  it("protects owner, audit and publication history", async () => {
    await expect(admin.query("UPDATE public.organization_memberships SET status='REVOKED' WHERE id=$1", [ids.membershipA])).rejects.toMatchObject({ code: "23514" });
    await expect(tenantQuery(ids.organizationA, ids.userA,
      "UPDATE public.audit_logs SET action='changed' WHERE id=$1", [ids.auditA])).rejects.toBeDefined();
    await expect(tenantQuery(ids.organizationA, ids.userA,
      "DELETE FROM public.client_portal_publications WHERE id=$1", [ids.publicationA])).rejects.toBeDefined();
  });

  it("keeps runtime and Data API privileges minimal", async () => {
    const role = await admin.query<{ compliant: boolean }>("SELECT rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolinherit AND NOT rolreplication AND NOT rolbypassrls AS compliant FROM pg_roles WHERE rolname='jurisvia_app'");
    expect(role.rows[0]?.compliant).toBe(true);
    const dataApi = await admin.query<{ count: string }>("SELECT count(*)::text AS count FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN ('anon','authenticated') AND table_name IN ('users','organizations','organization_memberships','clients','cases','lawsuits','tasks','documents','client_portal_publications','audit_logs')");
    expect(dataApi.rows[0]?.count).toBe("0");
    await expect(runtime.query("ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY")).rejects.toBeDefined();
  });
});
