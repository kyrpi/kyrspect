import { KyrspectWasm } from "./KyrspectWasm";
import type { KyrspectWasmOptions } from "./types";

/**
 * Checks whether the current browser / JavaScript runtime supports WebAssembly.
 */
export function isWasmSupported(): boolean {
  try {
    if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
      const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Creates a player using the WebAssembly engine when the browser supports it.
 *
 * @param target - CSS selector or HTMLElement
 * @param options - Kyrspect options
 */
export function createPlayer(target: string | HTMLElement, options: KyrspectWasmOptions = {}): KyrspectWasm {
  const hasWasm = isWasmSupported();
  if (!hasWasm) {
    console.warn("[Kyrspect] WebAssembly is not supported in this environment.");
  }
  return new KyrspectWasm(target, options);
}
