import { getWasmBytes } from "../generated/wasm-binary";

export interface WasmPlayerState {
  status: "idle" | "loading" | "ready" | "playing" | "paused" | "buffering" | "seeking" | "ended" | "error";
  current_time: number;
  duration: number;
  volume: number;
  muted: boolean;
  playback_rate: number;
  buffered_end: number;
  is_live: boolean;
  live_edge_distance: number;
  at_live_edge: boolean;
  quality_index: number;
  auto_quality: boolean;
  loop_playback: boolean;
  playsinline: boolean;
  last_error: string | null;
}

export interface WasmQualityProfile {
  id: number;
  width: number;
  height: number;
  bitrate: number;
  label: string;
}

export interface WasmAbrDecision {
  selected_index: number;
  reason: string;
  estimated_bandwidth_bps: number;
  buffer_length_sec: number;
}

export interface WasmLiveSyncStatus {
  is_live: boolean;
  live_edge_distance: number;
  target_latency: number;
  max_latency: number;
  at_live_edge: boolean;
  recommended_playback_rate: number;
  drift: number;
}

export interface WasmStatsSnapshot {
  fps: number;
  dropped_frames: number;
  total_frames: number;
  dropped_frame_rate: number;
  bandwidth_bps: number;
  buffer_length_sec: number;
  current_bitrate_bps: number;
  latency_sec: number;
  connection_quality: string;
  playback_stalls: number;
}

export interface WasmSubtitleCue {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
  settings: string;
}

export interface WasmSourceAnalysis {
  url: string;
  media_type: "hls" | "mp4" | "webm" | "ogg" | "mediastream" | "blob" | "unknown";
  is_hls: boolean;
  is_stream: boolean;
  probable_mime: string;
}

interface WasmExports {
  memory: WebAssembly.Memory;
  kyrspect_wasm_alloc: (size: number) => number;
  kyrspect_wasm_free: (ptr: number, size: number) => void;
  kyrspect_wasm_free_string: (ptr: number) => void;
  kyrspect_wasm_create_player: () => number;
  kyrspect_wasm_destroy_player: (id: number) => void;
  kyrspect_wasm_set_status: (id: number, statusCode: number) => void;
  kyrspect_wasm_update_playback: (id: number, currentTime: number, duration: number, bufferedEnd: number) => void;
  kyrspect_wasm_set_volume: (id: number, volume: number, muted: number) => void;
  kyrspect_wasm_set_playback_rate: (id: number, rate: number) => void;
  kyrspect_wasm_get_state_json: (id: number) => number;
  kyrspect_wasm_record_bandwidth_sample: (id: number, bytes: bigint, durationSec: number) => void;
  kyrspect_wasm_set_qualities_json: (id: number, ptr: number) => void;
  kyrspect_wasm_evaluate_abr: (
    id: number,
    currentQualityIndex: number,
    bufferLengthSec: number,
    viewportWidth: number,
    viewportHeight: number,
    isManual: number
  ) => number;
  kyrspect_wasm_update_live: (id: number, isLive: number, currentTime: number, liveEdgeTime: number) => number;
  kyrspect_wasm_compute_stats: (
    id: number,
    totalFrames: bigint,
    droppedFrames: bigint,
    timeMs: number,
    bufferSec: number,
    currentBitrateBps: bigint,
    latencySec: number
  ) => number;
  kyrspect_wasm_parse_vtt: (id: number, ptr: number) => number;
  kyrspect_wasm_get_active_cues: (id: number, currentTime: number) => number;
  kyrspect_wasm_analyze_source: (urlPtr: number, mimePtr: number) => number;
}

let instancePromise: Promise<WebAssembly.Instance> | null = null;
let cachedExports: WasmExports | null = null;

export async function getWasmExports(): Promise<WasmExports> {
  if (cachedExports) return cachedExports;
  if (!instancePromise) {
    instancePromise = (async () => {
      const bytes = getWasmBytes();
      const res = await WebAssembly.instantiate(bytes, {
        env: {},
      });
      return (res as any).instance ? (res as any).instance : (res as WebAssembly.Instance);
    })();
  }
  const instance = await instancePromise;
  cachedExports = instance.exports as unknown as WasmExports;
  return cachedExports;
}

