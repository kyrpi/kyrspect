import type { PlaybackAdapter, AdapterContext, NetworkRequest } from "../types/adapter";
import type { ResolvedSource, KyrspectSource } from "../types/source";
import type { KyrspectQuality } from "../types/quality";
import type { KyrspectAudioTrack, KyrspectSubtitleTrack } from "../types/tracks";
import { KyrspectError } from "../errors/KyrspectError";
import { loadDashModule } from "../utils/dash";
import { resetMediaElement } from "../utils/media";
import { findQuality, inferQualityReason, qualityLabel } from "../abr/quality";

interface DashRepresentation {
  id?: string | number;
  index?: number;
  qualityIndex?: number;
  bandwidth?: number;
  bitrate?: number;
  bitrateInKbit?: number;
  width?: number;
  height?: number;
  frameRate?: number | { value?: number };
  codecs?: string;
  codec?: string;
}

interface DashTrack {
  id?: string | number;
  index?: number;
  lang?: string;
  language?: string;
  labels?: Array<{ text?: string }>;
  label?: string;
  roles?: string[];
}

interface DashPlayer {
  initialize(video: HTMLVideoElement, url: string, autoplay: boolean): void;
  setProtectionData?(data: Record<string, unknown>): void;
  registerLicenseRequestFilter?(filter: (request: DashLicenseRequest) => Promise<DashLicenseRequest>): void;
  updateSettings(settings: Record<string, unknown>): void;
  on(event: string, handler: (data: Record<string, unknown>) => void): void;
  off(event: string, handler: (data: Record<string, unknown>) => void): void;
  addRequestInterceptor?(interceptor: (request: DashNetworkRequest) => Promise<DashNetworkRequest>): void;
  addResponseInterceptor?(interceptor: (response: DashNetworkResponse) => Promise<DashNetworkResponse>): void;
  getRepresentationsByType?(type: string): DashRepresentation[];
  getBitrateInfoListFor?(type: string): DashRepresentation[];
  getCurrentRepresentationForType?(type: string): DashRepresentation | null;
  getQualityFor?(type: string): number;
  setRepresentationForTypeByIndex?(type: string, index: number, forceReplace?: boolean): void;
  setQualityFor?(type: string, index: number): void;
  getSettings(): { streaming?: { abr?: { autoSwitchBitrate?: { video?: boolean } } } };
  getTracksFor(type: string): DashTrack[];
  getCurrentTrackFor(type: string): DashTrack | null;
  setCurrentTrack(track: DashTrack): void;
  setTextTrack(index: number): void;
  isDynamic(): boolean;
  getCurrentLiveLatency(): number;
  getDvrWindow?(): { start?: number; end?: number; size?: number } | null;
  getAverageThroughput(type: string): number;
  duration(): number;
  reset(): void;
  destroy?(): void;
}

interface DashNetworkRequest {
  url?: string;
  headers?: Record<string, string>;
}

interface DashNetworkResponse {
  url?: string;
  status?: number;
  headers?: Record<string, string>;
}

interface DashLicenseRequest {
  url?: string;
  headers?: Record<string, string>;
  data?: ArrayBuffer | Uint8Array | string;
}

export class DashPlaybackAdapter implements PlaybackAdapter {
  readonly name = "dash";
  private video: HTMLVideoElement | null = null;
  private player: DashPlayer | null = null;
  private context: AdapterContext | null = null;
  private qualities: KyrspectQuality[] = [];
  private mode: "auto" | "manual" = "auto";
  private pendingReason: "manual" | "emergency" | "buffer-risk" | null = null;
  private lastQuality: KyrspectQuality | undefined;
  private lastBandwidth = 0;
  private retryCount = 0;
  private loadSettled = false;
  private unsubs: Array<() => void> = [];
  private dashEvents: { STREAM_INITIALIZED: string; ERROR: string; QUALITY_CHANGE_RENDERED: string; METRIC_ADDED?: string; KEY_ERROR?: string } | null = null;

