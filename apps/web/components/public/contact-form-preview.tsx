"use client";

import { useRef, useState } from "react";

type Field = "name" | "email" | "office" | "size" | "subject" | "message" | "consent";
type Values = Record<Exclude<Field, "consent">, string> & { consent: boolean };
const initial: Values = { name: "", email: "", office: "", size: "", subject: "", message: "", consent: false };
const topics = ["Conhecer a proposta", "Participar de entrevistas", "Avaliar um piloto", "Outro assunto"];

function validate(values: Values) {
  const errors: Partial<Record<Field, string>> = {};
  const nameLength = values.name.trim().length;
  const officeLength = values.office.trim().length;
  const subjectLength = values.subject.trim().length;
  if (nameLength < 2 || nameLength > 120) errors.name = "Informe um nome entre 2 e 120 caracteres.";
  if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Informe um e-mail válido com até 254 caracteres.";
  if (officeLength < 2 || officeLength > 160) errors.office = "Informe o escritório entre 2 e 160 caracteres.";
  if (!values.size) errors.size = "Selecione o tamanho aproximado da equipe.";
  if (subjectLength < 2 || subjectLength > 160) errors.subject = "Informe um assunto entre 2 e 160 caracteres.";
  if (values.message.trim().length < 20) errors.message = "Escreva uma mensagem com pelo menos 20 caracteres.";
  if (values.message.length > 1000) errors.message = "A mensagem deve ter no máximo 1000 caracteres.";
  if (!values.consent) errors.consent = "Confirme que entendeu o requisito futuro de tratamento dos dados.";
  return errors;
}

export function ContactFormPreview() {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState("Nenhum dado será enviado ou armazenado nesta prévia.");
  const form = useRef<HTMLFormElement>(null);
  const errors = validate(values);

  function update<K extends keyof Values>(field: K, value: Values[K]) { setValues((current) => ({ ...current, [field]: value })); }
  function blur(field: Field) { setTouched((current) => ({ ...current, [field]: true })); }
  function chooseTopic(topic: string) { update("subject", topic); setTouched((current) => ({ ...current, subject: true })); setStatus(`Assunto “${topic}” selecionado. Complete os demais campos; nada foi enviado.`); requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("#name")?.focus()); }
  function verify(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values);
    const fields = Object.keys(initial) as Field[];
    setTouched(Object.fromEntries(fields.map((field) => [field, true])));
    const first = fields.find((field) => nextErrors[field]);
    if (first) { setStatus("Revise os campos indicados. Nada foi enviado ou armazenado."); requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(`#${first}`)?.focus()); }
    else setStatus("Preenchimento revisado localmente. Nada foi enviado ou armazenado; o canal ainda não está implementado.");
  }
  const error = (field: Field) => touched[field] && errors[field] ? <p className="field-error" id={`${field}-error`}>{errors[field]}</p> : null;
  const described = (field: Field, extra?: string) => [touched[field] && errors[field] ? `${field}-error` : "", extra ?? ""].filter(Boolean).join(" ") || undefined;

  return <div className="contact-workspace">
    <div className="contact-topics" aria-labelledby="topics-title"><h2 id="topics-title">Qual conversa faz sentido agora?</h2><p>Escolha um assunto para preencher a prévia e ir ao formulário.</p><div>{topics.map((topic) => <button type="button" key={topic} onClick={() => chooseTopic(topic)}>{topic}</button>)}</div></div>
    <form ref={form} id="formulario" className="contact-form" noValidate onSubmit={verify}>
      <div className="form-heading"><p className="eyebrow">Prévia local</p><h2>Conte um pouco sobre o escritório.</h2><p>Este formulário demonstra campos e validações. Não existe envio, persistência ou destinatário configurado.</p></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="name">Nome <span aria-hidden="true">*</span></label><input id="name" name="name" required maxLength={120} autoComplete="name" value={values.name} onChange={(e) => update("name", e.target.value)} onBlur={() => blur("name")} aria-invalid={Boolean(touched.name && errors.name)} aria-describedby={described("name")} />{error("name")}</div>
        <div className="field"><label htmlFor="email">E-mail profissional <span aria-hidden="true">*</span></label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" value={values.email} onChange={(e) => update("email", e.target.value)} onBlur={() => blur("email")} aria-invalid={Boolean(touched.email && errors.email)} aria-describedby={described("email")} />{error("email")}</div>
        <div className="field"><label htmlFor="office">Escritório <span aria-hidden="true">*</span></label><input id="office" name="office" required maxLength={160} autoComplete="organization" value={values.office} onChange={(e) => update("office", e.target.value)} onBlur={() => blur("office")} aria-invalid={Boolean(touched.office && errors.office)} aria-describedby={described("office")} />{error("office")}</div>
        <div className="field"><label htmlFor="size">Tamanho da equipe <span aria-hidden="true">*</span></label><select id="size" name="size" required value={values.size} onChange={(e) => update("size", e.target.value)} onBlur={() => blur("size")} aria-invalid={Boolean(touched.size && errors.size)} aria-describedby={described("size")}><option value="">Selecione</option><option>1 pessoa</option><option>2 a 5 pessoas</option><option>6 a 15 pessoas</option><option>16 a 50 pessoas</option><option>Mais de 50 pessoas</option></select>{error("size")}</div>
        <div className="field field-wide"><label htmlFor="subject">Assunto <span aria-hidden="true">*</span></label><input id="subject" name="subject" required maxLength={160} value={values.subject} onChange={(e) => update("subject", e.target.value)} onBlur={() => blur("subject")} aria-invalid={Boolean(touched.subject && errors.subject)} aria-describedby={described("subject")} />{error("subject")}</div>
        <div className="field field-wide"><label htmlFor="message">Mensagem <span aria-hidden="true">*</span></label><textarea id="message" name="message" required rows={7} maxLength={1000} value={values.message} onChange={(e) => update("message", e.target.value)} onBlur={() => blur("message")} aria-invalid={Boolean(touched.message && errors.message)} aria-describedby={described("message", "message-counter")} /><div className="field-meta"><span>Não inclua dados reais de clientes, casos ou processos.</span><span id="message-counter">{values.message.length}/1000</span></div>{error("message")}</div>
      </div>
      <div className="field checkbox-field"><input id="consent" name="consent" type="checkbox" required aria-required="true" checked={values.consent} onChange={(e) => update("consent", e.target.checked)} onBlur={() => blur("consent")} aria-invalid={Boolean(touched.consent && errors.consent)} aria-describedby={described("consent", "consent-note")} /><div><label htmlFor="consent">Entendo que, quando houver envio real, o tratamento destes dados exigirá aviso de privacidade e consentimento ou outra base legal aplicável. <span aria-hidden="true">*</span></label><p id="consent-note">Requisito futuro apresentado nesta prévia; marcar não transmite nenhuma informação.</p>{error("consent")}</div></div>
      <p className="form-status" role="status" aria-live="polite">{status}</p>
      <div className="form-actions"><button className="button button-primary button-large" type="submit">Verificar preenchimento</button><button className="button button-secondary button-large" type="button" disabled aria-describedby="send-disabled-note">Enviar mensagem</button></div><p id="send-disabled-note" className="disabled-note">Envio indisponível: nenhum endpoint ou destino foi definido.</p>
    </form>
  </div>;
}
