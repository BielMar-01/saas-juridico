import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import pg from "pg";
const env=dotenv.parse(await readFile(new URL("../.env",import.meta.url),"utf8"));
const admin=new pg.Client({connectionString:env.DIRECT_URL,connectionTimeoutMillis:15000});
const runtime=new pg.Client({connectionString:env.DATABASE_URL,connectionTimeoutMillis:15000});
try {
  await admin.connect(); await runtime.connect();
  const migrations=await admin.query("select count(*)::int n from _prisma_migrations where finished_at is not null and rolled_back_at is null");
  const rls=await admin.query("select count(*)::int n,count(*) filter(where relrowsecurity and relforcerowsecurity)::int secured from pg_class where relnamespace='public'::regnamespace and relname=any($1::text[])",[["users","organizations","organization_memberships","clients","cases","lawsuits","tasks","documents","client_portal_publications","audit_logs"]]);
  const policies=await admin.query("select count(*)::int n from pg_policies where schemaname='public' and 'jurisvia_app'=any(roles)");
  const grants=await admin.query("select count(*)::int n from information_schema.role_table_grants where table_schema='public' and grantee=any($1::text[]) and table_name=any($2::text[])",[["anon","authenticated"],["users","organizations","organization_memberships","clients","cases","lawsuits","tasks","documents","client_portal_publications","audit_logs"]]);
  const rows=await admin.query("select sum(n)::int n from (select count(*) n from users union all select count(*) from organizations union all select count(*) from organization_memberships union all select count(*) from clients union all select count(*) from cases union all select count(*) from lawsuits union all select count(*) from tasks union all select count(*) from documents union all select count(*) from client_portal_publications union all select count(*) from audit_logs)s");
  const fixtures=await admin.query("select count(*)::int n from users where email like '%@example.invalid'");
  const identity=await runtime.query("select current_user='jurisvia_app' expected,not rolsuper and not rolbypassrls compliant from pg_roles where rolname=current_user");
  console.log(JSON.stringify({connections:true,migrations:migrations.rows[0].n,rlsTables:rls.rows[0].n,rlsForced:rls.rows[0].secured,policies:policies.rows[0].n,dataApiBusinessGrants:grants.rows[0].n,businessRows:rows.rows[0].n,fixtureUsers:fixtures.rows[0].n,runtimeIdentity:identity.rows[0]?.expected===true,runtimeRestricted:identity.rows[0]?.compliant===true}));
} catch(error) { console.log(JSON.stringify({connections:false,code:error?.code??"unknown"})); process.exitCode=1; }
finally { await runtime.end().catch(()=>undefined); await admin.end().catch(()=>undefined); }
