import { Kyrspect } from "@kyrspect/core";
import { isSpuriousMediaError } from "../../packages/core/src/utils/media";

describe("media error filtering", () => {
  it("treats empty-src MEDIA_ERR_SRC_NOT_SUPPORTED as spurious", () => {
    const video = document.createElement("video");
    Object.defineProperty(video, "error", {
      configurable: true,
      get: () => ({ code: 4, message: "Format error" }),
    });
    expect(isSpuriousMediaError(video)).toBe(true);
  });

  it("does not treat a real resource error as spurious", () => {
    const video = document.createElement("video");
    video.setAttribute("src", "https://example.com/clip.mp4");
    Object.defineProperty(video, "error", {
      configurable: true,
      get: () => ({ code: 4, message: "Format error" }),
    });
    expect(isSpuriousMediaError(video)).toBe(false);
  });

  it("does not emit error when a detached video fires code 4", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: false, keyboard: false });
    const onError = vi.fn();
    player.on("error", onError);
    Object.defineProperty(player.media, "error", {
      configurable: true,
      get: () => ({ code: 4, message: "This media format is not supported." }),
    });
    player.media.dispatchEvent(new Event("error"));
    expect(onError).not.toHaveBeenCalled();
    player.destroy();
    root.remove();
  });
});
