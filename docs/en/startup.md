# Startup and load time

Kyrspect keeps the default (unencrypted) path cheap. The following are intentional; they do not skip security checks when DRM is actually configured.

## `@kyrspect/core`

- **hls.js** is loaded only when an HLS source uses the MSE engine.
- **dash.js** is loaded only when a DASH source is played.
- Progressive MP4 / WebM / MediaStream do not download those libraries.
- `DrmManager` and EME hooks are created only when a license URL is present.
- `getCapabilities()` caches the last snapshot and skips CDM probes unless `{ drm: true }` is passed. Video codec probes run in parallel.

## `@kyrspect/wasm`

- UI attaches without waiting for the WASM module.
- HLS / DASH adapters are constructed on first use.
- Stats / ABR intervals start after the WASM bridge is ready.
- Source kind (HLS, DASH, native) is decided in JavaScript from MIME and `.m3u8` / `.mpd`. WASM `analyzeSource` runs only when the URL has no usable hint.
- `ready` fires after UI attach and the optional initial `src` load. WASM ABR and telemetry catch up in the background.

A repeatable benchmark suite for these paths is tracked in [TODO.md](../../TODO.md).
