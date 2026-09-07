import { FAIRPLAY_KEY_SYSTEM, PLAYREADY_KEY_SYSTEM, WIDEVINE_KEY_SYSTEM } from "../types/drm";

const CENC_CONFIG: MediaKeySystemConfiguration[] = [
  {
    initDataTypes: ["cenc"],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
  },
];

const FAIRPLAY_CONFIG: MediaKeySystemConfiguration[] = [
  {
    initDataTypes: ["sinf", "skd", "cenc"],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
  },
];

export function isEmeAvailable(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.requestMediaKeySystemAccess === "function";
}

export async function probeKeySystem(keySystem: string, config = CENC_CONFIG): Promise<boolean> {
  if (!isEmeAvailable()) return false;
  try {
    await navigator.requestMediaKeySystemAccess(keySystem, config);
    return true;
  } catch {
    return false;
  }
}

export function isWidevineSupported(): Promise<boolean> {
  return probeKeySystem(WIDEVINE_KEY_SYSTEM);
}

export function isPlayReadySupported(): Promise<boolean> {
  return probeKeySystem(PLAYREADY_KEY_SYSTEM);
}

export function isFairPlaySupported(): Promise<boolean> {
  return probeKeySystem(FAIRPLAY_KEY_SYSTEM, FAIRPLAY_CONFIG);
}
