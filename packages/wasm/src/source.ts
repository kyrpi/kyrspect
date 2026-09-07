export type DetectedMediaKind = "hls" | "dash" | "native";

export function detectMediaKind(src: string, mime?: string): DetectedMediaKind {
  const hint = (mime ?? "").toLowerCase();
  if (hint.includes("dash+xml") || hint === "dash" || hint.includes("application/dash")) return "dash";
  if (hint.includes("mpegurl") || hint === "hls" || hint.includes("x-mpegurl")) return "hls";
  if (looksLike(src, /\.mpd($|[?#])/i)) return "dash";
  if (looksLike(src, /\.m3u8($|[?#])/i)) return "hls";
  return "native";
}

export function needsWasmSourceHint(src: string, mime?: string): boolean {
  if (mime) return false;
  try {
    const parsed = new URL(src, "https://kyrspect.local");
    return !/\.\w{2,5}($|[?#])/i.test(parsed.pathname);
  } catch {
    return !/\.\w{2,5}($|[?#])/i.test(src);
  }
}

function looksLike(src: string, pattern: RegExp): boolean {
  try {
    const parsed = new URL(src, "https://kyrspect.local");
    return pattern.test(parsed.pathname + parsed.search);
  } catch {
    return pattern.test(src);
  }
}
