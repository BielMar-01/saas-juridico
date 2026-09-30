import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import type { Principal } from "../auth/service.js";
import type { AuthIdentityProvider } from "../auth/identity-provider.js";
import { AppError } from "../errors/app-error.js";
import { withTenant } from "../lib/tenant-context.js";
import type { InvitationDelivery } from "./delivery.js";
import { createInvitationToken, hashInvitationToken } from "./token.js";

const invitationRoles = ["ADMIN", "LAWYER", "ASSISTANT", "FINANCIAL", "VIEWER"] as const;
type InvitationRole = typeof invitationRoles[number];
type MutableMembershipStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

function context(principal: Principal) {
  if (!principal.organization) throw new AppError("VALIDATION_ERROR", "Selecione uma organização.", 400);
  return { organizationId: principal.organization.organizationId, userId: principal.userId };
}

function databaseCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const meta = (error as { meta?: { driverAdapterError?: { cause?: { originalCode?: string } } } }).meta;
  return meta?.driverAdapterError?.cause?.originalCode;
}

function ensureTargetRole(actorRole: string, targetRole: InvitationRole) {
  if (actorRole === "ADMIN" && targetRole !== "LAWYER" && targetRole !== "ASSISTANT") throw new AppError("FORBIDDEN", "Acesso negado.", 403);
}

export class TeamService {
  constructor(
    private prisma: PrismaClient,
    private delivery: InvitationDelivery,
    private identityProvider: AuthIdentityProvider,
    private tokenSecret: string,
    private ttlHours: number,
    private resendCooldownSeconds: number,
  ) {}

