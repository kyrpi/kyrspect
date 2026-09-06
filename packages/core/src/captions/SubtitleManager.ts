import type { KyrspectAudioTrack, KyrspectSubtitleTrack, KyrspectTextTrackInput } from "../types/tracks";
import type { EventEmitter } from "../events/EventEmitter";
import type { KyrspectEventMap } from "../types/events";
import type { PlaybackAdapter } from "../types/adapter";
import { KyrspectError } from "../errors/KyrspectError";

export class SubtitleManager {
  private readonly elements: HTMLTrackElement[] = [];
  private customRoot: HTMLElement | null = null;
  private onCueChange: (() => void) | null = null;
  private activeId: string | null = null;

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly events: EventEmitter<KyrspectEventMap>,
    private readonly getAdapter: () => PlaybackAdapter | null,
    private readonly mode: "native" | "custom",
  ) {}

  applyConfigTracks(tracks: KyrspectTextTrackInput[] | undefined): void {
    this.clearConfigTracks();
    if (!tracks?.length) return;
    for (const [index, track] of tracks.entries()) {
      const node = document.createElement("track");
      node.kind = track.kind ?? "subtitles";
      node.src = track.src;
      node.srclang = track.lang;
      node.label = track.label;
      node.default = Boolean(track.default);
      node.dataset.KyrspectId = `cfg:${index}`;
      node.addEventListener("load", () => {
        this.events.emit("subtitleloaded", {
          track: {
            id: node.dataset.KyrspectId ?? String(index),
            kind: (track.kind ?? "subtitles") as KyrspectSubtitleTrack["kind"],
            label: track.label,
            language: track.lang,
            src: track.src,
          },
        });
      });
      node.addEventListener("error", () => {
        this.events.emit("subtitleerror", {
          error: new KyrspectError({
            code: "subtitle-load",
            category: "SUBTITLE_ERROR",
            message: `Subtitle track "${track.label}" could not be loaded.`,
            fatal: false,
            recoverable: true,
          }),
        });
      });
      this.video.appendChild(node);
      this.elements.push(node);
    }
  }

  list(): KyrspectSubtitleTrack[] {
    const adapterTracks = this.getAdapter()?.getSubtitleTracks?.();
    if (adapterTracks && adapterTracks.length > 0) return adapterTracks;

    const tracks: KyrspectSubtitleTrack[] = [];
    const list = this.video.textTracks;
    for (let i = 0; i < list.length; i += 1) {
      const track = list[i];
      if (!track || (track.kind !== "subtitles" && track.kind !== "captions")) continue;
      tracks.push({
        id: String(i),
        kind: track.kind,
        label: track.label || `Track ${i + 1}`,
        language: track.language || "",
      });
    }
    return tracks;
  }

  set(id: string | null): void {
    this.activeId = id;
    const adapter = this.getAdapter();
    if (adapter?.setSubtitleTrack) {
      adapter.setSubtitleTrack(id);
    }

    const list = this.video.textTracks;
    for (let i = 0; i < list.length; i += 1) {
      const track = list[i];
      if (!track) continue;
      if (id != null && String(i) === id) {
        track.mode = this.mode === "custom" ? "hidden" : "showing";
      } else if (track.kind === "subtitles" || track.kind === "captions") {
        track.mode = "disabled";
      }
    }

    this.bindCustomRenderer(id);
    const selected = id == null ? null : this.list().find((item) => item.id === id) ?? null;
    this.events.emit("subtitlechange", { track: selected });
  }

  disable(): void {
    this.set(null);
  }

  attachCustomRoot(root: HTMLElement | null): void {
    this.customRoot = root;
    this.bindCustomRenderer(this.activeId);
  }

  private bindCustomRenderer(id: string | null): void {
    if (this.onCueChange) {
      const list = this.video.textTracks;
      for (let i = 0; i < list.length; i += 1) list[i]?.removeEventListener("cuechange", this.onCueChange);
      this.onCueChange = null;
    }
    if (this.mode !== "custom" || !this.customRoot) return;
    this.customRoot.replaceChildren();
    if (id == null) return;
    const track = this.video.textTracks[Number(id)];
    if (!track) return;
    this.onCueChange = () => {
      if (!this.customRoot) return;
      this.customRoot.replaceChildren();
      const cues = track.activeCues;
      if (!cues) return;
      for (let i = 0; i < cues.length; i += 1) {
        const cue = cues[i];
        if (!cue || !("text" in cue)) continue;
        const line = document.createElement("div");
        line.className = "kyrspect-caption-cue";
        line.textContent = String((cue as VTTCue).text ?? "");
        this.customRoot.append(line);
      }
    };
    track.addEventListener("cuechange", this.onCueChange);
  }

  private clearConfigTracks(): void {
    for (const node of this.elements) node.remove();
    this.elements.length = 0;
  }

  destroy(): void {
    this.bindCustomRenderer(null);
    this.clearConfigTracks();
  }
}

interface MediaAudioTrack {
  id: string;
  label: string;
  language: string;
  enabled: boolean;
}

interface MediaAudioTrackList {
  length: number;
  [index: number]: MediaAudioTrack | undefined;
}

type MediaWithAudioTracks = HTMLVideoElement & {
  audioTracks?: MediaAudioTrackList;
};

export class AudioManager {
  constructor(
    private readonly video: MediaWithAudioTracks,
    private readonly events: EventEmitter<KyrspectEventMap>,
    private readonly getAdapter: () => PlaybackAdapter | null,
  ) {}

  list(): KyrspectAudioTrack[] {
    const adapterTracks = this.getAdapter()?.getAudioTracks?.();
    if (adapterTracks && adapterTracks.length > 0) return adapterTracks;
    const tracks: KyrspectAudioTrack[] = [];
    const list = this.video.audioTracks;
    if (!list) return tracks;
    for (let i = 0; i < list.length; i += 1) {
      const track = list[i];
      if (!track) continue;
      tracks.push({
        id: track.id || String(i),
        label: track.label || `Audio ${i + 1}`,
        language: track.language || "",
        default: track.enabled,
      });
    }
    return tracks;
  }

  set(id: string): void {
    const adapter = this.getAdapter();
    if (adapter?.setAudioTrack) {
      adapter.setAudioTrack(id);
    } else if (this.video.audioTracks) {
      const list = this.video.audioTracks;
      for (let i = 0; i < list.length; i += 1) {
        const track = list[i];
        if (track) track.enabled = track.id === id || String(i) === id;
      }
    }
    const selected = this.list().find((item) => item.id === id) ?? null;
    this.events.emit("audiotrackchange", { track: selected });
  }
}
