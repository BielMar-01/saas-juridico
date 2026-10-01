import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";
import { renderEmailTemplate, type EmailTemplateName, type TemplateInput } from "./templates.js";

export type EmailCategory = "access" | "invitations" | "notifications";
export interface EmailMessage { to:string; category:EmailCategory; template:EmailTemplateName; data:TemplateInput; idempotencyKey:string; organizationId?:string }
export interface EmailProvider { send(input:{from:string;replyTo?:string;to:string;subject:string;html:string;text:string;idempotencyKey:string}):Promise<{id:string}> }
export interface EmailSenders { access:string; invitations:string; notifications:string; replyTo?:string }
type Claim={id:string;status:string;provider_message_id:string|null;attempt_count:number;claimed:boolean};

export function maskEmail(value:string){const [local,domain]=value.split("@");return `${local?.slice(0,2)??"**"}***@${domain??"invalid"}`;}

export class ResendEmailProvider implements EmailProvider {
  constructor(private apiKey:string,private timeoutMs=8000){}
  async send(input:Parameters<EmailProvider["send"]>[0]){
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),this.timeoutMs);
    try{
      const response=await fetch("https://api.resend.com/emails",{method:"POST",signal:controller.signal,headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json","Idempotency-Key":input.idempotencyKey},body:JSON.stringify({from:input.from,to:[input.to],reply_to:input.replyTo,subject:input.subject,html:input.html,text:input.text})}) as {ok:boolean;status:number;json():Promise<unknown>};
      if(!response.ok)throw new Error(`email provider rejected request (${response.status})`);
      return z.object({id:z.string().min(1)}).parse(await response.json());
    }finally{clearTimeout(timeout);}
  }
}

export class EmailService {
  constructor(private prisma:PrismaClient,private provider:EmailProvider,private senders:EmailSenders,private leaseSeconds=300,private maxAttempts=3){}
  async send(message:EmailMessage){
    const to=z.email().parse(message.to.trim().toLowerCase());
    const emailHash=createHash("sha256").update(to).digest("hex");
    const [suppression]=await this.prisma.$queryRaw<Array<{suppressed:boolean}>>`SELECT private.is_email_suppressed(${emailHash}) AS suppressed`;
    if(suppression?.suppressed) return {id:null,status:"SUPPRESSED",deduplicated:true};

    const [claim]=await this.prisma.$queryRaw<Claim[]>`SELECT * FROM private.claim_email_delivery(${message.organizationId??null}::uuid,${message.idempotencyKey},${"resend"},${message.category},${message.template},${maskEmail(to)},${this.leaseSeconds},${this.maxAttempts})`;
    if(!claim) throw new AppError("EMAIL_UNAVAILABLE","Entrega de e-mail indisponível.",503);
    if(!claim.claimed){
      if(claim.status==="SENT"||claim.status==="DELIVERED") return {id:claim.provider_message_id,status:claim.status,deduplicated:true};
      throw new AppError("EMAIL_PENDING","Entrega de e-mail em processamento ou indisponível para nova tentativa.",409);
    }

    const rendered=renderEmailTemplate(message.template,message.data);
    try{
      const result=await this.provider.send({from:this.senders[message.category],...(this.senders.replyTo?{replyTo:this.senders.replyTo}:{}),to,idempotencyKey:message.idempotencyKey,...rendered});
      await this.prisma.emailDelivery.update({where:{id:claim.id},data:{providerMessageId:result.id,status:"SENT",lastEventAt:new Date(),claimedAt:null}});
      return{id:result.id,status:"SENT",deduplicated:false};
    }catch(error){
      await this.prisma.emailDelivery.update({where:{id:claim.id},data:{status:"FAILED",failureCode:"provider_error",lastEventAt:new Date(),claimedAt:null}});
      throw error;
    }
  }
}
export function verifyResendWebhook(rawBody:string,signature:string,secret:string){const expected=createHmac("sha256",secret).update(rawBody).digest("hex");const supplied=Buffer.from(signature.replace(/^sha256=/,""),"hex");const expectedBuffer=Buffer.from(expected,"hex");return supplied.length===expectedBuffer.length&&timingSafeEqual(supplied,expectedBuffer);}