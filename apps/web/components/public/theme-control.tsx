"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon, SystemIcon } from "./icons";

type ThemePreference = "system" | "light" | "dark";
type ThemeSnapshot = "system-light" | "system-dark" | "light" | "dark";

const THEME_KEY = "jurisvia-theme";
const THEME_EVENT = "jurisvia-theme-change";

function getPreference(): ThemePreference {
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

function resolveTheme(preference: ThemePreference) {
  return preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : preference;
}

function getSnapshot(): ThemeSnapshot {
  const preference = getPreference();
  const resolved = resolveTheme(preference);
  return preference === "system" ? `system-${resolved}` : resolved;
}

function getServerSnapshot(): ThemeSnapshot {
  return "system-light";
}

function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const emit = () => {
    applyTheme(getPreference());
    callback();
  };
  media.addEventListener("change", emit);
  window.addEventListener(THEME_EVENT, emit);
  window.addEventListener("storage", emit);
  return () => {
    media.removeEventListener("change", emit);
    window.removeEventListener(THEME_EVENT, emit);
    window.removeEventListener("storage", emit);
  };
}

export function ThemeControl() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const preference: ThemePreference = snapshot.startsWith("system-") ? "system" : snapshot as ThemePreference;
  const resolved = snapshot.endsWith("dark") ? "dark" : "light";
  const label = preference === "system"
    ? `Tema do sistema (${resolved === "dark" ? "escuro" : "claro"})`
    : `Tema ${resolved === "dark" ? "escuro" : "claro"}`;

  function changeTheme(value: ThemePreference) {
    if (value === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, value);
    applyTheme(value);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <label className="theme-control" title={label}>
      <span className="theme-icon" aria-hidden="true">
        {preference === "system" ? <SystemIcon /> : resolved === "dark" ? <MoonIcon /> : <SunIcon />}
      </span>
      <span className="sr-only">{label}. Selecione claro, escuro ou sistema.</span>
      <select aria-label={`${label}. Alterar tema de cores`} value={preference} onChange={(event) => changeTheme(event.target.value as ThemePreference)}>
        <option value="system">Usar tema do sistema</option>
        <option value="light">Usar tema claro</option>
        <option value="dark">Usar tema escuro</option>
      </select>
    </label>
  );
}
