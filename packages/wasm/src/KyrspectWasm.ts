import {
  attachDefaultUI,
  applyTheme,
  resolveLabels,
  resolveLocale,
  type PlayerLike,
  type PlayerUIHandle,
  type UIAspectRatio,
  type UILayout,
  type UITheme,
  type StatsField,
} from "@kyrspect/ui";

import type {
  UIQuality,
  UISubtitleTrack,
  UIAudioTrack,
  QualityState,
  KyrspectWasmOptions,
  KyrspectWasmEventMap,
  WasmTextTrackInput,
} from "./types";

import { WasmBridge, type WasmQualityProfile } from "./wasm/WasmBridge";
import { EventEmitter } from "./events/EventEmitter";
import { NativePlaybackAdapter } from "./adapters/NativePlaybackAdapter";
import { HlsPlaybackAdapter } from "./adapters/HlsPlaybackAdapter";
import { DashPlaybackAdapter } from "./adapters/DashPlaybackAdapter";
import { mergeDrm, type DrmOptions } from "./drm";
import { detectMediaKind, needsWasmSourceHint } from "./source";

export class KyrspectWasm implements PlayerLike {
  static readonly version = "0.1.0-wasm";

  readonly media: HTMLVideoElement;
  readonly el: HTMLElement;
  readonly options: { debug?: boolean; keyboard?: boolean | Record<string, string> };

  private wasmBridge: WasmBridge | null = null;
  private wasmReady: Promise<WasmBridge> | null = null;
  private readonly events = new EventEmitter<KyrspectWasmEventMap>();
  private uiHandle: PlayerUIHandle | null = null;
  private nativeAdapter: NativePlaybackAdapter;
  private hlsAdapter: HlsPlaybackAdapter | null = null;
  private dashAdapter: DashPlaybackAdapter | null = null;
  private activeAdaptive: "hls" | "dash" | "native" = "native";
  private pendingWasmQualities: WasmQualityProfile[] | null = null;

  private availableQualities: UIQuality[] = [];
  private currentQualityState: QualityState = {
    mode: "auto",
    level: null,
    bitrate: null,
    width: 0,
    height: 0,
  };

  private subtitleTracks: UISubtitleTrack[] = [];
  private activeSubtitleId: string | null = null;
  private audioTracks: UIAudioTrack[] = [];
  private activeAudioId: string | null = null;

  private statsFieldsList: StatsField[] = [
    "videoId",
    "viewport",
    "resolution",
    "volume",
    "codecs",
    "connection",
    "buffer",
    "live",
  ];

  private isLiveStream = false;
  private liveLatencySec: number | null = null;
  private loopPlayback = false;
  private destroyed = false;
  private statsInterval: any = null;
  private liveInterval: any = null;
  private abrInterval: any = null;
  private subtitleInterval: any = null;

  private currentSrc = "";
  private rawOptions: KyrspectWasmOptions;

  constructor(target: string | HTMLElement, options: KyrspectWasmOptions = {}) {
    this.rawOptions = options;
    this.options = {
      debug: Boolean(options.debug),
      keyboard: options.keyboard !== false,
    };

    const container = typeof target === "string" ? document.querySelector(target) as HTMLElement : target;
    if (!container) {
      throw new Error(`[KyrspectWasm] Target element "${target}" not found.`);
    }

    if (container instanceof HTMLVideoElement) {
      this.media = container;
      const parent = container.parentElement || document.body;
      const wrapper = document.createElement("div");
      wrapper.className = "kyrspect-wasm-root";
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.style.width = "100%";
      wrapper.style.height = "100%";
      parent.insertBefore(wrapper, container);
      wrapper.appendChild(container);
      this.el = wrapper;
    } else {
      this.el = container;
      this.el.classList.add("kyrspect-wasm-root");
      let video = this.el.querySelector("video");
      if (!video) {
        video = document.createElement("video");
        video.playsInline = true;
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.display = "block";
        this.el.appendChild(video);
      }
      this.media = video;
    }

    this.loopPlayback = Boolean(options.loop);
    this.media.loop = this.loopPlayback;
    if (options.muted) this.media.muted = true;
    if (typeof options.volume === "number") this.media.volume = options.volume;
    if (options.autoplay) this.media.autoplay = true;
    if (options.preload) this.media.preload = options.preload;

    this.nativeAdapter = new NativePlaybackAdapter(this.media);
    this.setupMediaListeners();
    this.initUiAndSource(options);
  }

