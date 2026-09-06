import type { ErrorData, Level } from "hls.js";
import type { PlaybackAdapter, AdapterContext, NetworkRequest } from "../types/adapter";
import type { ResolvedSource, KyrspectSource } from "../types/source";
import type { KyrspectQuality } from "../types/quality";
import type { KyrspectAudioTrack, KyrspectSubtitleTrack } from "../types/tracks";
import { KyrspectError } from "../errors/KyrspectError";
import { nativeHlsSupport } from "../utils/source";
import { getHlsConstructor, isHlsJsSupported } from "../utils/hls";
import { resetMediaElement } from "../utils/media";
import { findQuality, inferQualityReason, qualityLabel } from "../abr/quality";

const Hls = getHlsConstructor();

interface Engine {
  kind: "native" | "hls.js";
  hls: InstanceType<typeof Hls> | null;
}

export class HlsPlaybackAdapter implements PlaybackAdapter {
  readonly name = "hls";
  private video: HTMLVideoElement | null = null;
  private engine: Engine | null = null;
  private context: AdapterContext | null = null;
  private qualities: KyrspectQuality[] = [];
  private mode: "auto" | "manual" = "auto";
  private pendingReason: "manual" | "emergency" | "buffer-risk" | null = null;
  private lastQuality: KyrspectQuality | undefined;
  private lastBandwidth = 0;
  private retryCount = 0;
  private loadSettled = false;
  private unsubs: Array<() => void> = [];

  canHandle(source: ResolvedSource | KyrspectSource): boolean {
    return source.type === "hls";
  }

  ownsMediaElementErrors(): boolean {
    return this.engine?.kind === "hls.js";
  }

  async load(video: HTMLVideoElement, source: ResolvedSource, context: AdapterContext): Promise<void> {
    if (source.type !== "hls") return;
    await this.unload();
    this.video = video;
    this.context = context;
    this.retryCount = 0;
    this.loadSettled = false;
    this.mode = context.options.quality === "auto" || context.options.quality == null ? "auto" : "manual";

    const engine = this.chooseEngine(video, context);
    this.engine = engine;
    context.debug("HLS", `Using ${engine.kind} engine`);

    if (engine.kind === "native") {
      video.src = source.src;
      this.loadSettled = true;
      return;
    }

    if (!engine.hls) {
      throw new KyrspectError({
        code: "hls-unavailable",
        category: "UNSUPPORTED_FORMAT",
        message: "HLS playback is not supported in this browser.",
      });
    }

    await this.attachHls(engine.hls, video, source.src, context);
  }

  private chooseEngine(video: HTMLVideoElement, context: AdapterContext): Engine {
    const forced = context.options.hls?.forceEngine;
    const native = nativeHlsSupport(video);
    const nativeOk = native !== "none";
    const jsOk = isHlsJsSupported();
    const preferNative = context.options.hls?.preferNative === true;

    if (forced === "native" && nativeOk) return { kind: "native", hls: null };
    if (forced === "hls.js" && jsOk) return { kind: "hls.js", hls: this.createHls(context, video) };

    if (jsOk && !preferNative) return { kind: "hls.js", hls: this.createHls(context, video) };
    if (jsOk && native === "none") return { kind: "hls.js", hls: this.createHls(context, video) };
    if (nativeOk) return { kind: "native", hls: null };
    if (jsOk) return { kind: "hls.js", hls: this.createHls(context, video) };
    return { kind: "hls.js", hls: null };
  }

