"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CheckIcon, MoonIcon, SunIcon, SystemIcon } from "./icons";

type ThemePreference = "system" | "light" | "dark";
type ThemeOption = [ThemePreference, string, typeof SunIcon];

const THEME_KEY = "jurisvia-theme";
const THEME_EVENT = "jurisvia-theme-change";
const options: ThemeOption[] = [
  ["light", "Claro", SunIcon],
  ["dark", "Escuro", MoonIcon],
  ["system", "Sistema", SystemIcon],
];

function preference(): ThemePreference {
  const value = localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

function resolvedTheme(value: ThemePreference) {
  return value === "system"
    ? matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : value;
}

function snapshot() {
  const value = preference();
  const resolved = resolvedTheme(value);
  return value === "system" ? `system-${resolved}` : resolved;
}

function apply(value: ThemePreference) {
  const resolved = resolvedTheme(value);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

function subscribe(callback: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const emit = () => {
    apply(preference());
    callback();
  };
  addEventListener(THEME_EVENT, emit);
  addEventListener("storage", emit);
  media.addEventListener("change", emit);
  return () => {
    removeEventListener(THEME_EVENT, emit);
    removeEventListener("storage", emit);
    media.removeEventListener("change", emit);
  };
}

export function ThemeControl() {
  const currentSnapshot = useSyncExternalStore(subscribe, snapshot, () => "system-light");
  const current: ThemePreference = currentSnapshot.startsWith("system") ? "system" : currentSnapshot as ThemePreference;
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    items.current[focusIndex]?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    addEventListener("pointerdown", closeOutside);
    return () => removeEventListener("pointerdown", closeOutside);
  }, [open, focusIndex]);

  function openMenu() {
    const selected = options.findIndex(([value]) => value === current);
    setFocusIndex(selected);
    setOpen(true);
  }

  function choose(value: ThemePreference) {
    if (value === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, value);
    apply(value);
    dispatchEvent(new Event(THEME_EVENT));
    setOpen(false);
    trigger.current?.focus();
  }

  function handleMenuKey(event: React.KeyboardEvent) {
    let next = focusIndex;
    if (event.key === "ArrowDown") next = (focusIndex + 1) % options.length;
    else if (event.key === "ArrowUp") next = (focusIndex + options.length - 1) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
      return;
    } else if (event.key === "Tab") {
      setOpen(false);
      return;
    } else return;
    event.preventDefault();
    setFocusIndex(next);
  }

  const TriggerIcon = current === "light" ? SunIcon : current === "dark" ? MoonIcon : SystemIcon;

  return (
    <div className="theme-popup" ref={wrapper} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button ref={trigger} className="theme-trigger" type="button" aria-label="Alterar tema" aria-haspopup="menu" aria-expanded={open} onClick={() => open ? setOpen(false) : openMenu()}>
        <TriggerIcon />
      </button>
      {open && (
        <div className="theme-menu" role="menu" aria-label="Tema de cores" onKeyDown={handleMenuKey}>
          {options.map(([value, label, Icon], index) => (
            <button key={value} ref={(element) => { items.current[index] = element; }} role="menuitemradio" aria-checked={current === value} tabIndex={index === focusIndex ? 0 : -1} onFocus={() => setFocusIndex(index)} onClick={() => choose(value)}>
              <Icon /><span>{label}</span>{current === value && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
