export type EqualizerPresetId =
  | "flat"
  | "bass-boost"
  | "bass-reducer"
  | "treble-boost"
  | "vocal"
  | "rock"
  | "pop"
  | "classical"
  | "electronic";

export interface EqualizerBandConfig {
  frequency: number;
  type: BiquadFilterType;
  q?: number;
}

export const EQUALIZER_BANDS: EqualizerBandConfig[] = [
  { frequency: 60, type: "lowshelf" },
  { frequency: 250, type: "peaking", q: 1 },
  { frequency: 1000, type: "peaking", q: 1 },
  { frequency: 4000, type: "peaking", q: 1 },
  { frequency: 12000, type: "highshelf" },
];

export const EQUALIZER_PRESETS: Record<EqualizerPresetId, number[]> = {
  flat: [0, 0, 0, 0, 0],
  "bass-boost": [6, 4, 0, 0, 0],
  "bass-reducer": [-6, -3, 0, 0, 0],
  "treble-boost": [0, 0, 0, 3, 6],
  vocal: [-3, 1, 4, 3, -1],
  rock: [5, 2, -2, 3, 5],
  pop: [2, 4, 3, 1, 2],
  classical: [4, 2, 0, 2, 4],
  electronic: [6, 3, 0, 2, 5],
};

export class AudioEnhancer {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private leftDirectGain: GainNode | null = null;
  private rightDirectGain: GainNode | null = null;
  private leftToRightGain: GainNode | null = null;
  private rightToLeftGain: GainNode | null = null;
  private filterNodes: BiquadFilterNode[] = [];
  private analyserNode: AnalyserNode | null = null;

  private dualChannelEnabled = false;
  private currentPreset: EqualizerPresetId = "flat";
  private customGains: number[] = [0, 0, 0, 0, 0];
  private initialized = false;
  private cleanupListeners: Array<() => void> = [];

  constructor(private readonly media: HTMLMediaElement) {
    // If the media element already has an enhancer attached, we can link to it.
    const existing = (media as unknown as { __kyrspect_audio_enhancer?: AudioEnhancer }).__kyrspect_audio_enhancer;
    if (existing) {
      return existing;
    }
    (media as unknown as { __kyrspect_audio_enhancer?: AudioEnhancer }).__kyrspect_audio_enhancer = this;
  }

  private initGraph(): void {
    if (this.initialized || typeof window === "undefined") return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.sourceNode = this.ctx.createMediaElementSource(this.media);

      // Channel routing nodes (Dual-Channel / Stereo matrix)
      this.splitterNode = this.ctx.createChannelSplitter(2);
      this.mergerNode = this.ctx.createChannelMerger(2);

      this.leftDirectGain = this.ctx.createGain();
      this.rightDirectGain = this.ctx.createGain();
      this.leftToRightGain = this.ctx.createGain();
      this.rightToLeftGain = this.ctx.createGain();

      this.applyDualChannelRouting(this.dualChannelEnabled);

      // Connect source to splitter
      this.sourceNode.connect(this.splitterNode);

      // Splitter 0 (Left) -> Direct Left & Cross to Right
      this.splitterNode.connect(this.leftDirectGain, 0);
      this.splitterNode.connect(this.leftToRightGain, 0);

      // Splitter 1 (Right) -> Direct Right & Cross to Left
      this.splitterNode.connect(this.rightDirectGain, 1);
      this.splitterNode.connect(this.rightToLeftGain, 1);

      // Direct Left and Cross Right-to-Left into Merger input 0 (Left channel)
      this.leftDirectGain.connect(this.mergerNode, 0, 0);
      this.rightToLeftGain.connect(this.mergerNode, 0, 0);

      // Direct Right and Cross Left-to-Right into Merger input 1 (Right channel)
      this.rightDirectGain.connect(this.mergerNode, 0, 1);
      this.leftToRightGain.connect(this.mergerNode, 0, 1);

      // Create Equalizer BiquadFilter chain
      let previousNode: AudioNode = this.mergerNode;
      this.filterNodes = EQUALIZER_BANDS.map((bandCfg, index) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = bandCfg.type;
        filter.frequency.value = bandCfg.frequency;
        if (bandCfg.q !== undefined) {
          filter.Q.value = bandCfg.q;
        }
        const gainValue = this.customGains[index] ?? 0;
        filter.gain.value = gainValue;
        previousNode.connect(filter);
        previousNode = filter;
        return filter;
      });

