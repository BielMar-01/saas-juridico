export const emailTemplateNames=["signupConfirmation","passwordRecovery","emailChange","organizationInvitation","organizationInvitationResent","invitationAccepted","ownershipRequested","ownershipCompleted","mfaEnabled","mfaDisabled","securityAlert","organizationStatusChanged"] as const;
export type EmailTemplateName=typeof emailTemplateNames[number];
export interface TemplateInput{recipientName?:string;organizationName?:string;actionUrl?:string;expiresAt?:Date;status?:string}
const titles:Record<EmailTemplateName,string>={signupConfirmation:"Confirme seu cadastro",passwordRecovery:"Recupere sua senha",emailChange:"Confirme a alteração de e-mail",organizationInvitation:"Convite para o escritório",organizationInvitationResent:"Seu convite foi reenviado",invitationAccepted:"Convite aceito",ownershipRequested:"Transferência de propriedade solicitada",ownershipCompleted:"Transferência de propriedade concluída",mfaEnabled:"MFA ativado",mfaDisabled:"MFA desativado",securityAlert:"Alerta de segurança",organizationStatusChanged:"Status do escritório alterado"};
function escapeHtml(value:string){return value.replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]!));}
export function renderEmailTemplate(name:EmailTemplateName,input:TemplateInput){
 const title=titles[name]; const greeting=input.recipientName?`Olá, ${input.recipientName}.`:"Olá.";
 const organization=input.organizationName?` Escritório: ${input.organizationName}.`:"";
 const expiry=input.expiresAt?` Este link expira em ${input.expiresAt.toLocaleString("pt-BR",{timeZone:"UTC"})} UTC.`:"";
 const notice="Se você não reconhece esta ação, ignore a mensagem e revise a segurança da sua conta.";
 const text=[title,greeting+organization+expiry,input.actionUrl?`Acesse: ${input.actionUrl}`:"",notice,"JurisVia"].filter(Boolean).join("\n\n");
 const cta=input.actionUrl?`<p><a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:#164e63;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Continuar com segurança</a></p>`:"";
 const html=`<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f7f8;color:#17252a;font:16px Arial,sans-serif"><main style="max-width:600px;margin:auto;padding:32px"><div style="background:#fff;border:1px solid #dce5e7;border-radius:12px;padding:32px"><p style="color:#0f766e;font-weight:700">JurisVia</p><h1 style="font-size:24px">${escapeHtml(title)}</h1><p>${escapeHtml(greeting+organization+expiry)}</p>${cta}<p>${escapeHtml(notice)}</p><hr><p style="font-size:12px;color:#52656c">Mensagem transacional do JurisVia. Não responda com dados jurídicos ou credenciais.</p></div></main></body></html>`;
 return{subject:`JurisVia — ${title}`,html,text};
}
