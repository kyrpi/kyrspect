import { describe, it, expect } from "vitest";
import { WasmBridge } from "../../packages/wasm/src/wasm/WasmBridge";
import { detectMediaKind, needsWasmSourceHint } from "../../packages/wasm/src/source";
import { hasConfiguredDrm, mergeDrm } from "../../packages/wasm/src/drm";

describe("WebAssembly Core Engine (@kyrspect/wasm)", () => {
  it("initializes WasmBridge and tracks player state", async () => {
    const bridge = await WasmBridge.create();
    expect(bridge.id).toBeGreaterThan(0);

    let state = bridge.getState();
    expect(state.status).toBe("idle");
    expect(state.volume).toBe(1.0);

    bridge.setStatus("playing");
    bridge.updatePlayback(12.5, 120.0, 45.0);
    bridge.setVolume(0.75, false);

    state = bridge.getState();
    expect(state.status).toBe("playing");
    expect(state.current_time).toBe(12.5);
    expect(state.duration).toBe(120.0);
    expect(state.buffered_end).toBe(45.0);
    expect(state.volume).toBe(0.75);
    expect(state.muted).toBe(false);

    bridge.destroy();
  });

  it("evaluates adaptive bitrate (ABR) with EWMA throughput", async () => {
    const bridge = await WasmBridge.create();

    const qualities = [
      { id: 0, width: 640, height: 360, bitrate: 800_000, label: "360p" },
      { id: 1, width: 1280, height: 720, bitrate: 2_500_000, label: "720p" },
      { id: 2, width: 1920, height: 1080, bitrate: 6_000_000, label: "1080p" },
      { id: 3, width: 3840, height: 2160, bitrate: 16_000_000, label: "4K" },
    ];

    bridge.setQualities(qualities);

    bridge.recordBandwidthSample(10_000_000, 1.0);
    bridge.recordBandwidthSample(10_000_000, 1.0);

    const decision = bridge.evaluateAbr(0, 15.0, 1920, 1080, false);
    expect(decision.selected_index).toBeGreaterThanOrEqual(2);

    const emergencyDecision = bridge.evaluateAbr(2, 0.8, 1920, 1080, false);
    expect(emergencyDecision.selected_index).toBe(0);
    expect(emergencyDecision.reason).toBe("emergency_buffer_low");

    bridge.destroy();
  });

  it("handles live stream drift and latency calculation", async () => {
    const bridge = await WasmBridge.create();

    const liveSync = bridge.updateLive(true, 100.0, 104.0);
    expect(liveSync.is_live).toBe(true);
    expect(liveSync.live_edge_distance).toBe(4.0);
    expect(liveSync.at_live_edge).toBe(false);

    const edgeSync = bridge.updateLive(true, 103.5, 104.0);
    expect(edgeSync.at_live_edge).toBe(true);

    bridge.destroy();
  });

  it("parses WebVTT subtitles and performs timeline cue lookup", async () => {
    const bridge = await WasmBridge.create();

    const vtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Hello

2
00:00:05.000 --> 00:00:08.500
Second cue
`;

    const count = bridge.parseVtt(vtt);
    expect(count).toBe(2);

    const activeAt2s = bridge.getActiveCues(2.5);
    expect(activeAt2s.length).toBe(1);
    expect(activeAt2s[0].text).toContain("Hello");

    const activeAtGap = bridge.getActiveCues(4.5);
    expect(activeAtGap.length).toBe(0);

    const activeAt6s = bridge.getActiveCues(6.0);
    expect(activeAt6s.length).toBe(1);
    expect(activeAt6s[0].text).toContain("Second cue");

    bridge.destroy();
  });

  it("computes real-time player statistics", async () => {
    const bridge = await WasmBridge.create();

    bridge.computeStats(60, 0, 1000, 10.0, 3_000_000, 0);
    const stats = bridge.computeStats(120, 1, 2000, 12.0, 3_000_000, 0);

    expect(stats.total_frames).toBe(120);
    expect(stats.dropped_frames).toBe(1);
    expect(stats.fps).toBeCloseTo(60, 0);
    expect(stats.connection_quality).toBeDefined();

    bridge.destroy();
  });

  it("analyzes media sources and protocols accurately", async () => {
    const hls = await WasmBridge.analyzeSource("https://example.com/stream/master.m3u8");
    expect(hls.is_hls).toBe(true);
    expect(hls.media_type).toBe("hls");

    const mp4 = await WasmBridge.analyzeSource("https://example.com/video.mp4?auth=token");
    expect(mp4.is_hls).toBe(false);
    expect(mp4.media_type).toBe("mp4");

    const dash = await WasmBridge.analyzeSource("https://example.com/stream/manifest.mpd");
    expect(dash.media_type).toBe("dash");
    expect(dash.is_dash).toBe(true);
    expect(dash.is_hls).toBe(false);
  });

  it("detects HLS and DASH without waiting for WASM", () => {
    expect(detectMediaKind("https://cdn.example/live.m3u8")).toBe("hls");
    expect(detectMediaKind("https://cdn.example/manifest.mpd")).toBe("dash");
    expect(detectMediaKind("https://cdn.example/video.mp4")).toBe("native");
    expect(detectMediaKind("https://cdn.example/asset", "application/dash+xml")).toBe("dash");
    expect(needsWasmSourceHint("https://cdn.example/asset")).toBe(true);
    expect(needsWasmSourceHint("https://cdn.example/video.mp4")).toBe(false);
  });

  it("keeps DRM off unless a license URL is configured", () => {
    expect(hasConfiguredDrm(undefined)).toBe(false);
    expect(hasConfiguredDrm({})).toBe(false);
    expect(mergeDrm({ widevine: { licenseUrl: "" } }, undefined)).toBeNull();
    expect(mergeDrm(undefined, { widevine: { licenseUrl: "https://license.example/wv" } })?.widevine?.licenseUrl).toBe(
      "https://license.example/wv",
    );
  });
});
