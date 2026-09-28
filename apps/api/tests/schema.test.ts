import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("multi-tenant schema invariants", () => {
  it("binds domain references and actors to the same organization", async () => {
    const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

    expect(schema).toContain("@@unique([organizationId, id])");
    expect(schema).toMatch(/client\s+Client\s+@relation\(fields: \[organizationId, clientId\], references: \[organizationId, id\]/);
    expect(schema).toMatch(/case\s+Case\??\s+@relation\(fields: \[organizationId, caseId\], references: \[organizationId, id\]/);
    expect(schema).toMatch(/responsibleMember\s+OrganizationMembership\?/);
    expect(schema).toMatch(/assignedMember\s+OrganizationMembership\?/);
    expect(schema).toMatch(/uploadedByMember\s+OrganizationMembership/);
    expect(schema).toMatch(/createdByMember\s+OrganizationMembership/);
    expect(schema).toMatch(/actorMembership\s+OrganizationMembership\?/);
    expect(schema).not.toMatch(/responsibleUser\s+User\?/);
    expect(schema).not.toMatch(/uploadedByUser\s+User/);
  });
});
