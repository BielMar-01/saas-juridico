import type { FastifyInstance } from "fastify";

export interface DatabaseHealth {
  check(): Promise<void>;
}

const successEnvelope = {
  type: "object",
  required: ["data", "meta", "requestId"],
  properties: {
    data: { type: "object", additionalProperties: true },
    meta: { type: "object" },
    requestId: { type: "string" },
  },
} as const;

export async function healthRoutes(app: FastifyInstance, database: DatabaseHealth): Promise<void> {
  app.get("/api/v1/health", {
    schema: {
      tags: ["Health"],
      summary: "Confirma que o processo da API está ativo.",
      response: { 200: successEnvelope },
    },
  }, async (request) => ({
    data: {
      status: "ok",
      service: app.apiConfig.service,
      version: app.apiConfig.version,
      environment: app.apiConfig.environment,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    meta: {},
    requestId: request.id,
  }));

  app.get("/api/v1/health/database", {
    schema: {
      tags: ["Health"],
      summary: "Confirma a disponibilidade da dependência PostgreSQL.",
      response: {
        200: successEnvelope,
        503: {
          type: "object",
          required: ["error", "requestId"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: { code: { type: "string" }, message: { type: "string" } },
            },
            requestId: { type: "string" },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      await database.check();
      return { data: { status: "available" }, meta: {}, requestId: request.id };
    } catch {
      request.log.warn({ requestId: request.id }, "database health check failed");
      return reply.status(503).send({
        error: { code: "DATABASE_UNAVAILABLE", message: "Banco de dados indisponível." },
        requestId: request.id,
      });
    }
  });
}
