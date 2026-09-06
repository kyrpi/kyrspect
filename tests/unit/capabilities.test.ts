import { KyrspectCapabilities } from "@kyrspect/core";

describe("capability detection", () => {
  it("probes the current environment without assuming codecs", async () => {
    HTMLVideoElement.prototype.canPlayType = vi.fn((type: string) => {
      if (type.includes("avc1")) return "probably";
      return "";
    });
    Object.defineProperty(document, "pictureInPictureEnabled", { configurable: true, value: true });
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });

    const capabilities = await KyrspectCapabilities.probe();
    expect(capabilities.h264).toBe(true);
    expect(capabilities.mse).toBe(typeof MediaSource !== "undefined");
    expect(capabilities.pip).toBe(true);
    expect(capabilities.fullscreen).toBe(true);
    expect(capabilities.details.h264.supported).toBe(true);
  });
});
