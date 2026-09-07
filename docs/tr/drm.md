# DRM

Kyrspect içeriği çözmez. Lisans sunucusunu dash.js, hls.js veya Safari FairPlay üzerinden Encrypted Media Extensions (EME) ile yapılandırır.

DRM **isteğe bağlıdır**. `drm` yoksa veya lisans URL’si tanımlı değilse oynatma varsayılan HLS / DASH / progressive yolda kalır. `DrmManager` oluşturulmaz, anahtar sistemi kurulmaz.

```text
Kyrspect Core
  ├── PlaybackAdapter
  │    ├── HLS
  │    └── DASH
  └── DRMManager   ← yalnızca lisans URL’si varken oluşur
       ├── Widevine
       ├── PlayReady
       └── FairPlay
```

Oynatma adaptörleri anahtar sistemi seçmez. Motor ipucu ve lisans yapılandırmasını `DrmManager`’dan ister.

## Core (`@kyrspect/core`)

```javascript
const player = new Kyrspect('#player', {
  src: { type: 'dash', src: 'https://example.com/encrypted.mpd' },
  drm: {
    preferred: 'widevine',
    widevine: {
      licenseUrl: 'https://license.example/widevine',
      headers: { Authorization: 'Bearer <token>' },
    },
    playready: {
      licenseUrl: 'https://license.example/playready',
    },
  },
});
```

Kaynak, oynatıcı düzeyindeki lisans URL’sini ezebilir. Başlıklar birleştirilir. `beforeLicenseRequest` her lisans isteğini değiştirebilir.

FairPlay yalnızca HLS’tedir (Safari native veya hls.js) ve sertifika URL’si ister:

```javascript
drm: {
  fairplay: {
    licenseUrl: 'https://license.example/fairplay',
    certificateUrl: 'https://license.example/fps.cer',
  },
}
```

Widevine ve PlayReady MSE ister (hls.js veya dash.js). Yalnızca FairPlay olan akışlar native HLS’i tercih eder.

## WebAssembly (`@kyrspect/wasm`)

Aynı seçenek şekli `KyrspectWasm` ve kaynak nesnesinde vardır. DRM tanımlı değilse WASM oynatıcı bugünkü varsayılan adaptör yolunu kullanır.

```javascript
import { KyrspectWasm } from '@kyrspect/wasm';

const player = new KyrspectWasm('#player', {
  src: { src: 'https://example.com/encrypted.mpd', type: 'dash' },
  drm: {
    widevine: { licenseUrl: 'https://license.example/widevine' },
  },
});
```

WASM, bu globaller varsa koruma verisini `window.dashjs`’e, EME seçeneklerini `window.Hls`’e uygular. Bu yol için `@kyrspect/core` içe aktarılmaz.

## Yetenekler

`Kyrspect.getCapabilities()` CDM sorgulamaz; ilk yüklemeyi kısa tutar. Widevine / PlayReady / FairPlay bayrakları için `{ drm: true }` verin:

```ts
const caps = await Kyrspect.getCapabilities();
const drmCaps = await Kyrspect.getCapabilities({ drm: true });
```
