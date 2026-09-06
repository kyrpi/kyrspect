import type { PlaybackAdapter } from "../types/adapter";

const HAVE_METADATA = 1;

export class LiveManager {
  constructor(
    private readonly video: HTMLVideoElement,
    private readonly getAdapter: () => PlaybackAdapter | null,
    private readonly targetLatency: number,
  ) {}

  get enabled(): boolean {
    const adapter = this.getAdapter();
    if (adapter?.isLive) return Boolean(adapter.isLive());
    // A NaN duration means metadata has not arrived (or the load failed), which
    // is not the same as an endless stream.
    if (this.video.readyState < HAVE_METADATA) return false;
    return this.video.duration === Infinity;
  }

  get latency(): number | null {
    const adapter = this.getAdapter();
    const fromAdapter = adapter?.getLiveLatency?.();
    if (typeof fromAdapter === "number") return fromAdapter;
    if (!this.enabled) return null;
    const edge = this.liveEdge();
    if (edge == null) return null;
    return Math.max(0, edge - this.video.currentTime);
  }

  liveEdge(): number | null {
    const adapter = this.getAdapter();
    const sync = adapter?.getLiveSyncPosition?.();
    if (typeof sync === "number" && Number.isFinite(sync)) return sync;
    if (this.video.seekable.length > 0) {
      return this.video.seekable.end(this.video.seekable.length - 1);
    }
    if (Number.isFinite(this.video.duration)) return this.video.duration;
    return null;
  }

  atLiveEdge(): boolean {
    if (!this.enabled) return false;
    const latency = this.latency;
    if (latency == null) return true;
    return latency <= this.targetLatency + 1.5;
  }

  seekToLiveEdge(): void {
    const edge = this.liveEdge();
    if (edge == null) return;
    this.video.currentTime = Math.max(0, edge - Math.max(0.1, this.targetLatency * 0.15));
  }
}
