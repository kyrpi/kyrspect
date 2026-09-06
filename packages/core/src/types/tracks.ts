export type TextTrackKind = "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";

export interface KyrspectTextTrackInput {
  kind?: TextTrackKind;
  src: string;
  lang: string;
  label: string;
  default?: boolean;
}

export interface KyrspectSubtitleTrack {
  id: string;
  kind: TextTrackKind;
  label: string;
  language: string;
  src?: string;
}

export interface KyrspectAudioTrack {
  id: string;
  label: string;
  language: string;
  default?: boolean;
}
