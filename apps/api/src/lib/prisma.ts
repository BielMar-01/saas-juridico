import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export function getPrismaClient(connectionString: string): PrismaClient {
  const client = globalPrisma.prisma ?? createPrismaClient(connectionString);
  if (process.env.NODE_ENV !== "production") globalPrisma.prisma = client;
  return client;
}
