import { PluginManager } from "../../packages/core/src/plugins/PluginManager";
import type { KyrspectPlugin } from "@kyrspect/core";

describe("plugin lifecycle", () => {
  it("calls setup and destroy in order", () => {
    const host = { id: "player" };
    const manager = new PluginManager<typeof host>();
    manager.attach(host);
    const order: string[] = [];
    const plugin: KyrspectPlugin<typeof host> = {
      name: "probe",
      setup(player) {
        order.push(`setup:${player.id}`);
      },
      destroy() {
        order.push("destroy");
      },
    };
    manager.use(plugin);
    manager.destroy();
    expect(order).toEqual(["setup:player", "destroy"]);
  });
});
