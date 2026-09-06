import type { QualityState } from "./quality";

export type PlayerStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export interface PlayerState {
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  quality: QualityState;
  live: boolean;
  buffering: boolean;
  fullscreen: boolean;
  pictureInPicture: boolean;
  error: string | null;
}
