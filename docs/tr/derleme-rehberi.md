# Projeyi Derleme ve Paketleme Kılavuzu

Bu kılavuz, Kyrspect ve WebAssembly çekirdeğini sıfırdan derleme ve paketleme adımlarını açıklar.

---

## Ön Gereksinimler

Geliştirme ortamınızda aşağıdaki araçların kurulu olduğundan emin olun:
1. **Node.js**: `v18.18.0` veya üzeri
2. **Rust & Cargo**: `1.75.0` veya üzeri
3. **Rust WebAssembly Target**:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

---

## Monorepo Çalışma Alanı Yapısı

```text
kyrspect/
├── packages/
│   ├── core/         # TypeScript motoru
│   ├── ui/           # Ortak kullanıcı arayüzü, temalar ve i18n
│   ├── react/        # React wrapper paketi
│   └── wasm/         # WebAssembly paketi
│       ├── rust-core/# Rust Wasm kaynak kodları
│       └── src/      # TypeScript bridge & KyrspectWasm sınıfı
├── examples/
│   ├── wasm/         # WebAssembly interaktif demo uygulaması
│   ├── demo/         # Genel demo
│   └── vanilla/      # Düz JS demo
└── tests/            # Vitest birim ve entegrasyon testleri
```

---

## `@kyrspect/wasm` Paketini Derleme

Rust WebAssembly ikilisini derlemek, TypeScript/ESM/CommonJS paketlerini ve `.d.ts` tip tanımlarını üretmek için:

```bash
# Yalnızca WebAssembly paketini derler
npm run build -w @kyrspect/wasm
```

Bu komut arka planda sırasıyla 3 aşamayı yürütür:
1. `build:rust`: `cargo build --target wasm32-unknown-unknown --release` ile optimize Rust ikilisini üretir.
2. `bundle:wasm`: `.wasm` dosyasını TypeScript modülü (`src/generated/wasm-binary.ts`) içine paketler.
3. `build:ts`: `tsup` ile ESM, CJS ve TypeScript tip dosyalarını (`dist/`) oluşturur.

---

## Tüm Projeyi Derleme ve Test Etme

```bash
# Bağımlılıkları yükleyin
npm install

# Tüm paketleri derleyin
npm run build

# Tip kontrolü yapın
npm run typecheck

# Test paketini çalıştırın
npm run test
```

---

## Geliştirme Sunucularını Çalıştırma

```bash
# WebAssembly demo uygulamasını başlatın (http://localhost:5178)
npm run dev -w @kyrspect/example-wasm

# Düz JS demo uygulamasını başlatın
npm run dev:vanilla

# React demo uygulamasını başlatın
npm run dev:react
```

Kyrspect Apache License 2.0 ile yayınlanır. [LICENSE](../../LICENSE) ve [NOTICE](../../NOTICE).
