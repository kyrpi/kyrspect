# Kyrspect vs En Güçlü 3 Alternatif: Özellik Kıyaslaması ve Benchmark Raporu

Bu doküman, **Kyrspect** video oynatıcısının web video ekosistemindeki **en güçlü 3 alternatifi** ile kapsamlı teknik kıyaslamasını, mimari farklarını, özellik matrisini ve nesnel performans (benchmark) test sonuçlarını içermektedir.

---

## 1. Tespit Edilen En Güçlü 3 Alternatif

Web video oynatıcı pazarında açık kaynak ve endüstri standardı olarak öne çıkan en güçlü 3 oyuncu tespit edilmiştir:

1. **Video.js (Brightcove / Açık Kaynak Topluluk)**:
   - **Konum:** Web video tarihinin en köklü, en yaygın kullanılan ve en geniş eklenti kütüphanesine sahip amiral gemisi oynatıcısı (~37.500+ GitHub Stars, milyonlarca haftalık npm indirmesi).
   - **Karakter:** Eklenti zengini, geniş uyumluluk sağlayan ancak 2010'lu yılların monolitik bileşen hiyerarşisine dayanan ağır bir yapı.
2. **Shaka Player (Google)**:
   - **Konum:** Google ve YouTube Media ekibi tarafından geliştirilen, kurumsal yayın ve streaming (DASH / HLS / DRM) standardı (~7.200+ GitHub Stars).
   - **Karakter:** Kusursuz ABR (Adaptive Bitrate) algoritması, üst düzey DRM yeteneği, çevrimdışı önbellekleme; ancak işlevsel ve ham bir kullanıcı arayüzü.
3. **Plyr (Sam Potts)**:
   - **Konum:** Web tasarımcıları ve sade web siteleri arasında modern, temiz ve minimal tasarımıyla en sevilen hafif oynatıcı (~25.000+ GitHub Stars).
   - **Karakter:** Hafif ve görsel olarak şık; ancak dahili streaming (HLS/DASH) motoru içermeyen, gelişmiş ses/görüntü kontrolleri bulunmayan temel bir HTML5 medya kabuğu.

---

## 2. Özellik Kıyaslama Matrisi (Feature Comparison)

| Özellik / Kriter | Kyrspect | Video.js (v8.x) | Shaka Player (v4.x) | Plyr (v3.x) |
|---|---|---|---|---|
| **Temel Mimari** | Modüler Mikro-Çekirdek + Headless UI + Rust WASM | Monolitik Bileşen Ağacı (Eski OOP) | Streaming Motoru + Temel UI Overlay | Temel HTML5 Video Sarmalayıcı |
| **Paket Boyutu (Gzip)** | **~57.5 KB** (Çekirdek + Tam UI) | ~180 - 220 KB (VHS Streaming ile) | ~140 - 180 KB (UI Kütüphanesi ile) | **~40 KB** (Sadece UI, Streaming Yok) |
| **Çekirdek (Core) Boyutu** | **25.3 KB** (Headless Çekirdek) | ~130 KB | ~110 KB | N/A (Ayrılamaz) |
| **HLS Desteği** | ✅ Yerel + hls.js Adaptörü | ✅ VHS (Video.js HTTP Streaming) | ✅ Dahili HLS Ayrıştırıcı | ⚠️ Harici hls.js kodu gerekir |
| **DASH Desteği** | ✅ Yerel + dash.js Adaptörü | ⚠️ Eklenti gerekir | ✅ Endüstri lideri DASH ABR | ⚠️ Harici dash.js kodu gerekir |
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
| `@kyrspect/core` | 113.4 KB | **25.3 KB** | Oynatma motoru, adaptörler, durum yönetimi, olay döngüsü |
| `@kyrspect/ui` | 139.5 KB | **32.5 KB** | Tam arayüz, 8 tema, tüm SVG ikonlar, istatistik paneli, ekolayzer, 6 dil |
| `@kyrspect/react` | 5.9 KB | **1.7 KB** | React sarmalayıcısı ve reaktif kancalar (hooks) |
| **Kyrspect Tam Paket (Core + UI)** | **252.9 KB** | **57.5 KB** | **Video.js'in ~1/4'ü, Shaka Player'ın ~1/3'ü boyutunda!** |

### B. Başlatma ve İmha Gecikmeleri (Instantiation & Teardown Latency)

*500 döngülük soğuk ve sıcak başlatma/yıkım ölçümleri:*

