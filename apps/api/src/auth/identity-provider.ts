import { AppError } from "../errors/app-error.js";

export interface VerifiedAuthIdentity {
  authUserId: string;
  email: string;
  name: string;
}

export interface AuthIdentityProvider {
  getVerifiedIdentity(accessToken: string): Promise<VerifiedAuthIdentity>;
}

export class SupabaseAuthIdentityProvider implements AuthIdentityProvider {
  constructor(private baseUrl: string, private publishableKey: string) {}

  async getVerifiedIdentity(accessToken: string): Promise<VerifiedAuthIdentity> {
    let response: { ok: boolean; json(): Promise<unknown> };
    try {
      response = await fetch(new URL("/auth/v1/user", this.baseUrl), {
        headers: { apikey: this.publishableKey, authorization: "Bearer " + accessToken },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new AppError("AUTH_SERVICE_UNAVAILABLE", "Serviço de autenticação indisponível.", 503);
    }
    if (!response.ok) throw new AppError("UNAUTHORIZED", "Credenciais inválidas.", 401);
    const identity = await response.json() as Record<string, unknown>;
    const email = typeof identity.email === "string" ? identity.email.trim().toLowerCase() : "";
    const confirmed = typeof identity.email_confirmed_at === "string" && identity.email_confirmed_at.length > 0;
    const id = typeof identity.id === "string" ? identity.id : "";
    if (!id || !email || !confirmed) throw new AppError("FORBIDDEN", "E-mail verificado é obrigatório.", 403);
    const metadata = identity.user_metadata && typeof identity.user_metadata === "object" ? identity.user_metadata as Record<string, unknown> : {};
    const name = typeof metadata.name === "string" && metadata.name.trim() ? metadata.name.trim() : email.split("@")[0]!;
    return { authUserId: id, email, name };
  }
}