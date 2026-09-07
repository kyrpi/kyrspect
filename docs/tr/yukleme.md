# Başlangıç ve yükleme süresi

Kyrspect, varsayılan (şifresiz) yolu kısa tutar. Aşağıdakiler bilinçli seçimlerdir; DRM gerçekten tanımlıysa güvenlik adımları atlanmaz.

## `@kyrspect/core`

- **hls.js** yalnızca HLS kaynağı MSE motorunu kullanınca yüklenir.
- **dash.js** yalnızca DASH kaynağı oynatılınca yüklenir.
- Progressive MP4 / WebM / MediaStream bu kütüphaneleri indirmez.
- `DrmManager` ve EME kancaları yalnızca lisans URL’si varken oluşur.
- `getCapabilities()` son sonucu önbelleğe alır; CDM sorgusu yalnızca `{ drm: true }` ile çalışır. Video codec probe’ları paraleldir.

## `@kyrspect/wasm`

- Arayüz, WASM modülünü beklemeden bağlanır.
- HLS / DASH adaptörleri ilk ihtiyaçta oluşturulur.
- İstatistik / ABR aralıkları WASM köprüsü hazır olunca başlar.
- Kaynak türü (HLS, DASH, native) MIME ve `.m3u8` / `.mpd` ile JavaScript’te çözülür. WASM `analyzeSource` yalnızca URL’de kullanılabilir ipucu yoksa çalışır.
- `ready`, arayüz bağlandıktan ve isteğe bağlı ilk `src` yüklemesinden sonra yayınlanır. WASM ABR ve telemetri arka planda yetişir.

Bu yollar için tekrarlanabilir bir benchmark [TODO.md](../../TODO.md) içinde takip edilir.
