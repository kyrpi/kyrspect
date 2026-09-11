import { Kyrspect } from "@kyrspect/core";
import { PLAYER_CSS } from "@kyrspect/ui";

const ROOT_STATE_CLASSES = [
  "kyrspect-ui-visible",
  "kyrspect-paused",
  "kyrspect-loading",
  "kyrspect-error",
  "kyrspect-debug",
  "kyrspect-layout-reels",
  "kyrspect-layout-standard",
  "kyrspect-portrait",
  "kyrspect-landscape",
  "kyrspect-fill",
];

describe("player layout invariants", () => {
  it("never reuses a root state class as a child element class", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true, debug: true });

    const childClasses = new Set<string>();
    for (const node of Array.from(root.querySelectorAll("*"))) {
      for (const name of Array.from(node.classList)) childClasses.add(name);
    }

    for (const state of ROOT_STATE_CLASSES) {
      expect(childClasses.has(state)).toBe(false);
    }

    player.destroy();
    root.remove();
  });

  it("declares no unscoped state-class rule that could collapse the root box", () => {
    for (const state of ROOT_STATE_CLASSES) {
      const unscoped = new RegExp(`(^|[,}])\\s*\\.${state}\\s*\\{`);
      expect(unscoped.test(PLAYER_CSS)).toBe(false);
    }
  });

  it("gives the container an intrinsic 16:9 box independent of the video", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true });

    const sizer = root.querySelector(".kyrspect-sizer");
    const video = root.querySelector("video");
    expect(sizer).toBeInstanceOf(HTMLElement);
    expect(video).toBeInstanceOf(HTMLVideoElement);
    expect(sizer?.nextElementSibling).toBe(video);
    expect(PLAYER_CSS).toContain("padding-bottom: 56.25%");
    expect(PLAYER_CSS).toContain("aspect-ratio: var(--kyrspect-aspect, 16 / 9)");

    player.destroy();
    expect(root.querySelector(".kyrspect-sizer")).toBeNull();
    root.remove();
  });

  it("does not report live playback before metadata arrives", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: false });

    expect(player.media.readyState).toBe(0);
    expect(player.isLive).toBe(false);

    player.destroy();
    root.remove();
  });

  it("lets the settings menu receive clicks above the pointer-transparent overlay", () => {
    expect(PLAYER_CSS).toMatch(/\.kyrspect-menu\s*\{[^}]*pointer-events:\s*auto/);

    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true });
    const menu = root.querySelector(".kyrspect-menu");
    expect(menu).toBeInstanceOf(HTMLElement);
    expect(getComputedStyle(menu as Element).pointerEvents).toBe("auto");

    player.destroy();
    root.remove();
  });

  it("stacks the center overlay children in a single grid cell", () => {
    expect(PLAYER_CSS).toMatch(/\.kyrspect-center\s*>\s\*\s*\{[^}]*grid-area:\s*1\s*\/\s*1/);
  });

  it("renders Phosphor Regular control icons", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true });
    const play = root.querySelector('[data-control="play"] svg');
    expect(play?.getAttribute("viewBox")).toBe("0 0 256 256");
    player.destroy();
    root.remove();
  });

  it("opens a YouTube-style context menu and toggles loop", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    root.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 24, clientY: 24 }));
    const ctx = root.querySelector(".kyrspect-context");
    expect(ctx?.getAttribute("data-open")).toBe("true");
    const items = [...root.querySelectorAll<HTMLButtonElement>(".kyrspect-context-item")].map((item) => item.textContent);
    expect(items.some((text) => text?.includes("Döngü"))).toBe(true);
    expect(items.some((text) => text?.includes("Mini oynatıcı"))).toBe(true);

    const loop = [...root.querySelectorAll<HTMLButtonElement>(".kyrspect-context-item")].find((item) =>
      (item.textContent ?? "").includes("Döngü"),
    );
    loop?.click();
    expect(player.loop).toBe(true);
    expect(ctx?.getAttribute("data-open")).toBe("false");

    player.destroy();
    root.remove();
  });

  it("applies a playback rate chosen from the settings menu", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true });

    const settings = root.querySelector<HTMLButtonElement>('[data-control="settings"]');
    expect(settings).toBeInstanceOf(HTMLButtonElement);
    settings?.click();

    const speed = [...root.querySelectorAll<HTMLButtonElement>(".kyrspect-menu-item")].find((item) =>
      (item.textContent ?? "").includes("Playback"),
    );
    expect(speed).toBeInstanceOf(HTMLButtonElement);
    speed?.click();

    const rate = [...root.querySelectorAll<HTMLButtonElement>(".kyrspect-menu-item")].find(
      (item) => item.textContent === "1.5",
    );
    expect(rate).toBeInstanceOf(HTMLButtonElement);
    rate?.click();

    expect(player.playbackRate).toBe(1.5);
    expect(root.querySelector(".kyrspect-menu")?.getAttribute("data-open")).toBe("false");

    player.destroy();
    root.remove();
  });

  it("switches from captions to settings instead of closing the open menu", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, {
      controls: true,
      language: "en",
      tracks: [{ src: "https://example.com/en.vtt", lang: "en", label: "English" }],
    });

    const captions = root.querySelector<HTMLButtonElement>('[data-control="subtitles"]');
    const settings = root.querySelector<HTMLButtonElement>('[data-control="settings"]');
    const menu = root.querySelector<HTMLElement>(".kyrspect-menu");
    expect(captions).toBeInstanceOf(HTMLButtonElement);
    expect(settings).toBeInstanceOf(HTMLButtonElement);

    captions?.click();
    expect(menu?.getAttribute("data-open")).toBe("true");
    expect(menu?.getAttribute("data-view")).toBe("captions");
    expect(menu?.querySelector(".kyrspect-menu-back")?.textContent).toContain("Subtitles");

    settings?.click();
    expect(menu?.getAttribute("data-open")).toBe("true");
    expect(menu?.getAttribute("data-view")).toBe("root");
    expect(menu?.querySelector(".kyrspect-menu-back")).toBeNull();
    expect([...menu?.querySelectorAll(".kyrspect-menu-item") ?? []].some((item) =>
      (item.textContent ?? "").includes("Playback"),
    )).toBe(true);

    captions?.click();
    expect(menu?.getAttribute("data-view")).toBe("captions");
    expect(menu?.querySelector(".kyrspect-menu-back")?.textContent).toContain("Subtitles");

    root.querySelector<HTMLButtonElement>('[data-control="play"]')?.click();
    expect(menu?.getAttribute("data-open")).toBe("false");

    player.destroy();
    root.remove();
  });

  it("applies a reels chrome variant that can switch back to cinema", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true, ui: { layout: "reels" } });

    expect(root.classList.contains("kyrspect-layout-reels")).toBe(true);
    expect(root.dataset.layout).toBe("reels");
    expect(player.layout).toBe("reels");
    expect(PLAYER_CSS).toMatch(/\.kyrspect-player\.kyrspect-layout-reels\s+\.kyrspect-bar-right/);

    player.setLayout("standard");
    expect(root.classList.contains("kyrspect-layout-reels")).toBe(false);
    expect(root.classList.contains("kyrspect-layout-standard")).toBe(true);
    expect(player.layout).toBe("standard");

    player.destroy();
    expect(root.classList.contains("kyrspect-layout-standard")).toBe(false);
    root.remove();
  });

  it("sizes the frame for portrait sources without collapsing the box", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true, ui: { aspectRatio: "9:16" } });

    expect(root.classList.contains("kyrspect-portrait")).toBe(true);
    expect(root.classList.contains("kyrspect-landscape")).toBe(false);
    expect(root.style.getPropertyValue("--kyrspect-aspect")).toBe("9 / 16");
    expect(PLAYER_CSS).toMatch(/\.kyrspect-player\.kyrspect-portrait/);

    player.setAspectRatio("16:9");
    expect(root.classList.contains("kyrspect-landscape")).toBe(true);
    expect(root.style.getPropertyValue("--kyrspect-aspect")).toBe("16 / 9");

    player.destroy();
    root.remove();
  });

  it("prevents vertical and horizontal scrollbar flashing during menu animations", () => {
    expect(PLAYER_CSS).toMatch(/\.kyrspect-menu\s*\{[^}]*overflow-x:\s*hidden;/);
    expect(PLAYER_CSS).toMatch(/\.kyrspect-menu\s*\{[^}]*overflow-y:\s*auto;/);
    expect(PLAYER_CSS).toMatch(/@keyframes kyrspect-menu-in\s*\{[^}]*overflow:\s*hidden;/);
    expect(PLAYER_CSS).not.toMatch(/@keyframes kyrspect-menu-view-fade\s*\{[^}]*translateX/);
  });

  it("removes outline on button click / active state while preserving keyboard focus-visible", () => {
    expect(PLAYER_CSS).toContain(".kyrspect-player button:focus:not(:focus-visible)");
    expect(PLAYER_CSS).toContain(".kyrspect-btn:active");
    expect(PLAYER_CSS).toContain("outline: none !important;");
    expect(PLAYER_CSS).toMatch(/\.kyrspect-btn:focus-visible\s*\{[^}]*outline:\s*2px solid #fff/);
  });
});
