import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 }) });
}

export function getPrismaClient(connectionString: string): PrismaClient {
  const client = globalPrisma.prisma ?? createPrismaClient(connectionString);
  globalPrisma.prisma = client;
  return client;
}
