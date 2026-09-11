# Architecture & System Design

Kyrspect is built around a lightweight, framework-agnostic micro-core with zero external dependencies in its default playback loop, combined with an optional WebAssembly acceleration engine (`@kyrspect/wasm`), a modular audio graph, and an aesthetic, high-performance UI layer.

---

## High-Level Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Kyrspect UI Layer                               │
│  ├── Controls, Menus, Timeline & Granular Speed Slider (0.05 step)     │
│  ├── 8 Built-in Themes (Dracula, Nord, Cyberpunk, Sunset, etc.)        │
│  ├── Performance Mode Engine (Zero-blur, hardware-conserving mode)     │
│  ├── Real-time Stats for Nerds (Sparklines, Latency, FPS, Bitrate)     │
│  └── Audio Visualizer (Waveform canvas) & Equalizer Presets UI         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Kyrspect Core Engine (@kyrspect/core)               │
│  ├── State Machine & Typed EventEmitter Event Loop                     │
│  ├── Audio Enhancement Subsystem (Web Audio API Graph)                 │
│  │   ├── 5-Band BiquadFilter Parametric Equalizer                      │
│  │   ├── Dual-Channel Stereo Spatial Distributor                       │
│  │   └── Fast Fourier Transform (FFT) Frequency Analyser               │
│  ├── Source Resolution & Mime-Probe Interceptor                        │
│  ├── Capabilities Cache & Non-blocking CDM Probe                       │
│  └── Optional DRM Manager (Widevine, PlayReady, FairPlay)              │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼──────────────┐   ┌─────────────▼───────────────────┐
│     Playback Adapters            │   │  WebAssembly Engine (Rust FFI)  │
│  ├── HlsPlaybackAdapter          │   │  ├── EWMA Throughput Predictor  │
│  │   (Native HLS or hls.js MSE)  │   │  ├── Live Sync & Drift Control  │
│  ├── DashPlaybackAdapter         │   │  ├── Real-time Telemetry Stats  │
│  │   (dash.js MSE Engine)        │   │  └── WebVTT Binary Cue Search   │
│  └── Progressive / MediaStream   │   └─────────────────────────────────┘
└──────────────────────────────────┘
```

---

## Core Subsystems

### 1. Headless Core (`@kyrspect/core`)
- **Framework Independence:** Runs without React, Vue, or DOM UI dependencies. Can be embedded headless or paired with custom UI.
- **Event Loop:** Strongly-typed events with zero event bubbling leaks.
- **Lazy Adapter Loading:** hls.js and dash.js are never loaded until an HLS or DASH stream is requested. Progressive video plays instantly without streaming library overhead.
- **Optional DRM Manager:** `DrmManager` and EME hooks are created exclusively when license server URLs are configured.

### 2. Audio Enhancement Subsystem (`AudioEnhancer`)
- Connects to the HTMLMediaElement via `AudioContext` and `createMediaElementSource`.
- **5-Band Parametric Equalizer:** Provides 5 peaking/shelf `BiquadFilterNode` stages calibrated for standard acoustic, bass-boost, bass-reduction, electronic, rock, and vocal presets.
- **Stereo Dual-Channel Audio:** Merges or splits audio channels via `ChannelSplitterNode` and `ChannelMergerNode` to ensure balanced audio in single-channel recordings.
- **Real-Time Frequency Analyser:** Powers the UI waveform visualizer via `AnalyserNode.getByteFrequencyData()`.

### 3. UI Layer & Theming System (`@kyrspect/ui`)
- **8 Pre-tuned Themes:** `default`, `dracula`, `nord`, `cyberpunk`, `sunset`, `emerald`, `oled`, `minimal` defined via CSS custom properties.
- **Performance Mode:** Eliminates heavy GPU compositing costs (`backdrop-filter: blur()`, saturated box-shadows, dynamic transitions) on low-spec mobile devices or battery-saver profiles.
- **Ultra-Lean DOM:** Generates exactly 63 DOM nodes for the entire control surface.

### 4. WebAssembly Acceleration (`@kyrspect/wasm`)
- **Zero-Allocation Subtitle Search:** $O(\log N)$ binary search across WebVTT cues.
- **Dual-EWMA ABR:** Fast ($\alpha=0.3$) and slow ($\alpha=0.05$) throughput estimators that prevent quality oscillations.
- **Micro Live Drift Correction:** Adjusts playback rates between $0.95\times$ and $1.05\times$ without pitch distortion.

---

## Architectural Roadmap & Upcoming Focus

As outlined in [TODO.md](../../TODO.md), current architectural initiatives focus on:

### 1. DASH Hardening & Streaming Resiliency
- **Segment Buffer Governance:** Enhancing DASH buffer replenishment algorithms during rapid bandwidth drops.
- **Dynamic MPD & Live Sync:** Hardening live DASH synchronization against server manifest drift (`SegmentTemplate` / `SegmentTimeline`).
- **Multi-Codec Adaptation:** Dynamic track switching between multi-codec audio/video adaptation sets.
- **DASH Failover & Multi-CDN:** Automated failover to secondary `baseURL` on 4xx/5xx network anomalies.
- **dash.js v5 Metrics:** Direct pipeline from dash.js internal telemetry into the Kyrspect diagnostic overlay.

### 2. Package Optimization & Bundle Splitting
- **Dynamic Feature Splitting:** Lazy-loading heavier UI sub-panels (Stats for Nerds, Audio Visualizer, Equalizer) on demand.
- **Bundle Footprint Target:** Optimizing inline SVG icons and CSS utility rules to drive the production bundle (Core + UI) under 50 KB gzip.
- **Tree-Shaking Boundaries:** Fine-tuning `@kyrspect/core`, `@kyrspect/ui`, and `@kyrspect/react` modular export boundaries.
