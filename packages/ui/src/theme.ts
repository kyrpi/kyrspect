import type { ThemeInput, UITheme } from "./types";

export const DEFAULT_THEME: UITheme = {
  name: "default",
  label: "Default",
  accent: "#6d4aff",
  accentSoft: "rgba(109, 74, 255, 0.22)",
  background: "#000000",
  surface: "rgba(16, 16, 20, 0.88)",
  surfaceBorder: "rgba(255, 255, 255, 0.08)",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.72)",
  live: "#ff4d6a",
  track: "rgba(255, 255, 255, 0.22)",
  buffered: "rgba(255, 255, 255, 0.42)",
  played: "#6d4aff",
  radius: "12px",
  shadow: "0 12px 40px rgba(0, 0, 0, 0.45)",
  backdropBlur: "22px",
};

export const BUILTIN_THEMES: Record<string, UITheme> = {
  default: DEFAULT_THEME,
  scarlet: {
    name: "scarlet",
    label: "Scarlet",
    accent: "#ff0000",
    accentSoft: "rgba(255, 0, 0, 0.24)",
    background: "#0f0f0f",
    surface: "rgba(24, 24, 28, 0.92)",
    surfaceBorder: "rgba(255, 255, 255, 0.1)",
    text: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.7)",
    live: "#ff0000",
    track: "rgba(255, 255, 255, 0.24)",
    buffered: "rgba(255, 255, 255, 0.45)",
    played: "#ff0000",
    radius: "4px",
    shadow: "0 10px 32px rgba(0, 0, 0, 0.55)",
    backdropBlur: "20px",
  },
  cinema: {
    name: "cinema",
    label: "Cinema",
    accent: "#e50914",
    accentSoft: "rgba(229, 9, 20, 0.25)",
    background: "#000000",
    surface: "rgba(20, 20, 20, 0.95)",
    surfaceBorder: "rgba(229, 9, 20, 0.18)",
    text: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.65)",
    live: "#e50914",
    track: "rgba(255, 255, 255, 0.2)",
    buffered: "rgba(255, 255, 255, 0.4)",
    played: "#e50914",
    radius: "6px",
    shadow: "0 14px 44px rgba(0, 0, 0, 0.6)",
    backdropBlur: "24px",
  },
  emerald: {
    name: "emerald",
    label: "Emerald",
    accent: "#1db954",
    accentSoft: "rgba(29, 185, 84, 0.24)",
    background: "#121212",
    surface: "rgba(24, 24, 24, 0.92)",
    surfaceBorder: "rgba(255, 255, 255, 0.08)",
    text: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.7)",
    live: "#1db954",
    track: "rgba(255, 255, 255, 0.22)",
    buffered: "rgba(255, 255, 255, 0.42)",
    played: "#1db954",
    radius: "16px",
    shadow: "0 12px 36px rgba(0, 0, 0, 0.5)",
    backdropBlur: "22px",
  },
  cyberpunk: {
    name: "cyberpunk",
    label: "Cyberpunk",
    accent: "#00f0ff",
    accentSoft: "rgba(0, 240, 255, 0.28)",
    background: "#0a0914",
    surface: "rgba(18, 14, 34, 0.94)",
    surfaceBorder: "rgba(0, 240, 255, 0.25)",
    text: "#fbfbfb",
    textMuted: "rgba(251, 251, 251, 0.75)",
    live: "#ff0055",
    track: "rgba(255, 255, 255, 0.22)",
    buffered: "rgba(0, 240, 255, 0.35)",
    played: "#00f0ff",
    radius: "2px",
    shadow: "0 8px 30px rgba(0, 240, 255, 0.2)",
    backdropBlur: "18px",
  },
  light: {
    name: "light",
    label: "Light",
    accent: "#2563eb",
    accentSoft: "rgba(37, 99, 235, 0.18)",
    background: "#f3f4f6",
    surface: "rgba(255, 255, 255, 0.94)",
    surfaceBorder: "rgba(0, 0, 0, 0.12)",
    text: "#111827",
    textMuted: "rgba(17, 24, 39, 0.7)",
    live: "#dc2626",
    track: "rgba(0, 0, 0, 0.18)",
    buffered: "rgba(0, 0, 0, 0.32)",
    played: "#2563eb",
    radius: "12px",
    shadow: "0 12px 36px rgba(0, 0, 0, 0.15)",
    backdropBlur: "22px",
    className: "kyrspect-theme-light",
  },
  glass: {
    name: "glass",
    label: "Glass",
    accent: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.28)",
    background: "#020617",
    surface: "rgba(255, 255, 255, 0.09)",
    surfaceBorder: "rgba(255, 255, 255, 0.16)",
    text: "#f8fafc",
    textMuted: "rgba(248, 250, 252, 0.75)",
    live: "#f43f5e",
    track: "rgba(255, 255, 255, 0.18)",
    buffered: "rgba(255, 255, 255, 0.38)",
    played: "#38bdf8",
    radius: "16px",
    shadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
    backdropBlur: "32px",
    className: "kyrspect-theme-glass",
  },
  amber: {
    name: "amber",
    label: "Amber",
    accent: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, 0.24)",
    background: "#110e08",
    surface: "rgba(26, 20, 12, 0.92)",
    surfaceBorder: "rgba(245, 158, 11, 0.2)",
    text: "#fef3c7",
    textMuted: "rgba(254, 243, 199, 0.72)",
    live: "#f59e0b",
    track: "rgba(254, 243, 199, 0.2)",
    buffered: "rgba(254, 243, 199, 0.38)",
    played: "#f59e0b",
    radius: "10px",
    shadow: "0 12px 36px rgba(0, 0, 0, 0.55)",
    backdropBlur: "20px",
  },
};

