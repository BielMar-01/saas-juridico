import dotenv from "dotenv";
import { parseServerEnv } from "./env/index.js";
import { createRuntime } from "./runtime.js";
import { createShutdownHandler } from "./lib/shutdown.js";

dotenv.config({ quiet: true });
const env = parseServerEnv();
const { app, prisma } = await createRuntime(env);
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