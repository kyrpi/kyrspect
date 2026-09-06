import path from "node:path";
import { fileURLToPath } from "node:url";
import { exampleConfig } from "../vite.shared";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default exampleConfig({
  server: { port: 5178 },
  resolve: {
    alias: {
      "@kyrspect/wasm": path.resolve(repoRoot, "packages/wasm/src/index.ts"),
    },
  },
});
