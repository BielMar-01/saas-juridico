import { z } from "zod";

const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.url().optional());
const optionalSecret = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  HOST: z.string().min(1).default("127.0.0.1"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  DATABASE_URL: optionalUrl,
  DIRECT_URL: optionalUrl,
  SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: optionalSecret,
  SUPABASE_SECRET_KEY: optionalSecret,
  SUPABASE_JWKS_URL: optionalUrl,
  INVITATION_TOKEN_SECRET: optionalSecret,
  INVITATION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(72),
  INVITATION_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(10).max(86400).default(60),
});

export type ApiEnv = z.infer<typeof baseSchema> & { DATABASE_URL: string; SUPABASE_URL: string; SUPABASE_JWKS_URL: string; SUPABASE_PUBLISHABLE_KEY: string; INVITATION_TOKEN_SECRET: string };

export function parseServerEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = baseSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error("Configuração inválida da API: confira as variáveis documentadas em apps/api/.env.example.");
  }
  if (!parsed.data.DATABASE_URL || !parsed.data.SUPABASE_URL || !parsed.data.SUPABASE_JWKS_URL || !parsed.data.SUPABASE_PUBLISHABLE_KEY || !parsed.data.INVITATION_TOKEN_SECRET || parsed.data.INVITATION_TOKEN_SECRET.length < 32) {
    throw new Error("Configuração inválida da API: DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_JWKS_URL e INVITATION_TOKEN_SECRET (mínimo 32 caracteres) são obrigatórias para iniciar o servidor.");
  }
  return parsed.data as ApiEnv;
}
