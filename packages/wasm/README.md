# @kyrspect/wasm

WebAssembly video playback engine for Kyrspect.

## Architecture

`@kyrspect/wasm` compiles the playback engine to WebAssembly (`wasm32-unknown-unknown`):

- **State Machine**: Status transitions, time updates, and state persistence.
- **Adaptive Bitrate (ABR)**: Exponentially Weighted Moving Average (EWMA) throughput estimation and quality profile selection.
- **Low-Latency Live Sync**: Edge distance tracking, drift calculation, and playback-rate adjustment.
- **Real-Time Telemetry**: FPS, dropped frames, buffer health, and connection quality.
- **Subtitle & WebVTT Engine**: Cue parser and timeline lookup.
- **Kyrspect UI Integration**: Compatible with `@kyrspect/ui` (custom themes, localization, controls, and stats overlay).
- **Optional DRM**: Same `drm` option as core. Omitted means the default HLS / DASH / progressive path.
- **Fast start**: UI mounts before WASM is ready; `.m3u8` / `.mpd` are classified in JavaScript.

## Installation

```bash
npm install @kyrspect/wasm
```

## Quick Start

```typescript
import { KyrspectWasm } from "@kyrspect/wasm";

const player = new KyrspectWasm("#player", {
  src: "https://example.com/video.mp4",
  autoplay: false,
  controls: true,
  ui: {
    language: "tr",
    theme: {
      accent: "#6366f1",
      background: "#0a0c10",
    },
  },
});

player.on("ready", () => {
  console.log("Kyrspect WebAssembly Player ready");
});

player.play();
```

## Building from Source

```bash
# Build Rust Wasm core, bundle binary, and compile TypeScript package
npm run build -w @kyrspect/wasm
```

## License

Apache License 2.0. See the repository [LICENSE](../../LICENSE) and [NOTICE](../../NOTICE).
