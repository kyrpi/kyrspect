# Architecture

Kyrspect keeps a small public API and modular internals.

- `@kyrspect/core` is framework-free. It owns lifecycle, events, sources, adapters, and media managers.
- HLS lives in `HlsPlaybackAdapter`. Native HLS and hls.js are engine choices inside that adapter.
- `@kyrspect/ui` paints controls from the player API. It does not load media.
- `@kyrspect/react` constructs `Kyrspect` and forwards props/events.

Out of scope for this release, but the adapter / plugin / network interceptor seams are intended to allow later DASH, DRM, Chromecast, ads, analytics, and thumbnail sprites without rewriting the engine.
