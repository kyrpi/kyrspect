export type {
  PlayerLike,
  PlayerUIHandle,
  UIAspectRatio,
  UIControlsConfig,
  UIFit,
  UILabels,
  UILayout,
  UIOptions,
  UIQuality,
  UITheme,
  StatsField,
  StatsFieldId,
  StatsCustomField,
} from "./types";
export { attachDefaultUI } from "./PlayerUI";
export { createAudioWaveform, type AudioWaveformHandle, type WaveformOptions } from "./waveform";
export { injectStyles, PLAYER_CSS } from "./styles";
export { applyTheme } from "./theme";
export { formatClock, formatLiveOffset } from "./format";
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
  de,
  en,
  es,
  fr,
  pt,
  tr,
} from "./i18n";
export type { LocaleCode } from "./i18n";
