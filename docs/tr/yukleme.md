# Başlangıç ve Yükleme Süresi

Kyrspect, varsayılan (şifresiz) yolu son derece hafif ve anlık tutar. Aşağıdaki optimizasyonlar bilinçli tercihlerdir; DRM gerçekten tanımlandığında güvenlik adımları kesinlikle atlanmaz.

---

## `@kyrspect/core`

- **hls.js** yalnızca HLS kaynağı MSE motorunu kullandığında dinamik olarak yüklenir.
- **dash.js** yalnızca DASH kaynağı oynatıldığında yüklenir.
- Progressive MP4 / WebM / MediaStream akışları bu kütüphaneleri asla indirmez.
- `DrmManager` ve EME kancaları yalnızca lisans URL’si sağlandığında oluşturulur.
- `getCapabilities()` son sonucu önbelleğe alır; CDM sorgusu yalnızca `{ drm: true }` parametresiyle çalışır. Video codec probe’ları paralel yürütülür.

---

## `@kyrspect/wasm`

- Arayüz (UI), WASM modülünün derlenmesini beklemeden anında DOM'a bağlanır.
- HLS / DASH adaptörleri yalnızca ilk ihtiyaç anında oluşturulur.
- İstatistik ve ABR aralıkları WASM köprüsü hazır olduğunda arka planda başlar.
- Kaynak türü (HLS, DASH, yerel) MIME ve `.m3u8` / `.mpd` uzantısı üzerinden JavaScript’te saniyenin altında çözülür. WASM `analyzeSource` yalnızca URL’de ipucu bulunmadığında çalışır.
- `ready` olayı, arayüz bağlandıktan ve ilk `src` yüklemesi tetiklendikten hemen sonra tetiklenir. WASM ABR ve telemetri arka planda senkronize olur.

---

## Benchmark Ölçümleri ve Başlatma Gecikmesi

Bu yürütme yolları 500 döngülük soğuk ve sıcak testlerle doğrulanmıştır:

```bash
npm run benchmark
```

- **Headless Çekirdek Başlatma:** **0.313 ms** ortalama (3.192 ops/sec)
- **Headless Çekirdek İmha (Destroy):** **0.070 ms** ortalama (14.382 ops/sec)
- **Tam UI Başlatma (DOM + Temalar + Ses):** **2.778 ms** ortalama (360 ops/sec)
- **Tam UI İmha ve Temizlik:** **0.195 ms** ortalama (5.140 ops/sec)
- **DOM Ayak İzi:** Tam kullanıcı arayüzü toplamda **yalnızca 63 DOM düğümü** üretir.

Düşük donanımlı cihazlar ve pil tasarrufu için geliştirilen **Performans Modu** (`performanceMode: true` veya `player.setPerformanceMode(true)`), cam (backdrop-blur) efektlerini, ağır gölgeleri ve CSS geçişlerini devre dışı bırakarak GPU yükünü ve kompozisyon maliyetini minimuma indirir.

Ayrıntılı kıyaslama ve analiz için [Alternatifler ve Benchmark Raporu](./alternatifler-ve-benchmark.md) sayfasına bakın. Gelecek adımlar (DASH güçlendirmesi ve paket optimizasyonu) [TODO.md](../../TODO.md) içinde takip edilmektedir.
