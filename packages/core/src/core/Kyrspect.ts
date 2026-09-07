import {
  applyTheme,
  attachDefaultUI,
  resolveLabels,
  resolveLocale,
  type PlayerLike,
  type PlayerUIHandle,
  type UIAspectRatio,
  type UILayout,
  type UITheme,
} from "@kyrspect/ui";
import { EventEmitter } from "../events/EventEmitter";
import { normalizeError, userFacingErrorMessage } from "../errors/KyrspectError";
import { PlaybackManager } from "../playback/PlaybackManager";
import { DrmManager } from "../drm/DrmManager";
import { needsDrmManager } from "../drm/resolve";
import { NativePlaybackAdapter } from "../adapters/NativePlaybackAdapter";
import { HlsPlaybackAdapter } from "../adapters/HlsPlaybackAdapter";
import { DashPlaybackAdapter } from "../adapters/DashPlaybackAdapter";
import { MediaStreamPlaybackAdapter } from "../adapters/MediaStreamPlaybackAdapter";
import { FullscreenManager } from "../media/FullscreenManager";
import { PiPManager } from "../media/PiPManager";
import { KeyboardManager } from "../media/KeyboardManager";
import { BufferMonitor } from "../media/BufferMonitor";
import { LiveManager } from "../live/LiveManager";
import { SubtitleManager, AudioManager } from "../captions/SubtitleManager";
import { PluginManager } from "../plugins/PluginManager";
import { StorageManager } from "../storage/StorageManager";
import { StateStore } from "./PlayerState";
import { bindTarget } from "../utils/dom";
import { createLogger } from "../utils/logger";
import { deepMerge } from "../utils/misc";
import { clamp } from "../utils/misc";
import { getFrameStats, isSpuriousMediaError } from "../utils/media";
import { resolveSourceSync } from "../utils/source";
import { resolveStatsColor, resolveStatsFields, sourceIdentity } from "../utils/statsConfig";
import { KyrspectCapabilities } from "../utils/capabilities";
import { DEFAULT_OPTIONS, type KyrspectOptions } from "../types/options";
import type { KyrspectEventMap } from "../types/events";
import type { SourceInput } from "../types/source";
import type { QualityState, KyrspectQuality } from "../types/quality";
import type { KyrspectPlugin } from "../types/plugin";
import type { PlayerStats, StatsField } from "../types/stats";
import type { AdapterContext } from "../types/adapter";
import type { KyrspectCapabilitySnapshot } from "../utils/capabilities";

export const VERSION = "0.1.0";

function mergeOptions(input?: KyrspectOptions): KyrspectOptions {
  return deepMerge(
    DEFAULT_OPTIONS as unknown as Record<string, unknown>,
    (input ?? {}) as Record<string, unknown>,
  ) as KyrspectOptions;
}

export class Kyrspect {
  static readonly version = VERSION;

  static async getCapabilities(options?: { drm?: boolean }): Promise<KyrspectCapabilitySnapshot> {
    return KyrspectCapabilities.probe(undefined, options);
  }

  readonly media: HTMLVideoElement;
  readonly el: HTMLElement;

  private readonly optionsInternal: KyrspectOptions;
  private readonly events = new EventEmitter<KyrspectEventMap>();
  private readonly state = new StateStore();
  private readonly playback: PlaybackManager;
  private drm: DrmManager | null = null;
  private readonly fullscreen: FullscreenManager;
  private readonly pip: PiPManager;
  private readonly keyboard: KeyboardManager | null;
  private readonly buffer: BufferMonitor;
  private readonly live: LiveManager;
  private readonly subtitles: SubtitleManager;
  private readonly audio: AudioManager;
  private readonly plugins = new PluginManager<Kyrspect>();
  private readonly storage: StorageManager;
  private readonly logger = createLogger(() => Boolean(this.optionsInternal.debug));
  private readonly bound: BoundTargetCleanup;
  private readonly videoUnbind: () => void;
  private ui: PlayerUIHandle | null = null;
  private destroyed = false;
  private lastSource: SourceInput | null = null;
  private statsFieldsInternal: StatsField[] = [];
  private statsColorInternal = "";
  private lastStatsAt = 0;
  private activityBytes = 0;
  private lastAtLiveEdge = true;
  private readyEmitted = false;
  private ignoringMediaErrors = false;

