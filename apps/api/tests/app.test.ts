import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { AppError } from "../src/errors/app-error.js";

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });

async function create(database?: { check(): Promise<void> }) {
  const app = await buildApp(database ? { database } : {});
  apps.push(app);
  return app;
}

describe("API foundation", () => {
  it("returns the liveness envelope without a database", async () => {
    const app = await create();
    const response = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: { status: "ok", service: "jurisvia-api", version: "0.1.0", environment: "test" },
      meta: {},
    });
    expect(response.json().requestId).toEqual(expect.any(String));
    expect(response.json().data.timestamp).toEqual(expect.any(String));
  });

  it("preserves a valid caller request ID in the reply and envelope", async () => {
    const app = await create();
    const response = await app.inject({
      method: "GET", url: "/api/v1/health", headers: { "x-request-id": "trace_123:a.b-c" },
    });
    expect(response.headers["x-request-id"]).toBe("trace_123:a.b-c");
    expect(response.json().requestId).toBe("trace_123:a.b-c");
  });

  it.each([
    ["an ID longer than 128 characters", "a".repeat(129)],
    ["an ID with internal spaces", "unsafe value"],
    ["an ID with unsafe characters", "unsafe/value"],
  ])("replaces %s with a safe generated UUID", async (_label, requestId) => {
    const app = await create();
    const response = await app.inject({
      method: "GET", url: "/api/v1/health", headers: { "x-request-id": requestId },
    });
    const generated = response.json().requestId as string;
    expect(generated).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(response.headers["x-request-id"]).toBe(generated);
    expect(generated).not.toBe(requestId);
  });

  it("trims harmless surrounding whitespace before validation", async () => {
    const app = await create();
    const response = await app.inject({
      method: "GET", url: "/api/v1/health", headers: { "x-request-id": "  trace-123  " },
    });
    expect(response.json().requestId).toBe("trace-123");
    expect(response.headers["x-request-id"]).toBe("trace-123");
  });

  it("reports database availability through an injected dependency", async () => {
    const app = await create({ async check() {} });
    const response = await app.inject({ method: "GET", url: "/api/v1/health/database" });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe("available");
  });

  it("maps a controlled database failure without leaking its cause", async () => {
    const app = await create({ async check() { throw new Error("secret connection detail"); } });
    const response = await app.inject({ method: "GET", url: "/api/v1/health/database" });
    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain("secret connection detail");
    expect(response.json().error.code).toBe("DATABASE_UNAVAILABLE");
  });

  it("returns the standardized 404 response", async () => {
    const app = await create();
    const response = await app.inject({ method: "GET", url: "/api/v1/missing" });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("standardizes framework validation errors", async () => {
    const app = await create();
    app.post("/test-validation", {
      schema: { body: { type: "object", required: ["name"], properties: { name: { type: "string" } } } },
    }, async () => ({ ok: true }));
    const response = await app.inject({ method: "POST", url: "/test-validation", payload: {} });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("standardizes application errors", async () => {
    const app = await create();
    app.get("/test-conflict", async () => { throw new AppError("CONFLICT", "Registro conflitante.", 409); });
    const response = await app.inject({ method: "GET", url: "/test-conflict" });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { code: "CONFLICT", message: "Registro conflitante." } });
  });
});
