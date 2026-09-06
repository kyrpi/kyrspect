import type { KyrspectPlugin } from "../types/plugin";

export class PluginManager<T> {
  private readonly plugins: KyrspectPlugin[] = [];
  private host: T | null = null;

  attach(host: T): void {
    this.host = host;
  }

  use(plugin: KyrspectPlugin): void {
    if (!this.host) throw new Error("Plugin manager is not attached.");
    plugin.setup(this.host as never);
    this.plugins.push(plugin);
  }

  destroy(): void {
    for (const plugin of [...this.plugins].reverse()) {
      plugin.destroy?.();
    }
    this.plugins.length = 0;
    this.host = null;
  }
}
