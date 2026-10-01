import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { emailSyncState } from "../lib/auth/email-sync-result.ts";

test("callback classifica sucesso, conflito, confirmação pendente e erro",()=>{
  assert.equal(emailSyncState(200),"success");
  assert.equal(emailSyncState(204),"success");
  assert.equal(emailSyncState(409),"conflict");
  assert.equal(emailSyncState(403),"pending");
  assert.equal(emailSyncState(401),"error");
  assert.equal(emailSyncState(500),"error");
});

test("callback sincroniza por POST sem body, não registra token e evita cache",async()=>{
  const source=await readFile(new URL("../app/auth/callback/route.ts",import.meta.url),"utf8");
  assert.match(source,/sync-email"\s*,\s*\{method:"POST"/);
  assert.equal(/body\s*:/.test(source),false);
  assert.match(source,/authorization:`Bearer \$\{access\}`/);
  assert.match(source,/cache:"no-store"/);
  assert.equal(/console\.|localStorage|sessionStorage/.test(source),false);
});
