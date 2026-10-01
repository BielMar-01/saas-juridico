import { createHash } from "node:crypto";
import { Resend } from "resend";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "../generated/prisma/client.js";

export async function resendWebhookRoutes(
  app: FastifyInstance,
  options: { prisma: PrismaClient; secret: string },
) {
  const resend = new Resend("verification-only");

  app.post(
    "/api/v1/webhooks/resend",
    { config: { rawBody: true, rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const raw =
        typeof request.rawBody === "string"
          ? request.rawBody
          : request.rawBody?.toString("utf8");

      if (!raw) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", message: "Payload inválido." },
          requestId: request.id,
        });
      }

      const eventId = String(
        request.headers["svix-id"] ?? request.headers["webhook-id"] ?? "",
      );
      const timestamp = String(
        request.headers["svix-timestamp"] ??
          request.headers["webhook-timestamp"] ??
          "",
      );
      const signature = String(
        request.headers["svix-signature"] ??
          request.headers["webhook-signature"] ??
          "",
      );

      if (!eventId || !timestamp || !signature) {
        return reply.status(401).send({
          error: { code: "UNAUTHORIZED", message: "Assinatura inválida." },
          requestId: request.id,
        });
      }

      let event: unknown;
      try {
        event = await Promise.resolve().then(() =>
          resend.webhooks.verify({
            payload: raw,
            headers: { id: eventId, timestamp, signature },
            webhookSecret: options.secret,
          }),
        );
      } catch {
        return reply.status(401).send({
          error: { code: "UNAUTHORIZED", message: "Assinatura inválida." },
          requestId: request.id,
        });
      }

      if (!event || typeof event !== "object") {
        return reply.status(401).send({
          error: { code: "UNAUTHORIZED", message: "Assinatura inválida." },
          requestId: request.id,
        });
      }

      const value = event as {
        type?: string;
        created_at?: string;
        data?: { email_id?: string; to?: string[] };
      };
      const messageId = value.data?.email_id;
      const recipient = value.data?.to?.[0]?.trim().toLowerCase();
      const recipientHash = recipient
        ? createHash("sha256").update(recipient).digest("hex")
        : null;
      const occurred = value.created_at
        ? new Date(value.created_at)
        : new Date();

      if (value.type && messageId) {
        await options.prisma.$queryRaw`SELECT private.record_email_webhook(${eventId}, ${messageId}, ${value.type}, ${occurred}, ${recipientHash})`;
      }

      return reply.status(202).send({
        data: { accepted: true },
        meta: {},
        requestId: request.id,
      });
    },
  );
}