  private createHls(context: AdapterContext, video: HTMLVideoElement): InstanceType<typeof Hls> {
    const retry = context.options.retry;
    const live = context.options.live;
    const hlsOpts = context.options.hls;
    const headers = context.getHeaders();
    const hasHooks = Boolean(context.beforeRequest) || Object.keys(headers).length > 0;
    const playerSized = video.clientWidth > 0 && video.clientHeight > 0;

    return new Hls({
      enableWorker: true,
      lowLatencyMode: Boolean(live?.lowLatency || hlsOpts?.lowLatencyMode),
      liveSyncDurationCount: live?.targetLatency ? undefined : 3,
      liveSyncDuration: live?.targetLatency,
      capLevelToPlayerSize: (hlsOpts?.capLevelToPlayerSize ?? true) && playerSized,
      maxBufferLength: hlsOpts?.maxBufferLength ?? (live?.lowLatency ? 10 : 30),
      maxMaxBufferLength: hlsOpts?.maxMaxBufferLength ?? 60,
      backBufferLength: 90,
      startLevel: hlsOpts?.startLevel === "auto" || hlsOpts?.startLevel == null ? -1 : hlsOpts.startLevel,
      abrEwmaDefaultEstimate: 500_000,
      abrBandWidthFactor: 0.8,
      abrBandWidthUpFactor: 0.6,
      maxStarvationDelay: 4,
      maxLoadingDelay: 4,
      manifestLoadingMaxRetry: retry?.maxAttempts ?? 5,
      manifestLoadingRetryDelay: retry?.baseDelay ?? 500,
      manifestLoadingMaxRetryTimeout: retry?.maxDelay ?? 10_000,
      levelLoadingMaxRetry: retry?.maxAttempts ?? 5,
      levelLoadingRetryDelay: retry?.baseDelay ?? 500,
      fragLoadingMaxRetry: retry?.maxAttempts ?? 5,
      fragLoadingRetryDelay: retry?.baseDelay ?? 500,
      ...(hasHooks
        ? {
            xhrSetup: (xhr: XMLHttpRequest, url: string) => {
              const request: NetworkRequest = { url, headers: { ...headers } };
              void context.beforeRequest?.(request);
              for (const [key, value] of Object.entries(request.headers)) {
                xhr.setRequestHeader(key, value);
              }
            },
            fetchSetup: (ctx: { url: string }, init: RequestInit) => {
              const request: NetworkRequest = { url: ctx.url, headers: { ...headers } };
              void context.beforeRequest?.(request);
              const next = new Headers(init.headers);
              for (const [key, value] of Object.entries(request.headers)) next.set(key, value);
              return new Request(request.url, { ...init, headers: next });
            },
          }
        : {}),
    });
  }

