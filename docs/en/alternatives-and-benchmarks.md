# Kyrspect vs Top 3 Alternatives: Feature Comparison & Benchmark Audit

This document provides an in-depth technical comparison, architectural evaluation, feature matrix, and automated benchmark results comparing **Kyrspect** against the **top 3 video players** in the web ecosystem.

---

## 1. The Top 3 Alternatives Identified

1. **Video.js (Brightcove / Community)**:
   - **Positioning:** The most established and widely used web video player in history (~37.5k+ GitHub Stars, millions of weekly npm downloads).
   - **Characteristics:** Monolithic 2010s component tree, huge plugin ecosystem, heavy bundle footprint.
2. **Shaka Player (Google)**:
   - **Positioning:** Enterprise reference player for streaming (DASH / HLS) and DRM by Google (~7.2k+ GitHub Stars).
   - **Characteristics:** Unrivaled ABR algorithms, industrial DRM, offline caching; utilitarian/barebones UI.
3. **Plyr (Sam Potts)**:
   - **Positioning:** Minimalist, aesthetic HTML5 media player for lightweight websites (~25k+ GitHub Stars).
   - **Characteristics:** Clean aesthetic out of the box; no built-in streaming engine (HLS/DASH requires manual wiring), minimal audio/diagnostics features.

---

## 2. Feature Comparison Matrix

| Feature / Criteria | Kyrspect | Video.js (v8.x) | Shaka Player (v4.x) | Plyr (v3.x) |
|---|---|---|---|---|
| **Architecture** | Micro-Core + Headless UI + Rust WASM | Monolithic OOP Component Tree | Streaming Engine + Basic UI Overlay | HTML5 Media DOM Wrapper |
| **Bundle Size (Gzip)** | **~57.5 KB** (Core + Full UI) | ~180 - 220 KB (with VHS Streaming) | ~140 - 180 KB (with UI Library) | **~40 KB** (UI Only, No Streaming) |
| **Core Size (Gzip)** | **25.3 KB** (Headless Core) | ~130 KB | ~110 KB | N/A (Cannot be separated) |
| **HLS Support** | ✅ Native + hls.js Adapter | ✅ VHS (Video.js HTTP Streaming) | ✅ Native HLS Parser | ⚠️ Dev must wire external hls.js |
| **DASH Support** | ✅ Native + dash.js Adapter | ⚠️ Requires 3rd party plugin | ✅ Industry-standard DASH ABR | ⚠️ Dev must wire external dash.js |
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
- `@kyrspect/core`: 113.4 KB raw (**25.3 KB gzip**)
- `@kyrspect/ui`: 139.5 KB raw (**32.5 KB gzip**)
- `@kyrspect/react`: 5.9 KB raw (**1.7 KB gzip**)
- **Kyrspect Complete (Core + UI)**: **57.5 KB gzip** (~1/4 the size of Video.js with streaming).

### Instantiation & Teardown Latency
- **Headless Core Init:** 0.313 ms mean (3.192 ops/sec)
- **Full UI Init:** 2.778 ms mean (360 ops/sec)
- **Full UI Destroy:** 0.195 ms mean (5.140 ops/sec)
- **DOM Footprint:** Exactly 63 DOM nodes for the entire UI.

---

## 4. How to Run the Benchmark

```bash
npm run benchmark
```
