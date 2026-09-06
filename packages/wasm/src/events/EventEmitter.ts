export class EventEmitter<TEventMap extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof TEventMap, Set<(payload: unknown) => void>>();

  on<K extends keyof TEventMap>(event: K, handler: (payload: TEventMap[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as (payload: unknown) => void);
    return () => this.off(event, handler);
  }

  once<K extends keyof TEventMap>(event: K, handler: (payload: TEventMap[K]) => void): () => void {
    const wrapper = (payload: TEventMap[K]) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }

  off<K extends keyof TEventMap>(event: K, handler: (payload: TEventMap[K]) => void): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler as (payload: unknown) => void);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof TEventMap>(event: K, payload?: TEventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const handler of Array.from(set)) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[KyrspectWasm:EventEmitter] Error in listener for "${String(event)}":`, err);
        }
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
