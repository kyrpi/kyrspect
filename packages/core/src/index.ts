export { Kyrspect, VERSION } from "./core/Kyrspect";
export { EventEmitter } from "./events/EventEmitter";
export { KyrspectError, normalizeError, userFacingErrorMessage } from "./errors/KyrspectError";
export { KyrspectCapabilities } from "./utils/capabilities";
export { NativePlaybackAdapter } from "./adapters/NativePlaybackAdapter";
export { HlsPlaybackAdapter } from "./adapters/HlsPlaybackAdapter";
export { DashPlaybackAdapter } from "./adapters/DashPlaybackAdapter";
export { MediaStreamPlaybackAdapter } from "./adapters/MediaStreamPlaybackAdapter";
export { PlaybackManager } from "./playback/PlaybackManager";
export { AudioEnhancer, EQUALIZER_PRESETS, EQUALIZER_BANDS } from "./media/AudioEnhancer";
export type { EqualizerPresetId, EqualizerBandConfig } from "./media/AudioEnhancer";
export type { SubtitleStyle } from "./captions/SubtitleManager";
export { resolveSourceSync, normalizeSource, isProbablyHlsUrl, isHlsMime, isProbablyDashUrl, isDashMime } from "./utils/source";
export {
  DrmManager,
  WidevineDrmProvider,
  PlayReadyDrmProvider,
  FairPlayDrmProvider,
  resolveDrmOptions,
  needsDrmManager,
  hasWidevine,
  hasPlayReady,
  hasFairPlay,
  hasConfiguredDrm,
  isEmeAvailable,
  isWidevineSupported,
  isPlayReadySupported,
  isFairPlaySupported,
} from "./drm";
export { WIDEVINE_KEY_SYSTEM, PLAYREADY_KEY_SYSTEM, FAIRPLAY_KEY_SYSTEM } from "./types/drm";
export { toDashProtectionData, toHlsDrmConfig } from "./utils/drm";
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
  DashOptions,
  DrmOptions,
  DrmLicenseRequest,
  DrmRobustness,
  DrmSystemId,
  WidevineOptions,
  PlayReadyOptions,
  FairPlayOptions,
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
export type { KyrspectCapabilitySnapshot, CodecSupport, CapabilityProbeOptions } from "./utils/capabilities";
