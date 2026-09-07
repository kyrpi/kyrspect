# TODO

Açık işler. Tamamlanan maddeleri aşağıya taşıyın.

## Açık / Open

1. **Benchmark hazırlanacak**
   Startup, ilk kare, HLS / DASH geçişi, WASM köprüsü ve DRM-kapalı varsayılan yol için tekrarlanabilir bir ölçüm seti. Core ile `@kyrspect/wasm` yan yana karşılaştırılmalı; sonuçlar dokümana işlenmeli.

## Tamamlandı / Done

- İsteğe bağlı DRM (`DrmManager` yalnızca lisans URL’si varken)
- hls.js / dash.js tembel yükleme
- Capability probe’larında CDM atlama (`getCapabilities({ drm: true })`)
- WASM: JS-öncelikli kaynak tespiti, gecikmeli WASM init, isteğe bağlı DRM
