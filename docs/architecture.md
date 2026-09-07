# Architecture

Kyrspect keeps a small public API and modular internals.

- `@kyrspect/core` is framework-free. It owns lifecycle, events, sources, adapters, and media managers.
- HLS lives in `HlsPlaybackAdapter`. Native HLS and hls.js are engine choices inside that adapter.
- DASH lives in `DashPlaybackAdapter` and uses dash.js (no native browser DASH engine).
- DRM is a separate `DrmManager` with Widevine, PlayReady, and FairPlay providers. It is created only when a license URL is configured. Playback adapters ask the manager for engine hints and license configuration; they do not select a key system themselves. hls.js and dash.js are loaded only when that media type is actually played.
- `@kyrspect/wasm` uses the same optional DRM shape and JS-first source detection so `load()` does not wait on WASM for `.m3u8` / `.mpd` / MIME.
- `@kyrspect/ui` paints controls from the player API. It does not load media.
- `@kyrspect/react` constructs `Kyrspect` and forwards props/events.

See [English DRM](./en/drm.md), [startup](./en/startup.md), [Türkçe DRM](./tr/drm.md), and [yükleme](./tr/yukleme.md).

Out of scope for this release, but the adapter / plugin / network interceptor seams are intended to allow later Chromecast, ads, analytics, and thumbnail sprites without rewriting the engine.
