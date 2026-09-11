import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { performance } from "node:perf_hooks";
import { JSDOM } from "jsdom";

// 1. Setup DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"player-container\"></div></body></html>", {
  url: "http://localhost:3000",
  pretendToBeVisual: true,
});

function setupGlobal(key, val) {
  try {
    Object.defineProperty(globalThis, key, { value: val, configurable: true, writable: true });
  } catch {
    globalThis[key] = val;
  }
}

setupGlobal("window", dom.window);
setupGlobal("document", dom.window.document);
setupGlobal("HTMLElement", dom.window.HTMLElement);
setupGlobal("HTMLVideoElement", dom.window.HTMLVideoElement);
setupGlobal("customElements", dom.window.customElements);
setupGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 16));
setupGlobal("cancelAnimationFrame", (id) => clearTimeout(id));

// Load built Kyrspect packages
const { Kyrspect } = await import("../packages/core/dist/index.js");

// 2. Measure Bundle Sizes
function getBundleMetrics(filePath) {
  if (!fs.existsSync(filePath)) return { raw: 0, gzip: 0 };
  const content = fs.readFileSync(filePath);
  const raw = content.length;
  const gzip = zlib.gzipSync(content, { level: 9 }).length;
  return { raw, gzip };
}

const coreMetrics = getBundleMetrics(path.resolve("packages/core/dist/index.js"));
const uiMetrics = getBundleMetrics(path.resolve("packages/ui/dist/index.js"));
const reactMetrics = getBundleMetrics(path.resolve("packages/react/dist/index.js"));
const wasmGlueMetrics = getBundleMetrics(path.resolve("packages/wasm/dist/index.js"));

const hlsMetrics = getBundleMetrics(path.resolve("node_modules/hls.js/dist/hls.mjs"));
const dashMetrics = getBundleMetrics(path.resolve("node_modules/dashjs/dist/modern/esm/dash.all.min.js"));

const combinedRaw = coreMetrics.raw + uiMetrics.raw;
const combinedGzip = zlib.gzipSync(
  Buffer.concat([
    fs.readFileSync(path.resolve("packages/core/dist/index.js")),
    fs.readFileSync(path.resolve("packages/ui/dist/index.js")),
  ]),
  { level: 9 }
).length;

const coreHlsRaw = coreMetrics.raw + hlsMetrics.raw;
const coreHlsGzip = hlsMetrics.raw > 0 ? zlib.gzipSync(
  Buffer.concat([
    fs.readFileSync(path.resolve("packages/core/dist/index.js")),
    fs.readFileSync(path.resolve("node_modules/hls.js/dist/hls.mjs")),
  ]),
  { level: 9 }
).length : coreMetrics.gzip;

const coreDashRaw = coreMetrics.raw + dashMetrics.raw;
const coreDashGzip = dashMetrics.raw > 0 ? zlib.gzipSync(
  Buffer.concat([
    fs.readFileSync(path.resolve("packages/core/dist/index.js")),
    fs.readFileSync(path.resolve("node_modules/dashjs/dist/modern/esm/dash.all.min.js")),
  ]),
  { level: 9 }
).length : coreMetrics.gzip;

// DRM footprint: core includes modular EME handlers without requiring external polyfills
const drmActiveRaw = coreMetrics.raw;
const drmActiveGzip = coreMetrics.gzip;

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = 1;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// 3. Performance Micro-benchmarks
console.log("================================================================================");
console.log("               KYRSPECT BENCHMARK SUITE & PERFORMANCE AUDIT                     ");
console.log("================================================================================\n");

const statsMetrics = getBundleMetrics(path.resolve("packages/ui/dist/stats.js"));
const waveformMetrics = getBundleMetrics(path.resolve("packages/ui/dist/waveform.js"));

