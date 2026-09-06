import type { UILabels } from "../types";
import { DEFAULT_LOCALE, LOCALES, SUPPORTED_LOCALES, type LocaleCode } from "./catalog";

function matchSupported(input: string): LocaleCode | null {
  const normalized = input.trim().toLowerCase().replaceAll("_", "-");
  if (!normalized) return null;
  if (normalized in LOCALES) return normalized as LocaleCode;
  const base = normalized.split("-")[0] ?? "";
  return SUPPORTED_LOCALES.includes(base as LocaleCode) ? (base as LocaleCode) : null;
}

export function detectBrowserLocale(): LocaleCode {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const matched = matchSupported(candidate);
    if (matched) return matched;
  }
  return DEFAULT_LOCALE;
}

export function resolveLocale(input?: string | null): LocaleCode {
  if (!input || input === "auto") return detectBrowserLocale();
  return matchSupported(input) ?? DEFAULT_LOCALE;
}

export function resolveLabels(language?: string | null, overrides?: Partial<UILabels>): UILabels {
  const locale = resolveLocale(language);
  return { ...LOCALES[locale], ...overrides };
}

export function isSupportedLocale(input: string): input is LocaleCode {
  return matchSupported(input) !== null;
}
