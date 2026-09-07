import type Hls from "hls.js";

type HlsConstructor = typeof Hls;

let constructorPromise: Promise<HlsConstructor> | null = null;
let cached: HlsConstructor | null = null;

export function isMseAvailable(): boolean {
  return typeof MediaSource !== "undefined";
}

export function isHlsJsSupported(): boolean {
  if (cached) {
    try {
      return typeof cached.isSupported === "function" && cached.isSupported();
    } catch {
      return false;
    }
  }
  return isMseAvailable();
}

export async function loadHlsConstructor(): Promise<HlsConstructor> {
  if (cached) return cached;
  constructorPromise ??= import("hls.js").then((mod) => {
    const imported = mod as unknown as { default?: HlsConstructor } & HlsConstructor;
    cached = imported.default ?? imported;
    return cached;
  });
  return constructorPromise;
}

/** @deprecated Prefer loadHlsConstructor(); kept for sync call sites after a prior load. */
export function getHlsConstructor(): HlsConstructor {
  if (!cached) {
    throw new Error("hls.js has not been loaded yet.");
  }
  return cached;
}