  canHandle(source: ResolvedSource | KyrspectSource): boolean {
    return source.type === "dash";
  }

  ownsMediaElementErrors(): boolean {
    return Boolean(this.player);
  }

  async load(video: HTMLVideoElement, source: ResolvedSource, context: AdapterContext): Promise<void> {
    if (source.type !== "dash") return;
    await this.unload();
    this.video = video;
    this.context = context;
    this.retryCount = 0;
    this.loadSettled = false;
    this.mode = context.options.quality === "auto" || context.options.quality == null ? "auto" : "manual";

    const dash = await loadDashModule();
    if (typeof dash.supportsMediaSource === "function" && !dash.supportsMediaSource()) {
      throw new KyrspectError({
        code: "dash-unavailable",
        category: "UNSUPPORTED_FORMAT",
        message: "DASH playback is not supported in this browser.",
      });
    }

    const session = context.drm?.resolve(source, context.options) ?? null;
    const player = this.createPlayer(dash.MediaPlayer, context);
    if (session) context.drm?.applyToDash(player, session);
    this.player = player;
    this.dashEvents = dash.MediaPlayer.events;
    const system = session?.providers.map((item) => item.id).join("+");
    context.debug("DASH", system ? `Using dash.js engine with ${system}` : "Using dash.js engine");
    await this.attachDash(player, video, source.src, context);
  }

  private createPlayer(MediaPlayer: { (): { create(): unknown } }, context: AdapterContext): DashPlayer {
    const retry = context.options.retry;
    const live = context.options.live;
    const dashOpts = context.options.dash;
    const headers = context.getHeaders();
    const hasHooks = Boolean(context.beforeRequest) || Boolean(context.options.network?.afterResponse) || Object.keys(headers).length > 0;
    const playerSized = Boolean(this.video && this.video.clientWidth > 0 && this.video.clientHeight > 0);
    const attempts = retry?.maxAttempts ?? 5;
    const player = MediaPlayer().create() as unknown as DashPlayer;

    player.updateSettings({
      streaming: {
        delay: {
          liveDelay: live?.lowLatency || dashOpts?.lowLatencyMode ? live?.targetLatency ?? 3 : live?.targetLatency,
        },
        buffer: {
          bufferTimeDefault: dashOpts?.maxBufferLength ?? (live?.lowLatency || dashOpts?.lowLatencyMode ? 10 : 30),
          fastSwitchEnabled: true,
        },
        abr: {
          autoSwitchBitrate: { video: this.mode === "auto", audio: true },
          limitBitrateByPortal: (dashOpts?.capLevelToPlayerSize ?? true) && playerSized,
        },
        retryAttempts: {
          MPD: attempts,
          MediaSegment: attempts,
          InitializationSegment: attempts,
          BitstreamSwitchingSegment: attempts,
          IndexSegment: attempts,
          other: attempts,
        },
      },
    });

    if (hasHooks && typeof player.addRequestInterceptor === "function") {
      player.addRequestInterceptor(async (request) => {
        const next: NetworkRequest = { url: request.url ?? "", headers: { ...headers, ...request.headers } };
        await context.beforeRequest?.(next);
        request.url = next.url;
        request.headers = next.headers;
        return request;
      });
    }

    if (context.options.network?.afterResponse && typeof player.addResponseInterceptor === "function") {
      player.addResponseInterceptor(async (response) => {
        context.options.network?.afterResponse?.({
          url: response.url ?? "",
          status: response.status ?? 0,
        });
        return response;
      });
    }

    return player;
  }

