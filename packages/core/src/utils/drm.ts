import { DrmManager, WidevineDrmProvider } from "../drm";
import type { DrmOptions, WidevineOptions } from "../types/drm";

export {
  resolveDrmOptions,
  hasWidevine,
  hasPlayReady,
  hasFairPlay,
  hasConfiguredDrm,
  applyLicenseRequestHook,
  isEmeAvailable,
  isWidevineSupported,
} from "../drm";
export { WIDEVINE_KEY_SYSTEM } from "../types/drm";

const widevine = new WidevineDrmProvider();
const manager = new DrmManager();

export function toDashProtectionData(options: WidevineOptions): Record<string, unknown> {
  return widevine.toDashProtectionData({ widevine: options });
}

export function toHlsDrmConfig(drm: DrmOptions & { widevine: WidevineOptions }) {
  return manager.hlsConfig({ options: drm, providers: [widevine] });
}