      // Analyser node (shared with waveform visualizer)
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.75;
      previousNode.connect(this.analyserNode);

      // Final output destination
      this.analyserNode.connect(this.ctx.destination);

      (this.media as HTMLMediaElement & { __kyrspect_analyser?: AnalyserNode }).__kyrspect_analyser =
        this.analyserNode;

      this.initialized = true;

      // Resume context if suspended when user starts playback
      const onPlay = () => {
        if (this.ctx && this.ctx.state === "suspended") {
          void this.ctx.resume();
        }
      };
      this.media.addEventListener("play", onPlay);
      this.media.addEventListener("playing", onPlay);
      this.cleanupListeners.push(() => {
        this.media.removeEventListener("play", onPlay);
        this.media.removeEventListener("playing", onPlay);
      });
    } catch {
      // AudioContext unavailable or denied
      this.initialized = false;
    }
  }

  private applyDualChannelRouting(enabled: boolean): void {
    const time = this.ctx ? this.ctx.currentTime : 0;
    const directVal = enabled ? 0.5 : 1.0;
    const crossVal = enabled ? 0.5 : 0.0;

    if (this.leftDirectGain && this.ctx) {
      this.leftDirectGain.gain.setValueAtTime(directVal, time);
    }
    if (this.rightDirectGain && this.ctx) {
      this.rightDirectGain.gain.setValueAtTime(directVal, time);
    }
    if (this.leftToRightGain && this.ctx) {
      this.leftToRightGain.gain.setValueAtTime(crossVal, time);
    }
    if (this.rightToLeftGain && this.ctx) {
      this.rightToLeftGain.gain.setValueAtTime(crossVal, time);
    }
  }

  setDualChannel(enabled: boolean): void {
    this.dualChannelEnabled = enabled;
    if (!this.initialized) {
      this.initGraph();
    }
    this.applyDualChannelRouting(enabled);
  }

  isDualChannel(): boolean {
    return this.dualChannelEnabled;
  }

  setEqualizerPreset(preset: EqualizerPresetId): void {
    this.currentPreset = preset;
    const gains = EQUALIZER_PRESETS[preset] ?? EQUALIZER_PRESETS.flat;
    this.customGains = [...gains];

    if (!this.initialized) {
      this.initGraph();
    }

    const time = this.ctx ? this.ctx.currentTime : 0;
    for (let i = 0; i < this.filterNodes.length; i++) {
      const node = this.filterNodes[i];
      const targetGain = this.customGains[i] ?? 0;
      if (node && this.ctx) {
        node.gain.cancelScheduledValues(time);
        node.gain.setTargetAtTime(targetGain, time, 0.05);
      }
    }
  }

  getEqualizerPreset(): EqualizerPresetId {
    return this.currentPreset;
  }

  getEqualizerGains(): number[] {
    return [...this.customGains];
  }

  getAnalyserNode(): AnalyserNode | null {
    if (!this.initialized) {
      this.initGraph();
    }
    return this.analyserNode;
  }

  destroy(): void {
    for (const unsub of this.cleanupListeners) unsub();
    this.cleanupListeners = [];
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }
      this.splitterNode?.disconnect();
      this.mergerNode?.disconnect();
      this.leftDirectGain?.disconnect();
      this.rightDirectGain?.disconnect();
      this.leftToRightGain?.disconnect();
      this.rightToLeftGain?.disconnect();
      for (const filter of this.filterNodes) {
        filter.disconnect();
      }
      this.filterNodes = [];
      this.analyserNode?.disconnect();
      if (this.ctx && this.ctx.state !== "closed") {
        void this.ctx.close();
      }
    } catch {
      // Ignore cleanup error
    }
    this.sourceNode = null;
    this.splitterNode = null;
    this.mergerNode = null;
    this.leftDirectGain = null;
    this.rightDirectGain = null;
    this.leftToRightGain = null;
    this.rightToLeftGain = null;
    this.analyserNode = null;
    this.ctx = null;
    this.initialized = false;
    delete (this.media as unknown as { __kyrspect_audio_enhancer?: AudioEnhancer }).__kyrspect_audio_enhancer;
    delete (this.media as HTMLMediaElement & { __kyrspect_analyser?: AnalyserNode }).__kyrspect_analyser;
  }
}
