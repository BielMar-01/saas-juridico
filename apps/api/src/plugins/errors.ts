import type { FastifyError, FastifyInstance } from "fastify";
import { AppError } from "../errors/app-error.js";

function messageForStatus(status: number): string {
  if (status === 400) return "Dados da requisição inválidos.";
  if (status === 429) return "Limite de requisições excedido.";
  return "Não foi possível processar a solicitação.";
}

export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({ error: { code: "NOT_FOUND", message: "Rota não encontrada." }, requestId: request.id }),
  );

  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    const appError = error instanceof AppError ? error : undefined;
    const fastifyError = error as FastifyError;
    const statusCode = appError?.statusCode ?? fastifyError.statusCode ?? 500;
    const isValidation = Array.isArray(fastifyError.validation);
    const code = appError?.code ?? (isValidation ? "VALIDATION_ERROR" : statusCode === 429 ? "RATE_LIMIT_EXCEEDED" : "INTERNAL_ERROR");
    const safeStatus = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    if (safeStatus >= 500) request.log.error({ err: error, requestId: request.id }, "request failed");
    const details = isValidation && process.env.NODE_ENV !== "production"
      ? fastifyError.validation?.map((issue) => ({ path: issue.instancePath, message: issue.message }))
      : appError?.details;
    return reply.status(safeStatus).send({
      error: {
        code,
        message: appError?.message ?? (safeStatus >= 500 ? "Erro interno do servidor." : messageForStatus(safeStatus)),
        ...(details ? { details } : {}),
      },
      requestId: request.id,
    });
  });
}
