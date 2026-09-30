import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createVercelHandler } from "../api/[...path].js";
import type { ApiEnv } from "../src/env/index.js";
import { createRuntimeCache } from "../src/runtime.js";

const env = {} as ApiEnv;

describe("Vercel serverless entrypoint", () => {
  it("preserves the original request path and never owns connection shutdown", async () => {
    const ready = vi.fn(async () => undefined);
    const emit = vi.fn();
    const resolveRuntime = vi.fn(async () => ({ app: { ready, server: { emit } } }));
    const handler = createVercelHandler(resolveRuntime, () => env);
    const request = { url: "/api/v1/health/database?probe=1" } as IncomingMessage;
    const response = {} as ServerResponse;
    await handler(request, response);
    expect(resolveRuntime).toHaveBeenCalledOnce();
    expect(ready).toHaveBeenCalledOnce();
    expect(emit).toHaveBeenCalledWith("request", request, response);
    expect(request.url).toBe("/api/v1/health/database?probe=1");
  });

  it("creates the runtime once per warm serverless instance", async () => {
    const runtime = { app: {} as never, prisma: {} as never };
    const factory = vi.fn(async () => runtime);
    const cached = createRuntimeCache(factory as never);
    await expect(cached(env)).resolves.toBe(runtime);
    await expect(cached(env)).resolves.toBe(runtime);
    expect(factory).toHaveBeenCalledOnce();
  });

  it("does not listen, migrate, or disconnect in the request entrypoint", async () => {
    const source = await readFile(new URL("../api/[...path].ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/\.listen\s*\(/);
    expect(source).not.toMatch(/migrate/i);
    expect(source).not.toMatch(/\$disconnect/);
  });
});