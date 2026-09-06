import type { UITheme } from "./types";

const THEME_VARS: Record<keyof UITheme, string> = {
  accent: "--kyrspect-accent",
  accentSoft: "--kyrspect-accent-soft",
  background: "--kyrspect-background",
  text: "--kyrspect-text",
  textMuted: "--kyrspect-text-muted",
  live: "--kyrspect-live",
  track: "--kyrspect-track",
  buffered: "--kyrspect-buffered",
  controlSize: "--kyrspect-control-size",
  radius: "--kyrspect-radius",
  font: "--kyrspect-font",
};

export function applyTheme(root: HTMLElement, theme?: UITheme | null): void {
  for (const [key, cssVar] of Object.entries(THEME_VARS) as Array<[keyof UITheme, string]>) {
    const value = theme?.[key];
    if (value) root.style.setProperty(cssVar, value);
    else root.style.removeProperty(cssVar);
  }
}
