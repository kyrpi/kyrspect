# Architecture

Kyrspect keeps a small public API and modular internals.

- `@kyrspect/core` is framework-free. It owns lifecycle, events, sources, adapters, and media managers.
- HLS lives in `HlsPlaybackAdapter`. Native HLS and hls.js are engine choices inside that adapter.
- DASH lives in `DashPlaybackAdapter` and uses dash.js (no native browser DASH engine).
- DRM is a separate `DrmManager` with Widevine, PlayReady, and FairPlay providers. It is created only when a license URL is configured. Playback adapters ask the manager for engine hints and license configuration; they do not select a key system themselves. hls.js and dash.js are loaded only when that media type is actually played.
- Audio Enhancement lives in `AudioEnhancer`: Web Audio API graph providing a 5-band biquad filter equalizer, dual-channel stereo distribution, and frequency data export for real-time waveform visualization.
- Theming & Performance lives in `PlayerUI`: 8 built-in aesthetic themes (`cyberpunk`, `nord`, `dracula`, `sunset`, `emerald`, `oled`, `minimal`, `default`), dynamic CSS variable system, and a `performanceMode` toggle to disable blurs, heavy shadows, and animations on lower-end devices.
- Telemetry & Diagnostics: Real-time "Stats for Nerds" overlay tracking FPS, buffer health, viewport, bitrates, and live sparkline graphs.
- `@kyrspect/wasm` uses the same optional DRM shape and JS-first source detection so `load()` does not wait on WASM for `.m3u8` / `.mpd` / MIME.
- `@kyrspect/ui` paints controls from the player API. It does not load media.
- `@kyrspect/react` constructs `Kyrspect` and forwards props/events.
- Benchmarks: A 500-iteration automated suite (`npm run benchmark`) tests bundle size, instantiation latency, and memory cleanups against top industry alternatives.

See [English DRM](./en/drm.md), [startup](./en/startup.md), [Türkçe DRM](./tr/drm.md), [yükleme](./tr/yukleme.md), and [alternatives & benchmarks](./en/alternatives-and-benchmarks.md).

### Roadmap & Next Focus
Current ongoing initiatives in [TODO.md](../TODO.md):
1. **DASH Hardening**: Advanced ABR, live drift sync, multi-codec adaptation sets, multi-CDN failover, and dash.js v5 metrics.
2. **Package Optimization**: Tree-shaking, lazy-loading for heavy UI panels (Stats/Visualizer/Equalizer), SVG/CSS minification (< 50 KB gzip target), and bundle splitting.

