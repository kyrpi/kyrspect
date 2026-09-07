import type { UIQuality } from "@kyrspect/ui";
import type { WasmQualityProfile } from "../wasm/WasmBridge";
import type { DrmOptions } from "../drm";
import { applyDashDrm } from "../drm";

export interface DashCallbacks {
  onQualitiesLoaded: (qualities: UIQuality[], wasmProfiles: WasmQualityProfile[]) => void;
  onBandwidthSample: (bytes: number, durationSec: number) => void;
  onError: (error: Error) => void;
}

export class DashPlaybackAdapter {
  private media: HTMLVideoElement;
  private player: any = null;
  private callbacks: DashCallbacks;

  constructor(media: HTMLVideoElement, callbacks: DashCallbacks) {
    this.media = media;
    this.callbacks = callbacks;
  }

  async load(src: string, drm: DrmOptions | null = null): Promise<void> {
    const dashjs = (window as any).dashjs;
    const supported = typeof dashjs?.supportsMediaSource === "function" ? dashjs.supportsMediaSource() : Boolean(dashjs);
    if (dashjs && supported) {
      this.destroy();

      this.player = dashjs.MediaPlayer().create();
      if (drm) applyDashDrm(this.player, drm);
      this.player.updateSettings?.({
        streaming: {
          abr: { autoSwitchBitrate: { video: true, audio: true } },
          buffer: { fastSwitchEnabled: true },
        },
      });

      const events = dashjs.MediaPlayer?.events ?? {};
      const onInitialized = () => {
        const reps =
          this.player.getRepresentationsByType?.("video") ??
          this.player.getBitrateInfoListFor?.("video") ??
          [];
        const uiQualities: UIQuality[] = reps.map((rep: any, index: number) => ({
          id: typeof rep.index === "number" ? rep.index : index,
          width: rep.width || 0,
          height: rep.height || 0,
          bitrate: rep.bandwidth || rep.bitrate || (rep.bitrateInKbit ? rep.bitrateInKbit * 1000 : 0),
          name: rep.height ? `${rep.height}p` : `${rep.bitrateInKbit || Math.round((rep.bandwidth || 0) / 1000)} kbps`,
        }));
        const wasmProfiles: WasmQualityProfile[] = uiQualities.map((quality) => ({
          id: quality.id,
          width: quality.width,
          height: quality.height,
          bitrate: quality.bitrate,
          label: quality.name,
        }));
        this.callbacks.onQualitiesLoaded(uiQualities, wasmProfiles);
      };

      this.player.on?.(events.STREAM_INITIALIZED || "streamInitialized", onInitialized);
      this.player.on?.(events.ERROR || "error", (data: any) => {
        const message = data?.error?.message || data?.message || "DASH Fatal Error";
        this.callbacks.onError(new Error(String(message)));
      });

      this.player.initialize(this.media, src, false);
    } else {
      this.media.src = src;
      this.media.load();
    }
  }

  setQualityLevel(level: number): void {
    if (!this.player) return;
    if (level < 0) {
      this.player.updateSettings?.({
        streaming: { abr: { autoSwitchBitrate: { video: true } } },
      });
      return;
    }
    this.player.updateSettings?.({
      streaming: { abr: { autoSwitchBitrate: { video: false } } },
    });
    if (typeof this.player.setRepresentationForTypeByIndex === "function") {
      this.player.setRepresentationForTypeByIndex("video", level);
    } else if (typeof this.player.setQualityFor === "function") {
      this.player.setQualityFor("video", level);
    }
  }

  destroy(): void {
    if (!this.player) return;
    try {
      this.player.reset?.();
    } catch {
      // player may not have been initialized
    }
    try {
      this.player.destroy?.();
    } catch {
      // older dash.js builds only expose reset()
    }
    this.player = null;
  }
}
