import { EventEmitter } from "@kyrspect/core";

describe("EventEmitter", () => {
  it("subscribes, emits, and unsubscribes", () => {
    const bus = new EventEmitter<{ ping: { n: number }; bare: undefined }>();
    const seen: number[] = [];
    const off = bus.on("ping", (event) => seen.push(event.n));
    bus.emit("ping", { n: 1 });
    off();
    bus.emit("ping", { n: 2 });
    expect(seen).toEqual([1]);
  });

  it("supports once()", () => {
    const bus = new EventEmitter<{ tick: undefined }>();
    const fn = vi.fn();
    bus.once("tick", fn);
    bus.emit("tick");
    bus.emit("tick");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clears listeners on destroy", () => {
    const bus = new EventEmitter<{ tick: undefined }>();
    const fn = vi.fn();
    bus.on("tick", fn);
    bus.destroy();
    bus.emit("tick");
    expect(fn).not.toHaveBeenCalled();
  });

  it("off without handler removes all listeners for an event", () => {
    const bus = new EventEmitter<{ tick: undefined }>();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("tick", a);
    bus.on("tick", b);
    bus.off("tick");
    bus.emit("tick");
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });
});
