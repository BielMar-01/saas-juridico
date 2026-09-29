import { createClient } from "@/lib/supabase/client";

const base = () => {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value)
    throw new ApiError(0, "CONFIGURATION_ERROR", "Serviço indisponível.");
  return value.replace(/\/$/, "");
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
    public details?: unknown[],
  ) {
    super(message);
  }
}

type Options = RequestInit & { organizationId?: string; retry?: boolean };

async function token(refresh = false) {
  const auth = createClient().auth;
  if (refresh) {
    const { data, error } = await auth.refreshSession();
    if (error) return null;
    return data.session?.access_token ?? null;
  }
  const { data } = await auth.getSession();
  return data.session?.access_token ?? null;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  let access = await token();
  if (!access) {
    window.dispatchEvent(new Event("jurisvia:auth-expired"));
    throw new ApiError(401, "UNAUTHORIZED", "Sua sessão expirou.");
  }

  const headers = new Headers(options.headers);
  headers.set("authorization", `Bearer ${access}`);
  headers.set("accept", "application/json");
  headers.set("x-request-id", crypto.randomUUID());
  if (options.body) headers.set("content-type", "application/json");
  if (options.organizationId)
    headers.set("x-organization-id", options.organizationId);

  let response = await fetch(base() + path, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (
    response.status === 401 &&
    options.retry !== false &&
    (access = await token(true))
  ) {
    headers.set("authorization", `Bearer ${access}`);
    response = await fetch(base() + path, {
      ...options,
      headers,
      cache: "no-store",
    });
  }

  const requestId = response.headers.get("x-request-id") ?? undefined;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      await createClient().auth.signOut({ scope: "local" });
      window.dispatchEvent(new Event("jurisvia:auth-expired"));
    }
    throw new ApiError(
      response.status,
      body?.error?.code ?? "REQUEST_FAILED",
      safeMessage(response.status, body?.error?.message),
      body?.requestId ?? requestId,
      body?.error?.details,
    );
  }
  return body as T;
}

function safeMessage(status: number, message?: string) {
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 403) return "Você não tem permissão para esta ação.";
  if (status === 404) return "Recurso não encontrado.";
  if (status === 409) return "Já existe um registro com esses dados.";
  if (status === 422 || status === 400)
    return message ?? "Revise os dados informados.";
  return status >= 500
    ? "O serviço está temporariamente indisponível."
    : (message ?? "Não foi possível concluir a solicitação.");
}
