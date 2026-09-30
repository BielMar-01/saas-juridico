export interface InvitationDelivery {
  send(input: { email: string; token: string; expiresAt: Date; organizationName: string }): Promise<void>;
}

export class SafeDevelopmentInvitationDelivery implements InvitationDelivery {
  async send(input: { email: string; token: string; expiresAt: Date; organizationName: string }) {
    void input;
    // Intentionally no-op: never log or persist invitation tokens.
  }
}

export class UnavailableInvitationDelivery implements InvitationDelivery {
  async send(input: { email: string; token: string; expiresAt: Date; organizationName: string }) {
    void input;
    throw new Error("Invitation delivery provider is not configured.");
  }
}