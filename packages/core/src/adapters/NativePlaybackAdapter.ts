import type { PlaybackAdapter, AdapterContext } from "../types/adapter";
import type { ResolvedSource, KyrspectSource } from "../types/source";
import { resetMediaElement } from "../utils/media";

export class NativePlaybackAdapter implements PlaybackAdapter {
  readonly name = "native";
  private video: HTMLVideoElement | null = null;
  private objectUrl: string | null = null;

  canHandle(source: ResolvedSource | KyrspectSource): boolean {
    return source.type === "video" || source.type === "blob";
  }

  async load(video: HTMLVideoElement, source: ResolvedSource, context: AdapterContext): Promise<void> {
    this.video = video;
    if (video.srcObject) video.srcObject = null;
    if (source.type === "blob") {
      this.revokeObjectUrl();
      this.objectUrl = URL.createObjectURL(source.blob);
      video.src = this.objectUrl;
    } else if (source.type === "video") {
      video.src = source.src;
    }
    context.debug("Native", "Source loaded");
  }

  async unload(): Promise<void> {
    if (this.video) resetMediaElement(this.video);
    this.revokeObjectUrl();
    this.video = null;
  }

  destroy(): void {
    void this.unload();
  }

  private revokeObjectUrl(): void {
    if (!this.objectUrl) return;
    URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }
}