  private adaptiveCallbacks() {
    return {
      onQualitiesLoaded: (qualities: UIQuality[], wasmProfiles: WasmQualityProfile[]) => {
        this.availableQualities = qualities;
        if (this.wasmBridge) this.wasmBridge.setQualities(wasmProfiles);
        else this.pendingWasmQualities = wasmProfiles;
        this.events.emit("qualitieschange", { qualities });
      },
      onBandwidthSample: (bytes: number, durationSec: number) => {
        this.wasmBridge?.recordBandwidthSample(bytes, durationSec);
      },
      onError: (err: Error) => {
        this.events.emit("error", { message: err.message, fatal: true });
      },
    };
  }

  private getHlsAdapter(): HlsPlaybackAdapter {
    this.hlsAdapter ??= new HlsPlaybackAdapter(this.media, this.adaptiveCallbacks());
    return this.hlsAdapter;
  }

  private getDashAdapter(): DashPlaybackAdapter {
    this.dashAdapter ??= new DashPlaybackAdapter(this.media, this.adaptiveCallbacks());
    return this.dashAdapter;
  }

  private ensureWasm(): Promise<WasmBridge> {
    this.wasmReady ??= WasmBridge.create().then((bridge) => {
      if (this.destroyed) {
        bridge.destroy();
        throw new Error("KyrspectWasm destroyed");
      }
      this.wasmBridge = bridge;
      if (this.pendingWasmQualities) {
        bridge.setQualities(this.pendingWasmQualities);
        this.pendingWasmQualities = null;
      }
      this.setupIntervals();
      return bridge;
    });
    return this.wasmReady;
  }

  private async initUiAndSource(options: KyrspectWasmOptions) {
    try {
      if (options.controls !== false && options.ui?.controls !== false) {
        const uiOpts = options.ui || {};
        this.uiHandle = attachDefaultUI(this, {
          controls: options.controls ?? uiOpts.controls ?? true,
          hideDelay: uiOpts.hideDelay,
          showOnPause: uiOpts.showOnPause,
          language: uiOpts.language,
          labels: uiOpts.labels,
          theme: uiOpts.theme,
          statsFields: uiOpts.statsFields || this.statsFieldsList,
          layout: uiOpts.layout,
          aspectRatio: uiOpts.aspectRatio,
          fit: uiOpts.fit,
          fill: uiOpts.fill,
        });
      }

      if (options.tracks) {
        for (const trk of options.tracks) {
          void this.loadTextTrack(trk);
        }
      }

      void this.ensureWasm().catch((err) => {
        console.error("[KyrspectWasm] WASM init error:", err);
      });

      if (options.src) {
        await this.load(options.src);
      }

      if (!this.destroyed) this.events.emit("ready");
    } catch (err) {
      console.error("[KyrspectWasm] Initialization error:", err);
      this.events.emit("error", { message: (err as Error).message, fatal: true });
    }
  }

  private resolveDrm(source?: string | { drm?: DrmOptions }): DrmOptions | null {
    const sourceDrm = typeof source === "object" ? source.drm : undefined;
    return mergeDrm(this.rawOptions.drm, sourceDrm);
  }

  private setupMediaListeners() {
    const video = this.media;

    video.addEventListener("play", () => {
      this.wasmBridge?.setStatus("playing");
      this.events.emit("play");
    });

    video.addEventListener("playing", () => {
      this.wasmBridge?.setStatus("playing");
      this.events.emit("playing");
    });

    video.addEventListener("pause", () => {
      this.wasmBridge?.setStatus("paused");
      this.events.emit("pause");
    });

    video.addEventListener("waiting", () => {
      this.wasmBridge?.setStatus("buffering");
      this.events.emit("waiting");
    });

    video.addEventListener("seeking", () => {
      this.wasmBridge?.setStatus("seeking");
      this.events.emit("seeking");
    });

    video.addEventListener("seeked", () => {
      this.wasmBridge?.setStatus(video.paused ? "paused" : "playing");
      this.events.emit("seeked");
    });

    video.addEventListener("ended", () => {
      this.wasmBridge?.setStatus("ended");
      this.events.emit("ended");
    });

    video.addEventListener("timeupdate", () => {
      const bufferedEnd = video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0;
      this.wasmBridge?.updatePlayback(video.currentTime, video.duration || 0, bufferedEnd);
      this.events.emit("timeupdate", { currentTime: video.currentTime, duration: video.duration || 0 });
    });

    video.addEventListener("durationchange", () => {
      this.events.emit("durationchange", { duration: video.duration || 0 });
    });

    video.addEventListener("volumechange", () => {
      this.wasmBridge?.setVolume(video.volume, video.muted);
      this.events.emit("volumechange", { volume: video.volume, muted: video.muted });
    });

    video.addEventListener("ratechange", () => {
      this.wasmBridge?.setPlaybackRate(video.playbackRate);
      this.events.emit("ratechange", { playbackRate: video.playbackRate });
    });

    video.addEventListener("error", () => {
      const msg = video.error ? video.error.message || `MediaError Code ${video.error.code}` : "Video error";
      this.wasmBridge?.setStatus("error");
      this.events.emit("error", { message: msg, fatal: true });
    });
  }