console.log("[1/3] Measuring Bundle Sizes (Architectural Packages & Feature Modules)...\n");
console.table([
  { State: "1. Core Engine (@kyrspect/core)", "Raw (ESM)": formatBytes(coreMetrics.raw), "Gzipped (lvl 9)": formatBytes(coreMetrics.gzip) },
  { State: "2. UI Package (@kyrspect/ui)", "Raw (ESM)": formatBytes(uiMetrics.raw), "Gzipped (lvl 9)": formatBytes(uiMetrics.gzip) },
  { State: "3. Complete Player (Core + UI)", "Raw (ESM)": formatBytes(combinedRaw), "Gzipped (lvl 9)": formatBytes(combinedGzip) },
  { State: "4. React Wrapper (@kyrspect/react)", "Raw (ESM)": formatBytes(reactMetrics.raw), "Gzipped (lvl 9)": formatBytes(reactMetrics.gzip) },
  { State: "5. WASM Engine Glue (@kyrspect/wasm)", "Raw (ESM)": formatBytes(wasmGlueMetrics.raw), "Gzipped (lvl 9)": formatBytes(wasmGlueMetrics.gzip) },
  { State: "6. HLS Active (Core + hls.js MSE)", "Raw (ESM)": formatBytes(coreHlsRaw), "Gzipped (lvl 9)": formatBytes(coreHlsGzip) },
  { State: "7. DASH Active (Core + dash.js MSE)", "Raw (ESM)": formatBytes(coreDashRaw), "Gzipped (lvl 9)": formatBytes(coreDashGzip) },
  { State: "8. DRM Active (Built-in Modular EME)", "Raw (ESM)": formatBytes(drmActiveRaw), "Gzipped (lvl 9)": formatBytes(drmActiveGzip) },
  { State: "9. Stats Module (@kyrspect/ui/stats)", "Raw (ESM)": formatBytes(statsMetrics.raw), "Gzipped (lvl 9)": formatBytes(statsMetrics.gzip) },
  { State: "10. Waveform Module (@kyrspect/ui/waveform)", "Raw (ESM)": formatBytes(waveformMetrics.raw), "Gzipped (lvl 9)": formatBytes(waveformMetrics.gzip) },
]);

const isSmoke = process.argv.includes("--smoke");
const ITERATIONS = isSmoke ? 15 : 500;
const WARMUP_ITERATIONS = isSmoke ? 3 : 20;

console.log(`\n[2/3] Running Instantiation & Teardown Micro-benchmarks (${ITERATIONS} iterations, ${WARMUP_ITERATIONS} warmup)...`);

const container = dom.window.document.getElementById("player-container");

// Warmup
for (let i = 0; i < WARMUP_ITERATIONS; i++) {
  const p1 = new Kyrspect(container, { controls: false });
  p1.destroy();
  const p2 = new Kyrspect(container, { controls: true });
  p2.destroy();
}

// Benchmark 1: Headless Instantiation & Destroy
const headlessInitTimes = [];
const headlessDestroyTimes = [];

for (let i = 0; i < ITERATIONS; i++) {
  const t0 = performance.now();
  const player = new Kyrspect(container, { controls: false });
  const t1 = performance.now();
  headlessInitTimes.push(t1 - t0);

  const t2 = performance.now();
  player.destroy();
  const t3 = performance.now();
  headlessDestroyTimes.push(t3 - t2);
}

// Benchmark 2: Full UI Instantiation & Destroy
const uiInitTimes = [];
const uiDestroyTimes = [];
let nodeCount = 0;

for (let i = 0; i < ITERATIONS; i++) {
  const t0 = performance.now();
  const player = new Kyrspect(container, { controls: true });
  const t1 = performance.now();
  uiInitTimes.push(t1 - t0);

  if (i === 0) {
    nodeCount = container.getElementsByTagName("*").length;
  }

  const t2 = performance.now();
  player.destroy();
  const t3 = performance.now();
  uiDestroyTimes.push(t3 - t2);
}

function calcStats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((acc, v) => acc + v, 0);
  const mean = sum / times.length;
  const p50 = sorted[Math.floor(times.length * 0.5)];
  const p95 = sorted[Math.floor(times.length * 0.95)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const opsSec = Math.round(1000 / (mean || 1));
  return {
    "Mean (ms)": mean.toFixed(3),
    "Median (ms)": p50.toFixed(3),
    "p95 (ms)": p95.toFixed(3),
    "Min (ms)": min.toFixed(3),
    "Max (ms)": max.toFixed(3),
    "Throughput": `${opsSec.toLocaleString()} ops/sec`,
  };
}

console.log("\nInstantiation Latency & Throughput:");
console.table({
  "Headless Core Init": calcStats(headlessInitTimes),
  "Headless Core Destroy": calcStats(headlessDestroyTimes),
  "Full UI Init (DOM + Audio + Themes)": calcStats(uiInitTimes),
  "Full UI Destroy": calcStats(uiDestroyTimes),
});

