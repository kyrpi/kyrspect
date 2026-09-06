import type { QualityChangeEvent, KyrspectQuality } from "./quality";
import type { KyrspectAudioTrack, KyrspectSubtitleTrack } from "./tracks";
import type { KyrspectError } from "../errors/KyrspectError";

export interface KyrspectEventMap {
  ready: undefined;
  loadstart: undefined;
  loadedmetadata: undefined;
  loadeddata: undefined;
  play: undefined;
  playing: undefined;
  pause: undefined;
  ended: undefined;
  seeking: undefined;
  seeked: undefined;
  timeupdate: { currentTime: number };
  durationchange: { duration: number };
  volumechange: { volume: number; muted: boolean };
  ratechange: { playbackRate: number };
  bufferstart: { reason: BufferReason };
  bufferend: undefined;
  bufferlow: { bufferHealth: number };
  bufferhealthy: { bufferHealth: number };
  stalled: undefined;
  waiting: undefined;
  qualitychange: QualityChangeEvent;
  qualitylevelsloaded: { qualities: KyrspectQuality[] };
  bandwidthchange: { bitrate: number };
  subtitlechange: { track: KyrspectSubtitleTrack | null };
  subtitleloaded: { track: KyrspectSubtitleTrack };
  subtitleerror: { error: KyrspectError };
  audiotrackchange: { track: KyrspectAudioTrack | null };
  fullscreenchange: { fullscreen: boolean };
  pictureinpicturechange: { active: boolean };
  liveedge: { atLiveEdge: boolean };
  latencychange: { liveLatency: number | null };
  autoplayblocked: undefined;
  error: KyrspectError;
  destroy: undefined;
}

export type BufferReason = "initial" | "rebuffer" | "seeking" | "manifest" | "reconnect";

export type KyrspectEventName = keyof KyrspectEventMap;
