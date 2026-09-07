# Build and Compilation Guide

This guide describes how to build Kyrspect and its WebAssembly engine from source.

---

## Prerequisites

Make sure you have the following installed:
1. **Node.js**: `v18.18.0` or higher
2. **Rust**: `1.75.0` or higher (with `cargo` and `rustup`)
3. **WebAssembly Target**:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

---

## Workspace Structure

```text
kyrspect/
├── packages/
│   ├── core/         # TypeScript engine
│   ├── ui/           # Shared player UI, styles, i18n
│   ├── react/        # React wrapper
│   └── wasm/         # WebAssembly package
│       ├── rust-core/# Rust Wasm source code
│       └── src/      # TypeScript bridge & KyrspectWasm
├── examples/
│   ├── wasm/         # WebAssembly interactive demo
│   ├── demo/         # General demo
│   └── vanilla/      # Vanilla JS demo
└── tests/            # Vitest unit & integration tests
```

---

## Building `@kyrspect/wasm`

To build the Rust WebAssembly binary, bundle it, and generate TypeScript types (`.d.ts`), ESM, and CommonJS bundles:

```bash
# Build only the Wasm package
npm run build -w @kyrspect/wasm
```

This command executes three steps under the hood:
1. `build:rust`: `cargo build --target wasm32-unknown-unknown --release`
2. `bundle:wasm`: Embeds the optimized `.wasm` binary into `src/generated/wasm-binary.ts`
3. `build:ts`: Generates production bundles via `tsup`

---

## Building the Entire Project

```bash
# Install dependencies
npm install

# Build all packages (UI, Core, React, Wasm)
npm run build

# Run type checks
npm run typecheck

# Run test suite
npm run test
```

---

## Running Development Servers

```bash
# Run WebAssembly demo (http://localhost:5178)
npm run dev -w @kyrspect/example-wasm

# Run Vanilla demo
npm run dev:vanilla

# Run React demo
npm run dev:react
```

Kyrspect is published under the Apache License 2.0. See [LICENSE](../../LICENSE) and [NOTICE](../../NOTICE).
