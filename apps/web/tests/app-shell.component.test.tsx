import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AppShell } from "../components/app/app-shell";
import { api, ApiError } from "../lib/api";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("../lib/api", () => ({
  api: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
  },
}));
vi.mock("../lib/supabase/client", () => ({ createClient: () => ({ auth: { signOut: vi.fn() } }) }));
vi.mock("../components/public/theme-control", () => ({ ThemeControl: () => <button>Tema</button> }));
vi.mock("../components/auth/mfa-gate", () => ({ MfaGate: () => <div>Gate MFA</div> }));

const mockedApi = vi.mocked(api);

describe("AppShell post-login routing", () => {
  beforeEach(() => { mockedApi.mockReset(); replace.mockReset(); localStorage.clear(); });

  it("routes a SUPER_ADMIN with no memberships to the platform area", async () => {
    mockedApi.mockImplementation(async (path) => {
      if (path === "/api/v1/auth/organizations") throw new ApiError(403, "FORBIDDEN", "Sem vínculo");
      return { data: {}, meta: {}, requestId: "admin" };
    });
    render(<AppShell><p>Tenant</p></AppShell>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it("routes a SUPER_ADMIN at AAL1 to the admin MFA gate", async () => {
    mockedApi.mockImplementation(async (path) => {
      if (path === "/api/v1/auth/organizations") return { data: [], meta: {}, requestId: "orgs" };
      throw new ApiError(403, "MFA_REQUIRED", "Reforço necessário");
    });
    render(<AppShell><p>Tenant</p></AppShell>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it("shows pending access to an ordinary confirmed user with no memberships", async () => {
    mockedApi.mockRejectedValue(new ApiError(403, "FORBIDDEN", "Sem acesso"));
    render(<AppShell><p>Tenant</p></AppShell>);
    expect(await screen.findByRole("heading", { name: "Acesso pendente" })).toBeTruthy();
    expect(replace).not.toHaveBeenCalledWith("/admin");
  });

  it("keeps service failures distinct from pending access", async () => {
    mockedApi.mockRejectedValue(new ApiError(503, "INTERNAL_ERROR", "Indisponível"));
    render(<AppShell><p>Tenant</p></AppShell>);
    expect(await screen.findByRole("heading", { name: "Não foi possível carregar" })).toBeTruthy();
    expect(screen.getByText("Não foi possível carregar seus escritórios.")).toBeTruthy();
  });
});
