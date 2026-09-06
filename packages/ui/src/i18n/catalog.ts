import type { UILabels } from "../types";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { pt } from "./locales/pt";
import { tr } from "./locales/tr";

export const LOCALES = {
  en,
  tr,
  es,
  fr,
  de,
  pt,
} as const satisfies Record<string, UILabels>;

export type LocaleCode = keyof typeof LOCALES;

export const SUPPORTED_LOCALES = Object.keys(LOCALES) as LocaleCode[];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const DEFAULT_LABELS: UILabels = en;

export const LOCALE_META: Record<LocaleCode, { name: string; nativeName: string }> = {
  en: { name: "English", nativeName: "English" },
  tr: { name: "Turkish", nativeName: "Türkçe" },
  es: { name: "Spanish", nativeName: "Español" },
  fr: { name: "French", nativeName: "Français" },
  de: { name: "German", nativeName: "Deutsch" },
  pt: { name: "Portuguese", nativeName: "Português" },
};
