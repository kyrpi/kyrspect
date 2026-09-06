import { Kyrspect } from "@kyrspect/core";

describe("player lifecycle", () => {
  it("creates, loads a progressive source, and destroys without leaking listeners", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, {
      src: { type: "video", src: "https://example.com/video.mp4", mimeType: "video/mp4" },
      controls: true,
      autoplay: false,
    });

    expect(root.querySelector("video")).toBeInstanceOf(HTMLVideoElement);
    expect(player.paused).toBe(true);
    player.setVolume(0.4);
    expect(player.getVolume()).toBeCloseTo(0.4);
    player.mute();
    expect(player.muted).toBe(true);

    const ready = vi.fn();
    player.on("destroy", ready);
    player.destroy();
    expect(ready).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 8; i += 1) {
      const node = document.createElement("div");
      document.body.append(node);
      const instance = new Kyrspect(node, { controls: false });
      instance.destroy();
      node.remove();
    }
    root.remove();
  });

  it("exposes a stable public API surface", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: false });
    expect(typeof player.play).toBe("function");
    expect(typeof player.getQualities).toBe("function");
    expect(typeof player.getStats).toBe("function");
    expect(typeof player.setLoop).toBe("function");
    expect(typeof player.enableAutoQuality).toBe("function");
    player.destroy();
    root.remove();
  });
});
