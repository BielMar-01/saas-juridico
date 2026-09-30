import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import dotenv from "dotenv";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Principal } from "../src/auth/service.js";
import type { AuthIdentityProvider, VerifiedAuthIdentity } from "../src/auth/identity-provider.js";
import type { InvitationDelivery } from "../src/team/delivery.js";
import { TeamService } from "../src/team/service.js";
import { createPrismaClient } from "../src/lib/prisma.js";
import { withTenant } from "../src/lib/tenant-context.js";

const env = dotenv.parse(await readFile(resolve(process.cwd(), ".env"), "utf8"));
const marker = randomUUID();
const ids = { orgA: randomUUID(), orgB: randomUUID(), ownerA: randomUUID(), adminA: randomUUID(), lawyerA: randomUUID(), ownerB: randomUUID(), memOwnerA: randomUUID(), memAdminA: randomUUID(), memLawyerA: randomUUID(), memOwnerB: randomUUID() };
const secret = "team-test-secret-0123456789abcdef-team";
let admin: pg.Client;
if (!env.DATABASE_URL || !env.DIRECT_URL) throw new Error("Database test configuration is missing.");
const prisma = createPrismaClient(env.DATABASE_URL);
const tokens = new Map<string, string>();
const deliveries = new Map<string, number>();
let identity: VerifiedAuthIdentity = { authUserId: randomUUID(), email: "unset@example.invalid", name: "Invited" };
const delivery: InvitationDelivery = { async send(input) { tokens.set(input.email, input.token); deliveries.set(input.email, (deliveries.get(input.email) ?? 0) + 1); } };
const identityProvider: AuthIdentityProvider = { async getVerifiedIdentity() { return identity; } };
const service = new TeamService(prisma, delivery, identityProvider, secret, 72, 60);
const authService = { async verifyBearer() { return { claims: { sub: identity.authUserId }, token: "opaque-access-token" }; } };

function principal(userId: string, role: "OWNER" | "ADMIN", org = ids.orgA): Principal {
  return { authUserId: userId, userId, name: role, email: role.toLowerCase() + "-" + marker + "-" + org.slice(0, 8) + "@example.invalid", aal: "aal2", organization: { organizationId: org, name: "Org " + marker, slug: "org-" + marker, role }, organizations: [] };
}
const owner = principal(ids.ownerA, "OWNER");
const manager = principal(ids.adminA, "ADMIN");
const ownerB = principal(ids.ownerB, "OWNER", ids.orgB);

beforeAll(async () => {
  admin = new pg.Client({ connectionString: env.DIRECT_URL, connectionTimeoutMillis: 15000 });
  await admin.connect();
  await admin.query("INSERT INTO users(id,auth_user_id,name,email,status,updated_at) VALUES($1,$1,'Owner A',$2,'ACTIVE',now()),($3,$3,'Admin A',$4,'ACTIVE',now()),($5,$5,'Lawyer A',$6,'ACTIVE',now()),($7,$7,'Owner B',$8,'ACTIVE',now())", [ids.ownerA, owner.email, ids.adminA, manager.email, ids.lawyerA, "lawyer-" + marker + "@example.invalid", ids.ownerB, ownerB.email]);
  await admin.query("INSERT INTO organizations(id,name,slug,status,updated_at) VALUES($1,$2,$3,'ACTIVE',now()),($4,$5,$6,'ACTIVE',now())", [ids.orgA, "Org A " + marker, "org-a-" + marker, ids.orgB, "Org B " + marker, "org-b-" + marker]);
  await admin.query("INSERT INTO organization_memberships(id,organization_id,user_id,role,status,accepted_at,updated_at) VALUES($1,$2,$3,'OWNER','ACTIVE',now(),now()),($4,$2,$5,'ADMIN','ACTIVE',now(),now()),($6,$2,$7,'LAWYER','ACTIVE',now(),now()),($8,$9,$10,'OWNER','ACTIVE',now(),now())", [ids.memOwnerA, ids.orgA, ids.ownerA, ids.memAdminA, ids.adminA, ids.memLawyerA, ids.lawyerA, ids.memOwnerB, ids.orgB, ids.ownerB]);
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
  if (!admin) return;
  try {
    await admin.query("BEGIN");
    await admin.query("SELECT set_config('app.allow_admin_cleanup','on',true)");
    await admin.query("UPDATE organizations SET status='INACTIVE' WHERE id=ANY($1::uuid[])", [[ids.orgA, ids.orgB]]);
    for (const table of ["audit_logs", "invitations", "organization_memberships"]) await admin.query("DELETE FROM " + table + " WHERE organization_id=ANY($1::uuid[])", [[ids.orgA, ids.orgB]]);
    await admin.query("DELETE FROM organizations WHERE id=ANY($1::uuid[])", [[ids.orgA, ids.orgB]]);
    await admin.query("DELETE FROM users WHERE email LIKE $1", ["%" + marker + "%"]);
    await admin.query("COMMIT");
  } catch (error) {
    await admin.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await admin.end();
  }
}, 30000);

