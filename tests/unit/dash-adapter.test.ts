import { describe, expect, it, vi } from "vitest";
import { DashPlaybackAdapter, DrmManager } from "@kyrspect/core";
import { EventEmitter } from "@kyrspect/core";
import { DEFAULT_OPTIONS } from "@kyrspect/core";
import type { AdapterContext } from "@kyrspect/core";
import type { KyrspectEventMap } from "@kyrspect/core";

vi.mock("dashjs", () => {
  class FakeDashPlayer {
    settings = { streaming: { abr: { autoSwitchBitrate: { video: true, audio: true } } } };
    representations = [
      { index: 0, width: 640, height: 360, bandwidth: 800000, codecs: "avc1", frameRate: 30 },
      { index: 1, width: 1280, height: 720, bandwidth: 2400000, codecs: "avc1", frameRate: 30 },
      { index: 2, width: 1920, height: 1080, bandwidth: 5000000, codecs: "avc1", frameRate: 30 },
    ];
    audioTracks = [{ id: "en", lang: "en", label: "English" }];
    textTracks = [{ id: "en", lang: "en", label: "English" }];
    currentRepresentation = this.representations[1];
    currentAudio = this.audioTracks[0];
    protectionData: Record<string, unknown> | null = null;
    private listeners = new Map<string, Set<(data: unknown) => void>>();

    setProtectionData(data: Record<string, unknown>) {
      this.protectionData = data;
    }

    initialize() {
      this.emit("streamInitialized");
      this.emit("qualityChangeRendered", { mediaType: "video", newQuality: 1, newRepresentation: this.currentRepresentation });
    }

    updateSettings(next: { streaming?: { abr?: { autoSwitchBitrate?: { video?: boolean } } } }) {
      if (next.streaming?.abr?.autoSwitchBitrate) {
        this.settings.streaming.abr.autoSwitchBitrate = {
          ...this.settings.streaming.abr.autoSwitchBitrate,
          ...next.streaming.abr.autoSwitchBitrate,
        };
      }
    }

    on(event: string, handler: (data: unknown) => void) {
      const set = this.listeners.get(event) ?? new Set();
      set.add(handler);
      this.listeners.set(event, set);
    }

    off(event: string, handler: (data: unknown) => void) {
      this.listeners.get(event)?.delete(handler);
    }

    getRepresentationsByType(type: string) {
      return type === "video" ? this.representations : [];
    }

    getCurrentRepresentationForType(type: string) {
      return type === "video" ? this.currentRepresentation : null;
    }

    setRepresentationForTypeByIndex(_type: string, index: number) {
      this.currentRepresentation = this.representations[index] ?? this.currentRepresentation;
    }

    getSettings() {
      return this.settings;
    }

    getTracksFor(type: string) {
      return type === "audio" ? this.audioTracks : type === "text" ? this.textTracks : [];
    }

    getCurrentTrackFor(type: string) {
      return type === "audio" ? this.currentAudio : null;
    }

    setCurrentTrack(track: { id: string }) {
      this.currentAudio = track;
    }

    setTextTrack() {}

    isDynamic() {
      return false;
    }

    getCurrentLiveLatency() {
      return 2.4;
    }

    getDvrWindow() {
      return { start: 0, end: 120, size: 120 };
    }

    getAverageThroughput() {
      return 8200;
    }

    duration() {
      return 120;
    }

    reset() {
      this.listeners.clear();
    }

    destroy() {
      this.listeners.clear();
    }

    private emit(event: string, data: unknown = {}) {
      for (const handler of this.listeners.get(event) ?? []) handler(data);
    }
  }

  const events = {
    STREAM_INITIALIZED: "streamInitialized",
    ERROR: "error",
    KEY_ERROR: "keyError",
    QUALITY_CHANGE_RENDERED: "qualityChangeRendered",
    METRIC_ADDED: "metricAdded",
  };

  const MediaPlayer = Object.assign(() => ({ create: () => new FakeDashPlayer() }), { events });

  return {
    supportsMediaSource: () => true,
    MediaPlayer,
  };
});

describe("DASH adapter", () => {
  it("loads a mock MPD and exposes quality levels", async () => {
    const video = document.createElement("video");
    const events = new EventEmitter<KyrspectEventMap>();
    const qualities = vi.fn();
    events.on("qualitylevelsloaded", (event) => qualities(event.qualities.map((item) => item.height)));
    const adapter = new DashPlaybackAdapter();
    const context: AdapterContext = {
      options: { ...DEFAULT_OPTIONS },
      events,
      debug: () => undefined,
      getHeaders: () => ({}),
      drm: null,
    };
    await adapter.load(video, { type: "dash", src: "https://example.com/manifest.mpd" }, context);
    expect(qualities).toHaveBeenCalledWith([360, 720, 1080]);
    adapter.setQuality(1080);
    expect(adapter.getQualityMode()).toBe("manual");
    adapter.setQuality("auto");
    expect(adapter.getQualityMode()).toBe("auto");
    expect(adapter.getAudioTracks()).toHaveLength(1);
    expect(adapter.getSubtitleTracks()).toHaveLength(1);
    expect(adapter.getBandwidthEstimate()).toBe(8_200_000);
    await adapter.unload();
  });

  it("applies Widevine protection data before playback", async () => {
    const video = document.createElement("video");
    const events = new EventEmitter<KyrspectEventMap>();
    const adapter = new DashPlaybackAdapter();
    const context: AdapterContext = {
      options: {
        ...DEFAULT_OPTIONS,
        drm: {
          widevine: {
            licenseUrl: "https://license.example/widevine",
            headers: { Authorization: "Bearer token" },
          },
        },
      },
      events,
      debug: () => undefined,
      getHeaders: () => ({}),
      drm: new DrmManager(),
    };
    await adapter.load(video, { type: "dash", src: "https://example.com/manifest.mpd" }, context);
    const player = (adapter as unknown as { player: { protectionData: Record<string, { serverURL: string }> | null } }).player;
    expect(player.protectionData?.["com.widevine.alpha"]?.serverURL).toBe("https://license.example/widevine");
    await adapter.unload();
  });
});