  private setupIntervals() {
    if (this.statsInterval || this.destroyed) return;
    this.statsInterval = setInterval(() => {
      if (this.destroyed || !this.wasmBridge) return;
      const stats = this.getStats();
      this.events.emit("statsupdate", stats);

      if (this.currentQualityState.mode === "auto" && this.availableQualities.length > 0) {
        const bufferSec = this.bufferAhead;
        const rect = this.el.getBoundingClientRect();
        const abrResult = this.wasmBridge.evaluateAbr(
          this.currentQualityState.level ?? -1,
          bufferSec,
          Math.round(rect.width),
          Math.round(rect.height),
          false
        );

        if (abrResult.selected_index >= 0 && abrResult.selected_index !== this.currentQualityState.level) {
          const selectedProfile = this.availableQualities[abrResult.selected_index];
          if (selectedProfile) {
            this.applyQualityLevel(abrResult.selected_index);
            this.currentQualityState = {
              mode: "auto",
              level: abrResult.selected_index,
              bitrate: selectedProfile.bitrate,
              width: selectedProfile.width,
              height: selectedProfile.height,
            };
            this.events.emit("qualitychange", { quality: this.currentQualityState, reason: abrResult.reason });
          }
        }
      }
    }, 1000);

    this.subtitleInterval = setInterval(() => {
      if (this.destroyed || !this.wasmBridge) return;
      if (this.activeSubtitleId) {
        const activeCues = this.wasmBridge.getActiveCues(this.media.currentTime);
        this.events.emit("cuechange", { activeCues });
      }
    }, 250);
  }

  async load(source: string | { src: string; type?: string; isLive?: boolean; drm?: DrmOptions }): Promise<void> {
    const srcStr = typeof source === "string" ? source : source.src;
    const isLive = typeof source === "object" ? Boolean(source.isLive) : false;
    this.currentSrc = srcStr;
    this.isLiveStream = isLive;

    this.wasmBridge?.setStatus("loading");
    void this.ensureWasm();

    const mimeHint = typeof source === "object" ? source.type : undefined;
    let kind = detectMediaKind(srcStr, mimeHint);
    if (kind === "native" && needsWasmSourceHint(srcStr, mimeHint)) {
      const analysis = await WasmBridge.analyzeSource(srcStr, mimeHint);
      if (analysis.media_type === "dash" || analysis.is_dash) kind = "dash";
      else if (analysis.is_hls || analysis.media_type === "hls") kind = "hls";
    }

    this.hlsAdapter?.destroy();
    this.dashAdapter?.destroy();
    const drm = this.resolveDrm(source);

    if (kind === "dash") {
      this.activeAdaptive = "dash";
      await this.getDashAdapter().load(srcStr, drm);
    } else if (kind === "hls") {
      this.activeAdaptive = "hls";
      await this.getHlsAdapter().load(srcStr, drm);
    } else {
      this.activeAdaptive = "native";
      this.nativeAdapter.load(srcStr);
    }
  }

  parseVtt(vttContent: string, label = "English", srclang = "en", isDefault = true): void {
    const id = `track-${this.subtitleTracks.length + 1}`;
    const uiTrack: UISubtitleTrack = {
      id,
      label,
      language: srclang,
    };
    this.subtitleTracks.push(uiTrack);
    this.wasmBridge?.parseVtt(vttContent);
    if (isDefault) {
      this.setSubtitleTrack(id);
    }
  }

  async loadTextTrack(track: WasmTextTrackInput): Promise<void> {
    if (track.src.trim().startsWith("WEBVTT")) {
      this.parseVtt(track.src, track.label || track.srclang, track.srclang, Boolean(track.default));
      return;
    }

    const id = `track-${this.subtitleTracks.length + 1}`;
    const uiTrack: UISubtitleTrack = {
      id,
      label: track.label || track.srclang,
      language: track.srclang,
    };
    this.subtitleTracks.push(uiTrack);

    try {
      const res = await fetch(track.src);
      if (res.ok) {
        const vttText = await res.text();
        this.wasmBridge?.parseVtt(vttText);
        if (track.default) {
          this.setSubtitleTrack(id);
        }
      }
    } catch (err) {
      console.warn(`[KyrspectWasm] Failed to fetch subtitles from ${track.src}:`, err);
    }
  }