  constructor(target: string | HTMLElement, options?: KyrspectOptions) {
    this.optionsInternal = mergeOptions(options);
    const controlsEnabled = this.optionsInternal.controls !== false;
    const bound = bindTarget(target, { wrapForUi: controlsEnabled });
    this.el = bound.root;
    this.media = bound.video;
    this.bound = bound;

    this.applyMediaAttributes();
    this.storage = new StorageManager(
      Boolean(this.optionsInternal.preferences?.persist),
      this.optionsInternal.preferences?.storageKey ?? "kyrspect:preferences",
    );
    this.restorePreferences();

    this.playback = new PlaybackManager([
      new MediaStreamPlaybackAdapter(),
      new DashPlaybackAdapter(),
      new HlsPlaybackAdapter(),
      new NativePlaybackAdapter(),
    ]);

    this.fullscreen = new FullscreenManager(this.el, (fullscreen) => {
      this.state.patch({ fullscreen });
      this.events.emit("fullscreenchange", { fullscreen });
    });
    this.pip = new PiPManager(this.media, (active) => {
      this.state.patch({ pictureInPicture: active });
      this.events.emit("pictureinpicturechange", { active });
    });
    this.buffer = new BufferMonitor(this.media, this.events, (visible) => {
      this.ui?.setLoading(visible);
      this.state.patch({ buffering: visible, status: visible ? "buffering" : this.media.paused ? "paused" : "playing" });
    });
    this.live = new LiveManager(
      this.media,
      () => this.playback.current,
      this.optionsInternal.live?.targetLatency ?? 3,
    );
    this.subtitles = new SubtitleManager(
      this.media,
      this.events,
      () => this.playback.current,
      this.optionsInternal.captions?.mode ?? "native",
    );
    this.audio = new AudioManager(this.media, this.events, () => this.playback.current);
    this.keyboard =
      this.optionsInternal.keyboard === false
        ? null
        : new KeyboardManager(this.el, this.optionsInternal.keyboard ?? true, {
            togglePlay: () => {
              if (this.paused) void this.play();
              else this.pause();
            },
            seekBy: (delta) => this.seek(this.currentTime + delta),
            adjustVolume: (delta) => this.setVolume(this.volume + delta),
            toggleMute: () => (this.muted ? this.unmute() : this.mute()),
            toggleFullscreen: () => {
              void this.toggleFullscreen();
            },
            togglePip: () => {
              if (this.isPictureInPicture()) void this.exitPictureInPicture();
              else void this.enterPictureInPicture();
            },
          });

    this.videoUnbind = this.bindVideoEvents();
    this.plugins.attach(this);

    applyTheme(this.el, this.optionsInternal.ui?.theme);
    this.applyStatsConfig(this.optionsInternal.src ?? null);

    if (controlsEnabled) {
      this.ui = attachDefaultUI(this as unknown as PlayerLike, {
        controls: typeof this.optionsInternal.controls === "object" ? this.optionsInternal.controls : true,
        hideDelay: this.optionsInternal.ui?.hideDelay,
        showOnPause: this.optionsInternal.ui?.showOnPause,
        language: this.optionsInternal.language ?? this.optionsInternal.ui?.language,
        labels: this.optionsInternal.ui?.labels,
        theme: this.optionsInternal.ui?.theme,
        statsFields: this.statsFieldsInternal,
        layout: this.optionsInternal.ui?.layout,
        aspectRatio: this.optionsInternal.ui?.aspectRatio,
        fit: this.optionsInternal.ui?.fit,
        fill: this.optionsInternal.ui?.fill,
      });
      const captionRoot = this.el.querySelector(".kyrspect-captions");
      this.subtitles.attachCustomRoot(
        this.optionsInternal.captions?.mode === "custom"
          ? captionRoot instanceof HTMLElement
            ? captionRoot
            : null
          : null,
      );
    }

    if (this.optionsInternal.src) {
      void this.load(this.optionsInternal.src);
    }
  }

  setTheme(theme: UITheme | null): void {
    if (this.optionsInternal.ui) this.optionsInternal.ui.theme = theme ?? undefined;
    else this.optionsInternal.ui = { theme: theme ?? undefined };
    applyTheme(this.el, theme);
    this.ui?.setTheme(theme);
  }

  setLanguage(language: string): void {
    this.optionsInternal.language = language;
    this.ui?.setLanguage(language, this.optionsInternal.ui?.labels);
  }

  setLayout(layout: UILayout): void {
    if (!this.optionsInternal.ui) this.optionsInternal.ui = { layout };
    else this.optionsInternal.ui.layout = layout;
    this.ui?.setLayout(layout);
  }

