import type { PlaybackAdapter, AdapterContext } from "../types/adapter";
import type { ResolvedSource, KyrspectSource } from "../types/source";

export class MediaStreamPlaybackAdapter implements PlaybackAdapter {
  readonly name = "media-stream";
  private video: HTMLVideoElement | null = null;

  canHandle(source: ResolvedSource | KyrspectSource): boolean {
    return source.type === "media-stream";
  }

  async load(video: HTMLVideoElement, source: ResolvedSource, context: AdapterContext): Promise<void> {
    if (source.type !== "media-stream") return;
    this.video = video;
    video.removeAttribute("src");
    video.srcObject = source.stream;
    context.debug("MediaStream", "Stream attached");
  }

  async unload(): Promise<void> {
    if (this.video) {
      this.video.srcObject = null;
    }
    this.video = null;
  }

  destroy(): void {
    void this.unload();
  }
}
