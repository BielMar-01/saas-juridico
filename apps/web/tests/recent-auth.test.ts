import test from "node:test";
import assert from "node:assert/strict";
import { accessTokenClaims, isRecentAuth, RECENT_AUTH_SECONDS, sensitiveLoginPath } from "../lib/auth/recent-auth.ts";

function token(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${encoded}.signature`;
}

test("autenticação recente exige auth_time e respeita exatamente a janela", () => {
  const now = 10_000;
  assert.equal(isRecentAuth({ auth_time: now - RECENT_AUTH_SECONDS }, now), true);
  assert.equal(isRecentAuth({ auth_time: now - RECENT_AUTH_SECONDS - 1 }, now), false);
  assert.equal(isRecentAuth({ iat: now }, now), false, "iat renovado não comprova reautenticação");
  assert.equal(isRecentAuth({ auth_time: now + 1 }, now), false);
});

test("claims inválidos falham fechados e login sensível não aceita open redirect", () => {
  assert.deepEqual(accessTokenClaims("inválido"), {});
  assert.deepEqual(accessTokenClaims(token({ auth_time: 123, aal: "aal2" })), { auth_time: 123, aal: "aal2" });
  assert.equal(sensitiveLoginPath("//host.example"), "/login?next=%2Fapp");
  assert.equal(sensitiveLoginPath("/app/configuracoes/perfil"), "/login?next=%2Fapp%2Fconfiguracoes%2Fperfil");
});
