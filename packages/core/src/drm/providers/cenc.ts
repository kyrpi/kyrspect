import type { CencDrmOptions } from "../../types/drm";
import type { HlsDrmEngineConfig } from "./types";

export function cencProtectionData(keySystem: string, options: CencDrmOptions): Record<string, unknown> {
  const robustness = options.robustness;
  return {
    [keySystem]: {
      serverURL: options.licenseUrl,
      httpRequestHeaders: options.headers,
      withCredentials: options.withCredentials,
      serverCertificate: options.serverCertificate,
      audioRobustness: options.audioRobustness ?? robustness,
      videoRobustness: options.videoRobustness ?? robustness,
      persistentState: options.persistentState,
      distinctiveIdentifier: options.distinctiveIdentifier,
      sessionType: options.sessionType,
    },
  };
}

export function cencHlsConfig(
  keySystem: string,
  options: CencDrmOptions,
  extra: Partial<HlsDrmEngineConfig> = {},
): Partial<HlsDrmEngineConfig> {
  const robustness = options.robustness;
  return {
    emeEnabled: true,
    drmSystems: {
      [keySystem]: {
        licenseUrl: options.licenseUrl,
        serverCertificateUrl: options.serverCertificateUrl,
      },
    },
    drmSystemOptions: {
      audioRobustness: options.audioRobustness ?? robustness,
      videoRobustness: options.videoRobustness ?? robustness,
      persistentState: options.persistentState,
      distinctiveIdentifier: options.distinctiveIdentifier,
      sessionType: options.sessionType,
    },
    ...extra,
  };
}
