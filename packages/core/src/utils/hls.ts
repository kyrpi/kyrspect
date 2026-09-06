import Hls from "hls.js";

type HlsConstructor = typeof Hls;

export function getHlsConstructor(): HlsConstructor {
  const imported = Hls as unknown as { default?: HlsConstructor };
  return imported.default ?? Hls;
}

export function isHlsJsSupported(): boolean {
  try {
    const ctor = getHlsConstructor();
    return typeof ctor.isSupported === "function" && ctor.isSupported();
  } catch {
    return false;
  }
}
