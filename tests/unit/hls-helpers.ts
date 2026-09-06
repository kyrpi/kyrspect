import { qualityLabel } from "../../packages/core/src/abr/quality";
import type { KyrspectQuality } from "@kyrspect/core";

export function mapLevelFixture(level: {
  width: number;
  height: number;
  bitrate: number;
  index: number;
  codecs?: string;
}): KyrspectQuality {
  const quality: KyrspectQuality = {
    id: level.index,
    width: level.width,
    height: level.height,
    bitrate: level.bitrate,
    averageBitrate: level.bitrate,
    codecs: level.codecs ?? "avc1.42E01E",
    frameRate: 30,
    name: "",
  };
  quality.name = qualityLabel(quality);
  return quality;
}
