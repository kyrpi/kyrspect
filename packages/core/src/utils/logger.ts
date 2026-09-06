export function createLogger(enabled: () => boolean) {
  const print = (namespace: string, method: "log" | "warn" | "error", args: unknown[]) => {
    if (!enabled()) return;
    const prefix = namespace ? `[Kyrspect:${namespace}]` : "[Kyrspect]";
    console[method](prefix, ...args);
  };

  return {
    info(namespace: string, ...args: unknown[]) {
      print(namespace, "log", args);
    },
    warn(namespace: string, ...args: unknown[]) {
      print(namespace, "warn", args);
    },
    error(namespace: string, ...args: unknown[]) {
      print(namespace, "error", args);
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
