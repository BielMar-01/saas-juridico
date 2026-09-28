import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export async function registerInfrastructure(app: FastifyInstance, webOrigin: string): Promise<void> {
  await app.register(cors, { origin: webOrigin, credentials: true });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie);
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(swagger, {
    openapi: {
      info: { title: "JurisVia API", version: app.apiConfig.version, description: "API de domínio do SaaS jurídico." },
      servers: [{ url: "/api/v1" }],
    },
  });
  await app.register(swaggerUi, { routePrefix: "/api/docs" });
}
