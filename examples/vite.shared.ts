import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type UserConfig } from "vite";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export function exampleConfig(overrides: UserConfig = {}) {
  return defineConfig({
    ...overrides,
    resolve: {
      alias: {
        "@kyrspect/core": path.resolve(repoRoot, "packages/core/src/index.ts"),
        "@kyrspect/ui": path.resolve(repoRoot, "packages/ui/src/index.ts"),
        "@kyrspect/react": path.resolve(repoRoot, "packages/react/src/index.ts"),
        ...(overrides.resolve?.alias ?? {}),
      },
    },
  });
}
