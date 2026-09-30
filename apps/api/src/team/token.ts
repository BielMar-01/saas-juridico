import { createHmac, randomBytes } from "node:crypto";

export function createInvitationToken(secret: string) {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashInvitationToken(token, secret) };
}

export function hashInvitationToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token, "utf8").digest("hex");
}