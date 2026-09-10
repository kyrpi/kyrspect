export type PlayerStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export interface UIQuality {
  id: number;
  width: number;
  height: number;
  bitrate: number;
  name: string;
}

export interface UISubtitleTrack {
  id: string;
  label: string;
  language: string;
}

export interface UIAudioTrack {
  id: string;
  label: string;
  language: string;
}

export interface UIControlsConfig {
  play?: boolean;
  timeline?: boolean;
  volume?: boolean;
  subtitles?: boolean;
  settings?: boolean;
  pip?: boolean;
  fullscreen?: boolean;
  playbackRate?: boolean;
  quality?: boolean;
  live?: boolean;
  audioVisualizer?: boolean;
}

export interface UITheme {
  accent?: string;
  accentSoft?: string;
  background?: string;
  text?: string;
  textMuted?: string;
  live?: string;
  track?: string;
  buffered?: string;
  controlSize?: string;
  radius?: string;
  font?: string;
}

export type UILayout = "standard" | "reels";
export type UIFit = "contain" | "cover";
export type UIAspectRatio = "auto" | number | string;

export interface UIOptions {
  controls?: boolean | UIControlsConfig;
  hideDelay?: number;
  showOnPause?: boolean;
  language?: string;
  labels?: Partial<UILabels>;
  theme?: UITheme;
  statsFields?: StatsField[];
  layout?: UILayout;
  aspectRatio?: UIAspectRatio;
  fit?: UIFit;
  fill?: boolean;
  audioVisualizer?: boolean;
}

export interface UILabels {
  player: string;
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  volume: string;
  seek: string;
  settings: string;
  subtitles: string;
  subtitlesOff: string;
  quality: string;
  qualityAuto: string;
  playbackRate: string;
  playbackRateNormal: string;
  audio: string;
  fullscreen: string;
  exitFullscreen: string;
  pip: string;
  exitPip: string;
  live: string;
  retry: string;
  errorTitle: string;
  errorUnsupported: string;
  errorStream: string;
  buffering: string;
  loop: string;
  miniplayer: string;
  copyVideoUrl: string;
  copyVideoUrlAtTime: string;
  copyEmbed: string;
  copyDebug: string;
  troubleshoot: string;
  statsForNerds: string;
  about: string;
  copied: string;
  statsVideoId: string;
  statsViewport: string;
  statsResolution: string;
  statsVolume: string;
  statsCodecs: string;
  statsColor: string;
  statsConnection: string;
  statsNetwork: string;
  statsBuffer: string;
  statsLive: string;
  statsFlags: string;
  statsDate: string;
  statsClose: string;
  audioVisualizer: string;
  on: string;
  off: string;
}

export type StatsFieldId =
  | "videoId"
  | "viewport"
  | "resolution"
  | "volume"
  | "codecs"
  | "color"
  | "connection"
  | "network"
  | "buffer"
  | "live"
  | "flags"
  | "date";

export interface StatsCustomField {
  id: string;
  label: string;
  value?: string | ((stats: unknown) => string);
}

export type StatsField = StatsFieldId | StatsCustomField;

export interface QualityState {
  mode: "auto" | "manual";
  level: number | null;
  bitrate: number | null;
  width: number;
  height: number;
}

export interface PlayerLike {
  readonly media: HTMLVideoElement;
  readonly el: HTMLElement;
  readonly paused: boolean;
  readonly ended: boolean;
  readonly muted: boolean;
  readonly volume: number;
  readonly playbackRate: number;
  readonly currentTime: number;
  readonly duration: number;
  readonly buffered: TimeRanges;
  readonly isLive: boolean;
  readonly liveLatency: number | null;
  readonly bufferHealth: number;
  readonly quality: QualityState;
  readonly loop: boolean;
  readonly options: { debug?: boolean; keyboard?: boolean | Record<string, string> };

  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;
  seekToLiveEdge(): void;
  mute(): void;
  unmute(): void;
  setVolume(value: number): void;
  setPlaybackRate(rate: number): void;
  getQualities(): UIQuality[];
  getQuality(): QualityState;
  setQuality(level: number | "auto"): void;
  enableAutoQuality(): void;
  getSubtitleTracks(): UISubtitleTrack[];
  setSubtitleTrack(id: string): void;
  disableSubtitles(): void;
  getAudioTracks(): UIAudioTrack[];
  setAudioTrack(id: string): void;
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  toggleFullscreen(): Promise<void>;
  enterPictureInPicture(): Promise<void>;
  exitPictureInPicture(): Promise<void>;
  reload(): Promise<void>;
  setLoop(loop: boolean): void;
  getStatsFields(): StatsField[];
  setStatsFields(fields: StatsField[]): void;
  getStats(): {
    id: string;
    currentTime: number;
    duration: number;
    viewport: { width: number; height: number };
    resolution: { width: number; height: number; frameRate: number };
    optimal: { width: number; height: number; frameRate: number };
    volume: { level: number; muted: boolean };
    codecs: string;
    color: string;
    quality: { mode: string; level: number | null; bitrate: number | null };
    network: { bandwidthEstimate: number; activityBytes: number };
    buffer: { ahead: number; start: number; end: number };
    frames: { decoded: number; dropped: number };
    live: { enabled: boolean; latency: number | null };
    flags: string;
    timestamp: number;
  };

  isFullscreen(): boolean;
  isPictureInPicture(): boolean;
  isPipAvailable(): boolean;
  isFullscreenAvailable(): boolean;
  atLiveEdge(): boolean;

  on(event: string, handler: (...args: never[]) => void): () => void;
}

export interface PlayerUIHandle {
  destroy(): void;
  setLoading(visible: boolean, reason?: string): void;
  setError(message: string | null): void;
  setTheme(theme: UITheme | null): void;
  setLanguage(language: string, labels?: Partial<UILabels>): void;
  setStatsFields(fields: StatsField[]): void;
  setLayout(layout: UILayout): void;
  setAspectRatio(aspectRatio?: UIAspectRatio): void;
  setAudioVisualizer(visible: boolean): void;
  isAudioVisualizerVisible(): boolean;
}