describe("team and invitation integration", () => {
  it("enforces target role matrix, owner immutability and self-disable protection", async () => {
    await expect(service.createInvitation(manager, { email: "admin-target-" + marker + "@example.invalid", role: "ADMIN" })).rejects.toMatchObject({ statusCode: 403 });
    const invited = await service.createInvitation(owner, { email: "admin-target-" + marker + "@example.invalid", role: "ADMIN" });
    expect(invited.role).toBe("ADMIN");
    await expect(service.updateRole(owner, ids.memOwnerA, "ADMIN")).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.updateStatus(owner, ids.memOwnerA, "SUSPENDED")).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.updateRole(manager, ids.memAdminA, "LAWYER")).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.updateStatus(manager, ids.memAdminA, "SUSPENDED")).rejects.toMatchObject({ statusCode: 403 });
    expect((await service.updateRole(owner, ids.memLawyerA, "ASSISTANT")).role).toBe("ASSISTANT");
    expect((await service.updateStatus(owner, ids.memLawyerA, "SUSPENDED")).status).toBe("SUSPENDED");
    await service.updateStatus(owner, ids.memLawyerA, "ACTIVE");
    for (const restrictedRole of ["FINANCIAL", "VIEWER"] as const) {
      await admin.query("UPDATE organization_memberships SET role=$1 WHERE id=$2", [restrictedRole, ids.memLawyerA]);
      await expect(service.updateRole(manager, ids.memLawyerA, "LAWYER")).rejects.toMatchObject({ statusCode: 403 });
      await expect(service.updateStatus(manager, ids.memLawyerA, "SUSPENDED")).rejects.toMatchObject({ statusCode: 403 });
      await expect(withTenant(prisma, { organizationId: ids.orgA, userId: ids.adminA }, (tx) => tx.$queryRaw`SELECT * FROM private.update_member_role(${ids.memLawyerA}::uuid,'LAWYER'::"OrganizationRole")`)).rejects.toBeDefined();
      await expect(withTenant(prisma, { organizationId: ids.orgA, userId: ids.adminA }, (tx) => tx.$queryRaw`SELECT * FROM private.update_member_status(${ids.memLawyerA}::uuid,'SUSPENDED'::"MembershipStatus")`)).rejects.toBeDefined();
      expect((await service.updateStatus(owner, ids.memLawyerA, "SUSPENDED")).status).toBe("SUSPENDED");
      await service.updateStatus(owner, ids.memLawyerA, "ACTIVE");
    }
    await admin.query("UPDATE organization_memberships SET role='LAWYER' WHERE id=$1", [ids.memLawyerA]);
  }, 15000);

  it("isolates tenant resources and enforces pending uniqueness", async () => {
    const foreign = await service.createInvitation(ownerB, { email: "foreign-" + marker + "@example.invalid", role: "LAWYER" });
    await expect(service.cancelInvitation(owner, foreign.id)).rejects.toMatchObject({ statusCode: 404 });
    const email = "duplicate-" + marker + "@example.invalid";
    const results = await Promise.allSettled([service.createInvitation(owner, { email, role: "LAWYER" }), service.createInvitation(owner, { email, role: "LAWYER" })]);
    expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((item) => item.status === "rejected")).toHaveLength(1);
  });

  it("enforces persistent resend cooldown, rotates tokens and cancels safely", async () => {
    const email = "resend-" + marker + "@example.invalid";
    const invitation = await service.createInvitation(owner, { email, role: "VIEWER" });
    const firstToken = tokens.get(email);
    await expect(service.resendInvitation(owner, invitation.id)).rejects.toMatchObject({ statusCode: 429 });
    await admin.query("UPDATE invitations SET last_sent_at=now()-interval '2 minutes' WHERE id=$1", [invitation.id]);
    const beforeDeliveries = deliveries.get(email);
    const resends = await Promise.allSettled([service.resendInvitation(owner, invitation.id), service.resendInvitation(owner, invitation.id)]);
    expect(resends.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    const resendFailure = resends.find((item) => item.status === "rejected");
    expect(resendFailure).toMatchObject({ reason: { statusCode: 429 } });
    expect(deliveries.get(email)).toBe((beforeDeliveries ?? 0) + 1);
    const currentToken = tokens.get(email)!;
    expect(currentToken).not.toBe(firstToken);
    identity = { authUserId: randomUUID(), email, name: "Resend" };
    await expect(service.acceptInvitation("Bearer opaque", firstToken!, authService)).rejects.toMatchObject({ statusCode: 400 });
    await service.cancelInvitation(owner, invitation.id);
    await expect(service.acceptInvitation("Bearer opaque", currentToken, authService)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects expired and mismatched identities", async () => {
    const expiredEmail = "expired-" + marker + "@example.invalid";
    const expired = await service.createInvitation(owner, { email: expiredEmail, role: "LAWYER" });
    await admin.query("UPDATE invitations SET expires_at=now()-interval '1 minute' WHERE id=$1", [expired.id]);
    identity = { authUserId: randomUUID(), email: expiredEmail, name: "Expired" };
    await expect(service.acceptInvitation("Bearer opaque", tokens.get(expiredEmail)!, authService)).rejects.toMatchObject({ statusCode: 400 });
    const listed = await service.listInvitations(owner);
    expect(listed.find((item) => item.id === expired.id)?.status).toBe("EXPIRED");
    const recreated = await Promise.allSettled([
      service.createInvitation(owner, { email: expiredEmail, role: "LAWYER" }),
      service.createInvitation(owner, { email: expiredEmail, role: "LAWYER" }),
    ]);
    expect(recreated.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(recreated.filter((item) => item.status === "rejected")).toHaveLength(1);
    const expectedEmail = "expected-" + marker + "@example.invalid";
    await service.createInvitation(owner, { email: expectedEmail, role: "LAWYER" });
    identity = { authUserId: randomUUID(), email: "different-" + marker + "@example.invalid", name: "Mismatch" };
    await expect(service.acceptInvitation("Bearer opaque", tokens.get(expectedEmail)!, authService)).rejects.toMatchObject({ statusCode: 400 });
  }, 15000);

  it("never reactivates globally blocked users while accepting invitations", async () => {
    for (const blockedStatus of ["SUSPENDED", "INACTIVE"] as const) {
      const email = blockedStatus.toLowerCase() + "-" + marker + "@example.invalid";
      const authUserId = randomUUID();
      const userId = randomUUID();
      const invitation = await service.createInvitation(owner, { email, role: "LAWYER" });
      await admin.query("INSERT INTO users(id,auth_user_id,name,email,status,updated_at) VALUES($1,$2,$3,$4,$5,now())", [userId, authUserId, blockedStatus, email, blockedStatus]);
      if (blockedStatus === "SUSPENDED") await admin.query("INSERT INTO organization_memberships(id,organization_id,user_id,role,status,updated_at) VALUES($1,$2,$3,'LAWYER','SUSPENDED',now())", [randomUUID(), ids.orgB, userId]);
      identity = { authUserId, email, name: "Blocked" };
      await expect(service.acceptInvitation("Bearer opaque", tokens.get(email)!, authService)).rejects.toMatchObject({ statusCode: 400 });
      const state = await admin.query("SELECT status,(SELECT count(*)::int FROM organization_memberships WHERE user_id=$1 AND status='ACTIVE') active_memberships FROM users WHERE id=$1", [userId]);
      expect(state.rows[0]).toMatchObject({ status: blockedStatus, active_memberships: 0 });
      const inviteState = await admin.query("SELECT status FROM invitations WHERE id=$1", [invitation.id]);
      expect(inviteState.rows[0]?.status).toBe("PENDING");
    }
  });
  it("accepts once under concurrency and records audit without email or token", async () => {
    const email = "concurrent-" + marker + "@example.invalid";
    await service.createInvitation(owner, { email, role: "FINANCIAL" });
    identity = { authUserId: randomUUID(), email, name: "Concurrent Fixture" };
    const token = tokens.get(email)!;
    const results = await Promise.allSettled([service.acceptInvitation("Bearer opaque", token, authService), service.acceptInvitation("Bearer opaque", token, authService)]);
    expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((item) => item.status === "rejected")).toHaveLength(1);
    await expect(service.acceptInvitation("Bearer opaque", token, authService)).rejects.toMatchObject({ statusCode: 400 });
    const audit = await admin.query<{ leaked: boolean; accepted: number }>("SELECT bool_or(coalesce(metadata::text,'') LIKE $2 OR coalesce(metadata::text,'') LIKE $3) leaked,count(*) filter(where action='invitation.accepted')::int accepted FROM audit_logs WHERE organization_id=$1", [ids.orgA, "%" + email + "%", "%" + token + "%"]);
    expect(audit.rows[0]).toMatchObject({ leaked: false, accepted: 1 });
  });

  it("keeps invitation RLS forced and runtime grants minimal", async () => {
    const catalog = await admin.query<{ forced: boolean; delete_grant: boolean; policies: number }>("SELECT c.relrowsecurity AND c.relforcerowsecurity forced,has_table_privilege('jurisvia_app','public.invitations','DELETE') delete_grant,(SELECT count(*)::int FROM pg_policies WHERE schemaname='public' AND tablename='invitations' AND 'jurisvia_app'=any(roles)) policies FROM pg_class c WHERE c.oid='public.invitations'::regclass");
    expect(catalog.rows[0]).toEqual({ forced: true, delete_grant: false, policies: 4 });
  });
});