import type { PlayerState } from "../types/state";
import type { QualityState } from "../types/quality";

const INITIAL_QUALITY: QualityState = {
  mode: "auto",
  level: null,
  bitrate: null,
  width: 0,
  height: 0,
};

export function createInitialState(): PlayerState {
  return {
    status: "idle",
    currentTime: 0,
    duration: Number.NaN,
    volume: 1,
    muted: false,
    playbackRate: 1,
    quality: { ...INITIAL_QUALITY },
    live: false,
    buffering: false,
    fullscreen: false,
    pictureInPicture: false,
    error: null,
  };
}

export class StateStore {
  private state: PlayerState = createInitialState();
  private readonly listeners = new Set<(state: PlayerState) => void>();

  get(): PlayerState {
    return this.state;
  }

  patch(partial: Partial<PlayerState>): PlayerState {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) listener(this.state);
    return this.state;
  }

  subscribe(listener: (state: PlayerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.state = createInitialState();
  }
}
