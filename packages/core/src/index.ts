export { Kyrspect, VERSION } from "./core/Kyrspect";
export { EventEmitter } from "./events/EventEmitter";
export { KyrspectError, normalizeError, userFacingErrorMessage } from "./errors/KyrspectError";
export { KyrspectCapabilities } from "./utils/capabilities";
export { NativePlaybackAdapter } from "./adapters/NativePlaybackAdapter";
export { HlsPlaybackAdapter } from "./adapters/HlsPlaybackAdapter";
export { MediaStreamPlaybackAdapter } from "./adapters/MediaStreamPlaybackAdapter";
export { PlaybackManager } from "./playback/PlaybackManager";
export { resolveSourceSync, normalizeSource, isProbablyHlsUrl, isHlsMime } from "./utils/source";
export { DEFAULT_OPTIONS } from "./types/options";
export { DEFAULT_STATS_FIELDS } from "./types/stats";
export {
  DEFAULT_LABELS,
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  SUPPORTED_LOCALES,
  detectBrowserLocale,
  isSupportedLocale,
  resolveLabels,
  resolveLocale,
} from "@kyrspect/ui";

export type {
  KyrspectOptions,
  KyrspectSource,
  SourceInput,
  ResolvedSource,
  KyrspectQuality,
  QualityState,
  QualityChangeEvent,
  QualityChangeReason,
  KyrspectEventMap,
  KyrspectEventName,
  KyrspectAudioTrack,
  KyrspectSubtitleTrack,
  KyrspectTextTrackInput,
  KyrspectPlugin,
  PlaybackAdapter,
  AdapterContext,
  PlayerState,
  PlayerStatus,
  PlayerStats,
  StatsField,
  StatsFieldId,
  StatsCustomField,
  StatsOptions,
  CaptionOptions,
  HlsOptions,
  LiveOptions,
  NetworkOptions,
  RetryOptions,
  UIPlayerOptions,
  UITheme,
  UILabels,
} from "./types";
export type { UIAspectRatio, UIFit, UILayout } from "@kyrspect/ui";
export type { LocaleCode } from "@kyrspect/ui";

export type { KyrspectErrorCategory } from "./errors/KyrspectError";
export type { KyrspectCapabilitySnapshot, CodecSupport } from "./utils/capabilities";
