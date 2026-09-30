import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import dotenv from "dotenv";
import pg from "pg";

const businessTables = ["users", "organizations", "organization_memberships", "invitations", "clients", "cases", "lawsuits", "tasks", "documents", "client_portal_publications", "audit_logs"];
const expectedPoliciesPerTable = 4;
const migrationsRoot = new URL("../prisma/migrations/", import.meta.url);
const migrationName = (await readdir(migrationsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().at(-1);
if (!migrationName) throw new Error("No migration found.");
const migrationUrl = new URL(`${migrationName}/migration.sql`, migrationsRoot);
const sql = await readFile(migrationUrl, "utf8");
const env = dotenv.parse(await readFile(new URL("../.env", import.meta.url), "utf8"));
const destructive = { drop: /^\s*DROP\s+(?:TABLE|SCHEMA|DATABASE|TYPE)\b/im.test(sql), truncate: /^\s*TRUNCATE\s/im.test(sql), deleteData: /^\s*DELETE\s+FROM\s/im.test(sql), dropColumn: /\bALTER\s+TABLE\b[^;]*\bDROP\s+COLUMN\b/is.test(sql) };
const secretPatterns = (sql.match(/postgres(?:ql)?:\/\/|SUPABASE_(?:SECRET|SERVICE_ROLE)|PASSWORD\s+'[^']+'/gi) ?? []).length;
if (Object.values(destructive).some(Boolean) || secretPatterns !== 0) throw new Error("Migration static preflight rejected.");
const admin = new pg.Client({ connectionString: env.DIRECT_URL, connectionTimeoutMillis: 15000 });
try {
  await admin.connect();
  const record = await admin.query("SELECT finished_at IS NOT NULL AND rolled_back_at IS NULL applied,checksum FROM _prisma_migrations WHERE migration_name=$1 ORDER BY started_at DESC LIMIT 1", [migrationName]);
  const applied = record.rows[0]?.applied === true;
  let transactionRollback = false;
  if (!applied) { await admin.query("BEGIN"); try { await admin.query(sql); await admin.query("ROLLBACK"); transactionRollback = true; } catch (error) { await admin.query("ROLLBACK").catch(() => undefined); throw error; } }
  const checksum = createHash("sha256").update(sql).digest("hex");
  const checksumMatches = !applied || record.rows[0]?.checksum === checksum;
  const inventory = await admin.query("SELECT expected.name,coalesce(c.relrowsecurity,false) rls,coalesce(c.relforcerowsecurity,false) forced,coalesce(p.count,0)::int policies FROM unnest($1::text[]) expected(name) LEFT JOIN pg_class c ON c.relnamespace='public'::regnamespace AND c.relname=expected.name LEFT JOIN (SELECT tablename,count(*)::int count FROM pg_policies WHERE schemaname='public' AND 'jurisvia_app'=ANY(roles) GROUP BY tablename) p ON p.tablename=expected.name ORDER BY expected.name", [businessTables]);
  const existing = await admin.query("SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])", [businessTables]);
  const existingNames = new Set(existing.rows.map((row) => row.relname));
  const actuallyMissing = businessTables.filter((name) => !existingNames.has(name));
  const unsecuredTables = inventory.rows.filter((row) => existingNames.has(row.name) && (!row.rls || !row.forced)).map((row) => row.name);
  const policyMismatches = inventory.rows.filter((row) => existingNames.has(row.name) && row.policies !== expectedPoliciesPerTable).map((row) => ({ table: row.name, policies: row.policies }));
  const grants = await admin.query("SELECT count(*)::int count FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee=ANY($1::text[]) AND table_name=ANY($2::text[])", [["anon", "authenticated"], businessTables]);
  const cmd = process.env.ComSpec ?? "cmd.exe";
  const drift = spawnSync(cmd, ["/d", "/s", "/c", "pnpm.cmd exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code"], { cwd: new URL("..", import.meta.url), encoding: "utf8", windowsHide: true });
  const catalogValid = actuallyMissing.length === 0 && unsecuredTables.length === 0 && policyMismatches.length === 0;
  const result = { staticAnalysis: true, destructive, secretPatterns, applied, checksumMatches, transactionRollback, expectedRlsTables: businessTables.length, expectedPolicies: businessTables.length * expectedPoliciesPerTable, missingTables: actuallyMissing, unsecuredTables, policyMismatches, dataApiBusinessGrants: grants.rows[0].count, driftClean: drift.status === 0, catalogValid };
  console.log(JSON.stringify(result));
  if (!checksumMatches || drift.status !== 0 || (applied && (!catalogValid || grants.rows[0].count !== 0))) process.exitCode = 1;
} catch { console.log(JSON.stringify({ staticAnalysis: true, appliedStateValidated: false, category: "migration_preflight_failed" })); process.exitCode = 1; }
finally { await admin.end().catch(() => undefined); }