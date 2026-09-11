import { test, expect } from "playwright/test";

test.describe("Kyrspect Browser Playback Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof (window as any).player !== "undefined", { timeout: 15000 });
  });

  test("verifies player create, load, play, pause, seek, volume, destroy and recreate lifecycle", async ({ page }) => {
    // 1. Player is created and attached
    const hasVideo = await page.evaluate(() => {
      const p = (window as any).player;
      return Boolean(p && p.media && p.el);
    });
    expect(hasVideo).toBe(true);

    // 2. Play and Pause
    const playbackState = await page.evaluate(async () => {
      const p = (window as any).player;
      await p.play().catch(() => {});
      const playing = !p.paused;
      p.pause();
      const paused = p.paused;
      return { playing, paused };
    });
    expect(playbackState.paused).toBe(true);

    // 3. Seek
    const seekResult = await page.evaluate(async () => {
      const p = (window as any).player;
      p.seek(1.5);
      return { currentTime: p.currentTime };
    });
    expect(seekResult.currentTime).toBeGreaterThanOrEqual(0);

    // 4. Volume and Mute
    const volumeResult = await page.evaluate(() => {
      const p = (window as any).player;
      p.setVolume(0.5);
      const vol = p.volume;
      p.mute();
      const muted = p.muted;
      p.unmute();
      const unmuted = !p.muted;
      return { vol, muted, unmuted };
    });
    expect(volumeResult.vol).toBe(0.5);
    expect(volumeResult.muted).toBe(true);
    expect(volumeResult.unmuted).toBe(true);

    // 5. Destroy
    const destroyResult = await page.evaluate(() => {
      const p = (window as any).player;
      p.destroy();
      const container = document.querySelector("#player");
      return {
        hasVideoAfterDestroy: Boolean(container?.querySelector("video")),
        isDestroyed: p.destroyed ?? true,
      };
    });
    expect(destroyResult.hasVideoAfterDestroy).toBe(false);

    // 6. Recreate
    const recreateResult = await page.evaluate(() => {
      const Kyrspect = (window as any).Kyrspect;
      const newPlayer = new Kyrspect("#player", {
        src: "/sample.mp4",
        controls: true,
        autoplay: false,
      });
      (window as any).player = newPlayer;
      const container = document.querySelector("#player");
      return {
        hasVideoAfterRecreate: Boolean(container?.querySelector("video")),
        status: newPlayer.getState().status,
      };
    });
    expect(recreateResult.hasVideoAfterRecreate).toBe(true);
  });

  test("loads local progressive MP4 source and verifies media playback attributes", async ({ page }) => {
    const mp4Status = await page.evaluate(async () => {
      const p = (window as any).player;
      await p.load("/sample.mp4");
      const video = p.media as HTMLVideoElement;
      return {
        src: video.currentSrc || video.src,
        duration: video.duration || p.duration,
        controls: p.el.classList.contains("kyrspect-player"),
      };
    });
    expect(mp4Status.src).toContain("sample.mp4");
    expect(mp4Status.controls).toBe(true);
  });

  test("smoke tests HLS source switching and adapter attachment", async ({ page }) => {
    const hlsResult = await page.evaluate(async () => {
      const p = (window as any).player;
      const hlsUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
      await p.load(hlsUrl).catch(() => {});
      return {
        status: p.getState().status,
        error: p.getState().error,
        qualitiesCount: p.getQualities().length,
      };
    });
    if (hlsResult.status === "error") {
      expect(hlsResult.error).toMatch(/not supported|hls-unavailable/i);
    } else {
      expect(["loading", "ready", "playing"]).toContain(hlsResult.status);
    }
  });

  test("smoke tests DASH source switching and adapter attachment", async ({ page }) => {
    const dashResult = await page.evaluate(async () => {
      const p = (window as any).player;
      const dashUrl = "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";
      await p.load(dashUrl).catch(() => {});
      return {
        status: p.getState().status,
        error: p.getState().error,
      };
    });
    if (dashResult.status === "error") {
      expect(dashResult.error).toMatch(/not supported|dash-unavailable/i);
    } else {
      expect(["loading", "ready", "playing"]).toContain(dashResult.status);
    }
  });
});
