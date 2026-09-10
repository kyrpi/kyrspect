import { Kyrspect, EQUALIZER_PRESETS } from "@kyrspect/core";
import { PLAYER_CSS } from "@kyrspect/ui";

describe("Advanced Settings (Gelişmiş Ayarlar)", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.append(root);
  });

  afterEach(() => {
    root.remove();
  });

  it("renders Gelişmiş Ayarlar option in root settings menu", () => {
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    expect(settingsBtn).toBeInstanceOf(HTMLButtonElement);
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;
    expect(menu.dataset.open).toBe("true");

    const items = Array.from(menu.querySelectorAll(".kyrspect-menu-item")) as HTMLButtonElement[];
    const advancedItem = items.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Gelişmiş Ayarlar"),
    );

    expect(advancedItem).toBeDefined();
    expect(advancedItem?.querySelector(".kyrspect-menu-chevron")).toBeInstanceOf(HTMLElement);

    player.destroy();
  });

  it("navigates into Gelişmiş Ayarlar and displays sub-options", () => {
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;
    const items = Array.from(menu.querySelectorAll(".kyrspect-menu-item")) as HTMLButtonElement[];
    const advancedItem = items.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Gelişmiş Ayarlar"),
    );
    advancedItem?.click();

    expect(menu.dataset.view).toBe("advanced");

    const backBtn = menu.querySelector(".kyrspect-menu-back") as HTMLButtonElement;
    expect(backBtn).toBeInstanceOf(HTMLButtonElement);
    expect(backBtn.textContent).toContain("Gelişmiş Ayarlar");

    const subItems = Array.from(menu.querySelectorAll(".kyrspect-menu-item")) as HTMLButtonElement[];
    const subtitleItem = subItems.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Altyazı Ayarları"),
    );
    const dualChannelItem = subItems.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Sesi her iki kanaldan ver"),
    );
    const eqItem = subItems.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Ekolayzer"),
    );

    expect(subtitleItem).toBeDefined();
    expect(dualChannelItem).toBeDefined();
    expect(eqItem).toBeDefined();

    expect(dualChannelItem?.getAttribute("role")).toBe("menuitemcheckbox");
    expect(dualChannelItem?.getAttribute("aria-checked")).toBe("false");
    expect(dualChannelItem?.querySelector(".kyrspect-menu-value")?.textContent).toBe("Kapalı");

    player.destroy();
  });

  it("toggles dual-channel audio option", () => {
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    expect(player.isDualChannelAudioEnabled()).toBe(false);

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;
    const advancedItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Gelişmiş Ayarlar"),
    ) as HTMLButtonElement;
    advancedItem.click();

    const dualChannelItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Sesi her iki kanaldan ver"),
    ) as HTMLButtonElement;

    dualChannelItem.click();

    expect(player.isDualChannelAudioEnabled()).toBe(true);

    const updatedItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Sesi her iki kanaldan ver"),
    ) as HTMLButtonElement;

    expect(updatedItem.getAttribute("aria-checked")).toBe("true");
    expect(updatedItem.querySelector(".kyrspect-menu-value")?.textContent).toBe("Açık");

    // Toggle back
    updatedItem.click();
    expect(player.isDualChannelAudioEnabled()).toBe(false);

    player.destroy();
  });

  it("navigates into Equalizer submenu and selects presets", () => {
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;
    const advancedItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Gelişmiş Ayarlar"),
    ) as HTMLButtonElement;
    advancedItem.click();

    const eqItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Ekolayzer"),
    ) as HTMLButtonElement;
    eqItem.click();

    expect(menu.dataset.view).toBe("advanced-equalizer");

    const eqOptions = Array.from(menu.querySelectorAll(".kyrspect-menu-item")) as HTMLButtonElement[];
    expect(eqOptions.length).toBe(Object.keys(EQUALIZER_PRESETS).length);

    const bassBoostItem = eqOptions.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Bas Güçlendirme"),
    );
    expect(bassBoostItem).toBeDefined();

    bassBoostItem?.click();

    expect(player.getEqualizerPreset()).toBe("bass-boost");

    player.destroy();
  });

  it("navigates into Subtitle Settings and configures font, text color, and background color", () => {
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;
    const advancedItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Gelişmiş Ayarlar"),
    ) as HTMLButtonElement;
    advancedItem.click();

    const subItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Altyazı Ayarları"),
    ) as HTMLButtonElement;
    subItem.click();

    expect(menu.dataset.view).toBe("advanced-subtitles");

    // 1. Font Family
    const fontItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Yazı Tipi"),
    ) as HTMLButtonElement;
    fontItem.click();

    expect(menu.dataset.view).toBe("advanced-sub-font");
    const monoItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Monospace"),
    ) as HTMLButtonElement;
    monoItem.click();

    expect(player.getSubtitleStyle().fontFamily).toContain("monospace");
    expect(root.style.getPropertyValue("--kyrspect-sub-font-family")).toContain("monospace");

    // Go back to subtitle settings
    const backBtn = menu.querySelector(".kyrspect-menu-back") as HTMLButtonElement;
    backBtn.click();
    expect(menu.dataset.view).toBe("advanced-subtitles");

    // 2. Text Color
    const colorItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Yazı Rengi"),
    ) as HTMLButtonElement;
    colorItem.click();

    expect(menu.dataset.view).toBe("advanced-sub-color");
    const yellowItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Sarı"),
    ) as HTMLButtonElement;
    yellowItem.click();

    expect(player.getSubtitleStyle().color?.toLowerCase()).toBe("#ffff00");
    expect(root.style.getPropertyValue("--kyrspect-sub-color").toLowerCase()).toBe("#ffff00");

    // Go back to subtitle settings
    menu.querySelector<HTMLButtonElement>(".kyrspect-menu-back")?.click();
    expect(menu.dataset.view).toBe("advanced-subtitles");

    // 3. Background Color
    const bgItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Arka Plan Rengi"),
    ) as HTMLButtonElement;
    bgItem.click();

    expect(menu.dataset.view).toBe("advanced-sub-bg");
    const transparentItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.getAttribute("data-value") === "transparent" ||
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Saydam / Yok"),
    ) as HTMLButtonElement;
    transparentItem.click();

    expect(player.getSubtitleStyle().backgroundColor).toBe("transparent");
    expect(root.style.getPropertyValue("--kyrspect-sub-bg-color")).toBe("transparent");

    player.destroy();
  });

  it("handles multi-level back button navigation", () => {
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;

    // Root -> Advanced
    (Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Gelişmiş Ayarlar"),
    ) as HTMLButtonElement).click();
    expect(menu.dataset.view).toBe("advanced");

    // Advanced -> Subtitles
    (Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Altyazı Ayarları"),
    ) as HTMLButtonElement).click();
    expect(menu.dataset.view).toBe("advanced-subtitles");

    // Subtitles -> Subtitle Font
    (Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Yazı Tipi"),
    ) as HTMLButtonElement).click();
    expect(menu.dataset.view).toBe("advanced-sub-font");

    // Back: Subtitle Font -> Subtitles
    menu.querySelector<HTMLButtonElement>(".kyrspect-menu-back")?.click();
    expect(menu.dataset.view).toBe("advanced-subtitles");

    // Back: Subtitles -> Advanced
    menu.querySelector<HTMLButtonElement>(".kyrspect-menu-back")?.click();
    expect(menu.dataset.view).toBe("advanced");

    // Back: Advanced -> Root
    menu.querySelector<HTMLButtonElement>(".kyrspect-menu-back")?.click();
    expect(menu.dataset.view).toBe("root");

    player.destroy();
  });

  it("supports English localization for advanced settings", () => {
    const player = new Kyrspect(root, { controls: true, language: "en" });

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;
    const advancedItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Advanced Settings"),
    );

    expect(advancedItem).toBeDefined();

    advancedItem?.click();
    expect(menu.dataset.view).toBe("advanced");

    const dualItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Play sound through both channels"),
    );
    expect(dualItem).toBeDefined();

    const eqItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Equalizer"),
    );
    expect(eqItem).toBeDefined();

    player.destroy();
  });

  it("contains necessary CSS rules in PLAYER_CSS for subtitle variables and color dot", () => {
    expect(PLAYER_CSS).toContain("--kyrspect-sub-font-family");
    expect(PLAYER_CSS).toContain("--kyrspect-sub-color");
    expect(PLAYER_CSS).toContain("--kyrspect-sub-bg-color");
    expect(PLAYER_CSS).toContain(".kyrspect-menu-color-dot");
  });
});