  setAspectRatio(aspectRatio?: UIAspectRatio): void {
    if (!this.optionsInternal.ui) this.optionsInternal.ui = { aspectRatio };
    else this.optionsInternal.ui.aspectRatio = aspectRatio;
    this.ui?.setAspectRatio(aspectRatio);
  }

  get layout(): UILayout {
    return this.optionsInternal.ui?.layout === "reels" ? "reels" : "standard";
  }

  get language(): string {
    return resolveLocale(this.optionsInternal.language ?? this.optionsInternal.ui?.language);
  }

  get options(): KyrspectOptions {
    return this.optionsInternal;
  }

  get currentTime(): number {
    return this.media.currentTime;
  }

  get duration(): number {
    return this.media.duration;
  }

  get buffered(): TimeRanges {
    return this.media.buffered;
  }

  get paused(): boolean {
    return this.media.paused;
  }

  get ended(): boolean {
    return this.media.ended;
  }

  get volume(): number {
    return this.media.volume;
  }

  get muted(): boolean {
    return this.media.muted;
  }

  get playbackRate(): number {
    return this.media.playbackRate;
  }

  get loop(): boolean {
    return this.media.loop;
  }

  setLoop(loop: boolean): void {
    if (this.destroyed) return;
    this.optionsInternal.loop = loop;
    this.media.loop = loop;
  }

  getStatsFields(): StatsField[] {
    return this.statsFieldsInternal;
  }

  setStatsFields(fields: StatsField[]): void {
    this.statsFieldsInternal = fields.length > 0 ? fields : this.statsFieldsInternal;
    this.ui?.setStatsFields(this.statsFieldsInternal);
  }

  get quality(): QualityState {
    return this.getQuality();
  }

  get bandwidthEstimate(): number {
    return this.playback.current?.getBandwidthEstimate?.() ?? 0;
  }

  get bufferHealth(): number {
    return this.buffer.health;
  }

  get isLive(): boolean {
    return this.live.enabled;
  }

  get liveLatency(): number | null {
    return this.live.latency;
  }

  on<K extends keyof KyrspectEventMap>(
    event: K,
    handler: KyrspectEventMap[K] extends undefined ? () => void : (payload: KyrspectEventMap[K]) => void,
  ): () => void {
    return this.events.on(event, handler);
  }

  once<K extends keyof KyrspectEventMap>(
    event: K,
    handler: KyrspectEventMap[K] extends undefined ? () => void : (payload: KyrspectEventMap[K]) => void,
  ): () => void {
    return this.events.once(event, handler);
  }

  off<K extends keyof KyrspectEventMap>(
    event: K,
    handler?: KyrspectEventMap[K] extends undefined ? () => void : (payload: KyrspectEventMap[K]) => void,
  ): void {
    this.events.off(event, handler);
  }