  private attachDash(
    player: DashPlayer,
    video: HTMLVideoElement,
    src: string,
    context: AdapterContext,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const events = this.dashEvents ?? {
        STREAM_INITIALIZED: "streamInitialized",
        ERROR: "error",
        QUALITY_CHANGE_RENDERED: "qualityChangeRendered",
      };

      const onInitialized = () => {
        this.qualities = listVideoRepresentations(player).map((rep, index) => mapRepresentation(rep, index));
        context.debug("DASH", "Manifest loaded", `${this.qualities.length} levels`);
        context.events.emit("qualitylevelsloaded", { qualities: this.qualities });
        if (typeof context.options.quality === "number") {
          this.setQuality(context.options.quality);
        } else if (context.options.dash?.startLevel != null && context.options.dash.startLevel !== "auto") {
          this.setQuality(context.options.dash.startLevel);
        }
        this.loadSettled = true;
        this.emitQualityChange(currentQualityIndex(player, this.qualities));
        resolve();
      };

      const onError = (data: Record<string, unknown>) => {
        this.handleError(data, reject);
      };

      const onQuality = (data: Record<string, unknown>) => {
        if (data.mediaType && data.mediaType !== "video") return;
        const index = qualityIndexFromEvent(data, this.qualities);
        if (index != null) this.emitQualityChange(index);
        this.refreshBandwidth(context);
      };

      const onMetric = () => {
        this.refreshBandwidth(context);
      };

      const onKeyError = (data: Record<string, unknown>) => {
        this.handleError({ ...data, category: "DRM_ERROR", fatal: true }, reject);
      };

      player.on(events.STREAM_INITIALIZED, onInitialized);
      player.on(events.ERROR, onError);
      player.on(events.QUALITY_CHANGE_RENDERED, onQuality);
      if (events.METRIC_ADDED) player.on(events.METRIC_ADDED, onMetric);
      if (events.KEY_ERROR) player.on(events.KEY_ERROR, onKeyError);

      this.unsubs.push(() => {
        player.off(events.STREAM_INITIALIZED, onInitialized);
        player.off(events.ERROR, onError);
        player.off(events.QUALITY_CHANGE_RENDERED, onQuality);
        if (events.METRIC_ADDED) player.off(events.METRIC_ADDED, onMetric);
        if (events.KEY_ERROR) player.off(events.KEY_ERROR, onKeyError);
      });

      try {
        player.initialize(video, src, Boolean(context.options.autoplay));
      } catch (error) {
        reject(
          error instanceof KyrspectError
            ? error
            : new KyrspectError({
                code: "dash-initialize",
                category: "SOURCE_ERROR",
                message: error instanceof Error ? error.message : "Failed to initialize DASH playback.",
                originalError: error,
              }),
        );
      }
    });
  }

  private refreshBandwidth(context: AdapterContext): void {
    const estimate = this.getBandwidthEstimate();
    if (estimate && Math.abs(estimate - this.lastBandwidth) / Math.max(estimate, 1) > 0.08) {
      this.lastBandwidth = estimate;
      context.events.emit("bandwidthchange", { bitrate: estimate });
    }
  }

  private handleError(data: Record<string, unknown>, reject: (error: unknown) => void): void {
    const error = mapDashError(data);
    this.context?.debug("DASH", error.code, error.category);

    if (!error.fatal) {
      this.pendingReason = "buffer-risk";
      return;
    }

    this.retryCount += 1;
    const max = this.context?.options.retry?.maxAttempts ?? 5;
    if (this.player && this.retryCount <= max && error.recoverable) {
      this.pendingReason = "emergency";
      return;
    }

    if (!this.loadSettled) reject(error);
    else this.context?.events.emit("error", error);
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
    if (this.player) {
      try {
        this.player.reset();
      } catch {
        // dash.js reset can throw if the player was never initialized.
      }
      try {
        this.player.destroy?.();
      } catch {
        // older dash.js builds only expose reset()
      }
    }
    if (this.video) resetMediaElement(this.video);
    this.player = null;
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
    const player = this.player;
    if (!player) return;
    if (quality === "auto") {
      this.mode = "auto";
      this.pendingReason = null;
      setAutoSwitch(player, true);
      return;
    }
    const match = findQuality(this.qualities, quality);
    if (!match) return;
    this.mode = "manual";
    this.pendingReason = "manual";
    setAutoSwitch(player, false);
    setVideoRepresentation(player, match.id);
  }

  getQualityMode(): "auto" | "manual" {
    const auto = this.player?.getSettings()?.streaming?.abr?.autoSwitchBitrate?.video;
    if (typeof auto === "boolean") return auto ? "auto" : "manual";
    return this.mode;
  }

  getBandwidthEstimate(): number {
    const throughput = this.player?.getAverageThroughput("video");
    if (typeof throughput === "number" && Number.isFinite(throughput) && throughput > 0) {
      // dash.js reports kbit/s
      return throughput * 1000;
    }
    return this.lastBandwidth || 0;
  }

  getAudioTracks(): KyrspectAudioTrack[] {
    const player = this.player;
    if (!player) return [];
    const current = player.getCurrentTrackFor("audio");
    return (player.getTracksFor("audio") ?? []).map((track, index) => ({
      id: String(track.id ?? track.index ?? index),
      label: trackLabel(track, "Audio", index),
      language: track.lang || track.language || "",
      default: tracksEqual(track, current),
    }));
  }

  setAudioTrack(id: string): void {
    const player = this.player;
    if (!player) return;
    const track = (player.getTracksFor("audio") ?? []).find((item, index) => String(item.id ?? item.index ?? index) === id);
    if (track) player.setCurrentTrack(track);
  }

  getSubtitleTracks(): KyrspectSubtitleTrack[] {
    const player = this.player;
    if (!player) return [];
    return (player.getTracksFor("text") ?? []).map((track, index) => ({
      id: String(track.id ?? track.index ?? index),
      kind: "subtitles",
      label: trackLabel(track, "Subtitles", index),
      language: track.lang || track.language || "",
    }));
  }

  setSubtitleTrack(id: string | null): void {
    const player = this.player;
    if (!player) return;
    if (id == null) {
      player.setTextTrack(-1);
      return;
    }
    const tracks = player.getTracksFor("text") ?? [];
    const index = tracks.findIndex((item, i) => String(item.id ?? item.index ?? i) === id);
    if (index >= 0) player.setTextTrack(index);
  }

  isLive(): boolean {
    if (this.player) {
      try {
        return Boolean(this.player.isDynamic());
      } catch {
        // player not ready
      }
    }
    const video = this.video;
    return Boolean(video && (!Number.isFinite(video.duration) || video.duration === Infinity));
  }

  getLiveLatency(): number | null {
    const player = this.player;
    if (!player) return null;
    try {
      const latency = player.getCurrentLiveLatency();
      if (typeof latency === "number" && Number.isFinite(latency)) return latency;
    } catch {
      return null;
    }
    return null;
  }

  getLiveSyncPosition(): number | null {
    const window = this.player?.getDvrWindow?.();
    if (window && typeof window.end === "number" && Number.isFinite(window.end)) return window.end;
    try {
      const duration = this.player?.duration();
      if (typeof duration === "number" && Number.isFinite(duration)) return duration;
    } catch {
      return null;
    }
    return null;
  }
}

