import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyWebhook } = vi.hoisted(() => ({ verifyWebhook: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    webhooks = { verify: verifyWebhook };
  },
}));

import { buildApp } from "../src/app.js";

const secret = "test-webhook-secret-not-a-real-credential";
const headers = {
  "content-type": "application/json",
  "svix-id": "evt_http_1",
  "svix-timestamp": "1924992000",
  "svix-signature": "v1,test-signature",
};

function prismaMock() {
  return { $queryRaw: vi.fn().mockResolvedValue([{ recorded: true }]) };
}

describe("Resend webhook HTTP contract", () => {
  beforeEach(() => verifyWebhook.mockReset());

  it("keeps the endpoint absent when webhook verification is disabled", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "POST", url: "/api/v1/webhooks/resend", headers, payload: "{}" });
    expect(response.statusCode).toBe(404);
    expect(response.body).not.toContain(secret);
    await app.close();
  });

  it("verifies the exact raw body and processes a valid event", async () => {
    const prisma = prismaMock();
    const payload = JSON.stringify({ type: "email.bounced", created_at: "2030-01-02T00:00:00Z", data: { email_id: "msg_1", to: ["Person@Example.com"] } });
    verifyWebhook.mockReturnValue(JSON.parse(payload));
    const app = await buildApp({ resendWebhook: { prisma: prisma as never, secret } });
    const response = await app.inject({ method: "POST", url: "/api/v1/webhooks/resend", headers, payload });
    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({ data: { accepted: true } });
    expect(verifyWebhook).toHaveBeenCalledWith(expect.objectContaining({ payload, webhookSecret: secret, headers: { id: headers["svix-id"], timestamp: headers["svix-timestamp"], signature: headers["svix-signature"] } }));
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    expect(response.body).not.toContain(secret);
    await app.close();
  });

  it("accepts a verified replay while delegating idempotency to the database", async () => {
    const prisma = prismaMock();
    prisma.$queryRaw.mockResolvedValueOnce([{ recorded: true }]).mockResolvedValueOnce([{ recorded: false }]);
    verifyWebhook.mockReturnValue({ type: "email.delivered", data: { email_id: "msg_replay" } });
    const app = await buildApp({ resendWebhook: { prisma: prisma as never, secret } });
    const first = await app.inject({ method: "POST", url: "/api/v1/webhooks/resend", headers, payload: "{}" });
    const replay = await app.inject({ method: "POST", url: "/api/v1/webhooks/resend", headers, payload: "{}" });
    expect([first.statusCode, replay.statusCode]).toEqual([202, 202]);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    await app.close();
  });

  it.each([
    ["missing signature", { ...headers, "svix-signature": "" }],
    ["invalid signature", { ...headers, "svix-signature": "invalid" }],
  ])("returns 401 for %s without touching persistence", async (_label, requestHeaders) => {
    const prisma = prismaMock();
    if (requestHeaders["svix-signature"]) verifyWebhook.mockReturnValue(null);
    const app = await buildApp({ resendWebhook: { prisma: prisma as never, secret } });
    const response = await app.inject({ method: "POST", url: "/api/v1/webhooks/resend", headers: requestHeaders, payload: "{}" });
    expect(response.statusCode).toBe(401);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(response.body).not.toContain(secret);
    await app.close();
  });

  it("handles a verified unknown event without persistence or disclosure", async () => {
    const prisma = prismaMock();
    verifyWebhook.mockReturnValue({ type: "future.event", data: {} });
    const app = await buildApp({ resendWebhook: { prisma: prisma as never, secret } });
    const response = await app.inject({ method: "POST", url: "/api/v1/webhooks/resend", headers, payload: JSON.stringify({ future: true }) });
    expect(response.statusCode).toBe(202);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(response.body).not.toContain(secret);
    await app.close();
  });

  it("rejects malformed JSON safely before verification", async () => {
    const prisma = prismaMock();
    const app = await buildApp({ resendWebhook: { prisma: prisma as never, secret } });
    const response = await app.inject({ method: "POST", url: "/api/v1/webhooks/resend", headers, payload: "{" });
    expect(response.statusCode).toBe(400);
    expect(verifyWebhook).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(response.body).not.toContain(secret);
    await app.close();
  });
});