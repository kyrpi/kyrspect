export function formatClock(seconds: number, withHours = false): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return withHours ? "0:00:00" : "0:00";
  }
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (withHours || h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

export function formatLiveOffset(secondsBehind: number): string {
  if (!Number.isFinite(secondsBehind) || secondsBehind <= 0.75) return "0:00";
  return `-${formatClock(secondsBehind, secondsBehind >= 3600)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ratioFromTimeRanges(
  ranges: TimeRanges,
  currentTime: number,
  duration: number,
  mode: "played" | "buffered",
): number {
  if (!duration || !Number.isFinite(duration) || duration <= 0) return 0;
  if (mode === "played") return clamp(currentTime / duration, 0, 1);
  for (let i = 0; i < ranges.length; i += 1) {
    const start = ranges.start(i);
    const end = ranges.end(i);
    if (currentTime >= start && currentTime <= end) {
      return clamp(end / duration, 0, 1);
    }
  }
  return 0;
}
