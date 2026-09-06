export const DEFAULT_STATS_FIELDS = [
  "videoId",
  "viewport",
  "resolution",
  "volume",
  "codecs",
  "color",
  "connection",
  "network",
  "buffer",
  "flags",
  "date",
] as const;

export type StatsFieldId = (typeof DEFAULT_STATS_FIELDS)[number] | "live";

export interface StatsCustomField {
  id: string;
  label: string;
  value?: string | ((stats: unknown) => string);
}

export type StatsField = StatsFieldId | StatsCustomField;

export interface StatsOptions {
  fields?: StatsField[];
  color?: string;
}

export interface PlayerStats {
  id: string;
  currentTime: number;
  duration: number;
  viewport: {
    width: number;
    height: number;
  };
  resolution: {
    width: number;
    height: number;
    frameRate: number;
  };
  optimal: {
    width: number;
    height: number;
    frameRate: number;
  };
  volume: {
    level: number;
    muted: boolean;
  };
  codecs: string;
  color: string;
  quality: {
    mode: "auto" | "manual";
    level: number | null;
    bitrate: number | null;
  };
  network: {
    bandwidthEstimate: number;
    activityBytes: number;
  };
  buffer: {
    ahead: number;
    start: number;
    end: number;
  };
  frames: {
    decoded: number;
    dropped: number;
  };
  live: {
    enabled: boolean;
    latency: number | null;
  };
  flags: string;
  timestamp: number;
}
