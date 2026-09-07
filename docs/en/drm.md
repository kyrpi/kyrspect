# DRM

Kyrspect does not decrypt media. It configures license servers through Encrypted Media Extensions (EME) in dash.js, hls.js, or native Safari FairPlay.

DRM is **optional**. If `drm` is omitted, or no license URL is set, playback stays on the default HLS / DASH / progressive path. `DrmManager` is not constructed and no key-system setup runs.

```text
Kyrspect Core
  ├── PlaybackAdapter
  │    ├── HLS
  │    └── DASH
  └── DRMManager   ← created only when a license URL exists
       ├── Widevine
       ├── PlayReady
       └── FairPlay
```

Playback adapters never pick a key system. They ask `DrmManager` for an engine hint and license configuration.

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

A source can override player-level license URLs. Headers are merged. `beforeLicenseRequest` can adjust each license request.

FairPlay is HLS-only (Safari native or hls.js) and needs a certificate URL:

```javascript
drm: {
  fairplay: {
    licenseUrl: 'https://license.example/fairplay',
    certificateUrl: 'https://license.example/fps.cer',
  },
}
```

Widevine and PlayReady require MSE (hls.js or dash.js). FairPlay-only streams prefer native HLS.

## WebAssembly (`@kyrspect/wasm`)

The same option shape is available on `KyrspectWasm` and on a source object. If DRM is not configured, the WASM player uses the same default adapters as today.

```javascript
import { KyrspectWasm } from '@kyrspect/wasm';

const player = new KyrspectWasm('#player', {
  src: { src: 'https://example.com/encrypted.mpd', type: 'dash' },
  drm: {
    widevine: { licenseUrl: 'https://license.example/widevine' },
  },
});
```

WASM applies protection data to `window.dashjs` and EME options to `window.Hls` when those globals exist. It does not import `@kyrspect/core` for this path.

## Capabilities

`Kyrspect.getCapabilities()` does **not** probe CDMs. That keeps first paint cheap. Pass `{ drm: true }` when you need Widevine / PlayReady / FairPlay flags:

```ts
const caps = await Kyrspect.getCapabilities();
const drmCaps = await Kyrspect.getCapabilities({ drm: true });
```
