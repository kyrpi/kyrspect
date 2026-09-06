type Handler<T> = T extends undefined ? () => void : (payload: T) => void;

export class EventEmitter<TEvents extends { [K in keyof TEvents]: unknown }> {
  private readonly listeners = new Map<keyof TEvents, Set<(payload: unknown) => void>>();
  private alive = true;

  on<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): () => void {
    if (!this.alive) return () => undefined;
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as (payload: unknown) => void);
    return () => this.off(event, handler);
  }

  once<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): () => void {
    const wrapped = ((payload: TEvents[K]) => {
      off();
      (handler as (value: TEvents[K]) => void)(payload);
    }) as Handler<TEvents[K]>;
    const off = this.on(event, wrapped);
    return off;
  }

  off<K extends keyof TEvents>(event: K, handler?: Handler<TEvents[K]>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    if (!handler) {
      set.clear();
      return;
    }
    set.delete(handler as (payload: unknown) => void);
  }

  emit<K extends keyof TEvents>(
    event: K,
    ...args: TEvents[K] extends undefined ? [] : [TEvents[K]]
  ): void {
    if (!this.alive) return;
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    const payload = args[0];
    for (const handler of [...set]) {
      handler(payload);
    }
  }

  listenerCount(event: keyof TEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  destroy(): void {
    this.alive = false;
    this.removeAllListeners();
  }
}