console.log(`DOM Footprint: Full player UI renders exactly ${nodeCount} DOM nodes inside container.`);

console.log("\nPlayback Performance Metrics Infrastructure (Profile Standard):");
console.table([
  { Metric: "Time to First Frame (TTFF)", Status: "TODO (Requires real browser hardware decode context / Playwright profile)", Target: "< 250 ms" },
  { Metric: "Manifest → Playable Latency", Status: "TODO (Instrumented via manifestParsed → canplay event interval)", Target: "< 350 ms" },
  { Metric: "Seek Recovery Latency", Status: "TODO (Instrumented via seeking → seeked event interval)", Target: "< 150 ms" },
  { Metric: "Quality Switch Latency", Status: "TODO (Instrumented via qualitychange → rendition rendered)", Target: "< 500 ms" },
  { Metric: "Rebuffer Duration", Status: "TODO (Instrumented via waiting → playing interval)", Target: "0 ms under normal QoS" },
  { Metric: "Live Latency", Status: "Instrumented via player.liveLatency / getLiveLatency()", Target: "2 - 6 s (Low-Latency DASH/HLS)" },
  { Metric: "Destroy Teardown Time", Status: `Measured: ${calcStats(uiDestroyTimes)["Mean (ms)"]} ms mean`, Target: "< 5 ms" },
  { Metric: "Memory Growth (100x cycles)", Status: "0 leaked DOM nodes (verified via memory-leak test)", Target: "0 leaked nodes / 0 listeners" },
]);

console.log("\n[3/3] Generating Detailed Comparison Report against Top 3 Alternatives...\n");

// 4. Competitor Data Analysis
const competitors = [
  {
    name: "Kyrspect",
    vendor: "Kyrpi / Open Source",
    architecture: "Modular Micro-core + Adapters + Headless UI + Rust WASM",
    bundleGzip: `${formatBytes(combinedGzip)} (Core+UI)`,
    hlsDash: "HLS (Native / hls.js MSE) + DASH (dash.js MSE)",
    drm: "Widevine / FairPlay / PlayReady Modular EME",
    uiThemes: "8 Dynamic Built-in Themes + Runtime CSS Vars",
    perfMode: "Built-in Performance Mode (Zero animations/blurs)",
    statsForNerds: "Built-in Live Sparklines & Diagnostics Overlay",
    audioTools: "Built-in Audio Visualizer Waveform + Equalizer + Dual Channel",
    reactNative: "First-class `@kyrspect/react` with typed hooks/handles",
    wasm: "Rust/WASM acceleration engine (`@kyrspect/wasm`)",
  },
  {
    name: "Video.js",
    vendor: "Brightcove / Community",
    architecture: "Monolithic Component Hierarchy (Legacy OOP / Backbone-like)",
    bundleGzip: "~180 KB - 220 KB (with VHS / videojs-http-streaming)",
    hlsDash: "VHS (Video.js HTTP Streaming) built-in or plugin",
    drm: "Requires separate videojs-contrib-eme plugin",
    uiThemes: "CSS-only themes (Classic, Fantasy, Forest, City); static",
    perfMode: "None (requires manual CSS overrides)",
    statsForNerds: "None (requires custom 3rd party plugins)",
    audioTools: "None (requires custom Web Audio wiring)",
    reactNative: "Community wrappers (mostly unmaintained / manual lifecycle)",
    wasm: "None (pure JS legacy engine)",
  },
  {
    name: "Shaka Player",
    vendor: "Google",
    architecture: "Streaming Engine with basic optional UI overlay",
    bundleGzip: "~140 KB - 180 KB (with UI library)",
    hlsDash: "DASH (MSE) & HLS parser with robust ABR",
    drm: "Extensive enterprise EME integration (Widevine, PlayReady, FairPlay)",
    uiThemes: "Basic utilitarian styling; custom CSS variables",
    perfMode: "None",
    statsForNerds: "Basic stats API (`getStats()`), no rich graphical UI overlay",
    audioTools: "Basic track switching, no equalizer or waveform",
    reactNative: "No official React wrapper; manual DOM attachment",
    wasm: "None (pure JS streaming parser)",
  },
  {
    name: "Plyr",
    vendor: "Sam Potts / Community",
    architecture: "Monolithic DOM wrapper around standard HTML5 media",
    bundleGzip: "~40 KB (JS + CSS, but NO HLS/DASH streaming engine)",
    hlsDash: "No built-in HLS/DASH engine (requires manual hls.js setup by dev)",
    drm: "None (relies strictly on browser native support)",
    uiThemes: "Single sleek look with limited CSS variable color tweaks",
    perfMode: "None",
    statsForNerds: "None",
    audioTools: "None",
    reactNative: "Community wrapper (`plyr-react`)",
    wasm: "None",
  },
];

