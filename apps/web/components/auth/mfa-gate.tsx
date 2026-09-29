"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function MfaGate({ onVerified }: { onVerified: () => void }) {
  const started = useRef(false);
  const [factor, setFactor] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp.find(
        (candidate: { status?: string }) => candidate.status === "verified",
      );
      if (verified) {
        setFactor(verified.id);
        setBusy(false);
        return;
      }

      const enrolled = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "JurisVia",
      });
      if (enrolled.error) {
        setMessage("Não foi possível preparar a autenticação em duas etapas.");
        setBusy(false);
        return;
      }
      setFactor(enrolled.data.id);
      setQr(enrolled.data.totp.qr_code);
      setSecret(enrolled.data.totp.secret);
      setBusy(false);
    })();
  }, []);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!factor || code.length < 6) return;
    setBusy(true);
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: factor });
    if (challenge.error) {
      setMessage("Não foi possível validar o código.");
      setBusy(false);
      return;
    }
    const result = await supabase.auth.mfa.verify({
      factorId: factor,
      challengeId: challenge.data.id,
      code,
    });
    if (result.error) {
      setMessage("Código inválido ou expirado.");
      setBusy(false);
      return;
    }
    onVerified();
  }

  return (
    <section className="mfa-card" aria-labelledby="mfa-title">
      <p className="eyebrow">Proteção adicional</p>
      <h1 id="mfa-title">Confirme a autenticação em duas etapas.</h1>
      {qr && (
        <>
          <p>Escaneie o QR code no seu aplicativo autenticador.</p>
          <Image
            src={qr}
            alt="QR code para cadastrar o autenticador TOTP"
            width={260}
            height={260}
            unoptimized
          />
          <details>
            <summary>Não consigo escanear</summary>
            <code>{secret}</code>
          </details>
        </>
      )}
      <form className="auth-form" onSubmit={verify}>
        <div className="auth-field">
          <label htmlFor="totp">Código de 6 dígitos</label>
          <input
            id="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, ""))
            }
          />
        </div>
        {message && (
          <p role="alert" className="form-alert">
            {message}
          </p>
        )}
        <button
          className="button button-primary"
          disabled={busy || code.length !== 6}
        >
          {busy ? "Verificando…" : "Verificar código"}
        </button>
      </form>
    </section>
  );
}
