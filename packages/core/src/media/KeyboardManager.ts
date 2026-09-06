import type { KeyboardConfig } from "../types/options";

export interface KeyboardActions {
  togglePlay(): void;
  seekBy(delta: number): void;
  adjustVolume(delta: number): void;
  toggleMute(): void;
  toggleFullscreen(): void;
  togglePip(): void;
}

const DEFAULT_MAP: Record<string, string> = {
  " ": "toggle",
  Space: "toggle",
  k: "toggle",
  K: "toggle",
  ArrowRight: "seek+5",
  ArrowLeft: "seek-5",
  l: "seek+10",
  L: "seek+10",
  j: "seek-10",
  J: "seek-10",
  ArrowUp: "volume+0.05",
  ArrowDown: "volume-0.05",
  m: "mute",
  M: "mute",
  f: "fullscreen",
  F: "fullscreen",
  p: "pip",
  P: "pip",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export class KeyboardManager {
  private readonly onKey: (event: KeyboardEvent) => void;

  constructor(
    private readonly root: HTMLElement,
    private readonly config: KeyboardConfig,
    actions: KeyboardActions,
  ) {
    this.onKey = (event: KeyboardEvent) => {
      if (this.config === false) return;
      if (isTypingTarget(event.target)) return;
      const map = this.config === true || this.config === undefined ? DEFAULT_MAP : { ...DEFAULT_MAP, ...this.config };
      const action = map[event.key] ?? map[event.code];
      if (!action) return;
      event.preventDefault();
      if (action === "toggle") actions.togglePlay();
      else if (action === "mute") actions.toggleMute();
      else if (action === "fullscreen") actions.toggleFullscreen();
      else if (action === "pip") actions.togglePip();
      else if (action.startsWith("seek")) actions.seekBy(Number(action.slice(4)));
      else if (action.startsWith("volume")) actions.adjustVolume(Number(action.slice(6)));
    };
    this.root.addEventListener("keydown", this.onKey);
  }

  destroy(): void {
    this.root.removeEventListener("keydown", this.onKey);
  }
}
