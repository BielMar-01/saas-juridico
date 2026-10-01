import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload } from "jose";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";

const amrEntry=z.object({method:z.string(),timestamp:z.number().int().nonnegative()}).passthrough();
const claimsSchema=z.object({
  sub:z.uuid(),
  role:z.literal("authenticated"),
  is_anonymous:z.literal(false),
  aal:z.enum(["aal1","aal2"]).default("aal1"),
  auth_time:z.number().int().nonnegative().optional(),
  amr:z.array(amrEntry).optional(),
}).passthrough();
export type AccessClaims=z.infer<typeof claimsSchema>&JWTPayload;
export interface TokenVerifier{verify(token:string):Promise<AccessClaims>}

const interactiveMethods=new Set(["password","otp","totp","mfa","webauthn","recovery"]);
export function deriveRecentAuthenticationAt(claims:Pick<AccessClaims,"auth_time"|"amr">):number|undefined{
  if(typeof claims.auth_time==="number") return claims.auth_time;
  const timestamps=(claims.amr??[]).filter(entry=>interactiveMethods.has(entry.method.toLowerCase())).map(entry=>entry.timestamp);
  return timestamps.length?Math.max(...timestamps):undefined;
}

export function createJwtVerifier(options:{jwksUrl:string;issuer:string;audience:string;timeoutDuration?:number;cooldownDuration?:number;cacheMaxAge?:number}):TokenVerifier{
  const jwks=createRemoteJWKSet(new URL(options.jwksUrl),{timeoutDuration:options.timeoutDuration??3000,cooldownDuration:options.cooldownDuration??30000,cacheMaxAge:options.cacheMaxAge??600000});
  return{async verify(token){
    try{
      const{payload}=await jwtVerify(token,jwks,{issuer:options.issuer,audience:options.audience,algorithms:["ES256","RS256"],requiredClaims:["exp","sub","role","is_anonymous"]});
      return claimsSchema.parse(payload) as AccessClaims;
    }catch(error){
      if(error instanceof errors.JWKSTimeout||error instanceof TypeError)throw new AppError("AUTH_SERVICE_UNAVAILABLE","Serviço de autenticação indisponível.",503);
      throw new AppError("UNAUTHORIZED","Credenciais inválidas.",401);
    }
  }};
}