import { findQuality, inferQualityReason, qualityLabel } from "../../packages/core/src/abr/quality";
import type { KyrspectQuality } from "@kyrspect/core";

const levels: KyrspectQuality[] = [
  { id: 0, width: 640, height: 360, bitrate: 800_000, averageBitrate: 700_000, codecs: "avc1", frameRate: 30, name: "360p" },
  { id: 1, width: 1280, height: 720, bitrate: 2_400_000, averageBitrate: 2_000_000, codecs: "avc1", frameRate: 30, name: "720p" },
  { id: 2, width: 1920, height: 1080, bitrate: 5_000_000, averageBitrate: 4_500_000, codecs: "avc1", frameRate: 30, name: "1080p" },
];

describe("quality selection", () => {
  it("finds a level by height or id", () => {
    expect(findQuality(levels, 1080)?.id).toBe(2);
    expect(findQuality(levels, 0)?.height).toBe(360);
  });

  it("labels qualities from height", () => {
    expect(qualityLabel({ height: 2160, name: "", bitrate: 0 })).toBe("2160p");
  });

  it("infers ABR reasons without oscillating metadata", () => {
    expect(inferQualityReason(levels[1], levels[2], "auto")).toBe("bandwidth-increase");
    expect(inferQualityReason(levels[2], levels[1], "auto")).toBe("bandwidth-decrease");
    expect(inferQualityReason(undefined, levels[0], "auto")).toBe("startup");
    expect(inferQualityReason(levels[1], levels[2], "manual", "manual")).toBe("manual");
    expect(inferQualityReason(levels[2], levels[0], "auto", "emergency")).toBe("emergency");
  });
});