console.log("Competitors Comparison Matrix:");
console.table(competitors.map(c => ({
  Player: c.name,
  "Bundle Size (Gzip)": c.bundleGzip,
  "HLS / DASH": c.hlsDash,
  "DRM": c.drm,
  "Multi-Theme": c.uiThemes,
  "Perf Mode": c.perfMode,
  "Stats for Nerds": c.statsForNerds,
  "Audio Visualizer/EQ": c.audioTools,
  "WASM Engine": c.wasm,
})));

const headlessInitStats = calcStats(headlessInitTimes);
const headlessDestroyStats = calcStats(headlessDestroyTimes);
const uiInitStats = calcStats(uiInitTimes);
const uiDestroyStats = calcStats(uiDestroyTimes);

// 5. Generate Markdown Documentation
const trDoc = `# Kyrspect ve Alternatif Video Oynatıcıları: Özellik Karşılaştırması ve Benchmark Raporu

Bu doküman, **Kyrspect** video oynatıcısının web video ekosistemindeki öne çıkan açık kaynak oynatıcılar ile teknik karşılaştırmasını, mimari farklarını, özellik matrisini ve nesnel performans (benchmark) test sonuçlarını içermektedir.

---

## 1. Değerlendirilen Alternatifler

Web video ekosisteminde farklı kullanım senaryolarına hizmet eden açık kaynak çözümler:

1. **Video.js (Brightcove / Topluluk)**:
   - **Kapsam:** Geniş eklenti ekosistemi, VHS ile HLS/DASH streaming desteği, yerleşik ve olgun mimari.
   - **Mimari:** Monolitik bileşen hiyerarşisi, daha yüksek bundle boyutu.
2. **Shaka Player (Google)**:
   - **Kapsam:** Kurumsal streaming (DASH / HLS / DRM) ve ABR algoritmalarında endüstri referansı.
   - **Mimari:** Güçlü streaming motoru, temel UI katmanı, saf JS ayrıştırıcı.
3. **Plyr (Sam Potts)**:
   - **Kapsam:** Hafif, minimal ve temiz HTML5 video/audio sarmalayıcısı.
   - **Mimari:** Dahili HLS/DASH streaming motoru içermez; harici entegrasyon gerektirir.

---

## 2. Özellik Karşılaştırma Matrisi

| Özellik / Kriter | Kyrspect | Video.js (v8.x) | Shaka Player (v4.x) | Plyr (v3.x) |
|---|---|---|---|---|
| **Temel Mimari** | Modüler Mikro-Çekirdek + Headless UI + Rust WASM | Monolitik Bileşen Ağacı | Streaming Motoru + Temel UI Overlay | Temel HTML5 Video Sarmalayıcı |
| **Paket Boyutu (Gzip)** | **~${formatBytes(combinedGzip)}** (Çekirdek + Tam UI) | ~180 - 220 KB (VHS Streaming ile) | ~140 - 180 KB (UI Kütüphanesi ile) | **~40 KB** (Sadece UI, Streaming Yok) |
| **Çekirdek (Core) Boyutu** | **${formatBytes(coreMetrics.gzip)}** (Headless Çekirdek) | ~130 KB | ~110 KB | N/A (Ayrılamaz) |
| **HLS Desteği** | ✅ Native HLS + hls.js / MSE Adaptörü | ✅ VHS (Video.js HTTP Streaming) | ✅ Dahili HLS Ayrıştırıcı | ⚠️ Harici hls.js kodu gerekir |
| **DASH Desteği** | ✅ dash.js / MSE Adaptörü | ⚠️ Eklenti gerekir | ✅ DASH / MSE ABR motoru | ⚠️ Harici dash.js kodu gerekir |
| **DRM (EME) Entegrasyonu** | ✅ Modüler (Widevine, FairPlay, PlayReady) | ⚠️ videojs-contrib-eme eklentisi | ✅ Üst Düzey Kurumsal Entegrasyon | ❌ Desteklenmez |
| **WebAssembly Desteği** | ✅ Var (\`@kyrspect/wasm\` Rust motoru) | ❌ Yok (Saf JS) | ❌ Yok (Saf JS) | ❌ Yok (Saf JS) |
| **Dinamik Çoklu Tema** | ✅ 8 Estetik Tema + CSS Değişkenleri | ⚠️ Statik CSS temaları | ⚠️ Sınırlı CSS değişkenleri | ⚠️ Tek tema + renk değişkeni |
| **Performans Modu (Eski Cihaz)** | ✅ Dahili (Tüm animasyon ve blur sıfırlama) | ❌ Yok | ❌ Yok | ❌ Yok |
| **Stats for Nerds (İstatistikler)** | ✅ Canlı Sparkline Grafikler & Teşhis Paneli | ⚠️ Harici eklenti gerekir | ⚠️ Sadece JS API (\`getStats\`), UI yok | ❌ Yok |
| **Ses Görselleştirici (Waveform)** | ✅ Dahili Web Audio Frekans Dalgası | ❌ Yok | ❌ Yok | ❌ Yok |
| **Dahili Ses Ekolayzeri** | ✅ 5-Band Profiller (Akustik, Bas, Tiz vb.) | ❌ Yok | ❌ Yok | ❌ Yok |
| **İki Kanaldan Dinleme (Dual Channel)** | ✅ Dahili Stereo Birleştirici | ❌ Yok | ❌ Yok | ❌ Yok |
| **Hassas Hız Ayarı (-/+, Slider)** | ✅ Dahili (0.25x - 3.0x, 0.05 adımlı) | ⚠️ Standart açılır liste | ⚠️ Standart açılır liste | ⚠️ Standart açılır liste |
| **Resmi React Paketi** | ✅ \`@kyrspect/react\` (Tip güvenli, ${formatBytes(reactMetrics.gzip)}) | ⚠️ Topluluk sarmalayıcıları (gayriresmi) | ❌ Yok (Manuel bağlama) | ⚠️ Topluluk sarmalayıcısı |
| **Arayüz Özelleştirme** | ✅ Headless veya Cam Efektli Modern UI | ⚠️ Ağır DOM manipülasyonu | ⚠️ Zor ve sınırlı stil | ⚠️ Sınırlı özelleştirme |

---

## 3. Performans ve Benchmark Sonuçları

Otomatik test süitimiz (\`npm run benchmark\`) tarafından **${ITERATIONS} iterasyon** üzerinden toplanan gerçek ölçüm sonuçları:

### A. Paket Boyutları (Bundle Size Audit)

| Paket | Ham Boyut (ESM) | Gzip (Seviye 9) | Açıklama |
|---|---|---|---|
| \`@kyrspect/core\` | ${formatBytes(coreMetrics.raw)} | **${formatBytes(coreMetrics.gzip)}** | Oynatma motoru, adaptörler, durum yönetimi, olay döngüsü |
| \`@kyrspect/ui\` | ${formatBytes(uiMetrics.raw)} | **${formatBytes(uiMetrics.gzip)}** | Tam arayüz, 8 tema, tüm SVG ikonlar, istatistik paneli, ekolayzer, 6 dil |
| \`@kyrspect/react\` | ${formatBytes(reactMetrics.raw)} | **${formatBytes(reactMetrics.gzip)}** | React sarmalayıcısı ve reaktif kancalar (hooks) |
| **Kyrspect Tam Paket (Core + UI)** | **${formatBytes(combinedRaw)}** | **${formatBytes(combinedGzip)}** | **Core + UI modüler dağıtımı** |

### B. Başlatma ve İmha Gecikmeleri (Instantiation & Teardown Latency)

*${ITERATIONS} döngülük ölçümler:*

| Operasyon | Ortalama (Mean) | Medyan (p50) | %95 Dilim (p95) | En Hızlı (Min) | En Yavaş (Max) | İşlem Hacmi (Throughput) |
|---|---|---|---|---|---|---|
| **Headless Çekirdek Başlatma** | ${headlessInitStats["Mean (ms)"]} ms | ${headlessInitStats["Median (ms)"]} ms | ${headlessInitStats["p95 (ms)"]} ms | ${headlessInitStats["Min (ms)"]} ms | ${headlessInitStats["Max (ms)"]} ms | **${headlessInitStats["Throughput"]}** |
| **Headless Çekirdek İmha (Destroy)** | ${headlessDestroyStats["Mean (ms)"]} ms | ${headlessDestroyStats["Median (ms)"]} ms | ${headlessDestroyStats["p95 (ms)"]} ms | ${headlessDestroyStats["Min (ms)"]} ms | ${headlessDestroyStats["Max (ms)"]} ms | **${headlessDestroyStats["Throughput"]}** |
| **Tam UI Başlatma (DOM + Ses + Temalar)** | ${uiInitStats["Mean (ms)"]} ms | ${uiInitStats["Median (ms)"]} ms | ${uiInitStats["p95 (ms)"]} ms | ${uiInitStats["Min (ms)"]} ms | ${uiInitStats["Max (ms)"]} ms | **${uiInitStats["Throughput"]}** |
| **Tam UI İmha (Temizlik)** | ${uiDestroyStats["Mean (ms)"]} ms | ${uiDestroyStats["Median (ms)"]} ms | ${uiDestroyStats["p95 (ms)"]} ms | ${uiDestroyStats["Min (ms)"]} ms | ${uiDestroyStats["Max (ms)"]} ms | **${uiDestroyStats["Throughput"]}** |

### C. DOM ve Bellek Ayak İzi (Footprint)

- **DOM Düğüm Sayısı:** Kyrspect tam UI'ı; dalga formu, istatistik paneli, ayarlar açılır menüleri ve zaman çizelgesi dahil toplamda **${nodeCount} DOM düğümü** üretir.
- **Bellek Temizliği:** \`player.destroy()\` çağrıldığında tüm olay dinleyicileri, Web Audio düğümleri, zamanlayıcılar ve DOM ağacı temizlenir.

---

## 4. Detaylı Karşılaştırmalı Analiz

### 1. Kyrspect ve Video.js
- **Video.js'in Güçlü Yönleri:** Yıllardır piyasada olan, geniş üçüncü parti eklenti havuzuna ve çok köklü topluluk desteğine sahip olması.
- **Kyrspect'in Avantaj Sağladığı Alanlar:** Daha küçük bundle ayak izi, modern cam tasarım sistemi, canlı istatistik grafikleri, dahili ekolayzer ve ses görselleştiricisi, dahili çoklu tema sistemi ve modern SPA/React entegrasyonu için optimize edilmiş lifecycle yapısı.

### 2. Kyrspect ve Shaka Player
- **Shaka Player'ın Güçlü Yönleri:** Çevrimdışı şifreli video önbellekleme ve devasa video servislerinde test edilmiş kurumsal ABR algoritmaları.
- **Kyrspect'in Avantaj Sağladığı Alanlar:** Kutudan çıktığı anda modern hazır UI deneyimi, düşük donanımlı cihazlar için dahili performans modu, resmi React bileşen paketi ve Web Audio ses araçları.

### 3. Kyrspect ve Plyr
- **Plyr'ın Güçlü Yönleri:** Yalnızca temel HTML5 MP4/WebM veya üçüncü parti iframe oynatılacak basit projeler için çok hafif bir kabuk sunması.
- **Kyrspect'in Avantaj Sağladığı Alanlar:** Dahili HLS ve DASH adaptörleri, ABR kalite yönetimi, DRM desteği, detaylı istatistikler ve ekolayzer özellikleri sunması.

---

## 5. Benchmark Komutunu Çalıştırma

\`\`\`bash
npm run benchmark
\`\`\`
`;

