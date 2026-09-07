import type { DrmOptions } from "../../types/drm";
import { WIDEVINE_KEY_SYSTEM } from "../../types/drm";
import { hasWidevine } from "../resolve";
import { cencHlsConfig, cencProtectionData } from "./cenc";
import type { DrmPlaybackTarget, DrmProvider, HlsDrmEngineConfig } from "./types";

export class WidevineDrmProvider implements DrmProvider {
  readonly id = "widevine" as const;
  readonly keySystem = WIDEVINE_KEY_SYSTEM;

  canHandle(drm: DrmOptions): boolean {
    return hasWidevine(drm);
  }

  supports(target: DrmPlaybackTarget): boolean {
    return target === "dash.js" || target === "hls.js";
  }

  requiresMse(): boolean {
    return true;
  }

  licenseHeaders(drm: DrmOptions): Record<string, string> {
    return { ...drm.widevine?.headers };
  }

  toDashProtectionData(drm: DrmOptions): Record<string, unknown> {
    return drm.widevine ? cencProtectionData(this.keySystem, drm.widevine) : {};
  }

  toHlsConfig(drm: DrmOptions): Partial<HlsDrmEngineConfig> {
    if (!drm.widevine) return {};
    return cencHlsConfig(this.keySystem, drm.widevine, { widevineLicenseUrl: drm.widevine.licenseUrl });
  }
}
