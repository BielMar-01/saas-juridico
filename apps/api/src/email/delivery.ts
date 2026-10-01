import type { InvitationDelivery } from "../team/delivery.js";
import type { EmailService } from "./service.js";
export class EmailInvitationDelivery implements InvitationDelivery{
 constructor(private email:EmailService,private appUrl:string){}
 async send(input:{email:string;token:string;expiresAt:Date;organizationName:string;invitationId?:string}){const key=`invitation:${input.invitationId??input.email}:${input.expiresAt.toISOString()}`;await this.email.send({to:input.email,category:"invitations",template:"organizationInvitation",idempotencyKey:key,data:{organizationName:input.organizationName,actionUrl:`${this.appUrl.replace(/\/$/,"")}/convite?token=${encodeURIComponent(input.token)}`,expiresAt:input.expiresAt}});}}
