# Startup and Load Time

Kyrspect keeps the default (unencrypted) path lightweight and instantaneous. The following optimizations are intentional; they never skip security checks when DRM is actually configured.

---

## `@kyrspect/core`

- **hls.js** is loaded only when an HLS source uses the MSE engine.
- **dash.js** is loaded only when a DASH source is played.
- Progressive MP4 / WebM / MediaStream do not download those libraries.
- `DrmManager` and EME hooks are created only when a license URL is present.
- `getCapabilities()` caches the last snapshot and skips CDM probes unless `{ drm: true }` is passed. Video codec probes run in parallel.

---

## `@kyrspect/wasm`

- UI attaches without waiting for the WASM module.
- HLS / DASH adapters are constructed on first use.
- Stats / ABR intervals start after the WASM bridge is ready.
- Source kind (HLS, DASH, native) is decided in JavaScript from MIME and `.m3u8` / `.mpd`. WASM `analyzeSource` runs only when the URL has no usable hint.
- `ready` fires after UI attach and the optional initial `src` load. WASM ABR and telemetry catch up in the background.

---

## Benchmark Audit & Startup Latency

A repeatable benchmark suite verifies these execution paths across 500 cold and warm iterations:

```bash
npm run benchmark
```

- **Headless Core Initialization:** **0.313 ms** mean (3,192 ops/sec)
- **Headless Core Destroy:** **0.070 ms** mean (14,382 ops/sec)
- **Full UI Initialization (DOM + Themes + Audio):** **2.778 ms** mean (360 ops/sec)
- **Full UI Destroy & Cleanup:** **0.195 ms** mean (5,140 ops/sec)
- **DOM Footprint:** Exactly **63 DOM nodes** created for the entire player UI.

For low-spec devices or battery conservation, toggling **Performance Mode** (`performanceMode: true` or `player.setPerformanceMode(true)`) disables backdrop-blur filters, complex box-shadows, and animation transitions, further reducing GPU and compositing overhead.

See the complete benchmark comparison report in [Alternatives & Benchmarks](./alternatives-and-benchmarks.md). Upcoming tasks (DASH hardening and bundle splitting) are tracked in [TODO.md](../../TODO.md).
