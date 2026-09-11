# Kyrspect ve Alternatif Video Oynatıcıları: Özellik Karşılaştırması ve Benchmark Raporu

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
| **Paket Boyutu (Gzip)** | **~54 KB** (Çekirdek + Tam UI) | ~180 - 220 KB (VHS Streaming ile) | ~140 - 180 KB (UI Kütüphanesi ile) | **~40 KB** (Sadece UI, Streaming Yok) |
| **Çekirdek (Core) Boyutu** | **26.2 KB** (Headless Çekirdek) | ~130 KB | ~110 KB | N/A (Ayrılamaz) |
| **HLS Desteği** | ✅ Native HLS + hls.js / MSE Adaptörü | ✅ VHS (Video.js HTTP Streaming) | ✅ Dahili HLS Ayrıştırıcı | ⚠️ Harici hls.js kodu gerekir |
| **DASH Desteği** | ✅ dash.js / MSE Adaptörü | ⚠️ Eklenti gerekir | ✅ DASH / MSE ABR motoru | ⚠️ Harici dash.js kodu gerekir |
| **DRM (EME) Entegrasyonu** | ✅ Modüler (Widevine, FairPlay, PlayReady) | ⚠️ videojs-contrib-eme eklentisi | ✅ Üst Düzey Kurumsal Entegrasyon | ❌ Desteklenmez |
| **WebAssembly Desteği** | ✅ Var (`@kyrspect/wasm` Rust motoru) | ❌ Yok (Saf JS) | ❌ Yok (Saf JS) | ❌ Yok (Saf JS) |
| **Dinamik Çoklu Tema** | ✅ 8 Estetik Tema + CSS Değişkenleri | ⚠️ Statik CSS temaları | ⚠️ Sınırlı CSS değişkenleri | ⚠️ Tek tema + renk değişkeni |
| **Performans Modu (Eski Cihaz)** | ✅ Dahili (Tüm animasyon ve blur sıfırlama) | ❌ Yok | ❌ Yok | ❌ Yok |
| **Stats for Nerds (İstatistikler)** | ✅ Canlı Sparkline Grafikler & Teşhis Paneli | ⚠️ Harici eklenti gerekir | ⚠️ Sadece JS API (`getStats`), UI yok | ❌ Yok |
| **Ses Görselleştirici (Waveform)** | ✅ Dahili Web Audio Frekans Dalgası | ❌ Yok | ❌ Yok | ❌ Yok |
| **Dahili Ses Ekolayzeri** | ✅ 5-Band Profiller (Akustik, Bas, Tiz vb.) | ❌ Yok | ❌ Yok | ❌ Yok |
| **İki Kanaldan Dinleme (Dual Channel)** | ✅ Dahili Stereo Birleştirici | ❌ Yok | ❌ Yok | ❌ Yok |
| **Hassas Hız Ayarı (-/+, Slider)** | ✅ Dahili (0.25x - 3.0x, 0.05 adımlı) | ⚠️ Standart açılır liste | ⚠️ Standart açılır liste | ⚠️ Standart açılır liste |
| **Resmi React Paketi** | ✅ `@kyrspect/react` (Tip güvenli, 1.7 KB) | ⚠️ Topluluk sarmalayıcıları (gayriresmi) | ❌ Yok (Manuel bağlama) | ⚠️ Topluluk sarmalayıcısı |
| **Arayüz Özelleştirme** | ✅ Headless veya Cam Efektli Modern UI | ⚠️ Ağır DOM manipülasyonu | ⚠️ Zor ve sınırlı stil | ⚠️ Sınırlı özelleştirme |

---

## 3. Performans ve Benchmark Sonuçları

Otomatik test süitimiz (`npm run benchmark`) tarafından **500 iterasyon** üzerinden toplanan gerçek ölçüm sonuçları:

### A. Paket Boyutları (Bundle Size Audit)

| Paket | Ham Boyut (ESM) | Gzip (Seviye 9) | Açıklama |
|---|---|---|---|
| `@kyrspect/core` | 118.1 KB | **26.2 KB** | Oynatma motoru, adaptörler, durum yönetimi, olay döngüsü |
| `@kyrspect/ui` | 122.4 KB | **28.1 KB** | Tam arayüz, 8 tema, tüm SVG ikonlar, istatistik paneli, ekolayzer, 6 dil |
| `@kyrspect/react` | 5.9 KB | **1.7 KB** | React sarmalayıcısı ve reaktif kancalar (hooks) |
| **Kyrspect Tam Paket (Core + UI)** | **240.5 KB** | **54 KB** | **Core + UI modüler dağıtımı** |

### B. Başlatma ve İmha Gecikmeleri (Instantiation & Teardown Latency)

*500 döngülük ölçümler:*

| Operasyon | Ortalama (Mean) | Medyan (p50) | %95 Dilim (p95) | En Hızlı (Min) | En Yavaş (Max) | İşlem Hacmi (Throughput) |
|---|---|---|---|---|---|---|
| **Headless Çekirdek Başlatma** | 0.247 ms | 0.222 ms | 0.316 ms | 0.198 ms | 1.931 ms | **4.048 ops/sec** |
| **Headless Çekirdek İmha (Destroy)** | 0.054 ms | 0.046 ms | 0.076 ms | 0.037 ms | 1.532 ms | **18.466 ops/sec** |
| **Tam UI Başlatma (DOM + Ses + Temalar)** | 2.486 ms | 2.132 ms | 4.367 ms | 1.750 ms | 9.865 ms | **402 ops/sec** |
| **Tam UI İmha (Temizlik)** | 0.161 ms | 0.137 ms | 0.200 ms | 0.121 ms | 2.615 ms | **6.202 ops/sec** |

### C. DOM ve Bellek Ayak İzi (Footprint)

- **DOM Düğüm Sayısı:** Kyrspect tam UI'ı; dalga formu, istatistik paneli, ayarlar açılır menüleri ve zaman çizelgesi dahil toplamda **63 DOM düğümü** üretir.
- **Bellek Temizliği:** `player.destroy()` çağrıldığında tüm olay dinleyicileri, Web Audio düğümleri, zamanlayıcılar ve DOM ağacı temizlenir.

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

```bash
npm run benchmark
```
