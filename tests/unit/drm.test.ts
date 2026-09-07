import { describe, expect, it } from "vitest";
import {
  DrmManager,
  FAIRPLAY_KEY_SYSTEM,
  PLAYREADY_KEY_SYSTEM,
  resolveDrmOptions,
  needsDrmManager,
  resolveSourceSync,
  toDashProtectionData,
  toHlsDrmConfig,
  WIDEVINE_KEY_SYSTEM,
} from "@kyrspect/core";

const widevine = {
  licenseUrl: "https://license.example/widevine",
  headers: { Authorization: "Bearer token" },
  robustness: "SW_SECURE_CRYPTO" as const,
};

describe("DRM option resolution", () => {
  it("resolves player-level Widevine options", () => {
    const source = resolveSourceSync("https://cdn.example/manifest.mpd");
    const drm = resolveDrmOptions(source, { drm: { widevine } });
    expect(drm?.widevine?.licenseUrl).toBe(widevine.licenseUrl);
  });

  it("lets a source override the license URL and merge headers", () => {
    const source = resolveSourceSync({
      type: "dash",
      src: "https://cdn.example/manifest.mpd",
      drm: {
        widevine: {
          licenseUrl: "https://license.example/asset-1",
          headers: { "X-Asset": "1" },
        },
      },
    });
    const drm = resolveDrmOptions(source, { drm: { widevine } });
    expect(drm?.widevine?.licenseUrl).toBe("https://license.example/asset-1");
    expect(drm?.widevine?.headers).toEqual({
      Authorization: "Bearer token",
      "X-Asset": "1",
    });
  });

  it("keeps drm on auto-detected DASH sources", () => {
    const resolved = resolveSourceSync({
      src: "https://cdn.example/live/manifest.mpd",
      drm: { widevine },
    });
    expect(resolved.type).toBe("dash");
    expect("drm" in resolved && resolved.drm?.widevine?.licenseUrl).toBe(widevine.licenseUrl);
  });
});

describe("DRMManager", () => {
  const manager = new DrmManager();

  it("stays out of the default playback path when DRM is not configured", () => {
    expect(manager.resolve(resolveSourceSync("https://cdn.example/video.mp4"), {})).toBeNull();
    expect(manager.resolve(resolveSourceSync("https://cdn.example/master.m3u8"), { drm: {} })).toBeNull();
    expect(needsDrmManager("https://cdn.example/video.mp4", {})).toBe(false);
    expect(needsDrmManager({ src: "https://cdn.example/a.mpd", drm: {} }, {})).toBe(false);
    expect(needsDrmManager({ src: "https://cdn.example/a.mpd", drm: { widevine } }, {})).toBe(true);
  });


  it("keeps playback adapters free of key-system selection", () => {
    const source = resolveSourceSync({
      type: "dash",
      src: "https://cdn.example/manifest.mpd",
      drm: {
        widevine,
        playready: { licenseUrl: "https://license.example/playready" },
      },
    });
    const session = manager.resolve(source, {});
    expect(session?.providers.map((item) => item.id)).toEqual(["widevine", "playready"]);
    expect(manager.hlsEngineHint(session)).toBe("mse");
  });

  it("applies Widevine and PlayReady protection data for dash.js", () => {
    const host = { protection: null as Record<string, unknown> | null, setProtectionData(data: Record<string, unknown>) { this.protection = data; } };
    const session = manager.resolve(resolveSourceSync("https://cdn.example/a.mpd"), {
      drm: {
        widevine,
        playready: { licenseUrl: "https://license.example/playready" },
      },
    });
    manager.applyToDash(host, session);
    expect(host.protection?.[WIDEVINE_KEY_SYSTEM]).toMatchObject({ serverURL: widevine.licenseUrl });
    expect(host.protection?.[PLAYREADY_KEY_SYSTEM]).toMatchObject({ serverURL: "https://license.example/playready" });
  });

  it("rejects FairPlay on DASH and prefers native HLS for FairPlay-only", () => {
    const session = manager.resolve(resolveSourceSync("https://cdn.example/master.m3u8"), {
      drm: {
        fairplay: {
          licenseUrl: "https://license.example/fairplay",
          certificateUrl: "https://license.example/fairplay.cer",
        },
      },
    });
    expect(manager.hlsEngineHint(session)).toBe("native");
    expect(manager.compatible(session, "hls.js")[0]?.keySystem).toBe(FAIRPLAY_KEY_SYSTEM);
    expect(() => manager.assertCompatible(session, "dash.js")).toThrow(/cannot play through dash\.js/);
  });

  it("honors preferred key system order", () => {
    const session = manager.resolve(resolveSourceSync("https://cdn.example/a.mpd"), {
      drm: {
        preferred: "playready",
        widevine,
        playready: { licenseUrl: "https://license.example/playready" },
      },
    });
    expect(session?.providers[0]?.id).toBe("playready");
  });

  it("maps Widevine config through the manager helpers", () => {
    const data = toDashProtectionData(widevine);
    expect(data[WIDEVINE_KEY_SYSTEM]).toMatchObject({
      serverURL: widevine.licenseUrl,
      videoRobustness: "SW_SECURE_CRYPTO",
    });
    const config = toHlsDrmConfig({ widevine });
    expect(config?.emeEnabled).toBe(true);
    expect(config?.drmSystems[WIDEVINE_KEY_SYSTEM]?.licenseUrl).toBe(widevine.licenseUrl);
  });
});
