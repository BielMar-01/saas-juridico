import { describe, expect, it } from "vitest";
import { createInvitationToken, hashInvitationToken } from "../src/team/token.js";
import { SafeDevelopmentInvitationDelivery } from "../src/team/delivery.js";

describe("invitation token and safe delivery", () => {
  it("generates 32-byte opaque tokens and only deterministic HMAC hashes", () => {
    const secret = "0123456789abcdef0123456789abcdef";
    const first = createInvitationToken(secret);
    const second = createInvitationToken(secret);
    expect(first.token).not.toBe(second.token);
    expect(Buffer.from(first.token, "base64url")).toHaveLength(32);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInvitationToken(first.token, secret)).toBe(first.hash);
    expect(first.hash).not.toContain(first.token);
  });

  it("development delivery does not persist or expose the token", async () => {
    const delivery = new SafeDevelopmentInvitationDelivery();
    await expect(delivery.send({ email: "fixture@example.invalid", token: "opaque", expiresAt: new Date(), organizationName: "Fixture" })).resolves.toBeUndefined();
    expect(delivery).toEqual({});
  });
});