export class WasmBridge {
  private exports: WasmExports;
  private readonly playerId: number;
  private destroyed = false;

  private constructor(exports: WasmExports, playerId: number) {
    this.exports = exports;
    this.playerId = playerId;
  }

  static async create(): Promise<WasmBridge> {
    const exports = await getWasmExports();
    const playerId = exports.kyrspect_wasm_create_player();
    return new WasmBridge(exports, playerId);
  }

  get id(): number {
    return this.playerId;
  }

  private allocString(str: string): { ptr: number; len: number } {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str + "\0");
    const ptr = this.exports.kyrspect_wasm_alloc(bytes.length);
    const view = new Uint8Array(this.exports.memory.buffer, ptr, bytes.length);
    view.set(bytes);
    return { ptr, len: bytes.length };
  }

  private readAndFreeString(ptr: number): string {
    if (ptr === 0) return "";
    const memory = new Uint8Array(this.exports.memory.buffer);
    let end = ptr;
    while (memory[end] !== 0) {
      end++;
    }
    const decoder = new TextDecoder("utf-8");
    const str = decoder.decode(memory.subarray(ptr, end));
    this.exports.kyrspect_wasm_free_string(ptr);
    return str;
  }

  setStatus(status: "idle" | "loading" | "ready" | "playing" | "paused" | "buffering" | "seeking" | "ended" | "error"): void {
    if (this.destroyed) return;
    const map: Record<string, number> = {
      idle: 0,
      loading: 1,
      ready: 2,
      playing: 3,
      paused: 4,
      buffering: 5,
      seeking: 6,
      ended: 7,
      error: 8,
    };
    this.exports.kyrspect_wasm_set_status(this.playerId, map[status] ?? 8);
  }

  updatePlayback(currentTime: number, duration: number, bufferedEnd: number): void {
    if (this.destroyed) return;
    this.exports.kyrspect_wasm_update_playback(this.playerId, currentTime, duration, bufferedEnd);
  }

  setVolume(volume: number, muted: boolean): void {
    if (this.destroyed) return;
    this.exports.kyrspect_wasm_set_volume(this.playerId, volume, muted ? 1 : 0);
  }

  setPlaybackRate(rate: number): void {
    if (this.destroyed) return;
    this.exports.kyrspect_wasm_set_playback_rate(this.playerId, rate);
  }

  getState(): WasmPlayerState {
    if (this.destroyed) {
      return {
        status: "idle",
        current_time: 0,
        duration: 0,
        volume: 1,
        muted: false,
        playback_rate: 1,
        buffered_end: 0,
        is_live: false,
        live_edge_distance: 0,
        at_live_edge: true,
        quality_index: -1,
        auto_quality: true,
        loop_playback: false,
        playsinline: true,
        last_error: null,
      };
    }
    const ptr = this.exports.kyrspect_wasm_get_state_json(this.playerId);
    const json = this.readAndFreeString(ptr);
    try {
      return JSON.parse(json);
    } catch {
      return {} as WasmPlayerState;
    }
  }

  recordBandwidthSample(bytes: number, durationSec: number): void {
    if (this.destroyed) return;
    this.exports.kyrspect_wasm_record_bandwidth_sample(this.playerId, BigInt(Math.floor(bytes)), durationSec);
  }

  setQualities(qualities: WasmQualityProfile[]): void {
    if (this.destroyed) return;
    const json = JSON.stringify(qualities);
    const { ptr, len } = this.allocString(json);
    this.exports.kyrspect_wasm_set_qualities_json(this.playerId, ptr);
    this.exports.kyrspect_wasm_free(ptr, len);
  }

  evaluateAbr(
    currentQualityIndex: number,
    bufferLengthSec: number,
    viewportWidth: number,
    viewportHeight: number,
    isManual: boolean
  ): WasmAbrDecision {
    if (this.destroyed) {
      return {
        selected_index: currentQualityIndex,
        reason: "destroyed",
        estimated_bandwidth_bps: 0,
        buffer_length_sec: bufferLengthSec,
      };
    }
    const ptr = this.exports.kyrspect_wasm_evaluate_abr(
      this.playerId,
      currentQualityIndex,
      bufferLengthSec,
      viewportWidth,
      viewportHeight,
      isManual ? 1 : 0
    );
    const json = this.readAndFreeString(ptr);
    try {
      return JSON.parse(json);
    } catch {
      return {
        selected_index: currentQualityIndex,
        reason: "parse_error",
        estimated_bandwidth_bps: 0,
        buffer_length_sec: bufferLengthSec,
      };
    }
  }

  updateLive(isLive: boolean, currentTime: number, liveEdgeTime: number): WasmLiveSyncStatus {
    if (this.destroyed) {
      return {
        is_live: isLive,
        live_edge_distance: 0,
        target_latency: 3,
        max_latency: 10,
        at_live_edge: true,
        recommended_playback_rate: 1,
        drift: 0,
      };
    }
    const ptr = this.exports.kyrspect_wasm_update_live(this.playerId, isLive ? 1 : 0, currentTime, liveEdgeTime);
    const json = this.readAndFreeString(ptr);
    try {
      return JSON.parse(json);
    } catch {
      return {} as WasmLiveSyncStatus;
    }
  }

  computeStats(
    totalFrames: number,
    droppedFrames: number,
    timeMs: number,
    bufferSec: number,
    currentBitrateBps: number,
    latencySec: number
  ): WasmStatsSnapshot {
    if (this.destroyed) {
      return {
        fps: 0,
        dropped_frames: 0,
        total_frames: 0,
        dropped_frame_rate: 0,
        bandwidth_bps: 0,
        buffer_length_sec: 0,
        current_bitrate_bps: 0,
        latency_sec: 0,
        connection_quality: "Good",
        playback_stalls: 0,
      };
    }
    const ptr = this.exports.kyrspect_wasm_compute_stats(
      this.playerId,
      BigInt(Math.floor(totalFrames)),
      BigInt(Math.floor(droppedFrames)),
      timeMs,
      bufferSec,
      BigInt(Math.floor(currentBitrateBps)),
      latencySec
    );
    const json = this.readAndFreeString(ptr);
    try {
      return JSON.parse(json);
    } catch {
      return {} as WasmStatsSnapshot;
    }
  }

  parseVtt(vttContent: string): number {
    if (this.destroyed) return 0;
    const { ptr, len } = this.allocString(vttContent);
    const count = this.exports.kyrspect_wasm_parse_vtt(this.playerId, ptr);
    this.exports.kyrspect_wasm_free(ptr, len);
    return count;
  }

  getActiveCues(currentTime: number): WasmSubtitleCue[] {
    if (this.destroyed) return [];
    const ptr = this.exports.kyrspect_wasm_get_active_cues(this.playerId, currentTime);
    const json = this.readAndFreeString(ptr);
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  static async analyzeSource(url: string, mime?: string): Promise<WasmSourceAnalysis> {
    const exports = await getWasmExports();
    const encoder = new TextEncoder();
    const urlBytes = encoder.encode(url + "\0");
    const urlPtr = exports.kyrspect_wasm_alloc(urlBytes.length);
    new Uint8Array(exports.memory.buffer, urlPtr, urlBytes.length).set(urlBytes);

    let mimePtr = 0;
    let mimeLen = 0;
    if (mime) {
      const mimeBytes = encoder.encode(mime + "\0");
      mimePtr = exports.kyrspect_wasm_alloc(mimeBytes.length);
      mimeLen = mimeBytes.length;
      new Uint8Array(exports.memory.buffer, mimePtr, mimeBytes.length).set(mimeBytes);
    }

    const resPtr = exports.kyrspect_wasm_analyze_source(urlPtr, mimePtr);
    exports.kyrspect_wasm_free(urlPtr, urlBytes.length);
    if (mimePtr !== 0) {
      exports.kyrspect_wasm_free(mimePtr, mimeLen);
    }

    const memory = new Uint8Array(exports.memory.buffer);
    let end = resPtr;
    while (memory[end] !== 0) {
      end++;
    }
    const decoder = new TextDecoder("utf-8");
    const json = decoder.decode(memory.subarray(resPtr, end));
    exports.kyrspect_wasm_free_string(resPtr);

    try {
      return JSON.parse(json);
    } catch {
      return {
        url,
        media_type: "unknown",
        is_hls: false,
        is_stream: false,
        probable_mime: "video/mp4",
      };
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.exports.kyrspect_wasm_destroy_player(this.playerId);
  }
}
