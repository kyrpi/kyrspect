# Kyrspect

[![GitHub](https://img.shields.io/badge/GitHub-kyrpi%2Fkyrspect-blue?logo=github)](https://github.com/kyrpi/kyrspect)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Rust%20Engine-6366f1?logo=webassembly)](https://github.com/kyrpi/kyrspect)

Modern video playback for the web — available in both high-performance **WebAssembly (`@kyrspect/wasm`)** and lightweight TypeScript (`@kyrspect/core`).

Open Source at: [https://github.com/kyrpi/kyrspect](https://github.com/kyrpi/kyrspect)

Documentation: [docs/](./docs/README.md) (English and Turkish). Roadmap: [TODO.md](./TODO.md). Licensed under [Apache License 2.0](./LICENSE).

Kyrspect is a framework-agnostic video playback engine. It sits on top of `HTMLVideoElement`, plays progressive media, HLS, and DASH through adapters, and ships an optional default UI. React is a thin wrapper around the core engine — it never owns playback.

```text
HTMLVideoElement
       ↓
Kyrspect Core
       ↓
Playback Adapters
       ↓
HLS / DASH / Native / MediaStream / Progressive
       ↓
UI
       ↓
Framework Adapters
       ↓
React
```

## Installation

```bash
npm install @kyrspect/core
```

React:

```bash
npm install @kyrspect/react @kyrspect/core
```

## Vanilla JS Usage

```javascript
import { Kyrspect } from '@kyrspect/core';

const player = new Kyrspect('#player', {
  src: 'https://example.com/video.mp4',
});

player.play();
```

A container or an existing `HTMLVideoElement` both work:

```javascript
const element = document.querySelector('#player');

const player = new Kyrspect(element, {
  src: 'https://example.com/master.m3u8',
  autoplay: false,
  controls: true,
});

player.on('ready', () => {
  console.log('Kyrspect ready');
});
```

Headless (bring your own UI):

```javascript
const player = new Kyrspect(videoElement, {
  controls: false,
});
```

Theme the default UI with CSS variables (or change it at runtime):

```javascript
const player = new Kyrspect('#player', {
  src: 'https://example.com/video.mp4',
  ui: {
    theme: {
      accent: '#6d4aff',
      background: '#000',
      text: '#fff',
      radius: '10px',
    },
  },
});

player.setTheme({ accent: '#ff4d6a' });
```

The default UI is localized. Pass `language` when the player is created (`auto` follows the browser, then falls back to English). Built-in packs are English, Turkish, Spanish, French, German, and Portuguese. Individual strings can still be overridden.

```javascript
const player = new Kyrspect('#player', {
  src: 'https://example.com/video.mp4',
  language: 'tr',
  ui: {
    labels: { settings: 'Seçenekler' },
  },
});

player.setLanguage('es');
```

## React Usage

```jsx
import { KyrspectPlayer } from '@kyrspect/react';

export default function App() {
  return (
    <KyrspectPlayer
      src="https://example.com/master.m3u8"
      autoplay={false}
      controls
      onReady={() => console.log('Kyrspect ready')}
    />
  );
}
```

The component is declarative. Playback still runs in `@kyrspect/core`.

```tsx
import { useRef } from 'react';
import { KyrspectPlayer, type KyrspectHandle } from '@kyrspect/react';

const playerRef = useRef<KyrspectHandle>(null);

<KyrspectPlayer ref={playerRef} src={video} />

playerRef.current?.play();
```

`useKyrspectState()` subscribes to player state. `timeupdate` is throttled so React does not re-render on every frame.

## HLS

HLS is a first-class source, isolated behind `HlsPlaybackAdapter`.

- Native HLS is used when the browser can play `application/vnd.apple.mpegurl`
- Otherwise [hls.js](https://github.com/video-dev/hls.js) is used when Media Source Extensions are available
- The rest of the player does not know which engine is active

```javascript
const player = new Kyrspect('#player', {
  src: {
    type: 'hls',
    src: 'https://example.com/master.m3u8',
  },
  hls: {
    preferNative: true,
  },
  live: {
    lowLatency: true,
    targetLatency: 3,
  },
});
```

String URLs are resolved with MIME type, capability detection, and only then playlist URL hints. Extension sniffing is never the sole signal. **hls.js is imported only when the MSE HLS engine is chosen** — progressive files do not load it.

## DASH

MPEG-DASH is a first-class source, isolated behind `DashPlaybackAdapter` and [dash.js](https://github.com/Dash-Industry-Forum/dash.js). There is no native browser DASH engine — playback always goes through MSE when available.

```javascript
const player = new Kyrspect('#player', {
  src: {
    type: 'dash',
    src: 'https://example.com/manifest.mpd',
  },
  dash: {
    capLevelToPlayerSize: true,
    startLevel: 'auto',
  },
  live: {
    lowLatency: true,
    targetLatency: 3,
  },
});
```

`.mpd` URLs and `application/dash+xml` MIME types resolve to DASH automatically. Quality, audio, subtitle, and live APIs are the same as HLS. **dash.js is imported only when a DASH source is loaded.**

## DRM

Full notes: [docs/en/drm.md](./docs/en/drm.md) · [docs/tr/drm.md](./docs/tr/drm.md).

Playback adapters only load HLS or DASH. Key systems live in `DrmManager`:

```text
Kyrspect Core
  ├── PlaybackAdapter
  │    ├── HLS
  │    └── DASH
  └── DRMManager
       ├── Widevine
       ├── PlayReady
       └── FairPlay
```

DRM is optional. If `drm` is omitted (or has no license URL), playback stays on the default HLS / DASH / progressive path — `DrmManager` is not created and no EME setup runs.

Kyrspect does not decrypt content. When DRM is configured, it sets up dash.js / hls.js / native EME with your license server.

```javascript
const player = new Kyrspect('#player', {
  src: { type: 'dash', src: 'https://example.com/encrypted.mpd' },
  drm: {
    preferred: 'widevine',
    widevine: {
      licenseUrl: 'https://license.example/widevine',
      headers: { Authorization: 'Bearer <token>' },
    },
    playready: {
      licenseUrl: 'https://license.example/playready',
    },
  },
});
```

FairPlay is HLS-only (Safari native or hls.js) and needs a certificate URL:

```javascript
drm: {
  fairplay: {
    licenseUrl: 'https://license.example/fairplay',
    certificateUrl: 'https://license.example/fps.cer',
  },
}
```

A source can override player-level license URLs (headers are merged). `beforeLicenseRequest` can add per-request headers. Default `getCapabilities()` skips CDM probes; pass `{ drm: true }` for `widevine` / `playready` / `fairplay`.

The same optional `drm` object is accepted by `@kyrspect/wasm`. If it is missing, WASM stays on the default playback path.

## Startup

Load-time notes: [docs/en/startup.md](./docs/en/startup.md) · [docs/tr/yukleme.md](./docs/tr/yukleme.md).

Unencrypted playback does not construct DRM, does not probe CDMs, and does not download hls.js or dash.js unless that format is actually used. `@kyrspect/wasm` attaches UI before the WASM module is ready and classifies `.m3u8` / `.mpd` in JavaScript.

## WebAssembly

```bash
npm install @kyrspect/wasm
```

```javascript
import { KyrspectWasm } from '@kyrspect/wasm';

const player = new KyrspectWasm('#player', {
  src: 'https://example.com/master.m3u8',
  controls: true,
});
```

WASM owns ABR, live drift, stats, and VTT parsing. HLS / DASH still run in JS adapters (`window.Hls` / `window.dashjs` when present). See [architecture](./docs/en/architecture.md).

## Quality Selection

Master playlist variants become quality levels (`id`, `width`, `height`, `bitrate`, codecs, frame rate).

```javascript
player.getQualities();
player.setQuality(1080);
player.enableAutoQuality();

player.on('qualitychange', (event) => {
  console.log(event.from, event.to, event.mode, event.reason);
});
```

Auto mode uses the active adapter’s ABR (hls.js or dash.js) with Kyrspect’s own quality API on top. Manual selection overrides ABR; Auto is always available again.

## Subtitles

WebVTT tracks can be passed in config. HLS and DASH subtitle and audio tracks are also collected from the active adapter.

```javascript
const player = new Kyrspect('#player', {
  src: video,
  tracks: [
    { kind: 'subtitles', src: '/subtitles/en.vtt', lang: 'en', label: 'English', default: true },
  ],
});

player.setSubtitleTrack(id);
player.disableSubtitles();
```

Caption text is rendered with `textContent`, never `innerHTML`.

## Events

```javascript
player.on('play', () => {});
player.on('pause', () => {});
player.on('ended', () => {});
player.on('timeupdate', ({ currentTime }) => {});
player.on('qualitychange', (event) => {});
player.on('bufferstart', ({ reason }) => {});
player.on('error', (error) => {});

player.once('ready', () => {});
player.off('play', handler);
```

Events are type-safe. Core also emits `bandwidthchange`, `subtitlechange`, `audiotrackchange`, `fullscreenchange`, `pictureinpicturechange`, `liveedge`, and `autoplayblocked`.

## API

```ts
player.play()
player.pause()
player.stop()
player.seek(seconds)
player.load(source)
player.unload()
player.destroy()

player.mute()
player.unmute()
player.setVolume(value)

player.setPlaybackRate(rate)
player.setQuality(level | 'auto')
player.enableAutoQuality()

player.setSubtitleTrack(id)
player.disableSubtitles()
player.setAudioTrack(id)

player.enterFullscreen()
player.enterPictureInPicture()
player.seekToLiveEdge()

player.currentTime
player.duration
player.buffered
player.paused
player.volume
player.quality
player.bandwidthEstimate
player.bufferHealth
player.isLive
player.liveLatency

player.getStats()
```

Capabilities:

```ts
const capabilities = await Kyrspect.getCapabilities();
const drmCaps = await Kyrspect.getCapabilities({ drm: true });
// { h264, hevc, vp9, av1, hls, dash, eme, mse, ... } — CDM flags need { drm: true }
```

## Browser Support

Current Chrome, Edge, Firefox, and Safari. Features are gated by capability detection, not browser sniffing. Missing Picture-in-Picture, Fullscreen, MSE, HLS, or DASH disables that feature instead of breaking the player.

## Development

The demo playground ships a local `sample.mp4` so playback can be checked without
network or CORS in the way. `npm run verify:ui` drives the running demo in real
Chrome and reports container size, video state, control visibility, and the error
overlay; `npm run diagnose:ui` dumps detailed element metrics for debugging.

This is an npm workspaces monorepo.

```text
packages/core    TypeScript playback engine
packages/wasm    Rust WASM engine + JS bridge
packages/ui      default controls
packages/react   React wrapper
examples/        vanilla, react, hls, dash, livestream, demo
docs/            English and Turkish documentation
```

```bash
npm install
npm run build
npm run typecheck
npm test
```

Playgrounds:

```bash
npm run dev:demo      # diagnostic playground
npm run dev:vanilla
npm run dev:react
npm run dev:hls
npm run dev:dash
npm run dev:live
```

## Build

Packages emit ESM, CJS, TypeScript declarations, and source maps via `tsup`.

```bash
npm run build
```

`@kyrspect/core` does not import React. Importing `@kyrspect/react` is the only way to pull the React wrapper.

## Testing

Vitest + jsdom covers EventEmitter, source resolution, capabilities, config merging, quality helpers, errors, plugins, HLS and DASH adapter mapping (including the no-DRM path), optional DRM resolution, WASM source detection, subtitles, and destroy.

```bash
npm test
```

## License

Copyright 2026 Kyrpi / Kyrspect contributors.

Licensed under the [Apache License, Version 2.0](./LICENSE). See [NOTICE](./NOTICE).
