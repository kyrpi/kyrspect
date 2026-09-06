import { DEFAULT_STATS_FIELDS, type StatsField, type StatsOptions } from "../types/stats";
import type { SourceInput } from "../types/source";
import { isBlob, isMediaStream } from "./source";

export function sourceIdentity(source: SourceInput | null | undefined): string {
  if (!source) return "—";
  if (typeof source === "object" && !isMediaStream(source) && !isBlob(source) && "id" in source && source.id) {
    return String(source.id);
  }
  const url =
    typeof source === "string"
      ? source
      : source && typeof source === "object" && "src" in source
        ? source.src
        : "";
  if (!url) return "—";
  try {
    const name = new URL(url, "https://kyrspect.local").pathname.split("/").filter(Boolean).pop() ?? url;
    return decodeURIComponent(name);
  } catch {
    return url.slice(0, 24);
  }
}

export function statsOptionsFromSource(source: SourceInput | null | undefined): StatsOptions | undefined {
  if (!source || typeof source !== "object" || isMediaStream(source) || isBlob(source)) return undefined;
  if (!("stats" in source) || !source.stats) return undefined;
  return source.stats;
}

export function resolveStatsFields(
  source: SourceInput | null | undefined,
  fallback?: StatsOptions,
): StatsField[] {
  const fromSource = statsOptionsFromSource(source);
  const fields = fromSource?.fields ?? fallback?.fields ?? [...DEFAULT_STATS_FIELDS];
  return fields.length > 0 ? fields : [...DEFAULT_STATS_FIELDS];
}

export function resolveStatsColor(
  source: SourceInput | null | undefined,
  fallback?: StatsOptions,
): string {
  return statsOptionsFromSource(source)?.color ?? fallback?.color ?? "";
}
