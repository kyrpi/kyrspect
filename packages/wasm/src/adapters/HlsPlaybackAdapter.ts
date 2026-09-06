import type { UIQuality } from "@kyrspect/ui";
import type { WasmQualityProfile } from "../wasm/WasmBridge";

export interface HlsCallbacks {
  onQualitiesLoaded: (qualities: UIQuality[], wasmProfiles: WasmQualityProfile[]) => void;
  onBandwidthSample: (bytes: number, durationSec: number) => void;
  onError: (error: Error) => void;
}

export class HlsPlaybackAdapter {
  private media: HTMLVideoElement;
  private hls: any = null;
  private callbacks: HlsCallbacks;

  constructor(media: HTMLVideoElement, callbacks: HlsCallbacks) {
    this.media = media;
    this.callbacks = callbacks;
  }

  async load(src: string): Promise<void> {
    const HlsConstructor = (window as any).Hls;
    if (HlsConstructor && HlsConstructor.isSupported()) {
      if (this.hls) {
        this.hls.destroy();
      }

      this.hls = new HlsConstructor({
        enableWorker: true,
        lowLatencyMode: true,
      });

      this.hls.attachMedia(this.media);
      this.hls.loadSource(src);

      this.hls.on(HlsConstructor.Events.MANIFEST_PARSED, (_: any, data: any) => {
        const levels = data.levels || [];
        const uiQualities: UIQuality[] = levels.map((lvl: any, index: number) => ({
          id: index,
          width: lvl.width || 0,
          height: lvl.height || 0,
          bitrate: lvl.bitrate || 0,
          name: lvl.name || `${lvl.height || lvl.bitrate}p`,
        }));

        const wasmProfiles: WasmQualityProfile[] = levels.map((lvl: any, index: number) => ({
          id: index,
          width: lvl.width || 0,
          height: lvl.height || 0,
          bitrate: lvl.bitrate || 0,
          label: lvl.name || `${lvl.height || lvl.bitrate}p`,
        }));

        this.callbacks.onQualitiesLoaded(uiQualities, wasmProfiles);
      });

      this.hls.on(HlsConstructor.Events.FRAG_LOADED, (_: any, data: any) => {
        if (data && data.frag && data.stats) {
          const bytes = data.stats.total || data.stats.loaded || 0;
          const durationSec = (data.stats.tload - data.stats.tfirst) / 1000;
          if (bytes > 0 && durationSec > 0) {
            this.callbacks.onBandwidthSample(bytes, durationSec);
          }
        }
      });

      this.hls.on(HlsConstructor.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          this.callbacks.onError(new Error(`HLS Fatal Error: ${data.details}`));
        }
      });
    } else if (this.media.canPlayType("application/vnd.apple.mpegurl")) {
      this.media.src = src;
      this.media.load();
    } else {
      this.media.src = src;
      this.media.load();
    }
  }

  setQualityLevel(level: number): void {
    if (this.hls) {
      this.hls.currentLevel = level; // -1 is auto
    }
  }

  destroy(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }
}