  async listMembers(principal: Principal) {
    return withTenant(this.prisma, context(principal), (tx) => tx.organizationMembership.findMany({
      where: { organizationId: principal.organization!.organizationId },
      select: { id: true, role: true, status: true, invitedAt: true, acceptedAt: true, createdAt: true, updatedAt: true, user: { select: { id: true, name: true, email: true, status: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }));
  }

  async getMember(principal: Principal, id: string) {
    return withTenant(this.prisma, context(principal), async (tx) => {
      const member = await tx.organizationMembership.findFirst({
        where: { id, organizationId: principal.organization!.organizationId },
        select: { id: true, role: true, status: true, invitedAt: true, acceptedAt: true, createdAt: true, updatedAt: true, user: { select: { id: true, name: true, email: true, status: true } } },
      });
      if (!member) throw new AppError("NOT_FOUND", "Recurso não encontrado.", 404);
      return member;
    });
  }

  async updateRole(principal: Principal, id: string, role: InvitationRole) {
    ensureTargetRole(principal.organization!.role, role);
    return withTenant(this.prisma, context(principal), async (tx) => {
      const existing = await tx.organizationMembership.findFirst({ where: { id, organizationId: principal.organization!.organizationId }, select: { id: true, userId: true, role: true } });
      if (!existing) throw new AppError("NOT_FOUND", "Recurso não encontrado.", 404);
      if (existing.role === "OWNER" || (principal.organization!.role === "ADMIN" && existing.role !== "LAWYER" && existing.role !== "ASSISTANT")) throw new AppError("FORBIDDEN", "Acesso negado.", 403);
      const [updated] = await tx.$queryRaw<Array<{ id: string; userId: string; role: string; status: string }>>`SELECT id,user_id AS "userId",role::text,status::text FROM private.update_member_role(${id}::uuid,${role}::"OrganizationRole")`;
      if (!updated) throw new AppError("NOT_FOUND", "Recurso não encontrado.", 404);
      await tx.auditLog.create({ data: { organizationId: principal.organization!.organizationId, userId: principal.userId, action: "membership.role_changed", entityType: "organization_membership", entityId: id, metadata: { from: existing.role, to: role } } });
      return updated;
    });
  }

  async updateStatus(principal: Principal, id: string, status: MutableMembershipStatus) {
    return withTenant(this.prisma, context(principal), async (tx) => {
      const existing = await tx.organizationMembership.findFirst({ where: { id, organizationId: principal.organization!.organizationId }, select: { id: true, userId: true, role: true, status: true } });
      if (!existing) throw new AppError("NOT_FOUND", "Recurso não encontrado.", 404);
      if (existing.userId === principal.userId && status !== "ACTIVE") throw new AppError("FORBIDDEN", "Não é possível desativar o próprio acesso.", 403);
      if (existing.role === "OWNER" || (principal.organization!.role === "ADMIN" && existing.role !== "LAWYER" && existing.role !== "ASSISTANT")) throw new AppError("FORBIDDEN", "Acesso negado.", 403);
      const [updated] = await tx.$queryRaw<Array<{ id: string; userId: string; role: string; status: string }>>`SELECT id,user_id AS "userId",role::text,status::text FROM private.update_member_status(${id}::uuid,${status}::"MembershipStatus")`;
      if (!updated) throw new AppError("NOT_FOUND", "Recurso não encontrado.", 404);
      await tx.auditLog.create({ data: { organizationId: principal.organization!.organizationId, userId: principal.userId, action: "membership.status_changed", entityType: "organization_membership", entityId: id, metadata: { from: existing.status, to: status } } });
      return updated;
    });
  }

  async listInvitations(principal: Principal) {
    return withTenant(this.prisma, context(principal), async (tx) => {
      await tx.invitation.updateMany({ where: { organizationId: principal.organization!.organizationId, status: "PENDING", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
      return tx.invitation.findMany({
      where: { organizationId: principal.organization!.organizationId },
      select: { id: true, email: true, role: true, status: true, expiresAt: true, sentAt: true, lastSentAt: true, acceptedAt: true, cancelledAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    });
  }

  async createInvitation(principal: Principal, input: { email: string; role: InvitationRole }) {
    ensureTargetRole(principal.organization!.role, input.role);
    const email = input.email.trim().toLowerCase();
    const generated = createInvitationToken(this.tokenSecret);
    const expiresAt = new Date(Date.now() + this.ttlHours * 60 * 60 * 1000);
    let invitation;
    try {
      invitation = await withTenant(this.prisma, context(principal), async (tx) => {
        await tx.invitation.updateMany({ where: { organizationId: principal.organization!.organizationId, email, status: "PENDING", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
        const row = await tx.invitation.create({ data: { organizationId: principal.organization!.organizationId, email, role: input.role, tokenHash: generated.hash, expiresAt, createdByUserId: principal.userId }, select: { id: true, email: true, role: true, status: true, expiresAt: true, sentAt: true, lastSentAt: true, createdAt: true } });
        await tx.auditLog.create({ data: { organizationId: principal.organization!.organizationId, userId: principal.userId, action: "invitation.created", entityType: "invitation", entityId: row.id, metadata: { role: input.role } } });
        return row;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("CONFLICT", "Já existe um convite pendente.", 409);
      throw error;
    }
    try {
      await this.delivery.send({ email, token: generated.token, expiresAt, organizationName: principal.organization!.name });
      return invitation;
    } catch {
      await this.cancelAfterDeliveryFailure(principal, invitation.id);
      throw new AppError("INTERNAL_ERROR", "Entrega de convite indisponível.", 503);
    }
  }

  async resendInvitation(principal: Principal, id: string) {
    const generated = createInvitationToken(this.tokenSecret);
    const expiresAt = new Date(Date.now() + this.ttlHours * 60 * 60 * 1000);
    let invitation: { id: string; email: string; role: string; status: string; expiresAt: Date; sentAt: Date; lastSentAt: Date };
    try {
      invitation = await withTenant(this.prisma, context(principal), async (tx) => {
        const [row] = await tx.$queryRaw<Array<{ id: string; email: string; role: string; status: string; expiresAt: Date; sentAt: Date; lastSentAt: Date }>>`SELECT id,email,role::text,status::text,expires_at AS "expiresAt",sent_at AS "sentAt",last_sent_at AS "lastSentAt" FROM private.rotate_invitation_token(${id}::uuid,${generated.hash},${expiresAt},${this.resendCooldownSeconds})`;
        if (!row) throw new AppError("CONFLICT", "Convite indisponível.", 409);
        await tx.auditLog.create({ data: { organizationId: principal.organization!.organizationId, userId: principal.userId, action: "invitation.resent", entityType: "invitation", entityId: id, metadata: { role: row.role } } });
        return row;
      });
    } catch (error) {
      const code = databaseCode(error);
      if (code === "P0001") throw new AppError("RATE_LIMIT_EXCEEDED", "Aguarde antes de reenviar.", 429);
      if (code === "P0002") throw new AppError("NOT_FOUND", "Recurso não encontrado.", 404);
      if (code === "42501") throw new AppError("FORBIDDEN", "Acesso negado.", 403);
      if (error instanceof AppError) throw error;
      throw new AppError("CONFLICT", "Convite indisponível.", 409);
    }
    try {
      await this.delivery.send({ email: invitation.email, token: generated.token, expiresAt, organizationName: principal.organization!.name });
      return invitation;
    } catch {
      await this.cancelAfterDeliveryFailure(principal, invitation.id);
      throw new AppError("INTERNAL_ERROR", "Entrega de convite indisponível.", 503);
    }
  }
  async cancelInvitation(principal: Principal, id: string) {
    return withTenant(this.prisma, context(principal), async (tx) => {
      const existing = await tx.invitation.findFirst({ where: { id, organizationId: principal.organization!.organizationId } });
      if (!existing) throw new AppError("NOT_FOUND", "Recurso não encontrado.", 404);
      ensureTargetRole(principal.organization!.role, existing.role as InvitationRole);
      if (existing.status !== "PENDING") throw new AppError("CONFLICT", "Convite indisponível.", 409);
      const row = await tx.invitation.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() }, select: { id: true, role: true, status: true, cancelledAt: true } });
      await tx.auditLog.create({ data: { organizationId: principal.organization!.organizationId, userId: principal.userId, action: "invitation.cancelled", entityType: "invitation", entityId: id, metadata: { role: row.role } } });
      return row;
    });
  }

  async acceptInvitation(authorization: unknown, token: string, authService: { verifyBearer(header: unknown): Promise<{ claims: { sub: string }; token: string }> }) {
    const verified = await authService.verifyBearer(authorization);
    const identity = await this.identityProvider.getVerifiedIdentity(verified.token);
    if (identity.authUserId !== verified.claims.sub) throw new AppError("UNAUTHORIZED", "Credenciais inválidas.", 401);
    const tokenHash = hashInvitationToken(token, this.tokenSecret);
    try {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ organization_id: string; membership_id: string; role: string }>>(
        "SELECT * FROM private.accept_invitation($1,$2::uuid,$3,$4)",
        tokenHash, identity.authUserId, identity.email, identity.name,
      );
      if (!rows[0]) throw new AppError("VALIDATION_ERROR", "Convite inválido ou indisponível.", 400);
      return { organizationId: rows[0].organization_id, membershipId: rows[0].membership_id, role: rows[0].role };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("VALIDATION_ERROR", "Convite inválido ou indisponível.", 400);
    }
  }

  private async cancelAfterDeliveryFailure(principal: Principal, id: string) {
    await withTenant(this.prisma, context(principal), async (tx) => {
      await tx.invitation.updateMany({ where: { id, organizationId: principal.organization!.organizationId, status: "PENDING" }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    }).catch(() => undefined);
  }
}

export { invitationRoles };