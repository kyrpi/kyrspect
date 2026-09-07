import { describe, expect, it, vi } from "vitest";
import { HlsPlaybackAdapter } from "@kyrspect/core";
import { EventEmitter } from "@kyrspect/core";
import { DEFAULT_OPTIONS } from "@kyrspect/core";
import type { AdapterContext } from "@kyrspect/core";
import type { KyrspectEventMap } from "@kyrspect/core";

vi.mock("hls.js", () => {
  class FakeHls {
    static isSupported() {
      return true;
    }
    static Events = {
      MANIFEST_PARSED: "hlsManifestParsed",
      ERROR: "hlsError",
      LEVEL_SWITCHED: "hlsLevelSwitched",
      FRAG_LOADED: "hlsFragLoaded",
      AUDIO_TRACKS_UPDATED: "hlsAudioTracksUpdated",
      SUBTITLE_TRACKS_UPDATED: "hlsSubtitleTracksUpdated",
    };
    static ErrorTypes = {
      NETWORK_ERROR: "networkError",
      MEDIA_ERROR: "mediaError",
      MUX_ERROR: "muxError",
    };
    static ErrorDetails = {
      BUFFER_STALLED_ERROR: "bufferStalledError",
    };

    levels = [
      { width: 640, height: 360, bitrate: 800000, averageBitrate: 700000, codecSet: "avc1", videoCodec: "avc1", frameRate: 30 },
      { width: 1280, height: 720, bitrate: 2400000, averageBitrate: 2000000, codecSet: "avc1", videoCodec: "avc1", frameRate: 30 },
      { width: 1920, height: 1080, bitrate: 5000000, averageBitrate: 4500000, codecSet: "avc1", videoCodec: "avc1", frameRate: 30 },
    ];
    currentLevel = -1;
    get autoLevelEnabled() {
      return this.currentLevel === -1;
    }
    bandwidthEstimate = 8_200_000;
    audioTracks = [{ name: "English", lang: "en" }];
    subtitleTracks = [{ name: "English", lang: "en" }];
    latency = 3.2;
    liveSyncPosition = 42;
    private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

    on(event: string, handler: (...args: unknown[]) => void) {
      const set = this.listeners.get(event) ?? new Set();
      set.add(handler);
      this.listeners.set(event, set);
    }

    off(event: string, handler: (...args: unknown[]) => void) {
      this.listeners.get(event)?.delete(handler);
    }

    attachMedia() {}

    loadSource() {
      this.emit(FakeHls.Events.MANIFEST_PARSED);
      this.emit(FakeHls.Events.LEVEL_SWITCHED, { level: 1 });
    }

    destroy() {
      this.listeners.clear();
    }

    private emit(event: string, data?: unknown) {
      for (const handler of this.listeners.get(event) ?? []) handler(event, data);
    }
  }

  return { default: FakeHls };
});

describe("HLS adapter", () => {
  it("loads a mock master playlist and exposes quality levels", async () => {
    const video = document.createElement("video");
    video.canPlayType = () => "";
    const events = new EventEmitter<KyrspectEventMap>();
    const qualities = vi.fn();
    events.on("qualitylevelsloaded", (event) => qualities(event.qualities.map((item) => item.height)));
    const adapter = new HlsPlaybackAdapter();
    const context: AdapterContext = {
      options: { ...DEFAULT_OPTIONS, hls: { ...DEFAULT_OPTIONS.hls, preferNative: false, forceEngine: "hls.js" } },
      events,
      debug: () => undefined,
      getHeaders: () => ({}),
      drm: null,
    };
    await adapter.load(video, { type: "hls", src: "https://example.com/master.m3u8" }, context);
    expect(qualities).toHaveBeenCalledWith([360, 720, 1080]);
    adapter.setQuality(1080);
    expect(adapter.getQualityMode()).toBe("manual");
    adapter.setQuality("auto");
    expect(adapter.getAudioTracks()).toHaveLength(1);
    expect(adapter.getSubtitleTracks()).toHaveLength(1);
    await adapter.unload();
  });
});
