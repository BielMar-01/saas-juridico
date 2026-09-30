import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuthService } from "../auth/service.js";
import { requirePermission } from "../auth/permissions.js";
import { principal } from "../auth/plugin.js";
import { AppError } from "../errors/app-error.js";
import { invitationRoles, type TeamService } from "./service.js";

const idParams = z.object({ id: z.uuid() });
const roleBody = z.object({ role: z.enum(invitationRoles) });
const statusBody = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]) });
const invitationBody = z.object({ email: z.email().trim().toLowerCase(), role: z.enum(invitationRoles) });
const acceptBody = z.object({ token: z.string().min(40).max(128) });

function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError("VALIDATION_ERROR", "Dados da requisição inválidos.", 400, result.error.issues);
  return result.data;
}

export async function teamRoutes(app: FastifyInstance, service: TeamService, authService: AuthService) {
  const tenantAuth = {
    preHandler: app.authenticate,
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      security: [{ bearerAuth: [] }],
      headers: { type: "object", required: ["x-organization-id"], properties: { authorization: { type: "string" }, "x-organization-id": { type: "string", format: "uuid" } } },
    },
  };

  app.get("/api/v1/team/members", tenantAuth, async (request) => {
    const current = principal(request);
    requirePermission(current.organization!.role, "team.read", current.aal);
    const rows = await service.listMembers(current);
    return { data: rows, meta: { count: rows.length }, requestId: request.id };
  });

  app.get("/api/v1/team/members/:id", tenantAuth, async (request) => {
    const current = principal(request);
    requirePermission(current.organization!.role, "team.read", current.aal);
    return { data: await service.getMember(current, parse(idParams, request.params).id), meta: {}, requestId: request.id };
  });

  app.patch("/api/v1/team/members/:id/role", tenantAuth, async (request) => {
    const current = principal(request);
    requirePermission(current.organization!.role, "team.update", current.aal);
    return { data: await service.updateRole(current, parse(idParams, request.params).id, parse(roleBody, request.body).role), meta: {}, requestId: request.id };
  });

  app.patch("/api/v1/team/members/:id/status", tenantAuth, async (request) => {
    const current = principal(request);
    requirePermission(current.organization!.role, "team.update", current.aal);
    return { data: await service.updateStatus(current, parse(idParams, request.params).id, parse(statusBody, request.body).status), meta: {}, requestId: request.id };
  });

  app.get("/api/v1/team/invitations", tenantAuth, async (request) => {
    const current = principal(request);
    requirePermission(current.organization!.role, "invitations.read", current.aal);
    const rows = await service.listInvitations(current);
    return { data: rows, meta: { count: rows.length }, requestId: request.id };
  });

  app.post("/api/v1/team/invitations", tenantAuth, async (request, reply) => {
    const current = principal(request);
    requirePermission(current.organization!.role, "invitations.manage", current.aal);
    const row = await service.createInvitation(current, parse(invitationBody, request.body));
    return reply.status(201).send({ data: row, meta: {}, requestId: request.id });
  });

  app.post("/api/v1/team/invitations/:id/resend", tenantAuth, async (request) => {
    const current = principal(request);
    requirePermission(current.organization!.role, "invitations.manage", current.aal);
    return { data: await service.resendInvitation(current, parse(idParams, request.params).id), meta: {}, requestId: request.id };
  });

  app.delete("/api/v1/team/invitations/:id", tenantAuth, async (request) => {
    const current = principal(request);
    requirePermission(current.organization!.role, "invitations.manage", current.aal);
    return { data: await service.cancelInvitation(current, parse(idParams, request.params).id), meta: {}, requestId: request.id };
  });

  app.post("/api/v1/invitations/accept", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    schema: { security: [{ bearerAuth: [] }], headers: { type: "object", properties: { authorization: { type: "string" } } } },
  }, async (request) => {
    const body = parse(acceptBody, request.body);
    return { data: await service.acceptInvitation(request.headers.authorization, body.token, authService), meta: {}, requestId: request.id };
  });
}