import { randomUUID } from "node:crypto";

export function validateBootstrapConfig({email,databaseUrl,supabaseUrl,supabaseSecretKey,production,confirmation,mode="apply"}){
  if(!email||!supabaseUrl||!supabaseSecretKey)throw new Error("SUPER_ADMIN_EMAIL, SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
  if(mode!=="verify"&&mode!=="apply")throw new Error("SUPER_ADMIN_BOOTSTRAP_MODE must be verify or apply.");
  if(mode==="apply"&&!databaseUrl)throw new Error("DIRECT_URL is required in apply mode.");
  if(mode==="apply"&&production&&confirmation!=="YES")throw new Error("Production bootstrap requires CONFIRM_PRODUCTION=YES.");
}
export function normalizeEmail(value){const email=String(value??"").trim().toLowerCase();const parts=email.split("@");const local=parts[0]??"";const domain=parts[1]??"";const labels=domain.split(".");const hasWhitespace=Array.from(email).some(character=>character.charCodeAt(0)<=32||character.charCodeAt(0)===127);const nonAscii=Array.from(email).some(character=>character.charCodeAt(0)>127);const invalidLocal=!local||local.length>64||local.startsWith(".")||local.endsWith(".")||local.includes("..");const invalidDomain=parts.length!==2||!domain||domain.length>253||labels.length<2||labels.some(label=>!label||label.startsWith("-")||label.endsWith("-"));if(email.length>254||hasWhitespace||nonAscii||invalidLocal||invalidDomain)throw new Error("Confirmed Auth identity has an invalid email.");return email;}
function safeName(identity,email){const metadata=identity.user_metadata&&typeof identity.user_metadata==="object"?identity.user_metadata:{};const candidate=[metadata.name,metadata.full_name,metadata.display_name,email.split("@")[0]].find(value=>typeof value==="string"&&value.trim());const name=String(candidate).split("").map(character=>{const code=character.charCodeAt(0);return code<32||code===127?" ":character;}).join("").split(" ").filter(Boolean).join(" ").trim().slice(0,120);if(name.length<2)throw new Error("Confirmed Auth identity has an invalid name.");return name;}
function activeIdentity(identity){if(identity.deleted_at)return false;if(identity.banned_until){const banned=Date.parse(String(identity.banned_until));if(Number.isFinite(banned)&&banned>Date.now())return false;}return true;}

export async function fetchConfirmedAuthIdentity({baseUrl,secretKey,email,fetchImpl=fetch}){
  const expected=normalizeEmail(email);let page=1;let match;
  while(page<=100){
    let response;
    try{response=await fetchImpl(new URL(`/auth/v1/admin/users?page=${page}&per_page=1000`,baseUrl),{headers:{authorization:`Bearer ${secretKey}`,apikey:secretKey},signal:AbortSignal.timeout(5000)});}catch{throw new Error("Supabase Auth identity lookup failed.");}
    if(!response?.ok)throw new Error("Supabase Auth identity lookup failed.");
    const body=await response.json();const users=Array.isArray(body)?body:Array.isArray(body?.users)?body.users:[];
    for(const candidate of users){const candidateEmail=typeof candidate?.email==="string"?candidate.email.trim().toLowerCase():"";if(candidateEmail===expected){if(match)throw new Error("Auth identity conflict.");match=candidate;}}
    if(users.length<1000)break;page+=1;
  }
  if(!match)throw new Error("Confirmed Auth identity was not found.");
  if(typeof match.id!=="string"||!match.id||!match.email_confirmed_at)throw new Error("Confirmed Auth identity is required.");
  if(!activeIdentity(match))throw new Error("Active Auth identity is required.");
  return{authUserId:match.id,email:expected,name:safeName(match,expected)};
}

export async function bootstrapSuperAdmin(db,identity){
  const found=await db.query("SELECT id,email,status,auth_user_id FROM public.users WHERE auth_user_id=$1 OR lower(email)=lower($2) ORDER BY id FOR UPDATE",[identity.authUserId,identity.email]);
  let user;
  if(found.rows.length===0){
    const created=await db.query("INSERT INTO public.users(id,auth_user_id,name,email,status,updated_at) VALUES($1,$2,$3,$4,'ACTIVE',now()) RETURNING id,email,status,auth_user_id",[randomUUID(),identity.authUserId,identity.name,identity.email]);
    user=created.rows[0];
  }else{
    if(found.rows.length!==1)throw new Error("Application user identity conflict.");
    user=found.rows[0];
    if(user.auth_user_id!==identity.authUserId||normalizeEmail(user.email)!==identity.email)throw new Error("Application user identity conflict.");
    if(user.status!=="ACTIVE")throw new Error("Active application user is required.");
  }
  const result=await db.query("INSERT INTO public.platform_administrators(id,user_id,active,created_at,updated_at) VALUES(gen_random_uuid(),$1,true,now(),now()) ON CONFLICT(user_id) DO UPDATE SET active=true,updated_at=now() RETURNING id,user_id,active",[user.id]);
  const existingAudit=await db.query("SELECT 1 FROM public.platform_audit_logs WHERE user_id=$1 AND action='platform_admin.bootstrap' AND entity_id=$2 LIMIT 1",[user.id,result.rows[0].id]);
  if(existingAudit.rows.length===0)await db.query("INSERT INTO public.platform_audit_logs(id,user_id,action,entity_type,entity_id,result,metadata,created_at) VALUES(gen_random_uuid(),$1,'platform_admin.bootstrap','platform_administrator',$2,'success',$3::jsonb,now())",[user.id,result.rows[0].id,JSON.stringify({source:"administrative_command"})]);
  return{user,administrator:result.rows[0],created:found.rows.length===0,replayed:found.rows.length===1};
}

export async function runBootstrapTransaction(db,identity){
  await db.query("BEGIN");
  try{const result=await bootstrapSuperAdmin(db,identity);await db.query("COMMIT");return result;}catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
