import type { StatsOptions } from "./stats";

interface SourceDiagnostics {
  id?: string;
  stats?: StatsOptions;
}

export interface ProgressiveSource extends SourceDiagnostics {
  type: "video";
  src: string;
  mimeType?: string;
}

export interface HlsSource extends SourceDiagnostics {
  type: "hls";
  src: string;
  mimeType?: string;
}

export interface MediaStreamSource {
  type: "media-stream";
  stream: MediaStream;
}

export interface BlobSource {
  type: "blob";
  blob: Blob;
  mimeType?: string;
}

export interface AutoSource extends SourceDiagnostics {
  type?: "auto";
  src: string;
  mimeType?: string;
}

export type KyrspectSource =
  | ProgressiveSource
  | HlsSource
  | MediaStreamSource
  | BlobSource
  | AutoSource;

export type ResolvedSourceType = "video" | "hls" | "media-stream" | "blob";

export type ResolvedSource =
  | ProgressiveSource
  | HlsSource
  | MediaStreamSource
  | BlobSource;

export type SourceInput = KyrspectSource | string | MediaStream | Blob;