| Operasyon | Ortalama (Mean) | Medyan (p50) | %95 Dilim (p95) | En Hızlı (Min) | En Yavaş (Max) | İşlem Hacmi (Throughput) |
|---|---|---|---|---|---|---|
| **Headless Çekirdek Başlatma** | 0.313 ms | 0.251 ms | 0.418 ms | 0.215 ms | 10.423 ms | **3.192 ops/sec** |
| **Headless Çekirdek İmha (Destroy)** | 0.070 ms | 0.054 ms | 0.119 ms | 0.042 ms | 1.488 ms | **14.382 ops/sec** |
| **Tam UI Başlatma (DOM + Ses + Temalar)** | 2.778 ms | 2.375 ms | 4.919 ms | 1.818 ms | 27.637 ms | **360 ops/sec** |
| **Tam UI İmha (Temizlik)** | 0.195 ms | 0.161 ms | 0.261 ms | 0.132 ms | 2.723 ms | **5.140 ops/sec** |

### C. DOM ve Bellek Ayak İzi (Footprint)

- **DOM Düğüm Sayısı:** Kyrspect tam UI'ı; dalga formu, istatistik paneli, ayarlar açılır menüleri ve zaman çizelgesi dahil toplamda **sadece 63 DOM düğümü** üretir.
- **Bellek Temizliği:** `player.destroy()` çağrıldığında tüm olay dinleyicileri, Web Audio düğümleri, zamanlayıcılar ve DOM ağacı sıfır sızıntı ile bellekten atılır.

---

## 4. Detaylı Karşılaştırmalı Analiz

### 1. Kyrspect vs Video.js
- **Neden Video.js Tercih Edilir?** Yıllardır piyasada olan, yüzlerce hazır üçüncü parti eklentiye (örneğin Google IMA reklam entegrasyonu) ve çok geniş topluluk desteğine ihtiyaç duyulan projeler.
- **Neden Kyrspect Daha Üstün?** Video.js'in paket boyutu (~200 KB gzip) Kyrspect'in yaklaşık 4 katıdır. Video.js, React veya modern SPA framework'leri ile çalışırken doğrudan DOM hiyerarşisi yüzünden çakışmalar üretir. Kyrspect modern cam tasarımı, canlı istatistik grafikleri, dahili ekolayzer ve ses görselleştiricisi, 8 teması ve süper hafif mimarisiyle açık ara öndedir.

### 2. Kyrspect vs Shaka Player
- **Neden Shaka Player Tercih Edilir?** Çok yüksek güvenlikli kurumsal DRM projeleri (Widevine Persistent Licenses), çevrimdışı şifreli video indirme gereksinimleri ve devasa video platformu ölçeğinde karmaşık ABR algoritmaları.
- **Neden Kyrspect Daha Üstün?** Shaka Player'ın arayüzü oldukça hamdır ve modern bir streaming platformu hissi vermez; projelerde sıfırdan UI inşa etmek gerekir. Kyrspect ise hem HLS/DASH adaptörleriyle yüksek performanslı yayın sunar hem de kutudan çıktığı anda büyüleyici bir UI deneyimi, düşük donanımlı cihazlar için performans modu ve React entegrasyonu sağlar.

### 3. Kyrspect vs Plyr
- **Neden Plyr Tercih Edilir?** Yalnızca MP4/WebM veya YouTube/Vimeo iframe'i oynatılacak, hiçbir uyarlanabilir streaming (HLS/DASH) gerektirmeyen çok basit blog ya da açılış sayfaları.
- **Neden Kyrspect Daha Üstün?** Plyr'da dahili HLS/DASH streaming motoru yoktur; geliştirici bunu manuel kurmak zorundadır. Ayrıca Plyr gelişmiş istatistikler, ses dalgası, ekolayzer, performans modu ve dinamik çoklu tema sisteminden yoksundur. Kyrspect ise neredeyse aynı hafiflikte tam donanımlı profesyonel bir streaming oynatıcısı sunar.

---

## 5. Benchmark Komutunu Çalıştırma

Bu testleri yerel ortamınızda dilediğiniz an tekrarlamak için:

```bash
npm run benchmark
```

Gelecek performans ve paket optimizasyonu hedefleri (paket boyutunu 50 KB gzip altına çekme, dinamik panel yükleme ve DASH güçlendirmesi) [TODO.md](../TODO.md) içinde takip edilmektedir.

