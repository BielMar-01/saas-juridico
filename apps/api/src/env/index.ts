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
});

export type ApiEnv = z.infer<typeof baseSchema> & { DATABASE_URL: string };

export function parseServerEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = baseSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error("Configuração inválida da API: confira as variáveis documentadas em apps/api/.env.example.");
  }
  if (!parsed.data.DATABASE_URL) {
    throw new Error("Configuração inválida da API: DATABASE_URL é obrigatória para iniciar o servidor.");
  }
  return parsed.data as ApiEnv;
}
