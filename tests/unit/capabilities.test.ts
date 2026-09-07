import { describe, expect, it, vi } from "vitest";
import { KyrspectCapabilities } from "@kyrspect/core";

describe("capability detection", () => {
  it("probes the current environment without assuming codecs", async () => {
    HTMLVideoElement.prototype.canPlayType = vi.fn((type: string) => {
      if (type.includes("avc1")) return "probably";
      return "";
    });
    Object.defineProperty(document, "pictureInPictureEnabled", { configurable: true, value: true });
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });

    const capabilities = await KyrspectCapabilities.probe(document.createElement("video"));
    expect(capabilities.h264).toBe(true);
    expect(capabilities.mse).toBe(typeof MediaSource !== "undefined");
    expect(capabilities.pip).toBe(true);
    expect(capabilities.fullscreen).toBe(true);
    expect(capabilities.details.h264.supported).toBe(true);
    expect(typeof capabilities.eme).toBe("boolean");
    expect(typeof capabilities.widevine).toBe("boolean");
    expect(typeof capabilities.playready).toBe("boolean");
    expect(typeof capabilities.fairplay).toBe("boolean");
    expect(capabilities.widevine).toBe(false);
    expect(capabilities.playready).toBe(false);
    expect(capabilities.fairplay).toBe(false);
  });

  it("does not probe CDMs unless drm is requested", async () => {
    const request = vi.fn();
    Object.defineProperty(navigator, "requestMediaKeySystemAccess", {
      configurable: true,
      value: request,
    });
    await KyrspectCapabilities.probe(document.createElement("video"));
    expect(request).not.toHaveBeenCalled();
  });
});
