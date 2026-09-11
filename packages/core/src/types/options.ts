import type { SourceInput } from "./source";
import type { KyrspectTextTrackInput } from "./tracks";
import type { NetworkRequest } from "./adapter";
import type { StatsOptions } from "./stats";
import type { DrmOptions } from "./drm";
import type { SubtitleStyle } from "../captions/SubtitleManager";
import type { EqualizerPresetId } from "../media/AudioEnhancer";
import type { UIAspectRatio, UIControlsConfig, UIFit, UILabels, UILayout, UITheme, ThemeInput } from "@kyrspect/ui";

export interface AdvancedAudioOptions {
  dualChannel?: boolean;
  equalizer?: EqualizerPresetId;
}

export interface AdvancedOptions {
  subtitles?: SubtitleStyle;
  audio?: AdvancedAudioOptions;
}

export interface CaptionOptions {
  enabled?: boolean;
  mode?: "native" | "custom";
  language?: string;
}

export interface HlsOptions {
  preferNative?: boolean;
  forceEngine?: "native" | "hls.js";
  capLevelToPlayerSize?: boolean;
  maxBufferLength?: number;
  maxMaxBufferLength?: number;
  startLevel?: number | "auto";
  lowLatencyMode?: boolean;
}

export interface DashOptions {
  capLevelToPlayerSize?: boolean;
  maxBufferLength?: number;
  startLevel?: number | "auto";
  lowLatencyMode?: boolean;
}

export interface LiveOptions {
  lowLatency?: boolean;
  targetLatency?: number;
  dvr?: boolean;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export interface NetworkOptions {
  headers?: Record<string, string>;
  beforeRequest?(request: NetworkRequest): void | Promise<void>;
  afterResponse?(response: { url: string; status: number }): void;
}

export interface PreferenceOptions {
  persist?: boolean;
  storageKey?: string;
}

export interface UIPlayerOptions {
  hideDelay?: number;
  showOnPause?: boolean;
  language?: string;
  labels?: Partial<UILabels>;
  theme?: ThemeInput;
  performanceMode?: boolean;
  layout?: UILayout;
  aspectRatio?: UIAspectRatio;
  fit?: UIFit;
  fill?: boolean;
  audioVisualizer?: boolean;
}

export type KeyboardConfig = boolean | Partial<Record<string, string>>;

export interface KyrspectOptions {
  src?: SourceInput;
  autoplay?: boolean;
  muted?: boolean;
  volume?: number;
  loop?: boolean;
  poster?: string;
  controls?: boolean | UIControlsConfig;
  keyboard?: KeyboardConfig;
  preload?: "none" | "metadata" | "auto";
  playbackRate?: number;
  quality?: "auto" | number;
  tracks?: KyrspectTextTrackInput[];
  captions?: CaptionOptions;
  hls?: HlsOptions;
  dash?: DashOptions;
  drm?: DrmOptions;
  live?: LiveOptions;
  theme?: ThemeInput;
  performanceMode?: boolean;
  ui?: UIPlayerOptions;
  language?: string;
  stats?: StatsOptions;
  network?: NetworkOptions;
  retry?: RetryOptions;
  preferences?: PreferenceOptions;
  advanced?: AdvancedOptions;
  playsInline?: boolean;
  crossOrigin?: "anonymous" | "use-credentials" | "";
  debug?: boolean;
}

export const DEFAULT_OPTIONS: Required<
  Pick<
    KyrspectOptions,
    | "autoplay"
    | "muted"
    | "volume"
    | "loop"
    | "controls"
    | "keyboard"
    | "preload"
    | "playbackRate"
    | "quality"
    | "playsInline"
    | "debug"
    | "language"
  >
> & {
  hls: Omit<HlsOptions, "forceEngine">;
  dash: Required<DashOptions>;
  live: Required<LiveOptions>;
  retry: Required<RetryOptions>;
  captions: Required<CaptionOptions>;
  preferences: Required<PreferenceOptions>;
  ui: Required<Omit<UIPlayerOptions, "labels" | "theme" | "language" | "layout" | "aspectRatio" | "fit" | "fill">> & {
    labels?: Partial<UILabels>;
    theme?: UITheme;
    language?: string;
    layout?: UILayout;
    aspectRatio?: UIAspectRatio;
    fit?: UIFit;
    fill?: boolean;
  };
} = {
  autoplay: false,
  muted: false,
  volume: 1,
  loop: false,
  controls: true,
  keyboard: true,
  preload: "metadata",
  playbackRate: 1,
  quality: "auto",
  playsInline: true,
  debug: false,
  language: "auto",
  hls: {
    preferNative: false,
    capLevelToPlayerSize: true,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    startLevel: "auto",
    lowLatencyMode: false,
  },
  dash: {
    capLevelToPlayerSize: true,
    maxBufferLength: 30,
    startLevel: "auto",
    lowLatencyMode: false,
  },
  live: {
    lowLatency: false,
    targetLatency: 3,
    dvr: true,
  },
  retry: {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 10000,
  },
  captions: {
    enabled: true,
    mode: "native",
    language: "",
  },
  preferences: {
    persist: false,
    storageKey: "kyrspect:preferences",
  },
  ui: {
    hideDelay: 3000,
    showOnPause: true,
    audioVisualizer: false,
    performanceMode: false,
  },
};
