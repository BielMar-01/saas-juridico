import type { AuthService, Principal } from "../src/auth/service.js";
import type { ClientService } from "../src/clients/service.js";
import type { TeamService } from "../src/team/service.js";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

const organizationId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });

async function create(role: "OWNER" | "ADMIN" | "LAWYER", aal: "aal1" | "aal2") {
  const principal: Principal = { authUserId: userId, userId, name: "Fixture", email: "fixture@example.invalid", aal, organization: { organizationId, name: "Fixture", slug: "fixture", role }, organizations: [] };
  const authService = { authenticate: async () => principal, verifyBearer: async () => ({ claims: { sub: userId }, token: "opaque" }) } as unknown as AuthService;
  const clientService = {} as ClientService;
  const member = { id: userId, role: "LAWYER", status: "ACTIVE" };
  const teamService = {
    listMembers: async () => [member], getMember: async () => member, updateRole: async () => member, updateStatus: async () => member,
    listInvitations: async () => [], createInvitation: async () => ({ id: userId }), resendInvitation: async () => ({ id: userId }),
    cancelInvitation: async () => ({ id: userId }), acceptInvitation: async () => ({ organizationId, membershipId: userId, role: "LAWYER" }),
  } as unknown as TeamService;
  const app = await buildApp({ authService, clientService, teamService });
  apps.push(app);
  return app;
}

describe("team route authorization", () => {
  it.each(["OWNER", "ADMIN"] as const)("requires AAL2 for %s team routes", async (role) => {
    const aal1 = await create(role, "aal1");
    const denied = await aal1.inject({ method: "GET", url: "/api/v1/team/members", headers: { authorization: "Bearer opaque", "x-organization-id": organizationId } });
    expect(denied.statusCode).toBe(403);
    const aal2 = await create(role, "aal2");
    const allowed = await aal2.inject({ method: "GET", url: "/api/v1/team/members", headers: { authorization: "Bearer opaque", "x-organization-id": organizationId } });
    expect(allowed.statusCode).toBe(200);
  });

  it("denies non-manager roles and rejects OWNER invitations", async () => {
    const app = await create("LAWYER", "aal2");
    const denied = await app.inject({ method: "GET", url: "/api/v1/team/invitations", headers: { authorization: "Bearer opaque", "x-organization-id": organizationId } });
    expect(denied.statusCode).toBe(403);
    const owner = await create("OWNER", "aal2");
    const invalid = await owner.inject({ method: "POST", url: "/api/v1/team/invitations", headers: { authorization: "Bearer opaque", "x-organization-id": organizationId }, payload: { email: "new@example.invalid", role: "OWNER" } });
    expect(invalid.statusCode).toBe(400);
  });

  it("accepts an invitation without a tenant header", async () => {
    const app = await create("LAWYER", "aal1");
    const response = await app.inject({ method: "POST", url: "/api/v1/invitations/accept", headers: { authorization: "Bearer opaque" }, payload: { token: "a".repeat(43) } });
    expect(response.statusCode).toBe(200);
  });
});