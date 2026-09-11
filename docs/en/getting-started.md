# Getting Started with Kyrspect

Kyrspect is a modern, framework-agnostic video playback engine for the web. It is available in two compatible variants:
- **`@kyrspect/wasm`**: High-performance WebAssembly engine (Rust-powered state machine, EWMA adaptive bitrate, live drift sync, and subtitle parser).
- **`@kyrspect/core`**: Lightweight TypeScript engine (~25 KB gzip).

Both share the same modern UI layer (`@kyrspect/ui`) featuring 8 built-in themes, performance mode, Web Audio visualizers, 5-band equalizers, and real-time telemetry.

---

## Installation

Install the WebAssembly package along with the UI components:

```bash
npm install @kyrspect/wasm @kyrspect/ui
```

Or install the pure TypeScript core:

```bash
npm install @kyrspect/core @kyrspect/ui
```

If you are using React, install the official wrapper:

```bash
npm install @kyrspect/react @kyrspect/core
```

---

## Automatic WebAssembly Detection

Use `createPlayer` to instantiate the **WebAssembly** engine when the browser supports Wasm:

```typescript
import { createPlayer, isWasmSupported } from "@kyrspect/wasm";

console.log("WebAssembly supported:", isWasmSupported());

const player = createPlayer("#player-container", {
  src: "https://example.com/video.mp4",
  autoplay: false,
  controls: true,
  ui: {
    language: "en",
    // 8 built-in themes: 'dracula' | 'cyberpunk' | 'nord' | 'sunset' | 'emerald' | 'oled' | 'minimal' | 'default'
    theme: "dracula",
    // Toggle performance mode for resource-constrained devices:
    performanceMode: false,
    // Real-time audio waveform overlay:
    audioVisualizer: false,
  },
});

player.on("ready", () => {
  console.log("Kyrspect player is ready");
});
```

---

## Direct WebAssembly Usage

You can also directly instantiate the `KyrspectWasm` class:

```typescript
import { KyrspectWasm } from "@kyrspect/wasm";

const player = new KyrspectWasm("#player", {
  src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  controls: true,
  debug: true,
});

player.play();
```

HLS (`.m3u8`) and DASH (`.mpd`) are detected in JavaScript. Do not wait for WASM to classify those URLs. DRM is optional — omit `drm` unless you have a license server. Details: [DRM](./drm.md), [startup](./startup.md).

---

## HTML Setup

Add a container element in your HTML:

```html
<div id="player-container" style="width: 100%; max-width: 960px; aspect-ratio: 16/9;"></div>
```

---

## Benchmarks & Roadmap

- Run the automated 500-iteration benchmark suite: `npm run benchmark`. Full report in [Alternatives & Benchmarks](./alternatives-and-benchmarks.md).
- Active development roadmap and open tasks (DASH hardening and package optimization) are tracked in [TODO.md](../../TODO.md).
