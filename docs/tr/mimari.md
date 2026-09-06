# Mimari ve WebAssembly Çekirdeği

Kyrspect WebAssembly mimarisi; düşük bellek tüketimi, yüksek işlem hacmi ve kritik oynatma döngülerinde milisaniye altı yürütme performansı sunmak üzere tasarlanmıştır.

---

## Mimari Şema

```text
┌─────────────────────────────────────────────────────────────┐
│                    Kyrspect UI Layer                        │
│         (Kontroller, Menüler, Stats Paneli, Temalar, i18n)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│             KyrspectWasm JavaScript / TS Bridge             │
│       (HTMLVideoElement, Event Emitter, HLS Adaptörü)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Sıfır ek yük C-ABI FFI Köprüsü)
┌──────────────────────────────▼──────────────────────────────┐
│                 WebAssembly Core Engine (Rust)              │
│  ├── State Machine (Durum Motoru)                           │
│  ├── EWMA Adaptive Bitrate (ABR) Bant Genişliği Kestirimi   │
│  ├── Düşük Gecikmeli Canlı Yayın & Drift Senkronizasyonu    │
│  ├── Gerçek Zamanlı Telemetri & Kare Düşüşü Hesaplayıcı     │
│  ├── WebVTT Altyazı Ayrıştırıcı & İkili Arama Zaman Çizelgesi│
│  └── Medya URL & MIME Analizörü                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Rust Çekirdek Modülleri (`wasm32-unknown-unknown`)

1. **State Motoru (`src/state.rs`)**:
   - Oynatıcı durum geçişlerini (`idle`, `loading`, `ready`, `playing`, `paused`, `buffering`, `seeking`, `ended`, `error`) atomik olarak yönetir.
   - Asenkron oynatma olayları arasında tutarlı durum bütünlüğü sağlar.

2. **Adaptive Bitrate (ABR) Motoru (`src/abr.rs`)**:
   - Çift EWMA (Hızlı $\alpha=0.3$, Yavaş $\alpha=0.05$) bant genişliği kestirimi.
   - İlk bağlantı dalgalanmalarında agresif yukarı geçişleri engeller.
   - Tampon 1.5 saniyenin altına düştüğünde anında en düşük basamağa (emergency downswitch) iner.
   - Ekran çözünürlüğü kısıtlaması (küçük ekranda gereksiz 4K indirmesini önler).

3. **Canlı Yayın Senkronizasyon Motoru (`src/live.rs`)**:
   - Hedef gecikme ile gerçek canlı yayın ucu arasındaki farkı (drift) sürekli hesaplar.
   - Ses tonunu bozmadan mikro oynatma hızlarıyla (`0.95x` - `1.05x`) yayını senkronize tutar.

4. **Telemetri & İstatistik Motoru (`src/stats.rs`)**:
   - Anlık ve yumuşatılmış FPS hesaplar.
   - Bağlantı kalitesini `"Excellent"`, `"Good"`, `"Fair"`, `"Poor"` olarak derecelendirir.

5. **WebVTT Altyazı Motoru (`src/subtitles.rs`)**:
   - Yüksek hızlı altyazı ayrıştırma ve zaman çizelgesinde $O(\log N)$ sürede ikili arama ile anlık cue bulma.
