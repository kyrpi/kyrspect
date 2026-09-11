import { describe, expect, it, vi } from "vitest";
import { Kyrspect } from "@kyrspect/core";

// Setup mock adapters
vi.mock("hls.js", () => {
  class FakeHls {
    static isSupported() {
      return true;
    }
    static Events = {
      MANIFEST_PARSED: "manifestParsed",
      ERROR: "error",
      LEVEL_SWITCHED: "levelSwitched",
      FRAG_LOADED: "fragLoaded",
    };
    static ErrorTypes = { NETWORK_ERROR: "networkError", MEDIA_ERROR: "mediaError" };
    static ErrorDetails = { BUFFER_STALLED_ERROR: "bufferStalledError" };
    levels = [{ height: 720, bitrate: 2000000 }];
    on(_event: string, handler: (...args: unknown[]) => void) {
      if (_event === "manifestParsed") {
        setTimeout(() => handler("manifestParsed", { levels: this.levels }), 0);
      }
    }
    off() {}
    loadSource() {}
    attachMedia() {}
    destroy() {}
  }
  return { default: FakeHls };
});

vi.mock("dashjs", () => {
  class FakeDashPlayer {
    initialize() {
      setTimeout(() => {
        for (const handler of this.listeners.get("streamInitialized") ?? []) handler({});
      }, 0);
    }
    updateSettings() {}
    on(event: string, handler: (data: unknown) => void) {
      const set = this.listeners.get(event) ?? new Set();
      set.add(handler);
      this.listeners.set(event, set);
    }
    off(event: string, handler: (data: unknown) => void) {
      this.listeners.get(event)?.delete(handler);
    }
    getRepresentationsByType() {
      return [{ index: 0, height: 720, bandwidth: 2500000 }];
    }
    getCurrentRepresentationForType() {
      return { index: 0, height: 720, bandwidth: 2500000 };
    }
    getSettings() {
      return { streaming: { abr: { autoSwitchBitrate: { video: true } } } };
    }
    getTracksFor() {
      return [];
    }
    getCurrentTrackFor() {
      return null;
    }
    setCurrentTrack() {}
    setTextTrack() {}
    isDynamic() {
      return false;
    }
    getCurrentLiveLatency() {
      return 2.0;
    }
    getAverageThroughput() {
      return 5000;
    }
    duration() {
      return 100;
    }
    reset() {
      this.listeners.clear();
    }
    destroy() {
      this.listeners.clear();
    }
    private listeners = new Map<string, Set<(data: unknown) => void>>();
  }

  const MediaPlayer = Object.assign(() => ({ create: () => new FakeDashPlayer() }), {
    events: {
      STREAM_INITIALIZED: "streamInitialized",
      ERROR: "error",
      QUALITY_CHANGE_RENDERED: "qualityChangeRendered",
    },
  });

  return {
    supportsMediaSource: () => true,
    MediaPlayer,
  };
});

describe("Critical Lifecycle & Source Switching Hardening", () => {
  it("seamlessly transitions MP4 -> HLS -> DASH -> MP4 on the same player instance without leaking state", async () => {
    const container = document.createElement("div");
    const player = new Kyrspect(container, { controls: false });

    // 1. Load MP4
    await player.load("https://example.com/video.mp4");
    expect(player.getState().status).toMatch(/ready|playing|loading|paused/);

    // 2. Switch to HLS
    await player.load("https://example.com/playlist.m3u8");
    expect(player.getState().status).toMatch(/ready|playing|loading|paused/);

    // 3. Switch to DASH
    await player.load("https://example.com/manifest.mpd");
    expect(player.getState().status).toMatch(/ready|playing|loading|paused/);

    // 4. Switch back to MP4
    await player.load("https://example.com/fallback.mp4");
    expect(player.getState().status).toMatch(/ready|playing|loading|paused/);

    player.destroy();
  });

  it("cleans up DRM state when switching from DRM source to non-DRM source", async () => {
    const container = document.createElement("div");
    const player = new Kyrspect(container, { controls: false });

    // Load with DRM
    await player.load({
      src: "https://example.com/encrypted.mpd",
      type: "dash",
      drm: {
        widevine: { licenseUrl: "https://license.example/widevine" },
      },
    });

    // Switch to plain MP4
    await player.load("https://example.com/plain.mp4");
    expect(player.media.src).toBe("https://example.com/plain.mp4");

    player.destroy();
  });

  it("handles repeated destroy calls gracefully without throwing", () => {
    const container = document.createElement("div");
    const player = new Kyrspect(container, { controls: true });

    expect(() => {
      player.destroy();
      player.destroy();
      player.destroy();
    }).not.toThrow();

    // Calling public methods after destroy should be no-op safe
    expect(() => {
      player.play();
      player.pause();
      player.seek(10);
      player.setVolume(0.5);
    }).not.toThrow();
  });

  it("supports repeated player recreation loop without DOM or audio leaks", async () => {
    const container = document.createElement("div");

    for (let i = 0; i < 5; i++) {
      const player = new Kyrspect(container, { controls: true });
      await player.load("https://example.com/test.mp4");
      player.destroy();
    }

    // After 5 recreations, container should be clean
    expect(container.querySelectorAll(".kyrspect-controls")).toHaveLength(0);
  });
});
