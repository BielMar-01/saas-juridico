import type { Prisma, PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { withTenant } from "../src/lib/tenant-context.js";

const organizationId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

describe("withTenant", () => {
  it("rejects invalid UUIDs before opening a transaction", async () => {
    const transaction = vi.fn();
    const prisma = { $transaction: transaction } as unknown as PrismaClient;
    await expect(withTenant(prisma, { organizationId: "invalid", userId }, async () => true)).rejects.toBeDefined();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("sets local context and exposes only the transaction client", async () => {
    const executeRaw = vi.fn().mockResolvedValue(1);
    const tx = { $executeRaw: executeRaw } as unknown as Prisma.TransactionClient;
    const prisma = { $transaction: vi.fn(async (callback: (value: Prisma.TransactionClient) => Promise<string>) => callback(tx)) } as unknown as PrismaClient;
    const operation = vi.fn(async (value: Prisma.TransactionClient) => value === tx ? "ok" : "bad");
    await expect(withTenant(prisma, { organizationId, userId }, operation)).resolves.toBe("ok");
    expect(executeRaw).toHaveBeenCalledOnce();
    expect(operation).toHaveBeenCalledWith(tx);
  });
});
