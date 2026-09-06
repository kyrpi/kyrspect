import { Kyrspect, DEFAULT_STATS_FIELDS } from "@kyrspect/core";

describe("stats overlay", () => {
  it("uses the localized system-status title and can be opened from the context menu", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    root.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }));
    const item = [...root.querySelectorAll<HTMLButtonElement>(".kyrspect-context-item")].find((node) =>
      (node.textContent ?? "").includes("Sistemde Neler Olup Bittiğini Öğren"),
    );
    expect(item).toBeInstanceOf(HTMLButtonElement);
    item?.click();

    expect(root.classList.contains("kyrspect-stats-open")).toBe(true);
    expect(root.querySelector(".kyrspect-stats-title")?.textContent).toBe("Sistemde Neler Olup Bittiğini Öğren");
    expect(root.querySelector(".kyrspect-stats-row")).toBeInstanceOf(HTMLElement);

    root.querySelector<HTMLButtonElement>(".kyrspect-stats-close")?.click();
    expect(root.classList.contains("kyrspect-stats-open")).toBe(false);

    player.destroy();
    root.remove();
  });

  it("hides the overlay when [x] is clicked even if debug mode is on", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true, debug: true, language: "en" });

    root.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }));
    [...root.querySelectorAll<HTMLButtonElement>(".kyrspect-context-item")]
      .find((node) => (node.textContent ?? "").includes("happening in the system"))
      ?.click();

    expect(root.classList.contains("kyrspect-debug")).toBe(true);
    expect(root.classList.contains("kyrspect-stats-open")).toBe(true);

    root.querySelector<HTMLButtonElement>(".kyrspect-stats-close")?.click();
    expect(root.classList.contains("kyrspect-stats-open")).toBe(false);
    expect(root.querySelector(".kyrspect-stats")?.classList.contains("kyrspect-stats")).toBe(true);

    player.destroy();
    root.remove();
  });

  it("lets each source add or remove overlay rows", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, {
      controls: true,
      language: "en",
      src: {
        src: "https://example.com/short.mp4",
        id: "short-clip",
        stats: { fields: ["videoId", "buffer"] },
      },
    });

    expect(player.getStatsFields()).toEqual(["videoId", "buffer"]);
    root.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 16, clientY: 16 }));
    [...root.querySelectorAll<HTMLButtonElement>(".kyrspect-context-item")]
      .find((node) => (node.textContent ?? "").includes("happening in the system"))
      ?.click();

    const compact = [...root.querySelectorAll(".kyrspect-stats-key")].map((node) => node.textContent);
    expect(compact).toEqual(["Video ID", "Buffer Health"]);

    player.setStatsFields(["videoId", "viewport", "date"]);
    const expanded = [...root.querySelectorAll(".kyrspect-stats-key")].map((node) => node.textContent);
    expect(expanded).toEqual(["Video ID", "Viewport / Frames", "Date"]);

    player.destroy();
    root.remove();
  });

  it("keeps a default field set when none is provided", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: false });
    expect(player.getStatsFields()).toEqual([...DEFAULT_STATS_FIELDS]);
    expect(player.getStats().id).toBe("—");
    player.destroy();
    root.remove();
  });
});