  async play(): Promise<void> {
    if (this.destroyed) return;
    try {
      await this.media.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        this.events.emit("autoplayblocked");
        this.logger.info("", "Autoplay blocked");
        return;
      }
      this.fail(error);
    }
  }

  pause(): void {
    if (this.destroyed) return;
    this.media.pause();
  }

  stop(): void {
    if (this.destroyed) return;
    this.media.pause();
    if (!this.isLive) this.seek(0);
  }

  seek(seconds: number): void {
    if (this.destroyed) return;
    if (!Number.isFinite(seconds)) return;
    const duration = this.media.duration;
    const max = Number.isFinite(duration) ? duration : seconds;
    this.media.currentTime = clamp(seconds, 0, Math.max(0, max));
  }

  async load(source: SourceInput): Promise<void> {
    if (this.destroyed) return;
    this.lastSource = source;
    this.applyStatsConfig(source);
    this.readyEmitted = false;
    this.ui?.setError(null);
    this.state.patch({ status: "loading", error: null });
    this.buffer.begin("manifest");
    this.events.emit("loadstart");
    this.logger.info("", "Source loaded");
    this.ignoringMediaErrors = true;

    try {
      const resolved = resolveSourceSync(source, this.media);
      const context = this.createAdapterContext(source);
      await this.playback.load(this.media, resolved, context);
      if (this.destroyed) return;
      this.subtitles.applyConfigTracks(this.optionsInternal.tracks);

      this.state.patch({
        status: this.media.paused ? "ready" : "playing",
        duration: this.media.duration,
        live: this.live.enabled,
      });
      this.buffer.end();
      this.ui?.setError(null);
      this.emitReady();

      if (this.optionsInternal.autoplay) {
        await this.play();
      }
    } catch (error) {
      this.fail(error);
    } finally {
      window.setTimeout(() => {
        this.ignoringMediaErrors = false;
      }, 0);
    }
  }

  async unload(): Promise<void> {
    if (this.destroyed) return;
    this.media.pause();
    await this.playback.unload();
    this.state.patch({ status: "idle", currentTime: 0 });
  }

  async reload(): Promise<void> {
    if (this.lastSource) await this.load(this.lastSource);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.events.emit("destroy");
    this.ui?.destroy();
    this.ui = null;
    this.keyboard?.destroy();
    this.buffer.destroy();
    this.fullscreen.destroy();
    this.pip.destroy();
    this.subtitles.destroy();
    this.plugins.destroy();
    this.videoUnbind();
    this.playback.destroy();
    this.drm?.destroy();
    this.events.destroy();
    this.bound.cleanupDom();
  }

  mute(): void {
    this.media.muted = true;
    this.storage.write({ muted: true });
  }

  unmute(): void {
    this.media.muted = false;
    this.storage.write({ muted: false });
  }

  setVolume(value: number): void {
    this.media.volume = clamp(value, 0, 1);
    if (this.media.volume === 0) this.media.muted = true;
    this.storage.write({ volume: this.media.volume, muted: this.media.muted });
  }

  getVolume(): number {
    return this.media.volume;
  }

  setPlaybackRate(rate: number): void {
    this.media.playbackRate = clamp(rate, 0.25, 4);
    this.storage.write({ playbackRate: this.media.playbackRate });
  }

  getPlaybackRate(): number {
    return this.media.playbackRate;
  }

  setQuality(level: number | "auto"): void {
    this.playback.current?.setQuality?.(level);
  }

  getQuality(): QualityState {
    const adapter = this.playback.current;
    const qualities = adapter?.getQualities?.() ?? [];
    const mode = adapter?.getQualityMode?.() ?? "auto";
    const current =
      qualities.find((item) => item.height === this.media.videoHeight) ??
      qualities[qualities.length - 1];
    return {
      mode,
      level: current?.height ?? null,
      bitrate: current?.bitrate ?? null,
      width: this.media.videoWidth || current?.width || 0,
      height: this.media.videoHeight || current?.height || 0,
    };
  }

  getQualities(): KyrspectQuality[] {
    return this.playback.current?.getQualities?.() ?? [];
  }

  enableAutoQuality(): void {
    this.setQuality("auto");
  }

  disableAutoQuality(): void {
    const current = this.getQuality();
    if (current.height) this.setQuality(current.height);
  }

  setSubtitle(track: string): void {
    this.setSubtitleTrack(track);
  }

  getSubtitleTracks() {
    return this.subtitles.list();
  }

  setSubtitleTrack(id: string): void {
    this.subtitles.set(id);
    const track = this.subtitles.list().find((item) => item.id === id);
    if (track?.language) this.storage.write({ subtitleLanguage: track.language });
  }

  disableSubtitles(): void {
    this.subtitles.disable();
  }

  getAudioTracks() {
    return this.audio.list();
  }

  setAudioTrack(id: string): void {
    this.audio.set(id);
  }

  enterFullscreen(): Promise<void> {
    return this.fullscreen.enter();
  }

  exitFullscreen(): Promise<void> {
    return this.fullscreen.exit();
  }

  toggleFullscreen(): Promise<void> {
    return this.fullscreen.toggle();
  }

  isFullscreen(): boolean {
    return this.fullscreen.active;
  }

  isFullscreenAvailable(): boolean {
    return this.fullscreen.available;
  }

  enterPictureInPicture(): Promise<void> {
    return this.pip.enter();
  }

  exitPictureInPicture(): Promise<void> {
    return this.pip.exit();
  }

  isPictureInPicture(): boolean {
    return this.pip.active;
  }

  isPipAvailable(): boolean {
    return this.pip.available;
  }

  seekToLiveEdge(): void {
    this.live.seekToLiveEdge();
    this.events.emit("liveedge", { atLiveEdge: true });
  }

  atLiveEdge(): boolean {
    return this.live.atLiveEdge();
  }

  use(plugin: KyrspectPlugin<Kyrspect>): this {
    this.plugins.use(plugin);
    return this;
  }

  getState() {
    return this.state.get();
  }

  getStats(): PlayerStats {
    const frames = getFrameStats(this.media);
    const quality = this.getQuality();
    const qualities = this.getQualities();
    const current =
      qualities.find((item) => item.height === quality.height) ?? qualities[qualities.length - 1];
    const optimal = [...qualities].sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)[0];
    const rect = this.el.getBoundingClientRect();
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.lastStatsAt && !this.media.paused) {
      const dt = Math.max(0, (now - this.lastStatsAt) / 1000);
      const bitrate = quality.bitrate || this.bandwidthEstimate;
      this.activityBytes = bitrate > 0 ? (bitrate * dt) / 8 : 0;
    } else {
      this.activityBytes = 0;
    }
    this.lastStatsAt = now;

    let bufferStart = 0;
    let bufferEnd = 0;
    const { buffered, currentTime } = this.media;
    for (let i = 0; i < buffered.length; i += 1) {
      if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
        bufferStart = buffered.start(i);
        bufferEnd = buffered.end(i);
        break;
      }
    }

    const adapterName = this.playback.current?.name;
    const engine = adapterName === "dash" ? "DASH" : adapterName === "hls" ? "HLS" : "Native";
    const flags = [
      engine,
      quality.mode,
      this.isLive ? "LIVE" : "",
      `s:${Math.round(rect.width / 80)}`,
      `t:${Number.isFinite(this.currentTime) ? this.currentTime.toFixed(2) : "0.00"}`,
      `b:${bufferStart.toFixed(3)}-${bufferEnd.toFixed(3)}`,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      id: sourceIdentity(this.lastSource),
      currentTime: this.currentTime,
      duration: this.duration,
      viewport: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      resolution: {
        width: this.media.videoWidth || quality.width,
        height: this.media.videoHeight || quality.height,
        frameRate: current?.frameRate || 0,
      },
      optimal: {
        width: optimal?.width || this.media.videoWidth || quality.width,
        height: optimal?.height || this.media.videoHeight || quality.height,
        frameRate: optimal?.frameRate || current?.frameRate || 0,
      },
      volume: {
        level: this.media.muted ? 0 : this.volume,
        muted: this.media.muted,
      },
      codecs: current?.codecs || "",
      color: this.statsColorInternal,
      quality: {
        mode: quality.mode,
        level: quality.level,
        bitrate: quality.bitrate,
      },
      network: {
        bandwidthEstimate: this.bandwidthEstimate,
        activityBytes: this.activityBytes,
      },
      buffer: {
        ahead: this.bufferHealth,
        start: bufferStart,
        end: bufferEnd,
      },
      frames,
      live: {
        enabled: this.isLive,
        latency: this.liveLatency,
      },
      flags,
      timestamp: Date.now(),
    };
  }

  private applyStatsConfig(source: SourceInput | null): void {
    this.statsFieldsInternal = resolveStatsFields(source, this.optionsInternal.stats);
    this.statsColorInternal = resolveStatsColor(source, this.optionsInternal.stats);
    this.ui?.setStatsFields(this.statsFieldsInternal);
  }

  private applyMediaAttributes(): void {
    const video = this.media;
    const options = this.optionsInternal;
    video.controls = false;
    video.preload = options.preload ?? "metadata";
    video.loop = Boolean(options.loop);
    video.playsInline = options.playsInline !== false;
    video.muted = Boolean(options.muted);
    video.volume = clamp(options.volume ?? 1, 0, 1);
    video.playbackRate = options.playbackRate ?? 1;
    if (options.poster) video.poster = options.poster;
    if (options.crossOrigin) video.crossOrigin = options.crossOrigin;
    video.setAttribute("playsinline", "");
  }

  private restorePreferences(): void {
    const prefs = this.storage.read();
    if (typeof prefs.volume === "number") this.media.volume = clamp(prefs.volume, 0, 1);
    if (typeof prefs.muted === "boolean") this.media.muted = prefs.muted;
    if (typeof prefs.playbackRate === "number") this.media.playbackRate = prefs.playbackRate;
  }

  private ensureDrm(source?: SourceInput): DrmManager | null {
    if (!needsDrmManager(source, this.optionsInternal)) return this.drm;
    this.drm ??= new DrmManager();
    return this.drm;
  }

  private createAdapterContext(source?: SourceInput): AdapterContext {
    return {
      options: this.optionsInternal,
      events: this.events,
      debug: (namespace, ...args) => this.logger.info(namespace, ...args),
      getHeaders: () => ({ ...this.optionsInternal.network?.headers }),
      beforeRequest: this.optionsInternal.network?.beforeRequest,
      drm: this.ensureDrm(source),
    };
  }

  private emitReady(): void {
    if (this.readyEmitted) return;
    this.readyEmitted = true;
    this.events.emit("ready");
  }

  private uiLabels() {
    return resolveLabels(
      this.optionsInternal.language ?? this.optionsInternal.ui?.language,
      this.optionsInternal.ui?.labels,
    );
  }

  private fail(error: unknown): void {
    const normalized = normalizeError(error, { category: "PLAYBACK_ERROR" });
    if (!normalized.fatal) {
      this.logger.info("", normalized.message);
      return;
    }
    this.logger.error("", normalized.message, normalized);
    this.state.patch({ status: "error", error: normalized.message });
    this.ui?.setError(userFacingErrorMessage(normalized, this.uiLabels()));
    this.ui?.setLoading(false);
    this.events.emit("error", normalized);
  }

  private bindVideoEvents(): () => void {
    const video = this.media;
    const handlers: Array<[string, EventListener]> = [
      ["loadstart", () => this.events.emit("loadstart")],
      [
        "loadedmetadata",
        () => {
          this.events.emit("loadedmetadata");
          this.events.emit("durationchange", { duration: video.duration });
          this.state.patch({ duration: video.duration, live: this.live.enabled });
        },
      ],
      ["loadeddata", () => this.events.emit("loadeddata")],
      [
        "play",
        () => {
          this.events.emit("play");
          this.state.patch({ status: "playing" });
        },
      ],
      [
        "playing",
        () => {
          this.events.emit("playing");
          this.buffer.end();
          this.ui?.setError(null);
          this.state.patch({ status: "playing", buffering: false });
        },
      ],
      [
        "pause",
        () => {
          this.events.emit("pause");
          this.state.patch({ status: video.ended ? "ended" : "paused" });
        },
      ],
      [
        "ended",
        () => {
          this.events.emit("ended");
          this.state.patch({ status: "ended" });
        },
      ],
      [
        "seeking",
        () => {
          this.events.emit("seeking");
          this.buffer.begin("seeking");
        },
      ],
      [
        "seeked",
        () => {
          this.events.emit("seeked");
          this.buffer.end();
          this.emitLiveEdge();
        },
      ],
      [
        "timeupdate",
        () => {
          this.events.emit("timeupdate", { currentTime: video.currentTime });
          this.state.patch({ currentTime: video.currentTime });
          this.emitLiveEdge();
        },
      ],
      [
        "durationchange",
        () => this.events.emit("durationchange", { duration: video.duration }),
      ],
      [
        "volumechange",
        () => {
          this.events.emit("volumechange", { volume: video.volume, muted: video.muted });
          this.state.patch({ volume: video.volume, muted: video.muted });
          this.storage.write({ volume: video.volume, muted: video.muted });
        },
      ],
      [
        "ratechange",
        () => {
          this.events.emit("ratechange", { playbackRate: video.playbackRate });
          this.state.patch({ playbackRate: video.playbackRate });
        },
      ],
      [
        "error",
        () => {
          if (this.shouldIgnoreMediaError()) return;
          if (video.error) this.fail(video.error);
        },
      ],
    ];

    for (const [name, handler] of handlers) video.addEventListener(name, handler);
    return () => {
      for (const [name, handler] of handlers) video.removeEventListener(name, handler);
    };
  }

  private shouldIgnoreMediaError(): boolean {
    if (this.destroyed || this.ignoringMediaErrors) return true;
    if (isSpuriousMediaError(this.media)) return true;
    if (this.playback.current?.ownsMediaElementErrors?.()) return true;
    return false;
  }

  private emitLiveEdge(): void {
    if (!this.live.enabled) return;
    const atEdge = this.live.atLiveEdge();
    if (atEdge !== this.lastAtLiveEdge) {
      this.lastAtLiveEdge = atEdge;
      this.events.emit("liveedge", { atLiveEdge: atEdge });
    }
    const latency = this.live.latency;
    if (latency != null) this.events.emit("latencychange", { liveLatency: latency });
  }
}

type BoundTargetCleanup = ReturnType<typeof bindTarget>;

export type { KyrspectCapabilitySnapshot };
