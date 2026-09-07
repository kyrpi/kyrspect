import type { DrmOptions, DrmSystemId } from "../../types/drm";

export type DrmPlaybackTarget = "dash.js" | "hls.js" | "native-hls";

export interface HlsDrmEngineConfig {
  emeEnabled: true;
  widevineLicenseUrl?: string;
  drmSystems: Record<string, { licenseUrl: string; serverCertificateUrl?: string }>;
  drmSystemOptions: {
    audioRobustness?: string;
    videoRobustness?: string;
    persistentState?: MediaKeysRequirement;
    distinctiveIdentifier?: MediaKeysRequirement;
    sessionType?: MediaKeySessionType;
  };
}

export interface DrmProvider {
  readonly id: DrmSystemId;
  readonly keySystem: string;
  canHandle(drm: DrmOptions): boolean;
  supports(target: DrmPlaybackTarget): boolean;
  requiresMse(): boolean;
  licenseHeaders(drm: DrmOptions): Record<string, string>;
  toDashProtectionData(drm: DrmOptions): Record<string, unknown>;
  toHlsConfig(drm: DrmOptions): Partial<HlsDrmEngineConfig>;
}

export interface DashDrmHost {
  setProtectionData?(data: Record<string, unknown>): void;
  registerLicenseRequestFilter?(filter: (request: {
    url?: string;
    headers?: Record<string, string>;
    data?: ArrayBuffer | Uint8Array | string;
  }) => Promise<unknown>): void;
}
