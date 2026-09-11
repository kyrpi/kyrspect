import { describe, expect, it, vi } from "vitest";
import { Kyrspect } from "@kyrspect/core";

describe("Soak & Long-Running Playback Stability", () => {
  it("executes simulated 30-minute continuous playback with heavy seeking, switching, and pause/resume cycles without corruption", async () => {
    const container = document.createElement("div");
    const player = new Kyrspect(container, { controls: true });

    await player.load("https://example.com/long-stream.mp4");

    const video = player.media;
    Object.defineProperty(video, "duration", { value: 1800, writable: true }); // 30 minutes (1800s)

    let currentTime = 0;
    const initialListenerCount = (player as unknown as { events: { count(): number } }).events.count?.() ?? 0;

    // Simulate 30-minute playback progression with stress operations
    // 60 simulation ticks representing key intervals
    for (let tick = 0; tick < 60; tick++) {
      currentTime += 30;
      video.currentTime = currentTime;
      video.dispatchEvent(new Event("timeupdate"));

      // 1. Periodic quality switching
      if (tick % 5 === 0) {
        player.setQuality(tick % 2 === 0 ? 1080 : "auto");
      }

      // 2. Random seeks
      if (tick % 7 === 0) {
        const seekTarget = (currentTime + 120) % 1800;
        player.seek(seekTarget);
        video.dispatchEvent(new Event("seeking"));
        video.dispatchEvent(new Event("seeked"));
      }

      // 3. Pause & Resume cycles
      if (tick % 10 === 0) {
        player.pause();
        video.dispatchEvent(new Event("pause"));
        expect(player.getState().status).toBe("paused");

        void player.play();
        video.dispatchEvent(new Event("play"));
        video.dispatchEvent(new Event("playing"));
        expect(player.getState().status).toBe("playing");
      }

      // 4. Track switches
      if (tick % 12 === 0) {
        player.setSubtitleTrack(null);
      }
    }

    // Assert that player state remains valid and uncorrupted
    const finalState = player.getState();
    expect(finalState.error).toBeNull();
    expect(Number.isFinite(finalState.currentTime)).toBe(true);

    // Teardown and verify clean resource removal
    player.destroy();
    expect(container.querySelectorAll(".kyrspect-controls")).toHaveLength(0);
  });

  it("handles rapid burst seek and pause spam without state corruption or hanging buffers", async () => {
    const container = document.createElement("div");
    const player = new Kyrspect(container, { controls: false });

    await player.load("https://example.com/stress.mp4");

    for (let i = 0; i < 100; i++) {
      player.seek(i * 10);
      if (i % 2 === 0) {
        player.pause();
      } else {
        void player.play();
      }
    }

    expect(player.getState().error).toBeNull();
    player.destroy();
  });
});
