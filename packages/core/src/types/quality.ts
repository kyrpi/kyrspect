export type QualityMode = "auto" | "manual";

export type QualityChangeReason =
  | "manual"
  | "bandwidth-increase"
  | "bandwidth-decrease"
  | "buffer-risk"
  | "startup"
  | "emergency"
  | "unknown";

export interface KyrspectQuality {
  id: number;
  width: number;
  height: number;
  bitrate: number;
  averageBitrate: number;
  codecs: string;
  frameRate: number;
  name: string;
}

export interface QualityState {
  mode: QualityMode;
  level: number | null;
  bitrate: number | null;
  width: number;
  height: number;
}

export interface QualityChangeEvent {
  from: number | null;
  to: number | null;
  mode: QualityMode;
  reason: QualityChangeReason;
  bandwidthEstimate: number;
}
