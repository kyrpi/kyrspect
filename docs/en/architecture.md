# Architecture & WebAssembly Engine

Kyrspect's WebAssembly architecture is designed for maximum throughput, predictable memory consumption, and sub-millisecond execution for hot playback loops.

---

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Kyrspect UI Layer                        │
│         (Controls, Menus, Stats Panel, Themes, i18n)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│             KyrspectWasm JavaScript / TS Bridge             │
│       (HTMLVideoElement, Event Emitter, HLS Adapter)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Zero-overhead C-ABI FFI)
┌──────────────────────────────▼──────────────────────────────┐
│                 WebAssembly Core Engine (Rust)              │
│  ├── State Machine & Status Engine                          │
│  ├── EWMA Adaptive Bitrate (ABR) Throughput Predictor       │
│  ├── Low-Latency Live Stream & Drift Controller             │
│  ├── Real-Time Telemetry & Frame Drop Calculator            │
│  ├── WebVTT Subtitle Parser & Binary Search Timeline        │
│  └── Source URL & MIME Analyzer                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Modules in Rust (`wasm32-unknown-unknown`)

1. **State Engine (`src/state.rs`)**:
   - Manages player state transitions (`idle`, `loading`, `ready`, `playing`, `paused`, `buffering`, `seeking`, `ended`, `error`).
   - Ensures consistent state across concurrent async operations.

2. **Adaptive Bitrate Engine (`src/abr.rs`)**:
   - Dual-EWMA (Fast $\alpha=0.3$, Slow $\alpha=0.05$) throughput estimator.
   - Prevents aggressive upswitches during initial connection oscillations.
   - Emergency downswitch triggered when buffer drops below 1.5 seconds.
   - Viewport constraint filter (matches screen resolution with stream width/height).

3. **Live Sync Controller (`src/live.rs`)**:
   - Computes drift between target latency and actual live broadcast edge.
   - Calculates recommended playback rates (`0.95x` - `1.05x`) for pitch-neutral synchronization.

4. **Telemetry & Stats Engine (`src/stats.rs`)**:
   - Computes smoothed instant FPS.
   - Categorizes connection quality into `"Excellent"`, `"Good"`, `"Fair"`, or `"Poor"`.

5. **Subtitle Parser (`src/subtitles.rs`)**:
   - High-speed zero-allocation string parsing of WebVTT timestamps and text.
   - Binary search timeline indexing for $O(\log N)$ cue lookups.
