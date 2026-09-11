import { describe, expect, it } from "vitest";
import { Kyrspect } from "@kyrspect/core";
import { PLAYER_CSS } from "@kyrspect/ui";

describe("hover scale and performance mode", () => {
  it("does not have scale transform on .kyrspect-btn:hover or .kyrspect-big-play:hover", () => {
    // Verify CSS rules do not scale icons on hover
    expect(PLAYER_CSS).not.toMatch(/\.kyrspect-btn:hover\s*\{[^}]*transform:\s*scale/);
    expect(PLAYER_CSS).not.toMatch(/\.kyrspect-big-play:hover\s*\{[^}]*transform:\s*scale/);
  });

  it("includes smooth opening animation for settings menu", () => {
    expect(PLAYER_CSS).toContain("animation: kyrspect-menu-in");
    expect(PLAYER_CSS).toContain("@keyframes kyrspect-menu-in");
  });

  it("defines comprehensive performance mode rules disabling all animations and blurs", () => {
    expect(PLAYER_CSS).toContain(".kyrspect-player.kyrspect-performance-mode");
    expect(PLAYER_CSS).toContain("animation: none !important");
    expect(PLAYER_CSS).toContain("transition: none !important");
    expect(PLAYER_CSS).toContain("backdrop-filter: none !important");
  });

  it("enables and toggles performance mode via player API", () => {
    const root = document.createElement("div");
    document.body.append(root);

    const player = new Kyrspect(root, {
      controls: true,
      performanceMode: false,
    });

    expect(player.isPerformanceMode()).toBe(false);
    expect(root.classList.contains("kyrspect-performance-mode")).toBe(false);

    let eventState: boolean | undefined;
    player.on("performancemodechange", (data) => {
      eventState = data.enabled;
    });

    player.setPerformanceMode(true);
    expect(player.isPerformanceMode()).toBe(true);
    expect(root.classList.contains("kyrspect-performance-mode")).toBe(true);
    expect(root.dataset.performanceMode).toBe("true");
    expect(eventState).toBe(true);

    player.setPerformanceMode(false);
    expect(player.isPerformanceMode()).toBe(false);
    expect(root.classList.contains("kyrspect-performance-mode")).toBe(false);
    expect(root.dataset.performanceMode).toBe("false");
    expect(eventState).toBe(false);

    player.destroy();
    root.remove();
  });

  it("provides performance mode toggle inside settings menu", () => {
    const root = document.createElement("div");
    document.body.append(root);

    const player = new Kyrspect(root, {
      controls: true,
      language: "tr",
    });

    const settingsBtn = root.querySelector<HTMLButtonElement>('[data-control="settings"]');
    expect(settingsBtn).toBeTruthy();
    settingsBtn?.click();

    const menuItems = Array.from(root.querySelectorAll<HTMLButtonElement>(".kyrspect-menu-item"));
    const perfItem = menuItems.find((item) => item.textContent?.includes("Performans Modu"));
    expect(perfItem).toBeTruthy();
    expect(perfItem?.getAttribute("aria-checked")).toBe("false");

    // Click toggle
    perfItem?.click();
    expect(player.isPerformanceMode()).toBe(true);
    expect(root.classList.contains("kyrspect-performance-mode")).toBe(true);

    player.destroy();
    root.remove();
  });
});
