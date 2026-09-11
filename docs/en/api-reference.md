# API Reference

`@kyrspect/wasm` and `@kyrspect/core` provide a unified, strongly-typed player API.

---

## Options (`KyrspectOptions` / `KyrspectWasmOptions`)

```typescript
interface KyrspectOptions {
  src?: string | { src: string; type?: string; isLive?: boolean; drm?: DrmOptions };
  drm?: DrmOptions; // optional; omitted = default playback, no EME
  autoplay?: boolean;
  muted?: boolean;
  volume?: number; // 0.0 - 1.0
  loop?: boolean;
  playsinline?: boolean;
  preload?: "none" | "metadata" | "auto";
  controls?: boolean | UIControlsConfig;
  theme?: ThemeInput; // 'dracula' | 'cyberpunk' | 'nord' | 'sunset' | 'emerald' | 'oled' | 'minimal' | 'default' | UITheme
  performanceMode?: boolean; // disables blur/transitions for low-end hardware
  live?: {
    targetLatency?: number; // Target latency in seconds (default: 3.0)
    maxLatency?: number;    // Maximum latency before catch-up (default: 10.0)
    lowLatency?: boolean;
    dvr?: boolean;
  };
  ui?: {
    language?: "en" | "tr" | "de" | "fr" | "es" | "pt";
    theme?: ThemeInput;
    performanceMode?: boolean;
    audioVisualizer?: boolean;
    statsFields?: StatsField[];
    layout?: "standard" | "reels";
    aspectRatio?: "auto" | number | string;
  };
  advanced?: {
    audio?: {
      dualChannel?: boolean;
      equalizer?: EqualizerPresetId; // 'flat' | 'acoustic' | 'bass-booster' | 'bass-reducer' | 'electronic' | 'rock' | 'vocal'
    };
  };
  debug?: boolean;
  keyboard?: boolean;
}
```

---

## Methods

### Playback
- `play(): Promise<void>` - Starts playback.
- `pause(): void` - Pauses playback.
- `stop(): void` - Stops playback and seeks to start (if not live).
- `seek(seconds: number): void` - Seeks to the specified timestamp.
- `seekToLiveEdge(): void` - Jumps directly to the live broadcast edge.
- `reload(): Promise<void>` - Reloads current source.

### Audio & Volume
- `setVolume(value: number): void` - Sets volume (0.0 to 1.0).
- `mute(): void` - Mutes audio.
- `unmute(): void` - Unmutes audio.
- `setPlaybackRate(rate: number): void` - Sets playback rate (0.25x to 16.0x; UI slider supports granular 0.05 step).

### Advanced Audio, Equalizer & Visualizer
- `setAudioVisualizer(visible: boolean): void` - Toggles the real-time audio waveform canvas overlay.
- `isAudioVisualizerVisible(): boolean` - Checks if the audio visualizer overlay is visible.
- `setDualChannelAudio(enabled: boolean): void` - Enables stereo dual-channel distribution.
- `isDualChannelAudioEnabled(): boolean` - Checks if dual-channel audio is enabled.
- `setEqualizerPreset(preset: EqualizerPresetId): void` - Applies 5-band biquad equalizer preset (`flat`, `acoustic`, `bass-booster`, `bass-reducer`, `electronic`, `rock`, `vocal`).
- `getEqualizerPreset(): EqualizerPresetId` - Returns the current equalizer preset ID.

### Theming & Performance Mode
- `setTheme(theme: ThemeInput): void` - Changes theme dynamically (`default`, `dracula`, `nord`, `cyberpunk`, `sunset`, `emerald`, `oled`, `minimal`, or custom CSS variables object).
- `getTheme(): UITheme | null` - Returns active theme tokens and CSS variables.
- `getThemeName(): string` - Returns active theme name.
- `setPerformanceMode(enabled: boolean): void` - Toggles performance mode (eliminates backdrop-blur, heavy box-shadows, and transitions to maximize FPS on low-end devices or save battery).
- `isPerformanceMode(): boolean` - Returns whether performance mode is active.

### Quality & ABR
- `getQualities(): UIQuality[]` - Returns available quality streams.
- `getQuality(): QualityState` - Returns active quality level and mode (`auto` / `manual`).
- `setQuality(level: number | "auto"): void` - Sets a manual quality level or enables auto-switching.
- `enableAutoQuality(): void` - Re-enables adaptive bitrate algorithm.

### Subtitles & Tracks
- `parseVtt(content: string, label?: string, lang?: string, isDefault?: boolean): void` - Parses WebVTT captions into the player timeline.
- `getSubtitleTracks(): UISubtitleTrack[]` - Lists available subtitle tracks.
- `setSubtitleTrack(id: string): void` - Selects active subtitle track.
- `disableSubtitles(): void` - Turns subtitles off.
- `getAudioTracks(): AudioTrack[]` - Lists available alternate audio tracks.
- `setAudioTrack(id: string): void` - Selects alternate audio track.

### UI & Customization
- `setLanguage(lang: string): void` - Changes player language (`en`, `tr`, `de`, `fr`, `es`, `pt`).
- `setLayout(layout: "standard" | "reels"): void` - Changes layout orientation.
- `setAspectRatio(ratio?: string | number): void` - Updates player container aspect ratio.
- `getStats(): PlayerStats` - Returns real-time telemetry (FPS, buffer ahead, dropped frames, bandwidth estimate, resolution).
- `destroy(): void` - Destroys the player instance, frees memory, detaches Web Audio nodes, and cleans up DOM.

---

## Events

Subscribe using `player.on(event, handler)`:

| Event | Payload | Description |
|---|---|---|
| `ready` | `void` | UI attached and initial source load started |
| `play` | `void` | Playback started |
| `pause` | `void` | Playback paused |
| `playing` | `void` | Media actively playing |
| `waiting` | `void` | Buffering / waiting for data |
| `seeking` | `void` | Seeking operation started |
| `seeked` | `void` | Seeking completed |
| `ended` | `void` | Playback reached end |
| `timeupdate` | `{ currentTime, duration }` | Current time updated |
| `volumechange`| `{ volume, muted }` | Volume changed |
| `qualitychange`| `{ quality, reason }` | Quality level switched |
| `themechange` | `{ theme, name }` | Active theme changed |
| `performancemodechange` | `{ enabled }` | Performance mode toggled |
| `equalizerchange` | `{ preset }` | Equalizer preset changed |
| `dualchannelchange` | `{ enabled }` | Dual-channel stereo audio toggled |
| `cuechange` | `{ activeCues }` | Active subtitle cue changed in timeline |
| `statsupdate` | `PlayerStats` | Real-time telemetry tick (1s interval) |
| `error` | `{ message, fatal }` | Error occurred |
| `destroy` | `void` | Player destroyed |

`drm` is documented in [DRM](./drm.md). Benchmark audit is in [Benchmarks](./alternatives-and-benchmarks.md). Upcoming tasks (DASH hardening & bundle optimization) are in [TODO.md](../../TODO.md).
