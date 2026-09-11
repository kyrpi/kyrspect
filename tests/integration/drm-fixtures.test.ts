import { describe, expect, it, vi } from "vitest";
import {
  DrmManager,
  resolveDrmOptions,
  type DrmOptions,
  type KyrspectOptions,
  type ResolvedSource,
  DEFAULT_OPTIONS,
} from "@kyrspect/core";

// DRM Test Fixtures (Offline manifest representations without proprietary credentials)
const WIDEVINE_DASH_SOURCE: ResolvedSource = {
  src: "https://fixtures.kyrspect.test/streams/dash-cenc/manifest.mpd",
  type: "dash",
  drm: {
    widevine: {
      licenseUrl: "https://license.test.kyrspect/widevine",
      headers: { "X-Custom-Auth": "test-token" },
    },
  },
};

const PLAYREADY_DASH_SOURCE: ResolvedSource = {
  src: "https://fixtures.kyrspect.test/streams/dash-playready/manifest.mpd",
  type: "dash",
  drm: {
    playready: {
      licenseUrl: "https://license.test.kyrspect/playready",
    },
  },
};

const FAIRPLAY_HLS_SOURCE: ResolvedSource = {
  src: "https://fixtures.kyrspect.test/streams/hls-fairplay/master.m3u8",
  type: "hls",
  drm: {
    fairplay: {
      licenseUrl: "https://license.test.kyrspect/fairplay",
      certificateUrl: "https://license.test.kyrspect/fairplay.cer",
    },
  },
};

describe("DRM Integration Fixtures & Lifecycles", () => {
  it("resolves Widevine options and generates proper dash.js protection data", () => {
    const manager = new DrmManager();
    const session = manager.resolve(WIDEVINE_DASH_SOURCE, DEFAULT_OPTIONS as KyrspectOptions);
    expect(session).not.toBeNull();
    expect(session?.options.widevine?.licenseUrl).toBe("https://license.test.kyrspect/widevine");

    const providers = manager.assertCompatible(session, "dash.js");
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe("widevine");

    const fakeDashPlayer = {
      protectionData: null as Record<string, unknown> | null,
      setProtectionData(data: Record<string, unknown>) {
        this.protectionData = data;
      },
    };

    manager.applyToDash(fakeDashPlayer, session);
    expect(fakeDashPlayer.protectionData?.["com.widevine.alpha"]).toBeDefined();
  });

  it("resolves PlayReady options and generates PlayReady protection config", () => {
    const manager = new DrmManager();
    const session = manager.resolve(PLAYREADY_DASH_SOURCE, DEFAULT_OPTIONS as KyrspectOptions);
    expect(session).not.toBeNull();
    expect(session?.options.playready?.licenseUrl).toBe("https://license.test.kyrspect/playready");

    const providers = manager.assertCompatible(session, "dash.js");
    expect(providers.some((p) => p.id === "playready")).toBe(true);
  });

  it("resolves FairPlay HLS options and creates hls.js DRM engine configuration", () => {
    const manager = new DrmManager();
    const session = manager.resolve(FAIRPLAY_HLS_SOURCE, DEFAULT_OPTIONS as KyrspectOptions);
    expect(session).not.toBeNull();

    const hlsConfig = manager.hlsConfig(session);
    expect(hlsConfig).not.toBeNull();
    expect(hlsConfig?.emeEnabled).toBe(true);
    expect(hlsConfig?.drmSystems["com.apple.fps"]?.licenseUrl).toBe("https://license.test.kyrspect/fairplay");
    expect(hlsConfig?.drmSystems["com.apple.fps"]?.serverCertificateUrl).toBe("https://license.test.kyrspect/fairplay.cer");
  });

  it("applies beforeLicenseRequest transform hook across DRM providers", async () => {
    const beforeLicenseHook = vi.fn(async (req: { url: string; headers: Record<string, string> }) => {
      req.headers["X-Transformed"] = "true";
    });

    const source: ResolvedSource = {
      ...WIDEVINE_DASH_SOURCE,
      drm: {
        ...WIDEVINE_DASH_SOURCE.drm,
        beforeLicenseRequest: beforeLicenseHook,
      },
    };

    const manager = new DrmManager();
    const session = manager.resolve(source, DEFAULT_OPTIONS as KyrspectOptions);
    let capturedFilter: ((req: { url: string; headers: Record<string, string> }) => Promise<unknown>) | null = null;

    const fakePlayer = {
      registerLicenseRequestFilter(filter: typeof capturedFilter) {
        capturedFilter = filter;
      },
    };

    manager.applyToDash(fakePlayer, session);
    expect(capturedFilter).not.toBeNull();

    const dummyReq = { url: "https://license.test.kyrspect/widevine", headers: {} };
    await capturedFilter!(dummyReq);
    expect(beforeLicenseHook).toHaveBeenCalled();
    expect(dummyReq.headers).toHaveProperty("X-Transformed", "true");
  });

  it("cleans up native sessions and MediaKeys properly upon destroy", () => {
    const manager = new DrmManager();
    expect(() => manager.destroy()).not.toThrow();
  });
});
