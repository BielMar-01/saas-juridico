import { describe, expect, it } from "vitest";
import { parseServerEnv } from "../src/env/index.js";

describe("environment contract", () => {
  it("accepts the current Supabase variable names", () => {
    const env = parseServerEnv({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://placeholder.invalid/database",
      SUPABASE_URL: "https://project.invalid",
      SUPABASE_PUBLISHABLE_KEY: "publishable-placeholder",
      SUPABASE_SECRET_KEY: "secret-placeholder",
      SUPABASE_JWKS_URL: "https://project.invalid/auth/v1/.well-known/jwks.json",
    });
    expect(env.SUPABASE_PUBLISHABLE_KEY).toBe("publishable-placeholder");
    expect(env.SUPABASE_SECRET_KEY).toBe("secret-placeholder");
    expect(env.SUPABASE_JWKS_URL).toBe("https://project.invalid/auth/v1/.well-known/jwks.json");
    expect(env).not.toHaveProperty(["SUPABASE", "ANON", "KEY"].join("_"));
    expect(env).not.toHaveProperty(["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_"));
  });
});
