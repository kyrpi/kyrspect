import { SubtitleManager } from "../../packages/core/src/captions/SubtitleManager";
import { EventEmitter } from "@kyrspect/core";
import type { KyrspectEventMap } from "@kyrspect/core";

describe("subtitle logic", () => {
  it("adds configured VTT tracks and can disable them", () => {
    const video = document.createElement("video");
    const events = new EventEmitter<KyrspectEventMap>();
    const manager = new SubtitleManager(video, events, () => null, "native");
    manager.applyConfigTracks([
      { src: "/tr.vtt", lang: "tr", label: "Türkçe", default: true },
      { src: "/en.vtt", lang: "en", label: "English" },
    ]);
    expect(video.querySelectorAll("track")).toHaveLength(2);
    manager.disable();
    manager.destroy();
    expect(video.querySelectorAll("track")).toHaveLength(0);
  });
});
