import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    stats: "src/statsPanel.ts",
    waveform: "src/waveform.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  splitting: true,
});
