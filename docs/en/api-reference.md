# API Reference

`@kyrspect/wasm` provides a unified, strongly-typed player API.

---

## Options (`KyrspectWasmOptions`)

```typescript
interface KyrspectWasmOptions {
  src?: string | { src: string; type?: string; isLive?: boolean };
  autoplay?: boolean;
  muted?: boolean;
  volume?: number; // 0.0 - 1.0
  loop?: boolean;
  playsinline?: boolean;
  preload?: "none" | "metadata" | "auto";
  controls?: boolean | UIControlsConfig;
  live?: {
    targetLatency?: number; // Target latency in seconds (default: 3.0)
    maxLatency?: number;    // Maximum latency before catch-up (default: 10.0)
  };
  ui?: {
    language?: "en" | "tr" | "de" | "fr" | "es" | "pt";
    theme?: UITheme;
    statsFields?: StatsField[];
    layout?: "standard" | "reels";
    aspectRatio?: "auto" | number | string;
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
- `seek(seconds: number): void` - Seeks to the specified timestamp.
- `seekToLiveEdge(): void` - Jumps directly to the live broadcast edge.
- `reload(): Promise<void>` - Reloads current source.

### Audio & Volume
- `setVolume(value: number): void` - Sets volume (0.0 to 1.0).
- `mute(): void` - Mutes audio.
- `unmute(): void` - Unmutes audio.
- `setPlaybackRate(rate: number): void` - Sets playback rate (0.25x to 16.0x).

### Quality & ABR (WebAssembly Managed)
- `getQualities(): UIQuality[]` - Returns available quality streams.
- `getQuality(): QualityState` - Returns active quality level and mode (`auto` / `manual`).
- `setQuality(level: number | "auto"): void` - Sets a manual quality level or enables Wasm auto-switching.
- `enableAutoQuality(): void` - Re-enables WebAssembly EWMA adaptive bitrate algorithm.

### Subtitles & Tracks
- `parseVtt(content: string, label?: string, lang?: string, isDefault?: boolean): void` - Parses WebVTT captions directly into Wasm.
- `getSubtitleTracks(): UISubtitleTrack[]` - Lists available subtitle tracks.
- `setSubtitleTrack(id: string): void` - Selects active subtitle track.
- `disableSubtitles(): void` - Turns subtitles off.

### UI & Customization
- `setTheme(theme: UITheme): void` - Changes UI theme dynamically.
- `setLanguage(lang: string): void` - Changes player language (`en`, `tr`, `de`, `fr`, `es`, `pt`).
- `getStats(): PlayerStats` - Returns real-time Wasm telemetry (FPS, buffer ahead, dropped frames, bandwidth estimate).
- `destroy(): void` - Destroys the player instance, frees Wasm memory, and cleans up DOM.

---

## Events

Subscribe using `player.on(event, handler)`:

| Event | Payload | Description |
|---|---|---|
| `ready` | `void` | Player and Wasm engine initialized |
| `play` | `void` | Playback started |
| `pause` | `void` | Playback paused |
| `playing` | `void` | Media actively playing |
| `waiting` | `void` | Buffering / waiting for data |
| `seeking` | `void` | Seeking operation started |
| `seeked` | `void` | Seeking completed |
| `ended` | `void` | Playback reached end |
| `timeupdate` | `{ currentTime, duration }` | Current time updated |
| `volumechange`| `{ volume, muted }` | Volume changed |
| `qualitychange`| `{ quality, reason }` | Quality level switched by Wasm ABR |
| `cuechange` | `{ activeCues }` | Active subtitle cue changed in Wasm timeline |
| `statsupdate` | `PlayerStats` | Real-time telemetry tick (1s interval) |
| `error` | `{ message, fatal }` | Error occurred |
| `destroy` | `void` | Player destroyed |
