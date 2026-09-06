import { Kyrspect } from "@kyrspect/core";

describe("playback API", () => {
  function makePlayer() {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, {
      src: { type: "video", src: "https://example.com/a.mp4" },
      controls: false,
      keyboard: false,
    });
    return { root, player };
  }

  it("play, pause, seek, volume, and destroy", async () => {
    const { root, player } = makePlayer();
    await player.play();
    player.pause();
    player.seek(12);
    player.setVolume(0.3);
    player.setPlaybackRate(1.5);
    expect(player.getVolume()).toBeCloseTo(0.3);
    expect(player.getPlaybackRate()).toBe(1.5);
    const stats = player.getStats();
    expect(stats.buffer).toBeDefined();
    player.destroy();
    player.destroy();
    root.remove();
  });
});
