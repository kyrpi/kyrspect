import type { QualityChangeEvent, KyrspectQuality } from "./quality";
import type { KyrspectAudioTrack, KyrspectSubtitleTrack } from "./tracks";
import type { KyrspectError } from "../errors/KyrspectError";
import type { UITheme } from "@kyrspect/ui";

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
  subtitlestylechange: { style: Record<string, string | undefined> };
  subtitleloaded: { track: KyrspectSubtitleTrack };
  subtitleerror: { error: KyrspectError };
  audiotrackchange: { track: KyrspectAudioTrack | null };
  equalizerchange: { preset: string };
  dualchannelchange: { enabled: boolean };
  fullscreenchange: { fullscreen: boolean };
  pictureinpicturechange: { active: boolean };
  themechange: { theme: UITheme | null; name: string };
  performancemodechange: { enabled: boolean };
  liveedge: { atLiveEdge: boolean };
  latencychange: { liveLatency: number | null };
  autoplayblocked: undefined;
  error: KyrspectError;
  destroy: undefined;
}

export type BufferReason = "initial" | "rebuffer" | "seeking" | "manifest" | "reconnect";

export type KyrspectEventName = keyof KyrspectEventMap;
