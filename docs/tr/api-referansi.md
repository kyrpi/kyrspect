# API Referansı

`@kyrspect/wasm`, tüm framework'lerle uyumlu güçlü ve tipli bir oynatıcı arayüzü sunar.

---

## Oynatıcı Seçenekleri (`KyrspectWasmOptions`)

```typescript
interface KyrspectWasmOptions {
  src?: string | { src: string; type?: string; isLive?: boolean; drm?: DrmOptions };
  drm?: DrmOptions; // isteğe bağlı; yoksa varsayılan oynatma, EME yok
  autoplay?: boolean;
  muted?: boolean;
  volume?: number; // 0.0 - 1.0 arası ses seviyesi
  loop?: boolean;
  playsinline?: boolean;
  preload?: "none" | "metadata" | "auto";
  controls?: boolean | UIControlsConfig;
  live?: {
    targetLatency?: number; // Hedeflenen canlı yayın gecikmesi (sn, varsayılan: 3.0)
    maxLatency?: number;    // Yakalama modunun devreye gireceği azami gecikme (sn, varsayılan: 10.0)
  };
  ui?: {
    language?: "tr" | "en" | "de" | "fr" | "es" | "pt";
    theme?: UITheme;
    statsFields?: StatsField[];
    layout?: "standard" | "reels";
    aspectRatio?: "auto" | number | string;
  };
  debug?: boolean;
  keyboard?: boolean;
}
```

---

## Metotlar

### Oynatma Kontrolleri
- `play(): Promise<void>` - Oynatmayı başlatır.
- `pause(): void` - Oynatmayı duraklatır.
- `seek(seconds: number): void` - Belirtilen saniyeye atlar.
- `seekToLiveEdge(): void` - Canlı yayının en güncel anına atlar.
- `reload(): Promise<void>` - Mevcut kaynağı yeniden yükler.

### Ses Ayarları
- `setVolume(value: number): void` - Sesi ayarlar (0.0 ile 1.0 arası).
- `mute(): void` - Sesi kapatır.
- `unmute(): void` - Sesi açar.
- `setPlaybackRate(rate: number): void` - Oynatma hızını ayarlar (0.25x - 16.0x).

### Kalite ve ABR (WebAssembly Tarafından Yönetilir)
- `getQualities(): UIQuality[]` - Mevcut çözünürlük/kalite basamaklarını listeler.
- `getQuality(): QualityState` - Aktif kalite seviyesini ve modunu (`auto` / `manual`) döner.
- `setQuality(level: number | "auto"): void` - Belirli bir kaliteyi seçer veya Wasm otomatik seçimine geçer.
- `enableAutoQuality(): void` - WebAssembly EWMA akıllı kalite algoritmasını yeniden etkinleştirir.

### Altyazılar & Kanallar
- `parseVtt(content: string, label?: string, lang?: string, isDefault?: boolean): void` - WebVTT içeriğini doğrudan Wasm altyazı motoruna aktarır.
- `getSubtitleTracks(): UISubtitleTrack[]` - Yüklü altyazı kanallarını listeler.
- `setSubtitleTrack(id: string): void` - Belirtilen altyazı kanalını seçer.
- `disableSubtitles(): void` - Altyazıyı kapatır.

### Arayüz & Telemetri
- `setTheme(theme: UITheme): void` - Canlı tema rengi ve stilini değiştirir.
- `setLanguage(lang: string): void` - Arayüz dilini değiştirir (`tr`, `en`, `de`, `fr`, `es`, `pt`).
- `getStats(): PlayerStats` - Gerçek zamanlı Wasm telemetri verilerini (FPS, tampon süresi, düşen kare, tahmini bant genişliği) döner.
- `destroy(): void` - Oynatıcıyı, olay dinleyicilerini ve Wasm bellek ayırmalarını temizler.

---

## Olaylar (Events)

`player.on(event, handler)` ile dinlenebilir:

| Olay | İçerik (Payload) | Açıklama |
|---|---|---|
| `ready` | `void` | Arayüz bağlandı ve isteğe bağlı ilk `src` yüklemesi başladı (WASM ABR hâlâ başlıyor olabilir) |
| `play` | `void` | Oynatma başladı |
| `pause` | `void` | Oynatma duraklatıldı |
| `playing` | `void` | Video kareleri akmaya başladı |
| `waiting` | `void` | Tamponlama / veri bekleniyor |
| `seeking` | `void` | İleri/geri sarma işlemi başladı |
| `seeked` | `void` | Sarma işlemi tamamlandı |
| `ended` | `void` | Video sonuna ulaşıldı |
| `timeupdate` | `{ currentTime, duration }` | Süre güncellendi |
| `volumechange`| `{ volume, muted }` | Ses seviyesi değişti |
| `qualitychange`| `{ quality, reason }` | Wasm ABR tarafından kalite seviyesi değiştirildi |
| `cuechange` | `{ activeCues }` | Wasm zaman çizelgesindeki aktif altyazı değişti |
| `statsupdate` | `PlayerStats` | Gerçek zamanlı istatistik tick'i (1 saniyede bir) |
| `error` | `{ message, fatal }` | Bir hata meydana geldi |
| `destroy` | `void` | Oynatıcı bellekten silindi |

`drm` [DRM](./drm.md) sayfasında. `load()` `.m3u8` / `.mpd` türünü WASM beklemeden çözer ([yükleme](./yukleme.md)).
