import type { SourceInput, KyrspectSource, ResolvedSource } from "../types/source";

const HLS_MIME = /application\/(vnd\.apple\.mpegurl|x-mpegURL)/i;
const DASH_MIME = /application\/dash\+xml/i;

export function isHlsMime(mimeType?: string): boolean {
  return Boolean(mimeType && HLS_MIME.test(mimeType));
}

export function isDashMime(mimeType?: string): boolean {
  return Boolean(mimeType && DASH_MIME.test(mimeType));
}

export function isProbablyHlsUrl(url: string): boolean {
  try {
    const parsed = new URL(url, typeof location === "undefined" ? "https://kyrspect.local" : location.href);
    return /\.m3u8($|[?#])/i.test(parsed.pathname + parsed.search);
  } catch {
    return /\.m3u8($|[?#])/i.test(url);
  }
}

export function isProbablyDashUrl(url: string): boolean {
  try {
    const parsed = new URL(url, typeof location === "undefined" ? "https://kyrspect.local" : location.href);
    return /\.mpd($|[?#])/i.test(parsed.pathname + parsed.search);
  } catch {
    return /\.mpd($|[?#])/i.test(url);
  }
}

export function isMediaStream(value: unknown): value is MediaStream {
  return typeof MediaStream !== "undefined" && value instanceof MediaStream;
}

export function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

export function normalizeSource(input: SourceInput): KyrspectSource {
  if (typeof input === "string") {
    return { type: "auto", src: input };
  }
  if (isMediaStream(input)) {
    return { type: "media-stream", stream: input };
  }
  if (isBlob(input)) {
    return { type: "blob", blob: input, mimeType: input.type || undefined };
  }
  return input;
}

export function getSourceUrl(source: KyrspectSource): string | null {
  if ("src" in source && typeof source.src === "string") return source.src;
  return null;
}

export function nativeHlsSupport(video?: HTMLVideoElement | null): "probably" | "maybe" | "none" {
  const probe = video ?? (typeof document !== "undefined" ? document.createElement("video") : null);
  if (!probe) return "none";
  const apple = probe.canPlayType("application/vnd.apple.mpegurl");
  const legacy = probe.canPlayType("application/x-mpegURL");
  if (apple === "probably" || legacy === "probably") return "probably";
  if (apple !== "" || legacy !== "") return "maybe";
  return "none";
}

export function canPlayNativeHls(video?: HTMLVideoElement | null): boolean {
  return nativeHlsSupport(video) !== "none";
}

export function resolveSourceSync(
  input: SourceInput,
  video?: HTMLVideoElement | null,
): ResolvedSource {
  const source = normalizeSource(input);

  if (source.type === "media-stream") return source;
  if (source.type === "blob") return source;
  if (source.type === "hls") return source;
  if (source.type === "dash") return source;
  if (source.type === "video") return source;

  const mime = "mimeType" in source ? source.mimeType : undefined;
  const drm = "drm" in source ? source.drm : undefined;

  if (isHlsMime(mime)) {
    return { type: "hls", src: getSourceUrl(source) ?? "", mimeType: mime, drm };
  }
  if (isDashMime(mime)) {
    return { type: "dash", src: getSourceUrl(source) ?? "", mimeType: mime, drm };
  }

  if (mime && video && video.canPlayType(mime) !== "") {
    return { type: "video", src: getSourceUrl(source) ?? "", mimeType: mime, drm };
  }

  const url = getSourceUrl(source) ?? "";
  if (url && isProbablyHlsUrl(url)) {
    return { type: "hls", src: url, mimeType: mime ?? "application/vnd.apple.mpegurl", drm };
  }
  if (url && isProbablyDashUrl(url)) {
    return { type: "dash", src: url, mimeType: mime ?? "application/dash+xml", drm };
  }

  return {
    type: "video",
    src: url,
    mimeType: mime,
    drm,
  };
}