  get paused(): boolean {
    return this.media.paused;
  }

  get ended(): boolean {
    return this.media.ended;
  }

  get muted(): boolean {
    return this.media.muted;
  }

  get volume(): number {
    return this.media.volume;
  }

  get playbackRate(): number {
    return this.media.playbackRate;
  }

  get currentTime(): number {
    return this.media.currentTime;
  }

  get duration(): number {
    return this.media.duration || 0;
  }

  get buffered(): TimeRanges {
    return this.media.buffered;
  }

  get isLive(): boolean {
    return this.isLiveStream;
  }

  get liveLatency(): number | null {
    return this.liveLatencySec;
  }

  get bufferAhead(): number {
    const video = this.media;
    const cur = video.currentTime;
    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= cur && cur <= video.buffered.end(i)) {
        return video.buffered.end(i) - cur;
      }
    }
    return 0;
  }

  get bufferHealth(): number {
    const ahead = this.bufferAhead;
    return Math.min(100, Math.round((ahead / 15) * 100));
  }

  get quality(): QualityState {
    return this.currentQualityState;
  }

  get loop(): boolean {
    return this.loopPlayback;
  }

  async play(): Promise<void> {
    return this.media.play();
  }

  pause(): void {
    this.media.pause();
  }

  seek(seconds: number): void {
    const target = Math.max(0, Math.min(seconds, this.duration || Infinity));
    this.media.currentTime = target;
  }

  seekToLiveEdge(): void {
    if (this.isLiveStream && this.media.seekable.length > 0) {
      const edge = this.media.seekable.end(this.media.seekable.length - 1);
      this.media.currentTime = Math.max(0, edge - 0.5);
    }
  }

  mute(): void {
    this.media.muted = true;
    this.wasmBridge?.setVolume(this.media.volume, true);
  }

  unmute(): void {
    this.media.muted = false;
    this.wasmBridge?.setVolume(this.media.volume, false);
  }

  setVolume(value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    this.media.volume = clamped;
    if (clamped > 0 && this.media.muted) {
      this.media.muted = false;
    }
    this.wasmBridge?.setVolume(clamped, this.media.muted);
  }

  setPlaybackRate(rate: number): void {
    if (rate > 0 && rate <= 16) {
      this.media.playbackRate = rate;
      this.wasmBridge?.setPlaybackRate(rate);
    }
  }

  getQualities(): UIQuality[] {
    return this.availableQualities;
  }

  getQuality(): QualityState {
    return this.currentQualityState;
  }

  private applyQualityLevel(level: number): void {
    if (this.activeAdaptive === "dash") this.dashAdapter?.setQualityLevel(level);
    else this.hlsAdapter?.setQualityLevel(level);
  }

  setQuality(level: number | "auto"): void {
    if (level === "auto") {
      this.enableAutoQuality();
      return;
    }

    const q = this.availableQualities[level];
    if (q) {
      this.applyQualityLevel(level);
      this.currentQualityState = {
        mode: "manual",
        level,
        bitrate: q.bitrate,
        width: q.width,
        height: q.height,
      };
      this.events.emit("qualitychange", { quality: this.currentQualityState, reason: "manual" });
    }
  }

  enableAutoQuality(): void {
    this.applyQualityLevel(-1);
    this.currentQualityState = {
      ...this.currentQualityState,
      mode: "auto",
    };
    this.events.emit("qualitychange", { quality: this.currentQualityState, reason: "auto" });
  }

  getSubtitleTracks(): UISubtitleTrack[] {
    return this.subtitleTracks;
  }

  setSubtitleTrack(id: string): void {
    this.activeSubtitleId = id;
    const track = this.subtitleTracks.find((t) => t.id === id) || null;
    this.events.emit("subtitlechange", { track });
  }

  disableSubtitles(): void {
    this.activeSubtitleId = null;
    this.events.emit("subtitlechange", { track: null });
  }

  getAudioTracks(): UIAudioTrack[] {
    return this.audioTracks;
  }

  setAudioTrack(id: string): void {
    this.activeAudioId = id;
    const track = this.audioTracks.find((t) => t.id === id) || null;
    this.events.emit("audiochange", { track });
  }

  async enterFullscreen(): Promise<void> {
    if (this.el.requestFullscreen) {
      return this.el.requestFullscreen();
    }
  }

  async exitFullscreen(): Promise<void> {
    if (document.exitFullscreen && document.fullscreenElement) {
      return document.exitFullscreen();
    }
  }

  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  async enterPictureInPicture(): Promise<void> {
    if (document.pictureInPictureEnabled && this.media.requestPictureInPicture) {
      await this.media.requestPictureInPicture();
    }
  }

  async exitPictureInPicture(): Promise<void> {
    if (document.pictureInPictureElement && document.exitPictureInPicture) {
      await document.exitPictureInPicture();
    }
  }

  async reload(): Promise<void> {
    if (this.currentSrc) {
      await this.load(this.currentSrc);
    }
  }

  setLoop(loop: boolean): void {
    this.loopPlayback = loop;
    this.media.loop = loop;
  }

  getStatsFields(): StatsField[] {
    return this.statsFieldsList;
  }

  setStatsFields(fields: StatsField[]): void {
    this.statsFieldsList = fields;
    this.uiHandle?.setStatsFields(fields);
  }

  setTheme(theme: UITheme | null): void {
    if (theme) {
      applyTheme(this.el, theme);
    }
    this.uiHandle?.setTheme(theme);
  }

  setLanguage(language: string, labels?: Partial<any>): void {
    this.uiHandle?.setLanguage(language, labels);
  }

  getStats() {
    const video = this.media;
    const rect = this.el.getBoundingClientRect();
    const vQuality = (video as any).getVideoPlaybackQuality?.();
    const totalFrames = vQuality?.totalVideoFrames ?? 0;
    const droppedFrames = vQuality?.droppedVideoFrames ?? 0;

    const wasmStats = this.wasmBridge?.computeStats(
      totalFrames,
      droppedFrames,
      performance.now(),
      this.bufferAhead,
      this.currentQualityState.bitrate ?? 0,
      this.liveLatencySec ?? 0
    );

    return {
      id: this.currentSrc || "wasm-player",
      currentTime: video.currentTime,
      duration: video.duration || 0,
      viewport: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      resolution: {
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
        frameRate: wasmStats?.fps || 0,
      },
      optimal: {
        width: this.currentQualityState.width || video.videoWidth || 0,
        height: this.currentQualityState.height || video.videoHeight || 0,
        frameRate: wasmStats?.fps || 0,
      },
      volume: {
        level: video.volume,
        muted: video.muted,
      },
      codecs: "avc1.640028, mp4a.40.2",
      color: "bt709",
      quality: {
        mode: this.currentQualityState.mode,
        level: this.currentQualityState.level,
        bitrate: this.currentQualityState.bitrate,
      },
      network: {
        bandwidthEstimate: wasmStats?.bandwidth_bps || 0,
        activityBytes: 0,
      },
      buffer: {
        ahead: this.bufferAhead,
        start: video.buffered.length > 0 ? video.buffered.start(0) : 0,
        end: video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0,
      },
      frames: {
        decoded: totalFrames,
        dropped: droppedFrames,
      },
      live: {
        enabled: this.isLiveStream,
        latency: this.liveLatencySec,
      },
      flags: "WASM_CORE | ABR_EWMA | LIVE_DRIFT_SYNC",
      timestamp: Date.now(),
    };
  }

  isFullscreen(): boolean {
    return document.fullscreenElement === this.el;
  }

  isPictureInPicture(): boolean {
    return document.pictureInPictureElement === this.media;
  }

  isPipAvailable(): boolean {
    return Boolean(document.pictureInPictureEnabled);
  }

  isFullscreenAvailable(): boolean {
    return Boolean(document.fullscreenEnabled);
  }

  atLiveEdge(): boolean {
    if (!this.isLiveStream) return true;
    const distance = (this.liveLatencySec ?? 0);
    return distance <= 2.0;
  }

  on(event: string, handler: (...args: never[]) => void): () => void {
    return this.events.on(event as keyof KyrspectWasmEventMap, handler as any);
  }

  off(event: string, handler: (...args: never[]) => void): void {
    this.events.off(event as keyof KyrspectWasmEventMap, handler as any);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.statsInterval) clearInterval(this.statsInterval);
    if (this.liveInterval) clearInterval(this.liveInterval);
    if (this.abrInterval) clearInterval(this.abrInterval);
    if (this.subtitleInterval) clearInterval(this.subtitleInterval);

    this.uiHandle?.destroy();
    this.hlsAdapter?.destroy();
    this.dashAdapter?.destroy();
    this.nativeAdapter.destroy();
    this.wasmBridge?.destroy();
    this.events.emit("destroy");
    this.events.removeAllListeners();
  }
}
