# Getting Started with Kyrspect

Kyrspect is a modern, framework-agnostic video playback engine for the web. It is available in two compatible variants:
- **`@kyrspect/wasm`**: High-performance WebAssembly engine (Rust-powered state machine, EWMA adaptive bitrate, live drift sync, and subtitle parser).
- **`@kyrspect/core`**: Lightweight TypeScript engine.

---

## Installation

Install the WebAssembly package along with the UI components:

```bash
npm install @kyrspect/wasm @kyrspect/ui
```

Or using Yarn / pnpm / Bun:

```bash
pnpm add @kyrspect/wasm @kyrspect/ui
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
    theme: {
      accent: "#6366f1",
      background: "#0a0c10",
    },
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

---

## HTML Setup

Add a container element in your HTML:

```html
<div id="player-container" style="width: 100%; max-width: 960px; aspect-ratio: 16/9;"></div>
```