function listVideoRepresentations(player: DashPlayer): DashRepresentation[] {
  if (typeof player.getRepresentationsByType === "function") {
    return player.getRepresentationsByType("video") ?? [];
  }
  if (typeof player.getBitrateInfoListFor === "function") {
    return player.getBitrateInfoListFor("video") ?? [];
  }
  return [];
}

function currentQualityIndex(player: DashPlayer, qualities: KyrspectQuality[]): number {
  const current = player.getCurrentRepresentationForType?.("video");
  if (current) {
    const byId = qualities.findIndex((item) => String(item.id) === String(representationIndex(current)));
    if (byId >= 0) return byId;
  }
  if (typeof player.getQualityFor === "function") {
    const index = player.getQualityFor("video");
    if (Number.isInteger(index) && index >= 0) return index;
  }
  return 0;
}

function qualityIndexFromEvent(data: Record<string, unknown>, qualities: KyrspectQuality[]): number | null {
  const representation = (data.newRepresentation ?? data.representation) as DashRepresentation | undefined;
  if (representation) {
    const index = qualities.findIndex((item) => String(item.id) === String(representationIndex(representation)));
    if (index >= 0) return index;
  }
  const next = data.newQuality;
  if (typeof next === "number" && next >= 0) return next;
  return null;
}

