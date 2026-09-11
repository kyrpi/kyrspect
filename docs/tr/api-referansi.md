# API Referansı

`@kyrspect/core` ve `@kyrspect/wasm`, tüm framework'lerle uyumlu güçlü ve tip güvenli bir oynatıcı arayüzü sunar.

---

## Oynatıcı Seçenekleri (`KyrspectOptions` / `KyrspectWasmOptions`)

```typescript
interface KyrspectOptions {
  src?: string | { src: string; type?: string; isLive?: boolean; drm?: DrmOptions };
  drm?: DrmOptions; // isteğe bağlı; yoksa varsayılan oynatma, EME yok
  autoplay?: boolean;
  muted?: boolean;
  volume?: number; // 0.0 - 1.0 arası ses seviyesi
  loop?: boolean;
  playsinline?: boolean;
  preload?: "none" | "metadata" | "auto";
  controls?: boolean | UIControlsConfig;
  theme?: ThemeInput; // 'dracula' | 'cyberpunk' | 'nord' | 'sunset' | 'emerald' | 'oled' | 'minimal' | 'default' | UITheme
  performanceMode?: boolean; // düşük donanımlı cihazlar için blur ve geçişleri kapatır
  live?: {
    targetLatency?: number; // Hedeflenen canlı yayın gecikmesi (sn, varsayılan: 3.0)
    maxLatency?: number;    // Yakalama modunun devreye gireceği azami gecikme (sn, varsayılan: 10.0)
    lowLatency?: boolean;
    dvr?: boolean;
  };
  ui?: {
    language?: "tr" | "en" | "de" | "fr" | "es" | "pt";
    theme?: ThemeInput;
    performanceMode?: boolean;
    audioVisualizer?: boolean;
    statsFields?: StatsField[];
    layout?: "standard" | "reels";
    aspectRatio?: "auto" | number | string;
  };
  advanced?: {
    audio?: {
      dualChannel?: boolean;
      equalizer?: EqualizerPresetId; // 'flat' | 'acoustic' | 'bass-booster' | 'bass-reducer' | 'electronic' | 'rock' | 'vocal'
    };
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
- `stop(): void` - Oynatmayı durdurur ve başa sarar (canlı yayın değilse).
- `seek(seconds: number): void` - Belirtilen saniyeye atlar.
- `seekToLiveEdge(): void` - Canlı yayının en güncel anına atlar.
- `reload(): Promise<void>` - Mevcut kaynağı yeniden yükler.

### Ses Ayarları
- `setVolume(value: number): void` - Sesi ayarlar (0.0 ile 1.0 arası).
- `mute(): void` - Sesi kapatır.
- `unmute(): void` - Sesi açar.
- `setPlaybackRate(rate: number): void` - Oynatma hızını ayarlar (0.25x - 16.0x; arayüz slider'ı 0.05 adımlarla hassas ayar sunar).

### Gelişmiş Ses, Ekolayzer & Görselleştirici
- `setAudioVisualizer(visible: boolean): void` - Gerçek zamanlı Web Audio ses dalga formu (waveform) katmanını açar veya kapatır.
- `isAudioVisualizerVisible(): boolean` - Ses görselleştiricisinin açık olup olmadığını döner.
- `setDualChannelAudio(enabled: boolean): void` - İki kanallı stereo ses birleştirmeyi etkinleştirir/kapatır.
- `isDualChannelAudioEnabled(): boolean` - İki kanallı sesin aktif olup olmadığını döner.
- `setEqualizerPreset(preset: EqualizerPresetId): void` - 5-bant parametrik ekolayzer profilini uygular (`flat`, `acoustic`, `bass-booster`, `bass-reducer`, `electronic`, `rock`, `vocal`).
- `getEqualizerPreset(): EqualizerPresetId` - Aktif ekolayzer profilinin kimliğini döner.

### Tema ve Performans Modu
- `setTheme(theme: ThemeInput): void` - Oynatıcı temasını anında değiştirir (`default`, `dracula`, `nord`, `cyberpunk`, `sunset`, `emerald`, `oled`, `minimal` veya özel CSS değişken objesi).
- `getTheme(): UITheme | null` - Aktif temanın stil değişkenlerini döner.
- `getThemeName(): string` - Aktif temanın adını döner.
- `setPerformanceMode(enabled: boolean): void` - Performans modunu açar/kapatır (düşük donanımlı cihazlarda maksimum akıcılık için tüm backdrop-blur efektlerini, ağır gölgeleri ve CSS geçişlerini devre dışı bırakır).
- `isPerformanceMode(): boolean` - Performans modunun açık olup olmadığını döner.

### Kalite ve ABR
- `getQualities(): UIQuality[]` - Mevcut çözünürlük/kalite basamaklarını listeler.
- `getQuality(): QualityState` - Aktif kalite seviyesini ve modunu (`auto` / `manual`) döner.
- `setQuality(level: number | "auto"): void` - Belirli bir kaliteyi seçer veya otomatik kalite seçimine geçer.
- `enableAutoQuality(): void` - Akıllı uyarlanabilir kalite (ABR) algoritmasını yeniden etkinleştirir.

### Altyazılar & Kanallar
- `parseVtt(content: string, label?: string, lang?: string, isDefault?: boolean): void` - WebVTT içeriğini doğrudan altyazı motoruna aktarır.
- `getSubtitleTracks(): UISubtitleTrack[]` - Yüklü altyazı kanallarını listeler.
- `setSubtitleTrack(id: string): void` - Belirtilen altyazı kanalını seçer.
- `disableSubtitles(): void` - Altyazıyı kapatır.
- `getAudioTracks(): AudioTrack[]` - Mevcut alternatif ses kanallarını listeler.
- `setAudioTrack(id: string): void` - Alternatif ses kanalını seçer.

### Arayüz & Telemetri
- `setLanguage(lang: string): void` - Arayüz dilini değiştirir (`tr`, `en`, `de`, `fr`, `es`, `pt`).
- `setLayout(layout: "standard" | "reels"): void` - Arayüz yerleşimini değiştirir.
- `setAspectRatio(ratio?: string | number): void` - Oynatıcı en-boy oranını günceller.
- `getStats(): PlayerStats` - Gerçek zamanlı telemetri verilerini (FPS, tampon süresi, düşen kare, tahmini bant genişliği, çözünürlük) döner.
- `destroy(): void` - Oynatıcıyı, olay dinleyicilerini, Web Audio düğümlerini ve DOM ağacını temizler.

---

## Olaylar (Events)

`player.on(event, handler)` ile dinlenebilir:

| Olay | İçerik (Payload) | Açıklama |
|---|---|---|
| `ready` | `void` | Arayüz bağlandı ve ilk kaynak yüklemesi başladı |
| `play` | `void` | Oynatma başladı |
| `pause` | `void` | Oynatma duraklatıldı |
| `playing` | `void` | Video kareleri akmaya başladı |
| `waiting` | `void` | Tamponlama / veri bekleniyor |
| `seeking` | `void` | İleri/geri sarma işlemi başladı |
| `seeked` | `void` | Sarma işlemi tamamlandı |
| `ended` | `void` | Video sonuna ulaşıldı |
| `timeupdate` | `{ currentTime, duration }` | Süre güncellendi |
| `volumechange`| `{ volume, muted }` | Ses seviyesi değişti |
| `qualitychange`| `{ quality, reason }` | Kalite seviyesi değiştirildi |
| `themechange` | `{ theme, name }` | Tema değiştirildi |
| `performancemodechange` | `{ enabled }` | Performans modu açıldı/kapandı |
| `equalizerchange` | `{ preset }` | Ekolayzer profili değişti |
| `dualchannelchange` | `{ enabled }` | Çift kanal stereo ses modu değişti |
| `cuechange` | `{ activeCues }` | Aktif altyazı değişti |
| `statsupdate` | `PlayerStats` | Gerçek zamanlı istatistik tick'i (1 saniyede bir) |
| `error` | `{ message, fatal }` | Bir hata meydana geldi |
| `destroy` | `void` | Oynatıcı bellekten silindi |

`drm` [DRM](./drm.md) sayfasında. Benchmark sonuçları [Alternatifler ve Benchmark](./alternatifler-ve-benchmark.md) sayfasında. Gelecek DASH ve paket optimizasyonu planları [TODO.md](../../TODO.md) içinde yer almaktadır.
