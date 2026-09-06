import type { EventEmitter } from "../events/EventEmitter";
import type { BufferReason, KyrspectEventMap } from "../types/events";
import { getBufferAhead } from "../utils/media";

export class BufferMonitor {
  private low = false;
  private buffering = false;
  private showTimer = 0;
  private readonly onWaiting: () => void;
  private readonly onPlaying: () => void;
  private readonly onStalled: () => void;
  private readonly onProgress: () => void;

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly events: EventEmitter<KyrspectEventMap>,
    private readonly onVisible: (visible: boolean, reason?: BufferReason) => void,
    private readonly delay = 180,
  ) {
    this.onWaiting = () => this.begin("rebuffer");
    this.onPlaying = () => this.end();
    this.onStalled = () => {
      this.events.emit("stalled");
      this.begin("rebuffer");
    };
    this.onProgress = () => this.checkHealth();
    this.video.addEventListener("waiting", this.onWaiting);
    this.video.addEventListener("playing", this.onPlaying);
    this.video.addEventListener("stalled", this.onStalled);
    this.video.addEventListener("progress", this.onProgress);
    this.video.addEventListener("canplay", this.onPlaying);
  }

  get health(): number {
    return getBufferAhead(this.video);
  }

  begin(reason: BufferReason): void {
    if (this.buffering) return;
    this.buffering = true;
    this.events.emit("waiting");
    this.events.emit("bufferstart", { reason });
    window.clearTimeout(this.showTimer);
    const wait = reason === "initial" || reason === "manifest" ? 80 : this.delay;
    this.showTimer = window.setTimeout(() => this.onVisible(true, reason), wait);
  }

  end(): void {
    if (!this.buffering) {
      this.onVisible(false);
      return;
    }
    this.buffering = false;
    window.clearTimeout(this.showTimer);
    this.showTimer = 0;
    this.onVisible(false);
    this.events.emit("bufferend");
  }

  checkHealth(): void {
    const health = this.health;
    if (!this.low && health > 0 && health < 2.5) {
      this.low = true;
      this.events.emit("bufferlow", { bufferHealth: health });
    } else if (this.low && health > 8) {
      this.low = false;
      this.events.emit("bufferhealthy", { bufferHealth: health });
    }
  }

  destroy(): void {
    window.clearTimeout(this.showTimer);
    this.video.removeEventListener("waiting", this.onWaiting);
    this.video.removeEventListener("playing", this.onPlaying);
    this.video.removeEventListener("stalled", this.onStalled);
    this.video.removeEventListener("progress", this.onProgress);
    this.video.removeEventListener("canplay", this.onPlaying);
  }
}
