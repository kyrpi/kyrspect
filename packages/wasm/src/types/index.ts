import type {
  UIAspectRatio,
  UIControlsConfig,
  UIFit,
  UILabels,
  UILayout,
  UIQuality,
  UITheme,
  StatsField,
  StatsFieldId,
  StatsCustomField,
} from "@kyrspect/ui";
import type { DrmOptions } from "../drm";

export type { DrmOptions, CencDrmOptions, FairPlayOptions } from "../drm";

export type {
  UIAspectRatio,
  UIControlsConfig,
  UIFit,
  UILabels,
  UILayout,
  UIQuality,
  UITheme,
  StatsField,
  StatsFieldId,
  StatsCustomField,
};

export type PlayerStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export interface UISubtitleTrack {
  id: string;
  label: string;
  language: string;
}

export interface UIAudioTrack {
  id: string;
  label: string;
  language: string;
}

export interface QualityState {
  mode: "auto" | "manual";
  level: number | null;
  bitrate: number | null;
  width: number;
  height: number;
}

export interface KyrspectWasmSource {
  src: string;
  type?: string;
  isLive?: boolean;
  drm?: DrmOptions;
}

export interface WasmTextTrackInput {
  src: string;
  kind?: "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";
  srclang: string;
  label?: string;
  default?: boolean;
}

export interface KyrspectWasmOptions {
  src?: string | KyrspectWasmSource;
  drm?: DrmOptions;
  autoplay?: boolean;
  muted?: boolean;
  volume?: number;
  loop?: boolean;
  playsinline?: boolean;
  preload?: "none" | "metadata" | "auto";
  controls?: boolean | UIControlsConfig;
  live?: {
    targetLatency?: number;
    maxLatency?: number;
  };
  abr?: {
    enabled?: boolean;
    initialQualityIndex?: number;
  };
  tracks?: WasmTextTrackInput[];
  ui?: {
    controls?: boolean | UIControlsConfig;
    hideDelay?: number;
    showOnPause?: boolean;
    language?: string;
    labels?: Partial<UILabels>;
    theme?: UITheme;
    statsFields?: StatsField[];
    layout?: UILayout;
    aspectRatio?: UIAspectRatio;
    fit?: UIFit;
    fill?: boolean;
  };
  debug?: boolean;
  keyboard?: boolean;
}

export type KyrspectWasmEventMap = {
  ready: void;
  play: void;
  pause: void;
  playing: void;
  waiting: void;
  seeking: void;
  seeked: void;
  ended: void;
  timeupdate: { currentTime: number; duration: number };
  durationchange: { duration: number };
  volumechange: { volume: number; muted: boolean };
  ratechange: { playbackRate: number };
  qualitychange: { quality: QualityState; reason: string };
  qualitieschange: { qualities: UIQuality[] };
  subtitlechange: { track: UISubtitleTrack | null };
  audiochange: { track: UIAudioTrack | null };
  cuechange: { activeCues: { id: string; text: string; start_time: number; end_time: number }[] };
  statsupdate: Record<string, unknown>;
  error: { message: string; fatal?: boolean };
  destroy: void;
};
