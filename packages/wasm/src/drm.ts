export const WIDEVINE_KEY_SYSTEM = "com.widevine.alpha";
export const PLAYREADY_KEY_SYSTEM = "com.microsoft.playready";
export const FAIRPLAY_KEY_SYSTEM = "com.apple.fps";

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
  robustness?: string;
  audioRobustness?: string;
  videoRobustness?: string;
}

export interface FairPlayOptions {
  licenseUrl: string;
  certificateUrl: string;
  headers?: Record<string, string>;
  contentId?: string;
}

export interface DrmOptions {
  preferred?: "widevine" | "playready" | "fairplay";
  widevine?: CencDrmOptions;
  playready?: CencDrmOptions;
  fairplay?: FairPlayOptions;
  beforeLicenseRequest?(request: DrmLicenseRequest): void | Promise<void>;
}

export function hasConfiguredDrm(drm?: DrmOptions): boolean {
  return Boolean(
    drm?.widevine?.licenseUrl ||
      drm?.playready?.licenseUrl ||
      (drm?.fairplay?.licenseUrl && drm.fairplay.certificateUrl),
  );
}

export function mergeDrm(player?: DrmOptions, source?: DrmOptions): DrmOptions | null {
  if (!hasConfiguredDrm(player) && !hasConfiguredDrm(source)) return null;
  return {
    ...player,
    ...source,
    preferred: source?.preferred ?? player?.preferred,
    widevine: mergeCenc(player?.widevine, source?.widevine),
    playready: mergeCenc(player?.playready, source?.playready),
    fairplay: mergeFairPlay(player?.fairplay, source?.fairplay),
    beforeLicenseRequest: source?.beforeLicenseRequest ?? player?.beforeLicenseRequest,
  };
}

export function toHlsDrmConfig(drm: DrmOptions): Record<string, unknown> {
  const drmSystems: Record<string, { licenseUrl: string; serverCertificateUrl?: string }> = {};
  const robustness = drm.widevine?.videoRobustness ?? drm.widevine?.robustness ?? drm.playready?.videoRobustness ?? drm.playready?.robustness;
  if (drm.widevine?.licenseUrl) {
    drmSystems[WIDEVINE_KEY_SYSTEM] = {
      licenseUrl: drm.widevine.licenseUrl,
      serverCertificateUrl: drm.widevine.serverCertificateUrl,
    };
  }
  if (drm.playready?.licenseUrl) {
    drmSystems[PLAYREADY_KEY_SYSTEM] = { licenseUrl: drm.playready.licenseUrl };
  }
  if (drm.fairplay?.licenseUrl && drm.fairplay.certificateUrl) {
    drmSystems[FAIRPLAY_KEY_SYSTEM] = {
      licenseUrl: drm.fairplay.licenseUrl,
      serverCertificateUrl: drm.fairplay.certificateUrl,
    };
  }
  return {
    emeEnabled: true,
    widevineLicenseUrl: drm.widevine?.licenseUrl,
    drmSystems,
    drmSystemOptions: {
      audioRobustness: drm.widevine?.audioRobustness ?? drm.widevine?.robustness ?? drm.playready?.audioRobustness,
      videoRobustness: robustness,
    },
  };
}

export function licenseXhrSetup(drm: DrmOptions) {
  const headers = {
    ...drm.widevine?.headers,
    ...drm.playready?.headers,
    ...drm.fairplay?.headers,
  };
  if (!drm.beforeLicenseRequest && !Object.keys(headers).length) return undefined;
  return async (xhr: XMLHttpRequest, url: string, _keyContext?: unknown, challenge?: Uint8Array) => {
    const request: DrmLicenseRequest = { url, headers: { ...headers }, body: challenge };
    await drm.beforeLicenseRequest?.(request);
    for (const [key, value] of Object.entries(request.headers)) {
      xhr.setRequestHeader(key, value);
    }
  };
}

export function toDashProtectionData(drm: DrmOptions): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (drm.widevine?.licenseUrl) {
    data[WIDEVINE_KEY_SYSTEM] = {
      serverURL: drm.widevine.licenseUrl,
      httpRequestHeaders: drm.widevine.headers,
      withCredentials: drm.widevine.withCredentials,
      serverCertificate: drm.widevine.serverCertificate,
      audioRobustness: drm.widevine.audioRobustness ?? drm.widevine.robustness,
      videoRobustness: drm.widevine.videoRobustness ?? drm.widevine.robustness,
    };
  }
  if (drm.playready?.licenseUrl) {
    data[PLAYREADY_KEY_SYSTEM] = {
      serverURL: drm.playready.licenseUrl,
      httpRequestHeaders: drm.playready.headers,
      withCredentials: drm.playready.withCredentials,
      audioRobustness: drm.playready.audioRobustness ?? drm.playready.robustness,
      videoRobustness: drm.playready.videoRobustness ?? drm.playready.robustness,
    };
  }
  return data;
}

export function applyDashDrm(player: { setProtectionData?(data: Record<string, unknown>): void }, drm: DrmOptions): void {
  if (typeof player.setProtectionData === "function") {
    player.setProtectionData(toDashProtectionData(drm));
  }
}

function mergeCenc(base?: CencDrmOptions, override?: CencDrmOptions): CencDrmOptions | undefined {
  if (!base && !override) return undefined;
  if (!override) return base;
  if (!base) return override;
  return {
    ...base,
    ...override,
    headers: { ...base.headers, ...override.headers },
  };
}

function mergeFairPlay(base?: FairPlayOptions, override?: FairPlayOptions): FairPlayOptions | undefined {
  if (!base && !override) return undefined;
  if (!override) return base;
  if (!base) return override;
  return {
    ...base,
    ...override,
    headers: { ...base.headers, ...override.headers },
  };
}