function setAutoSwitch(player: DashPlayer, enabled: boolean): void {
  player.updateSettings({
    streaming: {
      abr: {
        autoSwitchBitrate: { video: enabled },
      },
    },
  });
}

function setVideoRepresentation(player: DashPlayer, index: number): void {
  if (typeof player.setRepresentationForTypeByIndex === "function") {
    player.setRepresentationForTypeByIndex("video", index);
    return;
  }
  if (typeof player.setQualityFor === "function") {
    player.setQualityFor("video", index);
  }
}

function representationIndex(rep: DashRepresentation): number {
  if (typeof rep.index === "number") return rep.index;
  if (typeof rep.qualityIndex === "number") return rep.qualityIndex;
  if (typeof rep.id === "number") return rep.id;
  const parsed = Number(rep.id);
  return Number.isFinite(parsed) ? parsed : 0;
}

function representationBitrate(rep: DashRepresentation): number {
  if (typeof rep.bandwidth === "number" && rep.bandwidth > 0) return rep.bandwidth;
  if (typeof rep.bitrate === "number" && rep.bitrate > 0) return rep.bitrate;
  if (typeof rep.bitrateInKbit === "number" && rep.bitrateInKbit > 0) return rep.bitrateInKbit * 1000;
  return 0;
}

function representationFrameRate(rep: DashRepresentation): number {
  if (typeof rep.frameRate === "number") return rep.frameRate;
  if (rep.frameRate && typeof rep.frameRate === "object" && typeof rep.frameRate.value === "number") {
    return rep.frameRate.value;
  }
  return 0;
}

function mapRepresentation(rep: DashRepresentation, fallbackIndex: number): KyrspectQuality {
  const quality: KyrspectQuality = {
    id: representationIndex(rep) || fallbackIndex,
    width: rep.width || 0,
    height: rep.height || 0,
    bitrate: representationBitrate(rep),
    averageBitrate: representationBitrate(rep),
    codecs: rep.codecs || rep.codec || "",
    frameRate: representationFrameRate(rep),
    name: "",
  };
  quality.name = qualityLabel(quality);
  return quality;
}

function trackLabel(track: DashTrack, kind: string, index: number): string {
  return track.labels?.[0]?.text || track.label || track.lang || track.language || `${kind} ${index + 1}`;
}

function tracksEqual(track: DashTrack, current: DashTrack | null): boolean {
  if (!current) return false;
  if (track === current) return true;
  if (track.id != null && current.id != null) return String(track.id) === String(current.id);
  if (track.index != null && current.index != null) return track.index === current.index;
  return track.lang === current.lang && track.language === current.language;
}

function mapDashError(data: Record<string, unknown>): KyrspectError {
  const nested = (data.error ?? data) as Record<string, unknown>;
  const message = String(nested.message ?? data.message ?? "DASH error");
  const code = String(nested.code ?? nested.event ?? data.event ?? "dash-error");
  const text = `${code} ${message}`;
  let category: KyrspectError["category"] = "PLAYBACK_ERROR";
  if (data.category === "DRM_ERROR" || /drm|widevine|license|key.?system|eme|protection/i.test(text)) {
    category = "DRM_ERROR";
  } else if (/cors/i.test(text)) category = "CORS_ERROR";
  else if (/manifest|mpd/i.test(text)) category = "MANIFEST_ERROR";
  else if (/network|download|timeout/i.test(text)) category = "NETWORK_ERROR";
  else if (/codec|capability/i.test(text)) category = "CODEC_ERROR";
  else if (/media|mse|buffer/i.test(text)) category = "MEDIA_ERROR";

  const fatal = nested.fatal !== false && data.fatal !== false;
  return new KyrspectError({
    code,
    category,
    message: message || `DASH error: ${code}`,
    fatal,
    recoverable: fatal && category !== "CODEC_ERROR",
    originalError: data,
  });
}
