import { Kyrspect } from "@kyrspect/core";
import { PLAYER_CSS } from "@kyrspect/ui";

describe("Audio Visualizer (Sesi Göster)", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.append(root);
  });

  afterEach(() => {
    root.remove();
  });

  it("renders waveform element directly above the timeline in controls", () => {
    const player = new Kyrspect(root, { controls: true });

    const waveform = root.querySelector(".kyrspect-waveform");
    const timeline = root.querySelector(".kyrspect-timeline");

    expect(waveform).toBeInstanceOf(HTMLElement);
    expect(timeline).toBeInstanceOf(HTMLElement);
    expect(waveform?.nextElementSibling).toBe(timeline);

    // Canvas exists inside waveform
    const canvas = waveform?.querySelector("canvas.kyrspect-waveform-canvas");
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    player.destroy();
  });

  it("starts hidden by default and becomes visible when enabled via API", () => {
    const player = new Kyrspect(root, { controls: true });

    const waveform = root.querySelector(".kyrspect-waveform") as HTMLElement;
    expect(waveform.style.display).toBe("none");
    expect(player.isAudioVisualizerVisible()).toBe(false);

    player.setAudioVisualizer(true);
    expect(waveform.style.display).toBe("block");
    expect(waveform.classList.contains("is-active")).toBe(true);
    expect(player.isAudioVisualizerVisible()).toBe(true);

    player.setAudioVisualizer(false);
    expect(waveform.style.display).toBe("none");
    expect(waveform.classList.contains("is-active")).toBe(false);
    expect(player.isAudioVisualizerVisible()).toBe(false);

    player.destroy();
  });

  it("starts visible if ui.audioVisualizer is true in config", () => {
    const player = new Kyrspect(root, {
      controls: true,
      ui: { audioVisualizer: true },
    });

    const waveform = root.querySelector(".kyrspect-waveform") as HTMLElement;
    expect(waveform.style.display).toBe("block");
    expect(player.isAudioVisualizerVisible()).toBe(true);

    player.destroy();
  });

  it("adds Sesi Göster toggle item in the settings menu with on/off switch", () => {
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    expect(settingsBtn).toBeInstanceOf(HTMLButtonElement);

    // Open settings menu
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;
    expect(menu.dataset.open).toBe("true");

    // Find "Sesi Göster" menu item
    const items = Array.from(menu.querySelectorAll(".kyrspect-menu-item")) as HTMLButtonElement[];
    const audioItem = items.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Sesi Göster"),
    );

    expect(audioItem).toBeDefined();
    expect(audioItem?.getAttribute("role")).toBe("menuitemcheckbox");
    expect(audioItem?.getAttribute("aria-checked")).toBe("false");
    expect(audioItem?.querySelector(".kyrspect-menu-value")?.textContent).toBe("Kapalı");
    expect(audioItem?.querySelector(".kyrspect-menu-toggle")).toBeInstanceOf(HTMLElement);

    const waveform = root.querySelector(".kyrspect-waveform") as HTMLElement;
    expect(waveform.style.display).toBe("none");

    // Click to turn on
    audioItem?.click();

    expect(player.isAudioVisualizerVisible()).toBe(true);
    expect(waveform.style.display).toBe("block");

    // Menu should reflect the new state
    const updatedItems = Array.from(menu.querySelectorAll(".kyrspect-menu-item")) as HTMLButtonElement[];
    const updatedAudioItem = updatedItems.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Sesi Göster"),
    );
    expect(updatedAudioItem?.getAttribute("aria-checked")).toBe("true");
    expect(updatedAudioItem?.querySelector(".kyrspect-menu-value")?.textContent).toBe("Açık");

    // Click again to turn off
    updatedAudioItem?.click();
    expect(player.isAudioVisualizerVisible()).toBe(false);
    expect(waveform.style.display).toBe("none");

    player.destroy();
  });

  it("supports English localization Show Audio with On/Off", () => {
    const player = new Kyrspect(root, { controls: true, language: "en" });

    const settingsBtn = root.querySelector('[data-control="settings"]') as HTMLButtonElement;
    settingsBtn.click();

    const menu = root.querySelector(".kyrspect-menu") as HTMLElement;
    const items = Array.from(menu.querySelectorAll(".kyrspect-menu-item")) as HTMLButtonElement[];
    const audioItem = items.find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Show Audio"),
    );

    expect(audioItem).toBeDefined();
    expect(audioItem?.querySelector(".kyrspect-menu-value")?.textContent).toBe("Off");

    audioItem?.click();
    expect(player.isAudioVisualizerVisible()).toBe(true);

    const updatedAudioItem = Array.from(menu.querySelectorAll(".kyrspect-menu-item")).find((item) =>
      item.querySelector(".kyrspect-menu-label")?.textContent?.includes("Show Audio"),
    );
    expect(updatedAudioItem?.querySelector(".kyrspect-menu-value")?.textContent).toBe("On");

    player.destroy();
  });

  it("cleans up waveform canvas and event listeners on destroy", () => {
    const player = new Kyrspect(root, {
      controls: true,
      ui: { audioVisualizer: true },
    });

    expect(root.querySelector(".kyrspect-waveform")).not.toBeNull();
    player.destroy();
    expect(root.querySelector(".kyrspect-waveform")).toBeNull();
  });

  it("contains necessary CSS rules for waveform and toggle switch in PLAYER_CSS", () => {
    expect(PLAYER_CSS).toContain(".kyrspect-waveform");
    expect(PLAYER_CSS).toContain(".kyrspect-waveform-canvas");
    expect(PLAYER_CSS).toContain(".kyrspect-menu-toggle");
    expect(PLAYER_CSS).toContain(".kyrspect-menu-toggle-thumb");
  });
});
