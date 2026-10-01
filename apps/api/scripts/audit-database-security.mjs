import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import pg from "pg";

const businessTables = ["users", "organizations", "organization_memberships", "invitations", "clients", "cases", "lawsuits", "tasks", "documents", "client_portal_publications", "audit_logs"];
const globalSecurityTables = ["platform_administrators", "platform_audit_logs", "email_deliveries", "email_webhook_events", "email_suppressions", "ownership_transfers", "notification_preferences", "account_identity_audits"];
const secureTables = [...businessTables, ...globalSecurityTables];
const expectedPoliciesPerTable = 4;
const env = dotenv.parse(await readFile(new URL("../.env", import.meta.url), "utf8"));
const admin = new pg.Client({ connectionString: env.DIRECT_URL, connectionTimeoutMillis: 15000 });
const runtime = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 15000 });
try {
  await admin.connect(); await runtime.connect();
  const migrations = await admin.query("SELECT count(*)::int n FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL");
  const inventory = await admin.query("SELECT expected.name,(c.oid IS NOT NULL) exists,coalesce(c.relrowsecurity,false) rls,coalesce(c.relforcerowsecurity,false) forced,coalesce(p.count,0)::int policies FROM unnest($1::text[]) expected(name) LEFT JOIN pg_class c ON c.relnamespace='public'::regnamespace AND c.relname=expected.name LEFT JOIN (SELECT tablename,count(*)::int count FROM pg_policies WHERE schemaname='public' AND 'jurisvia_app'=ANY(roles) GROUP BY tablename) p ON p.tablename=expected.name ORDER BY expected.name", [secureTables]);
  const missingTables = inventory.rows.filter((row) => !row.exists).map((row) => row.name);
  const unsecuredTables = inventory.rows.filter((row) => row.exists && (!row.rls || !row.forced)).map((row) => row.name);
  const policyMismatches = inventory.rows.filter((row) => businessTables.includes(row.name) && row.exists && row.policies !== expectedPoliciesPerTable).map((row) => ({ table: row.name, policies: row.policies }));
  const grants = await admin.query("SELECT count(*)::int n FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee=ANY($1::text[]) AND table_name=ANY($2::text[])", [["anon", "authenticated"], secureTables]);
  const rowCounts = await Promise.all(businessTables.map(async (table) => Number((await admin.query(`SELECT count(*)::int n FROM public.${table}`)).rows[0].n)));
  const fixtures = await admin.query("SELECT count(*)::int n FROM users WHERE email LIKE '%@example.invalid'");
  const identity = await runtime.query("SELECT current_user='jurisvia_app' expected,not rolsuper and not rolbypassrls compliant FROM pg_roles WHERE rolname=current_user");
  const catalogValid = missingTables.length === 0 && unsecuredTables.length === 0 && policyMismatches.length === 0;
  const result = { connections: true, migrations: migrations.rows[0].n, expectedRlsTables: secureTables.length, expectedPolicies: businessTables.length * expectedPoliciesPerTable, missingTables, unsecuredTables, policyMismatches, dataApiBusinessGrants: grants.rows[0].n, businessRows: rowCounts.reduce((sum, count) => sum + count, 0), fixtureUsers: fixtures.rows[0].n, runtimeIdentity: identity.rows[0]?.expected === true, runtimeRestricted: identity.rows[0]?.compliant === true, catalogValid };
  console.log(JSON.stringify(result));
  if (!catalogValid || grants.rows[0].n !== 0 || !result.runtimeIdentity || !result.runtimeRestricted) process.exitCode = 1;
} catch (error) { console.log(JSON.stringify({ connections: false, code: error?.code ?? "unknown" })); process.exitCode = 1; }
finally { await runtime.end().catch(() => undefined); await admin.end().catch(() => undefined); }