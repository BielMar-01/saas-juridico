import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import { registerErrorHandling } from "./plugins/errors.js";
import { registerInfrastructure } from "./plugins/infrastructure.js";
import { healthRoutes, type DatabaseHealth } from "./routes/health.js";
import { sanitizeRequestId } from "./utils/request-id.js";

export interface BuildAppOptions {
  database?: DatabaseHealth;
  environment?: string;
  logger?: FastifyServerOptions["logger"];
  webOrigin?: string;
}

const unavailableDatabase: DatabaseHealth = {
  async check() { throw new Error("Database dependency was not configured."); },
};

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    requestIdHeader: false,
    genReqId: (request) => sanitizeRequestId(request.headers["x-request-id"]),
  });
  app.decorate("apiConfig", {
    service: "jurisvia-api",
    version: "0.1.0",
    environment: options.environment ?? "test",
  });
  app.addHook("onRequest", (request, reply, done) => {
    reply.header("x-request-id", request.id);
    done();
  });
  registerErrorHandling(app);
  await registerInfrastructure(app, options.webOrigin ?? "http://localhost:3000");
  await app.register(healthRoutes, options.database ?? unavailableDatabase);
  return app;
}
