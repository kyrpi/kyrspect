import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@kyrspect/core": `${root}/packages/core/src/index.ts`,
      "@kyrspect/ui": `${root}/packages/ui/src/index.ts`,
      "@kyrspect/react": `${root}/packages/react/src/index.ts`,
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    restoreMocks: true,
  },
});
