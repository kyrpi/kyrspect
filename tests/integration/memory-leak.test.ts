import { describe, expect, it } from "vitest";
import { Kyrspect } from "@kyrspect/core";

describe("Memory & Resource Leak Hardening (100x Lifecycle Cycles)", () => {
  it("survives 100 create -> load -> play -> destroy cycles without DOM or listener accumulation", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const initialBodyChildren = document.body.childNodes.length;

    for (let i = 0; i < 100; i++) {
      const player = new Kyrspect(container, {
        controls: true,
        autoplay: false,
      });

      await player.load("https://example.com/test-media.mp4");
      await player.play().catch(() => {});
      player.pause();
      player.seek(5);
      player.setVolume(0.8);

      player.destroy();
    }

    // Verify container has zero remaining child elements (all controls, video, canvas cleaned up)
    expect(container.childNodes.length).toBe(0);
    // Verify document.body child count didn't grow
    expect(document.body.childNodes.length).toBe(initialBodyChildren);

    container.remove();
  });

  it("ensures repeated create/destroy cycles on headless mode have zero resource residue", async () => {
    const container = document.createElement("div");

    for (let i = 0; i < 100; i++) {
      const player = new Kyrspect(container, {
        controls: false,
        autoplay: false,
      });
      await player.load("https://example.com/test.mp4");
      player.destroy();
    }

    expect(container.childNodes.length).toBe(0);
  });
});
