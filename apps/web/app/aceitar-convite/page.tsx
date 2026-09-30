import{cookies}from"next/headers";
import{redirect}from"next/navigation";
import type{Metadata}from"next";
import{AuthShell}from"@/components/auth/auth-shell";
import{AcceptInvitation}from"@/components/invitations/accept-invitation";
import{invitationCookie,invitationNext}from"@/lib/invitations";
import{createClient}from"@/lib/supabase/server";
export const dynamic="force-dynamic";export const revalidate=0;export const metadata:Metadata={title:"Aceitar convite | JurisVia",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({searchParams}:{searchParams:Promise<{next?:string;estado?:string}>}){const params=await searchParams,next=invitationNext(params.next),token=(await cookies()).has(invitationCookie);if(params.estado==="invalido")return <AuthShell title="Aceitar convite" intro="Valide o acesso enviado pelo escritório."><AcceptInvitation initialState="invalid" next={next}/></AuthShell>;if(!token)return <AuthShell title="Aceitar convite" intro="Valide o acesso enviado pelo escritório."><AcceptInvitation initialState="missing" next={next}/></AuthShell>;const supabase=await createClient(),{data}=await supabase.auth.getClaims();if(!data?.claims)redirect(`/login?next=${encodeURIComponent(`/aceitar-convite?next=${encodeURIComponent(next)}`)}`);return <AuthShell title="Aceitar convite" intro="Confirme o vínculo com o escritório usando sua conta autenticada."><AcceptInvitation next={next}/></AuthShell>}