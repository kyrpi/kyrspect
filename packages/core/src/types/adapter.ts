import type { KyrspectSource, ResolvedSource } from "./source";
import type { KyrspectQuality } from "./quality";
import type { KyrspectAudioTrack, KyrspectSubtitleTrack } from "./tracks";
import type { KyrspectOptions } from "./options";
import type { EventEmitter } from "../events/EventEmitter";
import type { KyrspectEventMap } from "./events";
import type { DrmManager } from "../drm/DrmManager";

export interface AdapterContext {
  options: KyrspectOptions;
  events: EventEmitter<KyrspectEventMap>;
  debug: (namespace: string, ...args: unknown[]) => void;
  getHeaders(): Record<string, string>;
  beforeRequest?(request: NetworkRequest): void | Promise<void>;
  drm: DrmManager | null;
}

export interface NetworkRequest {
  url: string;
  headers: Record<string, string>;
}

export interface PlaybackAdapter {
  readonly name: string;
  canHandle(source: ResolvedSource | KyrspectSource): boolean;
  load(video: HTMLVideoElement, source: ResolvedSource, context: AdapterContext): Promise<void>;
  unload(): Promise<void>;
  destroy(): void;
  getQualities?(): KyrspectQuality[];
  setQuality?(quality: number | "auto"): void;
  getQualityMode?(): "auto" | "manual";
  getBandwidthEstimate?(): number;
  getAudioTracks?(): KyrspectAudioTrack[];
  setAudioTrack?(id: string): void;
  getSubtitleTracks?(): KyrspectSubtitleTrack[];
  setSubtitleTrack?(id: string | null): void;
  isLive?(): boolean;
  getLiveLatency?(): number | null;
  getLiveSyncPosition?(): number | null;
  getDroppedFrames?(): number;
  getDecodedFrames?(): number;
  ownsMediaElementErrors?(): boolean;
}
