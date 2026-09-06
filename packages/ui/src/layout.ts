import type { UIAspectRatio, UILayout } from "./types";

export interface FrameSize {
  width: number;
  height: number;
}

export function parseAspectRatio(value: UIAspectRatio | undefined): FrameSize | null {
  if (value == null || value === "auto") return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return { width: value, height: 1 };
  }
  const raw = String(value).trim();
  const [width, height] = raw.split(/[:xX/]/).map((part) => Number(part.trim()));
  if (width && height && width > 0 && height > 0) {
    return { width, height };
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) return { width: numeric, height: 1 };
  return null;
}

export function resolveFrameSize(
  aspectRatio: UIAspectRatio | undefined,
  video: { videoWidth: number; videoHeight: number },
  layout: UILayout,
): FrameSize {
  const explicit = parseAspectRatio(aspectRatio);
  if (explicit) return explicit;
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    return { width: video.videoWidth, height: video.videoHeight };
  }
  return layout === "reels" ? { width: 9, height: 16 } : { width: 16, height: 9 };
}

export function shouldFillHost(layout: UILayout, fill: boolean | undefined, root: HTMLElement): boolean {
  if (fill === true) return true;
  if (fill === false || layout !== "reels") return false;
  const parent = root.parentElement;
  if (!parent) return false;
  const height = parent.clientHeight;
  const width = parent.clientWidth;
  return height >= 280 && width > 0 && height >= width * 0.85;
}
