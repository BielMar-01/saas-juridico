import type { Prisma, PrismaClient } from "../generated/prisma/client.js";
import { z } from "zod";

const uuid = z.uuid();

export interface TenantContext {
  organizationId: string;
  userId: string;
}

export async function withTenant<T>(
  prisma: PrismaClient,
  context: TenantContext,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const organizationId = uuid.parse(context.organizationId);
  const userId = uuid.parse(context.userId);

  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT
        set_config('app.current_organization_id', ${organizationId}, true),
        set_config('app.current_user_id', ${userId}, true)
    `;
    return operation(transaction);
  });
}
