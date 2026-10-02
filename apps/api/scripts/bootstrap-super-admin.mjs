import {readFile} from "node:fs/promises";
import dotenv from "dotenv";
import pg from "pg";
import {fetchConfirmedAuthIdentity,runBootstrapTransaction,validateBootstrapConfig} from "./bootstrap-super-admin-core.mjs";

const local=dotenv.parse(await readFile(new URL("../.env",import.meta.url),"utf8"));
const env={...local,...process.env};
const email=String(env.SUPER_ADMIN_EMAIL??"").trim().toLowerCase();
const databaseUrl=env.DIRECT_URL;
const supabaseUrl=env.SUPABASE_URL;
const supabaseSecretKey=env.SUPABASE_SECRET_KEY;
const production=env.NODE_ENV==="production";
const mode=env.SUPER_ADMIN_BOOTSTRAP_MODE??"apply";
validateBootstrapConfig({email,databaseUrl,supabaseUrl,supabaseSecretKey,production,confirmation:env.CONFIRM_PRODUCTION,mode});

try{
  const identity=await fetchConfirmedAuthIdentity({baseUrl:supabaseUrl,secretKey:supabaseSecretKey,email});
  if(mode==="verify"){
    console.log(JSON.stringify({verified:true,written:false,emailConfirmed:true,active:true}));
    process.exit(0);
  }
  const db=new pg.Client({connectionString:databaseUrl,connectionTimeoutMillis:15000});
  try{
    await db.connect();
    const result=await runBootstrapTransaction(db,identity);
    const[a,b]=identity.email.split("@");
    console.log(JSON.stringify({verified:true,written:true,created:result.created,replayed:result.replayed,email:`${a.slice(0,2)}***@${b}`,userId:String(result.user.id).slice(0,8)+"...",active:true,role:"SUPER_ADMIN",emailConfirmed:true,mfa:"pending_verification"}));
  }finally{await db.end().catch(()=>undefined);}
}catch{
  console.error(JSON.stringify({ok:false,category:"super_admin_bootstrap_failed"}));
  process.exitCode=1;
}
