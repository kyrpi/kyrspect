# Mimari ve Sistem Tasarımı

Kyrspect; varsayılan oynatma döngüsünde sıfır harici bağımlılık barındıran hafif bir mikro-çekirdek (`@kyrspect/core`), isteğe bağlı WebAssembly hızlandırma motoru (`@kyrspect/wasm`), modüler bir Web Audio ses grafiği ve yüksek performanslı modern bir kullanıcı arayüzü (`@kyrspect/ui`) etrafında tasarlanmıştır.

---

## Genel Mimari Şema

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Kyrspect UI Katmanı                             │
│  ├── Kontroller, Menüler, Zaman Çizelgesi & Hassas Hız Slider (0.05)   │
│  ├── 8 Dahili Estetik Tema (Dracula, Nord, Cyberpunk, Sunset vb.)      │
│  ├── Performans Modu Motoru (Sıfır blur, düşük donanım tasarrufu)      │
│  ├── Canlı Stats for Nerds Paneli (Sparkline grafikler, FPS, Bitrate)  │
│  └── Ses Görselleştirici (Waveform canvas) & Ekolayzer Kontrolleri     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Kyrspect Çekirdeği (@kyrspect/core)                   │
│  ├── Durum Makinesi & Tip Güvenli EventEmitter Olay Döngüsü            │
│  ├── Gelişmiş Ses Alt Sistemi (Web Audio API Grafiği)                  │
│  │   ├── 5-Bant BiquadFilter Parametrik Ekolayzer                      │
│  │   ├── Çift Kanallı Stereo / Mono Ses Dağıtıcısı                     │
│  │   └── Hızlı Fourier Dönüşümü (FFT) Frekans Analizörü                │
│  ├── Kaynak Çözümleme & MIME Tespiti                                   │
│  ├── Yetenek Önbelleği & Engellemeyen CDM Taraması                     │
│  └── İsteğe Bağlı DRM Yöneticisi (Widevine, PlayReady, FairPlay)       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼──────────────┐   ┌─────────────▼───────────────────┐
│       Oynatma Adaptörleri        │   │  WebAssembly Motoru (Rust FFI)  │
│  ├── HlsPlaybackAdapter          │   │  ├── EWMA Bant Genişliği Tahmini│
│  │   (Yerel HLS veya hls.js MSE) │   │  ├── Canlı Drift Senkronizasyonu│
│  ├── DashPlaybackAdapter         │   │  ├── Canlı Telemetri İstatistiği│
│  │   (dash.js MSE Motoru)        │   │  └── WebVTT İkili Arama Motoru  │
│  └── Progressive / MediaStream   │   └─────────────────────────────────┘
└──────────────────────────────────┘
```

---

## Temel Alt Sistemler

### 1. Headless Çekirdek (`@kyrspect/core`)
- **Framework Bağımsızlığı:** React, Vue veya doğrudan DOM UI bağımlılıkları olmadan bağımsız çalışabilir. İster headless (UI'sız) ister özel UI tasarımlarıyla entegre edilebilir.
- **Olay Döngüsü:** Bellek sızıntısı üretmeyen tip güvenli olay dinleme altyapısı.
- **Tembel Yükleme (Lazy Loading):** hls.js ve dash.js kütüphaneleri yalnızca HLS veya DASH akışı oynatılacağı zaman dinamik olarak yüklenir. Düz MP4/WebM videoları sıfır kütüphane ek yüküyle oynatılır.
- **İsteğe Bağlı DRM:** Lisans URL'si yapılandırılmadığı sürece DRM yöneticisi (`DrmManager`) oluşturulmaz ve EME kancaları devreye girmez.

### 2. Gelişmiş Ses Alt Sistemi (`AudioEnhancer`)
- `AudioContext` ve `createMediaElementSource` üzerinden HTMLMediaElement'e bağlanır.
- **5-Bant Parametrik Ekolayzer:** Akustik, bas artırıcı, bas düşürücü, elektronik, rock ve vokal profilleri için kalibre edilmiş 5 adet `BiquadFilterNode` katmanı sunar.
- **Çift Kanallı Stereo Ses:** Tek kanallı veya dengesiz ses kayıtlarını dengelemek için `ChannelSplitterNode` ve `ChannelMergerNode` düğümlerini kullanır.
- **Gerçek Zamanlı Dalga Formu Görselleştirici:** `AnalyserNode.getByteFrequencyData()` ile canlı frekans dalga formunu ekrana çizer.

### 3. Kullanıcı Arayüzü ve Tema Sistemi (`@kyrspect/ui`)
- **8 Özel Tema:** `default`, `dracula`, `nord`, `cyberpunk`, `sunset`, `emerald`, `oled`, `minimal` temaları CSS değişkenleri üzerinden canlı değiştirilebilir.
- **Performans Modu:** Düşük donanımlı telefonlar veya pil tasarrufu için cam efektlerini (`backdrop-filter: blur()`), ağır gölgeleri ve geçiş animasyonlarını anında kapatır.
- **Hafif DOM:** Tüm oynatıcı bileşenleri dahil toplamda yalnızca **63 DOM düğümü** üretir.

### 4. WebAssembly Hızlandırması (`@kyrspect/wasm`)
- **Sıfır Ayırma ile Altyazı Arama:** WebVTT zaman çizelgesinde $O(\log N)$ sürede ikili arama.
- **Çift EWMA ABR:** Hızlı ($\alpha=0.3$) ve yavaş ($\alpha=0.05$) katsayılarla ağ dalgalanmalarında titremeyi önleyen akıllı kalite seçimi.
- **Canlı Yayın Drift Düzeltmesi:** $0.95\times$ ve $1.05\times$ mikro hızlarla ses perdesini bozmadan yayını canlı uçta tutma.

---

## Mimari Yol Haritası ve Gelecek Odak

[TODO.md](../../TODO.md) dokümanında belirtilen açık işler doğrultusunda odaklanılacak ana alanlar:

### 1. DASH Güçlendirmesi ve Dayanıklılık
- **Segment Tampon Yönetimi:** Hızlı bant genişliği düşüşlerinde DASH segment tamponlama stratejilerinin güçlendirilmesi.
- **Dinamik MPD ve Canlı Senkronizasyon:** Canlı DASH yayınlarında sunucu zaman kaymasına (`SegmentTemplate` / `SegmentTimeline`) karşı ek koruma.
- **Çoklu Codec Adaptasyonu:** Farklı ses/video codec kümeleri arasında dinamik kanal geçişleri.
- **DASH Yük Devretme (Failover) & Multi-CDN:** Ağ kesintilerinde otomatik yedek `baseURL` geçişi.
- **dash.js v5 Entegrasyonu:** dash.js iç telemetrisinin doğrudan Kyrspect teşhis paneline aktarılması.

### 2. Paket Boyutu ve Paketleme Optimizasyonu
- **Dinamik Panel Yükleme (Bundle Splitting):** Ağır UI alt panellerinin (Stats for Nerds, Audio Visualizer, Ekolayzer) yalnızca tıklandığında talep üzerine (lazy) yüklenmesi.
- **Paket Boyutu Hedefi:** SVG ikonların ve CSS kurallarının optimize edilerek tam paketin (Core + UI) Gzip boyutunun 50 KB altına çekilmesi.
- **Tree-Shaking Sınırları:** Paket dışa aktarımlarının (exports) bağımsız modül kullanımını en üst düzeye çıkaracak şekilde iyileştirilmesi.
