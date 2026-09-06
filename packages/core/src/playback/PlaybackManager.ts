import type { PlaybackAdapter, AdapterContext } from "../types/adapter";
import type { ResolvedSource, KyrspectSource } from "../types/source";
import { KyrspectError } from "../errors/KyrspectError";

export class PlaybackManager {
  private active: PlaybackAdapter | null = null;

  constructor(private readonly adapters: PlaybackAdapter[]) {}

  get current(): PlaybackAdapter | null {
    return this.active;
  }

  async load(video: HTMLVideoElement, source: ResolvedSource, context: AdapterContext): Promise<PlaybackAdapter> {
    await this.unload();
    const adapter = this.adapters.find((item) => item.canHandle(source));
    if (!adapter) {
      throw new KyrspectError({
        code: "no-adapter",
        category: "UNSUPPORTED_FORMAT",
        message: "No playback adapter could handle this source.",
      });
    }
    this.active = adapter;
    await adapter.load(video, source, context);
    return adapter;
  }

  async unload(): Promise<void> {
    if (!this.active) return;
    await this.active.unload();
    this.active = null;
  }

  destroy(): void {
    this.active?.destroy();
    this.active = null;
  }

  canHandle(source: KyrspectSource): boolean {
    return this.adapters.some((adapter) => adapter.canHandle(source));
  }
}