  private attachHls(
    hls: InstanceType<typeof Hls>,
    video: HTMLVideoElement,
    src: string,
    context: AdapterContext,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const onParsed = () => {
        this.qualities = hls.levels.map((level, index) => mapLevel(level, index));
        context.debug("HLS", "Manifest loaded", `${this.qualities.length} levels`);
        context.events.emit("qualitylevelsloaded", { qualities: this.qualities });
        if (typeof context.options.quality === "number") {
          this.setQuality(context.options.quality);
        }
        this.loadSettled = true;
        resolve();
      };

      const onError = (_event: string, data: ErrorData) => {
        this.handleError(data, reject);
      };

      const onLevel = (_event: string, data: { level: number }) => {
        this.emitQualityChange(data.level);
      };

      const onFrag = () => {
        const estimate = hls.bandwidthEstimate || 0;
        if (estimate && Math.abs(estimate - this.lastBandwidth) / Math.max(estimate, 1) > 0.08) {
          this.lastBandwidth = estimate;
          context.events.emit("bandwidthchange", { bitrate: estimate });
        }
      };

      hls.on(Hls.Events.MANIFEST_PARSED, onParsed);
      hls.on(Hls.Events.ERROR, onError);
      hls.on(Hls.Events.LEVEL_SWITCHED, onLevel);
      hls.on(Hls.Events.FRAG_LOADED, onFrag);

      this.unsubs.push(() => {
        hls.off(Hls.Events.MANIFEST_PARSED, onParsed);
        hls.off(Hls.Events.ERROR, onError);
        hls.off(Hls.Events.LEVEL_SWITCHED, onLevel);
        hls.off(Hls.Events.FRAG_LOADED, onFrag);
      });

      hls.loadSource(src);
      hls.attachMedia(video);
    });
  }

  private handleError(data: ErrorData, reject: (error: unknown) => void): void {
    const context = this.context;
    const hls = this.engine?.hls;
    const error = mapHlsError(data);
    context?.debug("HLS", data.details, data.type);

    if (!data.fatal) {
      if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
        this.pendingReason = "buffer-risk";
      }
      return;
    }

    this.retryCount += 1;
    const max = this.context?.options.retry?.maxAttempts ?? 5;
    if (hls && this.retryCount <= max && error.recoverable) {
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        this.pendingReason = "emergency";
        hls.startLoad();
        return;
      }
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        this.pendingReason = "emergency";
        hls.recoverMediaError();
        return;
      }
    }

    if (!this.loadSettled) reject(error);
    else context?.events.emit("error", error);
  }

  private emitQualityChange(levelIndex: number): void {
    const next = this.qualities[levelIndex];
    const from = this.lastQuality;
    const reason = inferQualityReason(from, next, this.mode, this.pendingReason);
    this.pendingReason = null;
    this.lastQuality = next;
    this.context?.debug("ABR", `${from ? qualityLabel(from) : "—"} → ${next ? qualityLabel(next) : "—"}`);
    if (this.context?.options.debug && next) {
      this.context.debug(
        "ABR",
        `Estimated bandwidth: ${(this.getBandwidthEstimate() / 1_000_000).toFixed(1)} Mbps`,
      );
    }
    this.context?.events.emit("qualitychange", {
      from: from?.height ?? null,
      to: next?.height ?? null,
      mode: this.mode,
      reason,
      bandwidthEstimate: this.getBandwidthEstimate(),
    });
  }

  async unload(): Promise<void> {
    for (const off of this.unsubs) off();
    this.unsubs = [];
    if (this.engine?.hls) this.engine.hls.destroy();
    if (this.video) resetMediaElement(this.video);
    this.engine = null;
    this.video = null;
    this.qualities = [];
    this.lastQuality = undefined;
    this.loadSettled = false;
  }

  destroy(): void {
    void this.unload();
  }

  getQualities(): KyrspectQuality[] {
    return this.qualities;
  }

  setQuality(quality: number | "auto"): void {
    const hls = this.engine?.hls;
    if (!hls) return;
    if (quality === "auto") {
      this.mode = "auto";
      this.pendingReason = null;
      hls.currentLevel = -1;
      return;
    }
    const match = findQuality(this.qualities, quality);
    if (!match) return;
    this.mode = "manual";
    this.pendingReason = "manual";
    hls.currentLevel = match.id;
  }

  getQualityMode(): "auto" | "manual" {
    const hls = this.engine?.hls;
    if (!hls) return this.mode;
    return hls.autoLevelEnabled ? "auto" : "manual";
  }

  getBandwidthEstimate(): number {
    return this.engine?.hls?.bandwidthEstimate || this.lastBandwidth || 0;
  }

  getAudioTracks(): KyrspectAudioTrack[] {
    const tracks = this.engine?.hls?.audioTracks ?? [];
    return tracks.map((track, index) => ({
      id: String(index),
      label: track.name || track.lang || `Audio ${index + 1}`,
      language: track.lang || "",
      default: this.engine?.hls?.audioTrack === index,
    }));
  }

  setAudioTrack(id: string): void {
    const hls = this.engine?.hls;
    if (!hls) return;
    const index = Number(id);
    if (Number.isInteger(index)) hls.audioTrack = index;
  }

  getSubtitleTracks(): KyrspectSubtitleTrack[] {
    const tracks = this.engine?.hls?.subtitleTracks ?? [];
    return tracks.map((track, index) => ({
      id: String(index),
      kind: "subtitles",
      label: track.name || track.lang || `Subtitles ${index + 1}`,
      language: track.lang || "",
    }));
  }

  setSubtitleTrack(id: string | null): void {
    const hls = this.engine?.hls;
    if (!hls) return;
    hls.subtitleTrack = id == null ? -1 : Number(id);
  }

  isLive(): boolean {
    const hls = this.engine?.hls;
    if (hls) return Boolean(hls.levels[hls.currentLevel]?.details?.live ?? hls.latestLevelDetails?.live);
    const video = this.video;
    return Boolean(video && (!Number.isFinite(video.duration) || video.duration === Infinity));
  }

  getLiveLatency(): number | null {
    const hls = this.engine?.hls;
    if (hls && typeof hls.latency === "number" && Number.isFinite(hls.latency)) return hls.latency;
    return null;
  }

  getLiveSyncPosition(): number | null {
    const hls = this.engine?.hls;
    if (hls && typeof hls.liveSyncPosition === "number") return hls.liveSyncPosition;
    return null;
  }
}

function mapLevel(level: Level, index: number): KyrspectQuality {
  const quality: KyrspectQuality = {
    id: index,
    width: level.width || 0,
    height: level.height || 0,
    bitrate: level.bitrate || 0,
    averageBitrate: level.averageBitrate || level.bitrate || 0,
    codecs: level.codecSet || level.videoCodec || "",
    frameRate: level.frameRate || 0,
    name: "",
  };
  quality.name = qualityLabel(quality);
  return quality;
}

function mapHlsError(data: ErrorData): KyrspectError {
  const details = String(data.details ?? "");
  const status = data.response?.code;
  const cors = status === 0 || /cors/i.test(details);
  let category: KyrspectError["category"] = "PLAYBACK_ERROR";
  if (cors) category = "CORS_ERROR";
  else if (/manifest/i.test(details)) category = "MANIFEST_ERROR";
  else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) category = "NETWORK_ERROR";
  else if (/codec/i.test(details)) category = "CODEC_ERROR";
  else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) category = "MEDIA_ERROR";

  return new KyrspectError({
    code: details || "hls-error",
    category,
    message: data.error?.message || `HLS error: ${details || data.type}`,
    fatal: Boolean(data.fatal),
    recoverable: Boolean(data.fatal) && data.type !== Hls.ErrorTypes.MUX_ERROR,
    originalError: data,
  });
}
