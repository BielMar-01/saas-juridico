import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import dotenv from "dotenv";
import pg from "pg";
const roleName="jurisvia_app";
const envPath=new URL("../.env",import.meta.url);
async function main(){
 const envText=await readFile(envPath,"utf8"); const env=dotenv.parse(envText);
 if(!env.DIRECT_URL||!env.DATABASE_URL)throw new Error("Required database configuration is missing.");
 const admin=new pg.Client({connectionString:env.DIRECT_URL,application_name:"jurisvia_runtime_role_provision",connectionTimeoutMillis:15000});
 let created=false; let runtimeUrl=env.DATABASE_URL;
 try{
  await admin.connect();
  const existing=await admin.query("SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=$1",[roleName]);
  if(existing.rowCount===0){
   const password=randomBytes(36).toString("base64url");
   const statement=await admin.query("SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD %L',$1::text,$2::text) sql",[roleName,password]);
   await admin.query("BEGIN");try{await admin.query(statement.rows[0].sql);await admin.query("COMMIT");}catch(error){await admin.query("ROLLBACK");throw error;}
   const url=new URL(env.DATABASE_URL);const separator=url.username.indexOf(".");url.username=separator>=0?roleName+url.username.slice(separator):roleName;url.password=password;runtimeUrl=url.toString();created=true;
   const updated=envText.split(/\r?\n/).map((line)=>/^DATABASE_URL=/.test(line)?`DATABASE_URL="${runtimeUrl}"`:line).join("\n");await writeFile(envPath,updated.endsWith("\n")?updated:`${updated}\n`,{mode:384});
  }
  const role=await admin.query("SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=$1",[roleName]);const value=role.rows[0];
  const configured=Boolean(value?.rolcanlogin&&!value.rolsuper&&!value.rolcreatedb&&!value.rolcreaterole&&!value.rolinherit&&!value.rolreplication&&!value.rolbypassrls);if(!configured)throw new Error("Runtime role attributes are not compliant.");
  if(process.env.NODE_ENV==="test"&&process.env.RUNTIME_ROLE_VALIDATION_URL)runtimeUrl=process.env.RUNTIME_ROLE_VALIDATION_URL;
  const runtime=new pg.Client({connectionString:runtimeUrl,application_name:"jurisvia_runtime_role_validation",connectionTimeoutMillis:15000});
  try{await runtime.connect();const identity=await runtime.query("SELECT current_user=$1 expected_user,rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=current_user",[roleName]);const current=identity.rows[0];const effective=Boolean(current?.expected_user&&current.rolcanlogin&&!current.rolsuper&&!current.rolcreatedb&&!current.rolcreaterole&&!current.rolinherit&&!current.rolreplication&&!current.rolbypassrls);if(!effective)throw new Error("Effective runtime identity is not compliant.");console.log(JSON.stringify({roleCreated:created,attributesValid:true,runtimeConnected:true,currentUserExpected:true,effectiveAttributesValid:true,databaseUrlUpdated:created}));}
  finally{await runtime.end().catch(()=>undefined);}
 }finally{await admin.end().catch(()=>undefined);}
}
main().catch(()=>{console.error(JSON.stringify({ok:false,category:"runtime_role_validation_failed"}));process.exitCode=1;});
