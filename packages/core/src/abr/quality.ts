import type { KyrspectQuality } from "../types/quality";

export function qualityLabel(quality: Pick<KyrspectQuality, "height" | "name" | "bitrate">): string {
  if (quality.name) return quality.name;
  if (quality.height) return `${quality.height}p`;
  if (quality.bitrate) return `${Math.round(quality.bitrate / 1000)} kbps`;
  return "Unknown";
}

export function findQuality(
  qualities: KyrspectQuality[],
  level: number,
): KyrspectQuality | undefined {
  return qualities.find((item) => item.id === level) ?? qualities.find((item) => item.height === level);
}

export function inferQualityReason(
  from: KyrspectQuality | undefined,
  to: KyrspectQuality | undefined,
  mode: "auto" | "manual",
  pending?: string | null,
): "manual" | "bandwidth-increase" | "bandwidth-decrease" | "buffer-risk" | "startup" | "emergency" | "unknown" {
  if (pending === "manual" || mode === "manual") return "manual";
  if (pending === "emergency") return "emergency";
  if (pending === "buffer-risk") return "buffer-risk";
  if (!from) return "startup";
  if (!to) return "unknown";
  if (to.height > from.height || to.bitrate > from.bitrate) return "bandwidth-increase";
  if (to.height < from.height || to.bitrate < from.bitrate) return "bandwidth-decrease";
  return "unknown";
}
