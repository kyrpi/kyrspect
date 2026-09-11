# TODO

Kyrspect geliştirme yol haritası ve açık işler. Tamamlanan maddeleri aşağıya taşıyın.

## Açık / Open (Gelecek Planlar)

### 1. DASH Güçlendirmesi (DASH Hardening & Streaming Resiliency)
- **Gelişmiş DASH ABR & Segment Yönetimi**: Ağ dalgalanmalarına karşı segment buffer stratejilerinin sertleştirilmesi ve dynamic throughput kestirimi.
- **Canlı Yayın Senkronizasyonu**: Canlı DASH akışlarında zaman kayması (live drift) ve dinamik MPD (`SegmentTemplate`, `SegmentTimeline`) senkronizasyonunun güçlendirilmesi.
- **Çoklu Ses ve Altyazı Adaptasyonu**: Farklı dillerdeki ses ve altyazı akışları arasında kesintisiz geçiş, multi-codec adaptation set desteği.
- **DASH Failover & Multi-CDN**: Segment indirme hatalarında otomatik yedek `baseURL` / CDN kaynağına geçiş desteği.
- **dash.js v5 ve Telemetri**: dash.js v5 yükseltme doğrulamaları ve DASH'a özel metriklerin (tampon doluluğu, istek süreleri, indirme hızları) "Stats for Nerds" paneline aktarılması.

### 2. Paket Boyutu ve Paketleme Optimizasyonu (Package & Bundle Optimization)
- **Lazy-Loaded Paneller & Bundle Splitting**: UI paketindeki ağır panellerin (Stats for Nerds, Audio Visualizer, Ekolayzer) talep anında (on-demand/lazy) dinamik yüklenmesi.
- **Paket Boyutunun Küçültülmesi**: CSS ve inline SVG ikon setinin optimize edilmesi, üretim paketinin (Core + UI) Gzip boyutunun 50 KB altına çekilmesi.
- **Bağımsız Dağıtım Sınırları**: `@kyrspect/core`, `@kyrspect/ui`, `@kyrspect/react` ve `@kyrspect/wasm` modül sınırlarının ve tree-shaking yeteneklerinin denetlenmesi.
- **Derleme Ayarları (tsup / esbuild)**: Minification, Dead Code Elimination (DCE) ve modern target yapılandırmalarının inceltilmesi.

---

## Tamamlandı / Done

- **Kapsamlı Benchmark ve Alternatifler Kıyaslama Raporu**:
  - `scripts/benchmark.mjs` ile 500 döngülük otomatik benchmark süiti (`npm run benchmark`).
  - Video.js, Shaka Player ve Plyr ile nesnel paket boyutu, başlatma gecikmesi (0.313 ms core, 2.778 ms UI) ve bellek kıyaslamaları.
  - Detaylı İngilizce ve Türkçe karşılaştırma raporları (`docs/en/alternatives-and-benchmarks.md`, `docs/tr/alternatifler-ve-benchmark.md`).
- **8 Dahili Estetik Tema ve Tema Seçici**:
  - `cyberpunk`, `nord`, `dracula`, `sunset`, `emerald`, `oled`, `minimal`, `default` temaları.
  - Dinamik CSS değişkenleri, runtime tema değiştirme (`setTheme`) ve kalıcılık desteği.
- **Performans Modu (Performance Mode)**:
  - Düşük donanımlı cihazlar ve pil tasarrufu için tüm cam (backdrop-blur) efektlerini, gölgeleri ve geçiş animasyonlarını tek bayrakla (`performanceMode: true`, `setPerformanceMode`) kapatabilme.
- **Gelişmiş Ses Özellikleri ve Ekolayzer**:
  - Web Audio API tabanlı 5-bant parametrik ekolayzer hazır ayarları (Acoustic, Bass Booster, Bass Reducer, Electronic, Rock, Vocal vb.).
  - Canlı Web Audio frekans dalga formu görselleştiricisi (waveform canvas).
  - Stereo / Dual-channel ses birleştirici modu.
- **Hassas Oynatma Hızı Ayarı**:
  - 0.25x - 3.0x arasında 0.05 adımlı hassas slider ve -/+ butonları.
- **Stats for Nerds Teşhis Paneli**:
  - Canlı sparkline grafikleri, çözünürlük, bant genişliği, düşen kare (dropped frames) ve tampon sağlık göstergeleri.
- **İsteğe Bağlı DRM**:
  - `DrmManager` yalnızca lisans URL’si tanımlandığında devreye girer (Widevine, PlayReady, FairPlay).
- **hls.js ve dash.js Tembel Yükleme (Lazy-Loading)**:
  - Oynatılan medya türüne göre kütüphanelerin yalnızca gerektiğinde yüklenmesi.
- **Capability Probe Optimizasyonu**:
  - CDM probe'larını atlayarak anında capability önbellekleme (`getCapabilities({ drm: true })`).
- **WebAssembly Optimizasyonları**:
  - JS-öncelikli kaynak tespiti, gecikmeli WASM başlatma ve isteğe bağlı DRM entegrasyonu.
- **Çoklu Dil (i18n) Desteği**:
  - İngilizce, Türkçe, Almanca, Fransızca, İspanyolca ve Portekizce dil paketleri.
- **Resmi React Sarmalayıcısı**:
  - Tip güvenli, reaktif kancalara sahip `@kyrspect/react` paketi.
