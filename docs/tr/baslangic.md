# Kyrspect'e Başlarken

Kyrspect, modern web uygulamaları için geliştirilmiş yüksek performanslı ve framework bağımsız bir video oynatıcı motorudur. İki uyumlu paket seçeneği sunar:
- **`@kyrspect/wasm`**: Rust ile yazılmış ve WebAssembly'ye derlenmiş yüksek performanslı çekirdek motor (EWMA ABR, düşük gecikmeli canlı yayın senkronizasyonu, WebVTT altyazı motoru ve telemetri).
- **`@kyrspect/core`**: Hafif TypeScript çekirdeği.

---

## Kurulum

WebAssembly paketini ve arayüz bileşenlerini projenize ekleyin:

```bash
npm install @kyrspect/wasm @kyrspect/ui
```

Veya Yarn / pnpm / Bun ile:

```bash
pnpm add @kyrspect/wasm @kyrspect/ui
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
    theme: {
      accent: "#6366f1",
      background: "#0a0c10",
    },
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

---

## HTML Yapılandırması

HTML dosyanıza bir kapsayıcı (container) elemanı eklemeniz yeterlidir:

```html
<div id="player-container" style="width: 100%; max-width: 960px; aspect-ratio: 16/9;"></div>
```
