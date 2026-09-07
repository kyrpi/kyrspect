export const WIDEVINE_KEY_SYSTEM = "com.widevine.alpha";
export const PLAYREADY_KEY_SYSTEM = "com.microsoft.playready";
export const FAIRPLAY_KEY_SYSTEM = "com.apple.fps";

export type DrmSystemId = "widevine" | "playready" | "fairplay";

export type DrmRobustness =
  | "SW_SECURE_CRYPTO"
  | "SW_SECURE_DECODE"
  | "HW_SECURE_CRYPTO"
  | "HW_SECURE_DECODE"
  | "HW_SECURE_ALL"
  | (string & {});

export interface DrmLicenseRequest {
  url: string;
  headers: Record<string, string>;
  body?: ArrayBuffer | Uint8Array | string;
}

export interface CencDrmOptions {
  licenseUrl: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  serverCertificate?: string;
  serverCertificateUrl?: string;
  robustness?: DrmRobustness;
  audioRobustness?: DrmRobustness;
  videoRobustness?: DrmRobustness;
  persistentState?: MediaKeysRequirement;
  distinctiveIdentifier?: MediaKeysRequirement;
  sessionType?: MediaKeySessionType;
}

export type WidevineOptions = CencDrmOptions;
export type PlayReadyOptions = CencDrmOptions;

export interface FairPlayOptions {
  licenseUrl: string;
  certificateUrl: string;
  headers?: Record<string, string>;
  contentId?: string;
  extractContentId?(initData: ArrayBuffer): string;
}

export interface DrmOptions {
  preferred?: DrmSystemId;
  widevine?: WidevineOptions;
  playready?: PlayReadyOptions;
  fairplay?: FairPlayOptions;
  beforeLicenseRequest?(request: DrmLicenseRequest): void | Promise<void>;
}
