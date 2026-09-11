# Kyrspect

[![GitHub](https://img.shields.io/badge/GitHub-kyrpi%2Fkyrspect-blue?logo=github)](https://github.com/kyrpi/kyrspect)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Rust%20Engine-6366f1?logo=webassembly)](https://github.com/kyrpi/kyrspect)

> Modern, lightweight, framework-agnostic video playback engine for the web.

---

## What is Kyrspect?

**Kyrspect** is a modular video playback engine designed for high reliability, strict memory lifecycle management, and optimal bundle size. It sits on top of standard `HTMLVideoElement`, orchestrating progressive media, HLS, and DASH through dedicated, isolated adapters.

Kyrspect offers both a lightweight TypeScript core (`@kyrspect/core`) and an optional WebAssembly acceleration engine (`@kyrspect/wasm`), alongside modern themeable UI components (`@kyrspect/ui`) and official React bindings (`@kyrspect/react`).

## Why Kyrspect?

- **Lean & Modular Footprint:** The core playback engine remains tiny (~30 KB gzip). Heavier streaming engines (dash.js, hls.js) and UI features (Stats for Nerds, Audio Visualizer) are decoupled and loaded only when requested.
- **Strict Resource Cleanup:** Zero memory and event listener leaks across repeated `create -> load -> play -> destroy -> create` lifecycles.
- **Enterprise-grade Streaming & DRM:** First-class HLS (Native / hls.js MSE) and DASH (dash.js MSE) support with modular DRM (Widevine, FairPlay, PlayReady) that introduces zero overhead when unused.
- **Web Audio & Presentation Controls:** Built-in 5-band equalizer, stereo distribution, real-time waveform visualizer, 8 runtime themes, and a dedicated low-spec hardware **Performance Mode**.
- **WebAssembly Ready:** High-throughput Rust-powered ABR decision engine and subtitle parser for CPU-constrained environments.

---

## Installation

Install the core playback engine:

```bash
npm install @kyrspect/core
```

For React applications:

```bash
npm install @kyrspect/core @kyrspect/react
```

Optional WebAssembly acceleration engine:

```bash
npm install @kyrspect/wasm
```

---

## Quickstart

### Vanilla JavaScript

```javascript
import { Kyrspect } from '@kyrspect/core';

// Attach to container or existing <video> element
const player = new Kyrspect('#player', {
  src: 'https://example.com/stream.m3u8',
  controls: true,
  autoplay: false,
});

player.on('ready', () => {
  console.log('Player ready to play');
});

player.play();
```

### React

```tsx
import { KyrspectPlayer } from '@kyrspect/react';

export default function VideoApp() {
  return (
    <KyrspectPlayer
      src="https://example.com/manifest.mpd"
      controls
      autoplay={false}
      onReady={() => console.log('Player ready')}
    />
  );
}
```

---

## Key Features

- **Format Support:** Progressive MP4/WebM, HLS (Native Safari or hls.js / MSE), MPEG-DASH (dash.js / MSE), and MediaStreams.
- **Quality & ABR Management:** Auto adaptive bitrate with seamless manual quality override and hysteresis protection.
- **Audio & Visual Enhancements:** 5-band equalizer presets, dual-channel audio matrix, and real-time audio waveform visualizer.
- **Performance Mode:** Instant elimination of blurs, canvas drawing, backdrop filters, and animations for older and low-spec devices.
- **Subtitles & Audio Tracks:** Multi-language track switching with WebVTT and embedded stream captioning.
- **State Management & Events:** Type-safe event emitter covering standard playback, network stalls, live edge sync, and bitrate adjustments.

---

## Browser Support

Kyrspect targets modern evergreen browsers via capability detection:
- **Google Chrome / Chromium-based** (Edge, Brave, Opera)
- **Mozilla Firefox**
- **Apple Safari** (iOS & macOS)

Playback adapts dynamically to host platform capabilities (e.g. Native HLS on Safari or hls.js / MSE on Chromium and Firefox; DASH via dash.js / MSE).

---

## Documentation

Comprehensive guides, architectural details, and API references are located in [`docs/`](./docs/README.md):

- [Architecture & Modular Micro-Core](./docs/en/architecture.md)
- [HLS Playback Guide](./docs/en/hls.md)
- [DASH Playback Guide](./docs/en/dash.md)
- [DRM Integration & Licensing (Widevine, PlayReady, FairPlay)](./docs/en/drm.md)
- [WebAssembly Engine Integration (`@kyrspect/wasm`)](./docs/en/wasm.md)
- [Performance Optimization & Low-Spec Mode](./docs/en/performance.md)
- [Benchmark Results & Competitor Comparison](./docs/en/alternatives-and-benchmarks.md)
- [Türkçe Dokümantasyon Dizini](./docs/tr/)

---

## Roadmap & Future Focus

Stabilization, hardening, and test coverage remain the primary focus. Future expansions planned for subsequent milestones:
- Chromecast & AirPlay receiver adapters
- Server-Side / Client-Side Ad Insertion (SSAI / CSAI - VAST / VMAP)
- WebRTC & Low-Latency Streaming adapters
- Offline persistent DRM playback & storage management
- Modular analytics backends
- Server-side / Edge transcoding integrations

---

## License

Copyright 2026 Kyrpi / Kyrspect contributors.

Licensed under the [Apache License, Version 2.0](./LICENSE). See [NOTICE](./NOTICE).
