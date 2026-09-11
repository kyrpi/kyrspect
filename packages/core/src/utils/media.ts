export function hasMediaResource(video: HTMLVideoElement): boolean {
  return Boolean(video.currentSrc || video.getAttribute("src") || video.srcObject);
}

export function isSpuriousMediaError(video: HTMLVideoElement): boolean {
  const error = video.error;
  if (!error) return true;
  const empty = !hasMediaResource(video);
  if (empty && (error.code === 1 || error.code === 4)) return true;
  return false;
}

export function resetMediaElement(video: HTMLVideoElement): void {
  video.pause();
  const currentSrc = video.currentSrc || video.src;
  if (currentSrc && currentSrc.startsWith("blob:") && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    try {
      URL.revokeObjectURL(currentSrc);
    } catch {
      // Ignored
    }
  }
  video.removeAttribute("src");
  video.srcObject = null;
  try {
    video.load();
  } catch {
    // Some environments throw when load() has no resource.
  }
}

export function getBufferAhead(video: HTMLVideoElement): number {
  const { buffered, currentTime } = video;
  for (let i = 0; i < buffered.length; i += 1) {
    const start = buffered.start(i);
    const end = buffered.end(i);
    if (currentTime >= start && currentTime <= end) return Math.max(0, end - currentTime);
  }
  return 0;
}

export function getFrameStats(video: HTMLVideoElement): { decoded: number; dropped: number } {
  const quality = (
    video as HTMLVideoElement & {
      getVideoPlaybackQuality?: () => VideoPlaybackQuality;
      webkitDecodedFrameCount?: number;
      webkitDroppedFrameCount?: number;
    }
  );
  if (typeof quality.getVideoPlaybackQuality === "function") {
    const info = quality.getVideoPlaybackQuality();
    return { decoded: info.totalVideoFrames, dropped: info.droppedVideoFrames };
  }
  return {
    decoded: quality.webkitDecodedFrameCount ?? 0,
    dropped: quality.webkitDroppedFrameCount ?? 0,
  };
}