const customThemeRegistry = new Map<string, UITheme>();

export function registerTheme(name: string, theme: UITheme): void {
  customThemeRegistry.set(name, { ...theme, name });
}

export function unregisterTheme(name: string): boolean {
  return customThemeRegistry.delete(name);
}

export function getTheme(name: string): UITheme | undefined {
  return customThemeRegistry.get(name) ?? BUILTIN_THEMES[name];
}

export function getRegisteredThemes(): Array<{ id: string; label: string; theme: UITheme }> {
  const list: Array<{ id: string; label: string; theme: UITheme }> = [];
  for (const [id, theme] of Object.entries(BUILTIN_THEMES)) {
    list.push({ id, label: theme.label || id, theme });
  }
  for (const [id, theme] of customThemeRegistry.entries()) {
    if (!BUILTIN_THEMES[id]) {
      list.push({ id, label: theme.label || id, theme });
    }
  }
  return list;
}

const THEME_CSS_VARS: Record<string, string> = {
  accent: "--kyrspect-accent",
  accentSoft: "--kyrspect-accent-soft",
  background: "--kyrspect-background",
  surface: "--kyrspect-surface",
  surfaceBorder: "--kyrspect-surface-border",
  text: "--kyrspect-text",
  textMuted: "--kyrspect-text-muted",
  live: "--kyrspect-live",
  track: "--kyrspect-track",
  buffered: "--kyrspect-buffered",
  played: "--kyrspect-played",
  controlSize: "--kyrspect-control-size",
  iconSize: "--kyrspect-icon-size",
  radius: "--kyrspect-radius",
  font: "--kyrspect-font",
  shadow: "--kyrspect-shadow",
  backdropBlur: "--kyrspect-backdrop-blur",
};

export function resolveTheme(theme?: ThemeInput): { resolvedTheme: UITheme; themeName: string } {
  if (typeof theme === "string") {
    const found = getTheme(theme);
    if (found) {
      return { resolvedTheme: found, themeName: theme };
    }
    return { resolvedTheme: DEFAULT_THEME, themeName: "default" };
  }

  if (theme && typeof theme === "object") {
    const name = theme.name || "custom";
    return { resolvedTheme: { ...DEFAULT_THEME, ...theme }, themeName: name };
  }

  return { resolvedTheme: DEFAULT_THEME, themeName: "default" };
}

export function applyTheme(root: HTMLElement, theme?: ThemeInput): UITheme {
  const { resolvedTheme, themeName } = resolveTheme(theme);

  // Clean previous theme classes
  const classesToRemove: string[] = [];
  for (const cls of root.classList) {
    if (cls.startsWith("kyrspect-theme-")) {
      classesToRemove.push(cls);
    }
  }
  for (const cls of classesToRemove) {
    root.classList.remove(cls);
  }

  // Set theme data attribute and class
  root.dataset.theme = themeName;
  root.classList.add(`kyrspect-theme-${themeName}`);
  if (resolvedTheme.className) {
    for (const token of resolvedTheme.className.split(/\s+/)) {
      if (token) root.classList.add(token);
    }
  }

  // Apply mapped CSS variables
  for (const [key, cssVar] of Object.entries(THEME_CSS_VARS)) {
    const value = (resolvedTheme as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0) {
      root.style.setProperty(cssVar, value);
    } else {
      root.style.removeProperty(cssVar);
    }
  }

  // Apply optional customVars
  if (resolvedTheme.customVars) {
    for (const [varName, varVal] of Object.entries(resolvedTheme.customVars)) {
      const prop = varName.startsWith("--") ? varName : `--${varName}`;
      root.style.setProperty(prop, varVal);
    }
  }

  return resolvedTheme;
}