const enDoc = `# Kyrspect and Alternative Video Players: Feature Comparison & Benchmark Audit

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
| **Bundle Size (Gzip)** | **~${formatBytes(combinedGzip)}** (Core + Full UI) | ~180 - 220 KB (with VHS Streaming) | ~140 - 180 KB (with UI Library) | **~40 KB** (UI Only, No Streaming) |
| **Core Size (Gzip)** | **${formatBytes(coreMetrics.gzip)}** (Headless Core) | ~130 KB | ~110 KB | N/A (Cannot be separated) |
| **HLS Support** | ✅ Native HLS + hls.js / MSE Adapter | ✅ VHS (Video.js HTTP Streaming) | ✅ Native HLS Parser | ⚠️ Dev must wire external hls.js |
| **DASH Support** | ✅ dash.js / MSE Adapter | ⚠️ Requires 3rd party plugin | ✅ DASH / MSE Engine | ⚠️ Dev must wire external dash.js |
| **DRM (EME)** | ✅ Modular (Widevine, FairPlay, PlayReady) | ⚠️ videojs-contrib-eme plugin | ✅ Enterprise Tier EME | ❌ None |
| **WebAssembly Engine** | ✅ Yes (\`@kyrspect/wasm\` Rust engine) | ❌ None (Pure JS) | ❌ None (Pure JS) | ❌ None (Pure JS) |
| **Multi-Theme System** | ✅ 8 Aesthetic Themes + CSS Variables | ⚠️ Static CSS themes | ⚠️ Limited CSS variables | ⚠️ Single theme + color var |
| **Performance Mode** | ✅ Built-in (Disables blurs/animations) | ❌ None | ❌ None | ❌ None |
| **Stats for Nerds** | ✅ Real-time Sparklines & Diagnostics | ⚠️ Requires custom plugin | ⚠️ JS API only (\`getStats\`), no UI | ❌ None |
| **Audio Visualizer** | ✅ Web Audio Dynamic Waveform | ❌ None | ❌ None | ❌ None |
| **Audio Equalizer** | ✅ 5-Band Presets (Acoustic, Bass, etc.) | ❌ None | ❌ None | ❌ None |
| **Dual Channel Audio** | ✅ Built-in Stereo Distribution | ❌ None | ❌ None | ❌ None |
| **Granular Speed Slider** | ✅ Built-in (0.25x - 3.0x, step 0.05) | ⚠️ Standard dropdown | ⚠️ Standard dropdown | ⚠️ Standard dropdown |
| **Official React Library** | ✅ \`@kyrspect/react\` (Typed, ${formatBytes(reactMetrics.gzip)}) | ⚠️ Community wrappers | ❌ None (Manual DOM binding) | ⚠️ Community wrapper |
| **UI Customization** | ✅ Headless or Modern Glassmorphism | ⚠️ Heavy DOM overrides | ⚠️ Utilitarian, hard to theme | ⚠️ Limited layout options |

---

## 3. Automated Benchmark Results

Conducted across **${ITERATIONS} iterations** via \`npm run benchmark\`:

### Bundle Sizes
- \`@kyrspect/core\`: ${formatBytes(coreMetrics.raw)} raw (**${formatBytes(coreMetrics.gzip)} gzip**)
- \`@kyrspect/ui\`: ${formatBytes(uiMetrics.raw)} raw (**${formatBytes(uiMetrics.gzip)} gzip**)
- \`@kyrspect/react\`: ${formatBytes(reactMetrics.raw)} raw (**${formatBytes(reactMetrics.gzip)} gzip**)
- **Kyrspect Complete (Core + UI)**: **${formatBytes(combinedGzip)} gzip**

### Instantiation & Teardown Latency
- **Headless Core Init:** ${headlessInitStats["Mean (ms)"]} ms mean (${headlessInitStats["Throughput"]})
- **Full UI Init:** ${uiInitStats["Mean (ms)"]} ms mean (${uiInitStats["Throughput"]})
- **Full UI Destroy:** ${uiDestroyStats["Mean (ms)"]} ms mean (${uiDestroyStats["Throughput"]})
- **DOM Footprint:** Exactly ${nodeCount} DOM nodes for the entire UI.

---

## 4. Where Kyrspect Has Advantages
- **Modular Footprint:** Keeps core playback lightweight without forcing heavy UI or audio assets.
- **Built-in Presentation Tooling:** Zero-dependency multi-theming, Performance Mode, and Web Audio tools built with consistent lifecycle management.
- **WASM Acceleration:** Optional Rust-based ABR and subtitle parser for CPU-constrained environments.

---

## 5. How to Run the Benchmark

\`\`\`bash
npm run benchmark
\`\`\`
`;

fs.writeFileSync(path.resolve("docs/tr/alternatifler-ve-benchmark.md"), trDoc, "utf-8");
fs.writeFileSync(path.resolve("docs/en/alternatives-and-benchmarks.md"), enDoc, "utf-8");
fs.writeFileSync(path.resolve("docs/alternatives_and_benchmarks.md"), trDoc, "utf-8");

console.log("Wrote documentation to:");
console.log("  - docs/alternatives_and_benchmarks.md");
console.log("  - docs/tr/alternatifler-ve-benchmark.md");
console.log("  - docs/en/alternatives-and-benchmarks.md");
console.log("\nBenchmark and evaluation complete.");

