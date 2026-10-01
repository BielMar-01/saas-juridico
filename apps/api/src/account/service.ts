import type { PrismaClient } from "../generated/prisma/client.js";
import type { AuthIdentityProvider } from "../auth/identity-provider.js";
import type { Principal } from "../auth/service.js";
import { AppError } from "../errors/app-error.js";
import { requireRecentAuthentication } from "../auth/permissions.js";

export class AccountService {
  constructor(
    private prisma: PrismaClient,
    private identityProvider?: AuthIdentityProvider,
    private sensitiveAuthMaxAgeSeconds = 900,
  ) {}

  async getProfile(current: Principal) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: current.userId },
      select: { id: true, name: true, email: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async updateProfile(current: Principal, input: { name: string }) {
    return this.prisma.user.update({
      where: { id: current.userId },
      data: { name: input.name.trim() },
      select: { id: true, name: true, email: true, status: true, updatedAt: true },
    });
  }

  async syncVerifiedEmail(current: Principal, accessToken: string) {
    requireRecentAuthentication(current, this.sensitiveAuthMaxAgeSeconds);
    if (!this.identityProvider) throw new AppError("AUTH_SERVICE_UNAVAILABLE", "Serviço de autenticação indisponível.", 503);
    const identity = await this.identityProvider.getVerifiedIdentity(accessToken);
    if (identity.authUserId !== current.authUserId) throw new AppError("FORBIDDEN", "Identidade divergente.", 403);
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_user_id',${current.userId},true)`;
        const [value] = await tx.$queryRaw<Array<{id:string;name:string;email:string;status:string;updated_at:Date}>>`SELECT * FROM private.sync_verified_user_email(${current.authUserId}::uuid,${identity.email})`;
        return value;
      });
      if (!row) throw new AppError("NOT_FOUND", "Usuário não encontrado.", 404);
      return { id: row.id, name: row.name, email: row.email, status: row.status, updatedAt: row.updated_at };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "23505") throw new AppError("CONFLICT", "E-mail já vinculado.", 409);
      throw error;
    }
  }

  async getPreferences(current: Principal) {
    return this.prisma.notificationPreference.upsert({
      where: { userId: current.userId },
      create: { userId: current.userId },
      update: {},
      select: { teamEnabled: true, officeEnabled: true, systemEnabled: true, caseUpdatesEnabled: true, updatedAt: true },
    });
  }

  async updatePreferences(current: Principal, input: {teamEnabled:boolean;officeEnabled:boolean;systemEnabled:true;caseUpdatesEnabled:boolean}) {
    return this.prisma.notificationPreference.upsert({
      where: { userId: current.userId },
      create: { userId: current.userId, ...input, systemEnabled: true },
      update: { ...input, systemEnabled: true },
      select: { teamEnabled: true, officeEnabled: true, systemEnabled: true, caseUpdatesEnabled: true, updatedAt: true },
    });
  }
}