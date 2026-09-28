import dotenv from "dotenv";
import { buildApp } from "./app.js";
import { parseServerEnv } from "./env/index.js";
import { getPrismaClient } from "./lib/prisma.js";
import { createShutdownHandler } from "./lib/shutdown.js";

dotenv.config({ quiet: true });

const env = parseServerEnv();
const prisma = getPrismaClient(env.DATABASE_URL);
const app = await buildApp({
  database: { async check() { await prisma.$queryRaw`SELECT 1`; } },
  environment: env.NODE_ENV,
  logger: { level: env.LOG_LEVEL, redact: ["req.headers.authorization", "req.headers.cookie"] },
  webOrigin: env.WEB_ORIGIN,
});

const shutdown = createShutdownHandler({
  closeApplication: () => app.close(),
  disconnectDatabase: () => prisma.$disconnect(),
  logInfo: (context, message) => app.log.info(context, message),
  logError: (context, message) => app.log.error({ err: context.error, signal: context.signal }, message),
  setExitCode: (code) => { process.exitCode = code; },
});

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.fatal({ err: error }, "server failed to start");
  await prisma.$disconnect();
  process.exitCode = 1;
}
