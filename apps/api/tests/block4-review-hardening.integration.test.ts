import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import dotenv from "dotenv";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const env=dotenv.parse(await readFile(resolve(process.cwd(),".env"),"utf8"));
const enabled=Boolean(env.DIRECT_URL);
describe.skipIf(!enabled)("Block 4 review database hardening",()=>{
  let admin:pg.Client;
  const users=[randomUUID(),randomUUID()];
  const admins=[randomUUID(),randomUUID()];
  const preferenceUser=randomUUID();
  beforeAll(async()=>{
    admin=new pg.Client({connectionString:env.DIRECT_URL});await admin.connect();
    await admin.query("INSERT INTO users(id,auth_user_id,name,email,status,updated_at) VALUES($1,$1,'Admin A',$2,'ACTIVE',now()),($3,$3,'Admin B',$4,'ACTIVE',now()),($5,$5,'Preferences',$6,'ACTIVE',now())",[users[0],`admin-a-${users[0]}@example.invalid`,users[1],`admin-b-${users[1]}@example.invalid`,preferenceUser,`pref-${preferenceUser}@example.invalid`]);
    await admin.query("INSERT INTO platform_administrators(id,user_id,active,updated_at) VALUES($1,$2,true,now()),($3,$4,true,now())",[admins[0],users[0],admins[1],users[1]]);
  });
  afterAll(async()=>{
    if(!admin)return;
    await admin.query("DELETE FROM notification_preferences WHERE user_id=$1",[preferenceUser]);
    await admin.query("BEGIN");await admin.query("SELECT set_config('app.allow_admin_cleanup','on',true)");await admin.query("DELETE FROM platform_administrators WHERE id=ANY($1::uuid[])",[admins]);await admin.query("COMMIT");
    await admin.query("DELETE FROM users WHERE id=ANY($1::uuid[])",[[...users,preferenceUser]]);
    await admin.end();
  });
  it("serializes concurrent deactivation and preserves an active administrator",async()=>{
    const a=new pg.Client({connectionString:env.DIRECT_URL}),b=new pg.Client({connectionString:env.DIRECT_URL});
    await Promise.all([a.connect(),b.connect()]);
    const results=await Promise.allSettled([
      a.query("UPDATE platform_administrators SET active=false,updated_at=now() WHERE id=$1",[admins[0]]),
      b.query("UPDATE platform_administrators SET active=false,updated_at=now() WHERE id=$1",[admins[1]]),
    ]);
    await Promise.all([a.end(),b.end()]);
    expect(results.filter(x=>x.status==="fulfilled")).toHaveLength(1);
    expect(results.filter(x=>x.status==="rejected")).toHaveLength(1);
    const active=await admin.query("SELECT count(*)::int count FROM platform_administrators WHERE active");
    expect(active.rows[0].count).toBeGreaterThanOrEqual(1);
  },30000);
  it("claims one sender concurrently and recovers stale deliveries with an attempt cap",async()=>{
    const key=`outbox-${randomUUID()}`;
    const a=new pg.Client({connectionString:env.DATABASE_URL}),b=new pg.Client({connectionString:env.DATABASE_URL});
    await Promise.all([a.connect(),b.connect()]);
    const sql="SELECT * FROM private.claim_email_delivery(NULL,$1,'resend','notifications','securityAlert','te***@example.invalid',1,3)";
    const claims=await Promise.all([a.query(sql,[key]),b.query(sql,[key])]);
    expect(claims.flatMap(x=>x.rows).filter(x=>x.claimed)).toHaveLength(1);
    await Promise.all([a.end(),b.end()]);
    await admin.query("UPDATE email_deliveries SET status='SENDING',claimed_at=now()-interval '2 seconds' WHERE idempotency_key=$1",[key]);
    const c=new pg.Client({connectionString:env.DATABASE_URL});await c.connect();
    const reclaimed=await c.query(sql,[key]);expect(reclaimed.rows[0].claimed).toBe(true);
    await admin.query("UPDATE email_deliveries SET status='FAILED',attempt_count=3,claimed_at=NULL WHERE idempotency_key=$1",[key]);
    const capped=await c.query(sql,[key]);expect(capped.rows[0]).toMatchObject({claimed:false,status:"FAILED",attempt_count:3});
    await c.end();
    await admin.query("DELETE FROM email_deliveries WHERE idempotency_key=$1",[key]);
  },30000);  it("rejects disabling mandatory system notifications directly",async()=>{
    await expect(admin.query("INSERT INTO notification_preferences(id,user_id,system_enabled,updated_at) VALUES($1,$2,false,now())",[randomUUID(),preferenceUser])).rejects.toBeDefined();
    await admin.query("INSERT INTO notification_preferences(id,user_id,system_enabled,updated_at) VALUES($1,$2,true,now())",[randomUUID(),preferenceUser]);
    await expect(admin.query("UPDATE notification_preferences SET system_enabled=false WHERE user_id=$1",[preferenceUser])).rejects.toBeDefined();
  });
});