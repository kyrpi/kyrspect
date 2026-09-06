import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  splitting: false,
  external: ["react", "react-dom", "react/jsx-runtime", "@kyrspect/core"],
  async onSuccess() {
    for (const file of ["dist/index.js", "dist/index.cjs"]) {
      const code = readFileSync(file, "utf8");
      if (!code.startsWith('"use client"')) {
        writeFileSync(file, `"use client";\n${code}`);
      }
    }
  },
});
