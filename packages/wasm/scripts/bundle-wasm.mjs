import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wasmPath = path.resolve(__dirname, '../rust-core/target/wasm32-unknown-unknown/release/kyrspect_wasm_core.wasm');
const outDir = path.resolve(__dirname, '../src/generated');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const wasmBuffer = fs.readFileSync(wasmPath);
const base64 = wasmBuffer.toString('base64');

const tsContent = `// Auto-generated WebAssembly binary bundle
export const WASM_BYTE_LENGTH = ${wasmBuffer.length};
export const WASM_BASE64 = "${base64}";

export function getWasmBytes(): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(WASM_BASE64, "base64"));
  }
  const binaryString = atob(WASM_BASE64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
`;

fs.writeFileSync(path.join(outDir, 'wasm-binary.ts'), tsContent, 'utf-8');
console.log(`Successfully bundled WebAssembly binary (${wasmBuffer.length} bytes) to src/generated/wasm-binary.ts`);
