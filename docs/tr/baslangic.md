# Kyrspect'e Başlarken

Kyrspect, modern web uygulamaları için geliştirilmiş yüksek performanslı ve framework bağımsız bir video oynatıcı motorudur. İki uyumlu paket seçeneği sunar:
- **`@kyrspect/wasm`**: Rust ile yazılmış ve WebAssembly'ye derlenmiş yüksek performanslı çekirdek motor (EWMA ABR, düşük gecikmeli canlı yayın senkronizasyonu, WebVTT altyazı motoru ve telemetri).
- **`@kyrspect/core`**: Hafif TypeScript çekirdeği (~25 KB gzip).

Her iki motor da 8 dahili estetik tema, performans modu, Web Audio görselleştiricisi, 5-bant ekolayzer ve canlı telemetri sunan ortak `@kyrspect/ui` arayüzünü paylaşır.

---

## Kurulum

WebAssembly paketini ve arayüz bileşenlerini projenize ekleyin:

```bash
npm install @kyrspect/wasm @kyrspect/ui
```

Veya yalnızca TypeScript çekirdeğini kullanmak isterseniz:

```bash
npm install @kyrspect/core @kyrspect/ui
```

React kullanıyorsanız, resmi sarmalayıcıyı ekleyin:

```bash
npm install @kyrspect/react @kyrspect/core
```

---

## Otomatik WebAssembly Tespiti ve Kullanımı

`createPlayer` fonksiyonu, kullanıcının tarayıcısında WebAssembly desteğini otomatik olarak kontrol eder. WebAssembly destekleyen tüm modern tarayıcılarda doğrudan **Wasm motorunu** devreye alır:

```typescript
import { createPlayer, isWasmSupported } from "@kyrspect/wasm";

console.log("WebAssembly desteği mevcut mu?:", isWasmSupported());

const player = createPlayer("#player-container", {
  src: "https://example.com/video.mp4",
  autoplay: false,
  controls: true,
  ui: {
    language: "tr",
    // 8 dahili tema: 'dracula' | 'cyberpunk' | 'nord' | 'sunset' | 'emerald' | 'oled' | 'minimal' | 'default'
    theme: "dracula",
    // Düşük donanımlı cihazlar veya pil tasarrufu için performans modu:
    performanceMode: false,
    // Canlı ses frekans dalga formu görselleştiricisi:
    audioVisualizer: false,
  },
});

player.on("ready", () => {
  console.log("Kyrspect Wasm oynatıcı hazır");
});
```

---

## Doğrudan WebAssembly Sınıfı ile Kullanım

Dilerseniz doğrudan `KyrspectWasm` sınıfını da oluşturabilirsiniz:

```typescript
import { KyrspectWasm } from "@kyrspect/wasm";

const player = new KyrspectWasm("#player", {
  src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  controls: true,
  debug: true,
});

player.play();
```

HLS (`.m3u8`) ve DASH (`.mpd`) JavaScript’te tespit edilir. Bu URL’leri sınıflandırmak için WASM beklenmez. DRM isteğe bağlıdır — lisans sunucunuz yoksa `drm` vermeyin. Ayrıntılar: [DRM](./drm.md), [yükleme](./yukleme.md).

---

## HTML Yapılandırması

HTML dosyanıza bir kapsayıcı (container) elemanı eklemeniz yeterlidir:

```html
<div id="player-container" style="width: 100%; max-width: 960px; aspect-ratio: 16/9;"></div>
```

---

## Benchmark ve Yol Haritası

- 500 döngülük otomatik benchmark testini yerel ortamınızda çalıştırın: `npm run benchmark`. Ayrıntılı rapor için [Alternatifler ve Benchmark Raporu](./alternatifler-ve-benchmark.md) sayfasına bakın.
- Açık işler ve gelecek planlar (DASH güçlendirmesi ve paket optimizasyonu) [TODO.md](../../TODO.md) içinde listelenmektedir.
