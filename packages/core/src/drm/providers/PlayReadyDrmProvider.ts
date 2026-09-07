import type { DrmOptions } from "../../types/drm";
import { PLAYREADY_KEY_SYSTEM } from "../../types/drm";
import { hasPlayReady } from "../resolve";
import { cencHlsConfig, cencProtectionData } from "./cenc";
import type { DrmPlaybackTarget, DrmProvider, HlsDrmEngineConfig } from "./types";

export class PlayReadyDrmProvider implements DrmProvider {
  readonly id = "playready" as const;
  readonly keySystem = PLAYREADY_KEY_SYSTEM;

  canHandle(drm: DrmOptions): boolean {
    return hasPlayReady(drm);
  }

  supports(target: DrmPlaybackTarget): boolean {
    return target === "dash.js" || target === "hls.js";
  }

  requiresMse(): boolean {
    return true;
  }

  licenseHeaders(drm: DrmOptions): Record<string, string> {
    return { ...drm.playready?.headers };
  }

  toDashProtectionData(drm: DrmOptions): Record<string, unknown> {
    return drm.playready ? cencProtectionData(this.keySystem, drm.playready) : {};
  }

  toHlsConfig(drm: DrmOptions): Partial<HlsDrmEngineConfig> {
    return drm.playready ? cencHlsConfig(this.keySystem, drm.playready) : {};
  }
}
