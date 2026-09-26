"use client";

import { useEffect, useRef } from "react";

type ThemePreference = "system" | "light" | "dark";

function applyTheme(preference: ThemePreference) {
  const resolved =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;

  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeControl() {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("jurisvia-theme");
    const initial = saved === "light" || saved === "dark" ? saved : "system";
    if (selectRef.current) selectRef.current.value = initial;
    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if ((window.localStorage.getItem("jurisvia-theme") ?? "system") === "system") {
        applyTheme("system");
      }
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  function changeTheme(value: ThemePreference) {
    if (value === "system") {
      window.localStorage.removeItem("jurisvia-theme");
    } else {
      window.localStorage.setItem("jurisvia-theme", value);
    }
    applyTheme(value);
  }

  return (
    <label className="theme-control">
      <span className="sr-only">Tema de cores</span>
      <select
        ref={selectRef}
        aria-label="Tema de cores"
        defaultValue="system"
        onChange={(event) => changeTheme(event.target.value as ThemePreference)}
      >
        <option value="system">Tema do sistema</option>
        <option value="light">Tema claro</option>
        <option value="dark">Tema escuro</option>
      </select>
    </label>
  );
}
