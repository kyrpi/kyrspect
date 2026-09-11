import { describe, expect, it } from "vitest";
import {
  Kyrspect,
  BUILTIN_THEMES,
  applyTheme,
  getRegisteredThemes,
  getTheme,
  registerTheme,
  resolveTheme,
  unregisterTheme,
} from "@kyrspect/core";

describe("theme system", () => {
  it("includes all aesthetic built-in themes without company names", () => {
    const themeIds = Object.keys(BUILTIN_THEMES);
    expect(themeIds).toContain("default");
    expect(themeIds).toContain("scarlet");
    expect(themeIds).toContain("cinema");
    expect(themeIds).toContain("emerald");
    expect(themeIds).toContain("cyberpunk");
    expect(themeIds).toContain("light");
    expect(themeIds).toContain("glass");
    expect(themeIds).toContain("amber");

    // Strictly ensure no company/brand names are used
    expect(themeIds).not.toContain("youtube");
    expect(themeIds).not.toContain("netflix");
    expect(themeIds).not.toContain("spotify");
  });

  it("registers, retrieves, and unregisters custom themes", () => {
    registerTheme("synthwave", {
      label: "Synthwave",
      accent: "#ff00ff",
      accentSoft: "rgba(255, 0, 255, 0.25)",
      background: "#1a0026",
      surface: "rgba(30, 0, 48, 0.9)",
      customVars: {
        "--kyrspect-neon-glow": "0 0 10px #ff00ff",
      },
    });

    const theme = getTheme("synthwave");
    expect(theme).toBeDefined();
    expect(theme?.accent).toBe("#ff00ff");

    const all = getRegisteredThemes();
    expect(all.some((t) => t.id === "synthwave")).toBe(true);

    unregisterTheme("synthwave");
    expect(getTheme("synthwave")).toBeUndefined();
  });

  it("resolves built-in and custom theme inputs", () => {
    const scarlet = resolveTheme("scarlet");
    expect(scarlet.themeName).toBe("scarlet");
    expect(scarlet.resolvedTheme.accent).toBe("#ff0000");

    const fallback = resolveTheme("non-existent-theme");
    expect(fallback.themeName).toBe("default");
    expect(fallback.resolvedTheme.name).toBe("default");

    const custom = resolveTheme({ accent: "#123456", name: "custom-blue" });
    expect(custom.themeName).toBe("custom-blue");
    expect(custom.resolvedTheme.accent).toBe("#123456");
  });

  it("applies theme styles and classes to DOM element", () => {
    const el = document.createElement("div");
    applyTheme(el, "emerald");

    expect(el.dataset.theme).toBe("emerald");
    expect(el.classList.contains("kyrspect-theme-emerald")).toBe(true);
    expect(el.style.getPropertyValue("--kyrspect-accent")).toBe("#1db954");
    expect(el.style.getPropertyValue("--kyrspect-played")).toBe("#1db954");

    // Switch theme and ensure previous class is removed
    applyTheme(el, "light");
    expect(el.dataset.theme).toBe("light");
    expect(el.classList.contains("kyrspect-theme-emerald")).toBe(false);
    expect(el.classList.contains("kyrspect-theme-light")).toBe(true);
    expect(el.style.getPropertyValue("--kyrspect-accent")).toBe("#2563eb");
  });

  it("integrates dynamically with Kyrspect instance and emits themechange event", () => {
    const root = document.createElement("div");
    document.body.append(root);

    const player = new Kyrspect(root, {
      controls: true,
      theme: "cyberpunk",
    });

    expect(player.getThemeName()).toBe("cyberpunk");
    expect(root.dataset.theme).toBe("cyberpunk");
    expect(root.classList.contains("kyrspect-theme-cyberpunk")).toBe(true);

    let eventThemeName = "";
    player.on("themechange", (data) => {
      eventThemeName = data.name;
    });

    player.setTheme("cinema");
    expect(eventThemeName).toBe("cinema");
    expect(player.getThemeName()).toBe("cinema");
    expect(root.dataset.theme).toBe("cinema");
    expect(root.classList.contains("kyrspect-theme-cinema")).toBe(true);
    expect(root.classList.contains("kyrspect-theme-cyberpunk")).toBe(false);

    player.destroy();
    root.remove();
  });

  it("renders theme selector in the settings menu and switches themes interactively", () => {
    const root = document.createElement("div");
    document.body.append(root);

    const player = new Kyrspect(root, {
      controls: true,
      theme: "default",
      language: "tr",
    });

    const settingsBtn = root.querySelector<HTMLButtonElement>('[data-control="settings"]');
    expect(settingsBtn).toBeTruthy();
    settingsBtn?.click();

    const menu = root.querySelector<HTMLElement>(".kyrspect-menu");
    expect(menu?.dataset.open).toBe("true");

    // Find the theme menu item in root view
    const menuItems = Array.from(root.querySelectorAll<HTMLButtonElement>(".kyrspect-menu-item"));
    const themeItem = menuItems.find((item) => item.textContent?.includes("Tema"));
    expect(themeItem).toBeTruthy();
    expect(themeItem?.textContent).toContain("Varsayılan");

    // Click to enter Theme menu
    themeItem?.click();
    expect(menu?.dataset.view).toBe("theme");

    // Check that themes are listed
    const themeOptionItems = Array.from(root.querySelectorAll<HTMLButtonElement>(".kyrspect-menu-item"));
    expect(themeOptionItems.length).toBeGreaterThanOrEqual(8);

    // Select "Sinema" theme
    const cinemaItem = themeOptionItems.find((item) => item.textContent?.includes("Sinema"));
    expect(cinemaItem).toBeTruthy();
    cinemaItem?.click();

    expect(root.dataset.theme).toBe("cinema");
    expect(root.classList.contains("kyrspect-theme-cinema")).toBe(true);

    player.destroy();
    root.remove();
  });
});
