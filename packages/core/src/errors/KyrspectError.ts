export type KyrspectErrorCategory =
  | "NETWORK_ERROR"
  | "MEDIA_ERROR"
  | "MANIFEST_ERROR"
  | "CODEC_ERROR"
  | "SOURCE_ERROR"
  | "DRM_ERROR"
  | "SUBTITLE_ERROR"
  | "PLAYBACK_ERROR"
  | "UNSUPPORTED_FORMAT"
  | "CORS_ERROR"
  | "UNKNOWN_ERROR";

export interface KyrspectErrorInit {
  code: string;
  category: KyrspectErrorCategory;
  message: string;
  fatal?: boolean;
  recoverable?: boolean;
  originalError?: unknown;
}

export class KyrspectError extends Error {
  readonly code: string;
  readonly category: KyrspectErrorCategory;
  readonly fatal: boolean;
  readonly recoverable: boolean;
  readonly originalError?: unknown;

  constructor(init: KyrspectErrorInit) {
    super(init.message);
    this.name = "KyrspectError";
    this.code = init.code;
    this.category = init.category;
    this.fatal = init.fatal ?? true;
    this.recoverable = init.recoverable ?? !this.fatal;
    this.originalError = init.originalError;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      message: this.message,
      fatal: this.fatal,
      recoverable: this.recoverable,
    };
  }
}

export function normalizeError(error: unknown, fallback?: Partial<KyrspectErrorInit>): KyrspectError {
  if (error instanceof KyrspectError) return error;

  if (typeof MediaError !== "undefined" && error instanceof MediaError) {
    return fromMediaError(error);
  }

  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const maybe = error as { code?: number | string; message?: string; name?: string };
    if (typeof maybe.code === "number" && maybe.message) {
      return fromMediaError(maybe as MediaError);
    }
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : fallback?.message ?? "An unknown playback error occurred.";

  const cors = /cors|cross-origin|access-control/i.test(message);

  return new KyrspectError({
    code: fallback?.code ?? (cors ? "cors" : "unknown"),
    category: fallback?.category ?? (cors ? "CORS_ERROR" : "UNKNOWN_ERROR"),
    message,
    fatal: fallback?.fatal ?? true,
    recoverable: fallback?.recoverable,
    originalError: error,
  });
}

export function fromMediaError(error: MediaError): KyrspectError {
  switch (error.code) {
    case 1:
      return new KyrspectError({
        code: "media-aborted",
        category: "PLAYBACK_ERROR",
        message: "Playback was aborted.",
        fatal: false,
        recoverable: true,
        originalError: error,
      });
    case 2:
      return new KyrspectError({
        code: "media-network",
        category: "NETWORK_ERROR",
        message: "A network error interrupted playback.",
        fatal: true,
        recoverable: true,
        originalError: error,
      });
    case 3:
      return new KyrspectError({
        code: "media-decode",
        category: "MEDIA_ERROR",
        message: "The media could not be decoded.",
        fatal: true,
        recoverable: true,
        originalError: error,
      });
    case 4:
      return new KyrspectError({
        code: "media-src-not-supported",
        category: "UNSUPPORTED_FORMAT",
        message: "This media format is not supported.",
        fatal: true,
        recoverable: false,
        originalError: error,
      });
    default:
      return new KyrspectError({
        code: "media-unknown",
        category: "MEDIA_ERROR",
        message: error.message || "A media error occurred.",
        fatal: true,
        originalError: error,
      });
  }
}

export function userFacingErrorMessage(
  error: KyrspectError,
  labels?: Partial<{
    errorTitle: string;
    errorUnsupported: string;
    errorStream: string;
  }>,
): string {
  const text = {
    errorTitle: "This video could not be loaded.",
    errorUnsupported: "This video format is not supported.",
    errorStream: "The stream could not be loaded.",
    ...labels,
  };
  switch (error.category) {
    case "NETWORK_ERROR":
    case "CORS_ERROR":
      return text.errorTitle;
    case "UNSUPPORTED_FORMAT":
    case "CODEC_ERROR":
      return text.errorUnsupported;
    case "DRM_ERROR":
    case "MANIFEST_ERROR":
      return text.errorStream;
    default:
      return text.errorTitle;
  }
}
