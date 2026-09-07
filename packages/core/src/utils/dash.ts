import type * as DashNamespace from "dashjs";

type DashModule = typeof DashNamespace;

let modulePromise: Promise<DashModule> | null = null;
let cached: DashModule | null = null;

export function isDashJsSupported(): boolean {
  if (cached && typeof cached.supportsMediaSource === "function") {
    try {
      return cached.supportsMediaSource();
    } catch {
      return false;
    }
  }
  return typeof MediaSource !== "undefined";
}

export async function loadDashModule(): Promise<DashModule> {
  if (cached) return cached;
  modulePromise ??= import("dashjs").then((mod) => {
    cached = mod;
    return mod;
  });
  return modulePromise;
}
