export { DrmManager, createDrmManager, type DrmSession } from "./DrmManager";
export { WidevineDrmProvider } from "./providers/WidevineDrmProvider";
export { PlayReadyDrmProvider } from "./providers/PlayReadyDrmProvider";
export { FairPlayDrmProvider, extractFairPlayContentId } from "./providers/FairPlayDrmProvider";
export type { DrmPlaybackTarget, DrmProvider, HlsDrmEngineConfig, DashDrmHost } from "./providers/types";
export {
  resolveDrmOptions,
  needsDrmManager,
  hasWidevine,
  hasPlayReady,
  hasFairPlay,
  hasConfiguredDrm,
  applyLicenseRequestHook,
} from "./resolve";
export { isEmeAvailable, isWidevineSupported, isPlayReadySupported, isFairPlaySupported } from "./capabilities";
