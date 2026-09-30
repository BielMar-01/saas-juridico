import { buildApp } from "./app.js";
import { AuthService } from "./auth/service.js";
import { SupabaseAuthIdentityProvider } from "./auth/identity-provider.js";
import { createJwtVerifier } from "./auth/jwt.js";
import { ClientService } from "./clients/service.js";
import type { ApiEnv } from "./env/index.js";
import { getPrismaClient } from "./lib/prisma.js";
import { SafeDevelopmentInvitationDelivery, UnavailableInvitationDelivery } from "./team/delivery.js";
import { TeamService } from "./team/service.js";


export async function createRuntime(env: ApiEnv) {
  const prisma = getPrismaClient(env.DATABASE_URL);
  const issuer = env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1";
  const verifier = createJwtVerifier({ jwksUrl: env.SUPABASE_JWKS_URL, issuer, audience: "authenticated" });
  const authService = new AuthService(prisma, verifier);
  const delivery = env.NODE_ENV === "production" ? new UnavailableInvitationDelivery() : new SafeDevelopmentInvitationDelivery();
  const teamService = new TeamService(
    prisma,
    delivery,
    new SupabaseAuthIdentityProvider(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY),
    env.INVITATION_TOKEN_SECRET,
    env.INVITATION_TTL_HOURS,
    env.INVITATION_RESEND_COOLDOWN_SECONDS,
  );
  const app = await buildApp({
    database: { async check() { await prisma.$queryRawUnsafe("SELECT 1"); } },
    environment: env.NODE_ENV,
    logger: { level: env.LOG_LEVEL, redact: ["req.headers.authorization", "req.headers.cookie", "req.headers.x-organization-id", "req.body.token"] },
    webOrigin: env.WEB_ORIGIN,
    authService,
    clientService: new ClientService(prisma),
    teamService,
    trustProxy: env.NODE_ENV === "production",
  });
  return { app, prisma };
}

export function createRuntimeCache(factory: typeof createRuntime = createRuntime) {
  let applicationPromise: ReturnType<typeof createRuntime> | undefined;
  return (env: ApiEnv) => {
    applicationPromise ??= factory(env);
    return applicationPromise;
  };
}

export const getServerlessRuntime = createRuntimeCache();
