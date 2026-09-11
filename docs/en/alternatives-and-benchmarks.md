# Kyrspect and Alternative Video Players: Feature Comparison & Benchmark Audit

This document provides a technical comparison, architectural evaluation, feature matrix, and automated benchmark results comparing **Kyrspect** with prominent open-source players in the web ecosystem.

---

## 1. Evaluated Alternatives

1. **Video.js (Brightcove / Community)**:
   - **Positioning:** Established web video player with a vast plugin ecosystem (~37.5k+ GitHub Stars).
   - **Characteristics:** Monolithic component hierarchy, higher bundle footprint, VHS streaming engine.
2. **Shaka Player (Google)**:
   - **Positioning:** Enterprise reference player for streaming (DASH / HLS) and DRM by Google (~7.2k+ GitHub Stars).
   - **Characteristics:** Sophisticated ABR algorithms, industrial DRM, modular streaming engine with basic UI overlay.
3. **Plyr (Sam Potts)**:
   - **Positioning:** Minimalist, clean HTML5 media player wrapper (~25k+ GitHub Stars).
   - **Characteristics:** Clean aesthetic; no built-in streaming engine (requires external hls.js/dash.js setup).

---

## 2. Feature Comparison Matrix

| Feature / Criteria | Kyrspect | Video.js (v8.x) | Shaka Player (v4.x) | Plyr (v3.x) |
|---|---|---|---|---|
| **Architecture** | Micro-Core + Headless UI + Rust WASM | Monolithic Component Tree | Streaming Engine + Basic UI Overlay | HTML5 Media DOM Wrapper |
| **Bundle Size (Gzip)** | **~57.5 KB** (Core + Full UI) | ~180 - 220 KB (with VHS Streaming) | ~140 - 180 KB (with UI Library) | **~40 KB** (UI Only, No Streaming) |
| **Core Size (Gzip)** | **26.1 KB** (Headless Core) | ~130 KB | ~110 KB | N/A (Cannot be separated) |
| **HLS Support** | ✅ Native HLS + hls.js / MSE Adapter | ✅ VHS (Video.js HTTP Streaming) | ✅ Native HLS Parser | ⚠️ Dev must wire external hls.js |
| **DASH Support** | ✅ dash.js / MSE Adapter | ⚠️ Requires 3rd party plugin | ✅ DASH / MSE Engine | ⚠️ Dev must wire external dash.js |
| **DRM (EME)** | ✅ Modular (Widevine, FairPlay, PlayReady) | ⚠️ videojs-contrib-eme plugin | ✅ Enterprise Tier EME | ❌ None |
| **WebAssembly Engine** | ✅ Yes (`@kyrspect/wasm` Rust engine) | ❌ None (Pure JS) | ❌ None (Pure JS) | ❌ None (Pure JS) |
| **Multi-Theme System** | ✅ 8 Aesthetic Themes + CSS Variables | ⚠️ Static CSS themes | ⚠️ Limited CSS variables | ⚠️ Single theme + color var |
| **Performance Mode** | ✅ Built-in (Disables blurs/animations) | ❌ None | ❌ None | ❌ None |
| **Stats for Nerds** | ✅ Real-time Sparklines & Diagnostics | ⚠️ Requires custom plugin | ⚠️ JS API only (`getStats`), no UI | ❌ None |
| **Audio Visualizer** | ✅ Web Audio Dynamic Waveform | ❌ None | ❌ None | ❌ None |
| **Audio Equalizer** | ✅ 5-Band Presets (Acoustic, Bass, etc.) | ❌ None | ❌ None | ❌ None |
| **Dual Channel Audio** | ✅ Built-in Stereo Distribution | ❌ None | ❌ None | ❌ None |
| **Granular Speed Slider** | ✅ Built-in (0.25x - 3.0x, step 0.05) | ⚠️ Standard dropdown | ⚠️ Standard dropdown | ⚠️ Standard dropdown |
| **Official React Library** | ✅ `@kyrspect/react` (Typed, 1.7 KB) | ⚠️ Community wrappers | ❌ None (Manual DOM binding) | ⚠️ Community wrapper |
| **UI Customization** | ✅ Headless or Modern Glassmorphism | ⚠️ Heavy DOM overrides | ⚠️ Utilitarian, hard to theme | ⚠️ Limited layout options |

---

## 3. Automated Benchmark Results

Conducted across **500 iterations** via `npm run benchmark`:

### Bundle Sizes
- `@kyrspect/core`: 117.8 KB raw (**26.1 KB gzip**)
- `@kyrspect/ui`: 121.9 KB raw (**28 KB gzip**)
- `@kyrspect/react`: 5.9 KB raw (**1.7 KB gzip**)
- **Kyrspect Complete (Core + UI)**: **53.8 KB gzip**

### Instantiation & Teardown Latency
- **Headless Core Init:** 0.265 ms mean (3.778 ops/sec)
- **Full UI Init:** 2.562 ms mean (390 ops/sec)
- **Full UI Destroy:** 0.174 ms mean (5.748 ops/sec)
- **DOM Footprint:** Exactly 63 DOM nodes for the entire UI.

---

## 4. Where Kyrspect Has Advantages
- **Modular Footprint:** Keeps core playback lightweight without forcing heavy UI or audio assets.
- **Built-in Presentation Tooling:** Zero-dependency multi-theming, Performance Mode, and Web Audio tools built with consistent lifecycle management.
- **WASM Acceleration:** Optional Rust-based ABR and subtitle parser for CPU-constrained environments.

---

## 5. How to Run the Benchmark

```bash
npm run benchmark
```
