import { canPlayNativeHls } from "./source";
import { isHlsJsSupported } from "./hls";

export interface CodecSupport {
  supported: boolean;
  smooth: boolean;
  powerEfficient: boolean;
}

export interface KyrspectCapabilitySnapshot {
  h264: boolean;
  hevc: boolean;
  vp8: boolean;
  vp9: boolean;
  av1: boolean;
  aac: boolean;
  opus: boolean;
  mp3: boolean;
  flac: boolean;
  vorbis: boolean;
  hls: boolean;
  hlsNative: boolean;
  hlsJs: boolean;
  mse: boolean;
  pip: boolean;
  fullscreen: boolean;
  mediaCapabilities: boolean;
  details: {
    h264: CodecSupport;
    hevc: CodecSupport;
    vp8: CodecSupport;
    vp9: CodecSupport;
    av1: CodecSupport;
  };
}

const VIDEO_PROBES: Record<keyof KyrspectCapabilitySnapshot["details"], string> = {
  h264: 'video/mp4; codecs="avc1.42E01E"',
  hevc: 'video/mp4; codecs="hvc1.1.6.L93.B0"',
  vp8: 'video/webm; codecs="vp8"',
  vp9: 'video/webm; codecs="vp9"',
  av1: 'video/mp4; codecs="av01.0.05M.08"',
};

const AUDIO_PROBES = {
  aac: 'audio/mp4; codecs="mp4a.40.2"',
  opus: 'audio/webm; codecs="opus"',
  mp3: "audio/mpeg",
  flac: "audio/flac",
  vorbis: 'audio/ogg; codecs="vorbis"',
} as const;

function emptyCodec(): CodecSupport {
  return { supported: false, smooth: false, powerEfficient: false };
}

function canPlay(video: HTMLVideoElement, contentType: string): boolean {
  const result = video.canPlayType(contentType);
  if (result !== "") return true;
  return typeof MediaSource !== "undefined" && typeof MediaSource.isTypeSupported === "function"
    ? MediaSource.isTypeSupported(contentType)
    : false;
}

async function decodingInfo(contentType: string): Promise<CodecSupport> {
  const fallback: CodecSupport = { supported: false, smooth: false, powerEfficient: false };
  if (typeof navigator === "undefined" || !navigator.mediaCapabilities?.decodingInfo) {
    return fallback;
  }
  try {
    const info = await navigator.mediaCapabilities.decodingInfo({
      type: "file",
      video: {
        contentType,
        width: 1280,
        height: 720,
        bitrate: 2_000_000,
        framerate: 30,
      },
    });
    return {
      supported: info.supported,
      smooth: info.smooth,
      powerEfficient: info.powerEfficient,
    };
  } catch {
    return fallback;
  }
}

export class KyrspectCapabilities {
  static async probe(video?: HTMLVideoElement): Promise<KyrspectCapabilitySnapshot> {
    const media =
      video ?? (typeof document !== "undefined" ? document.createElement("video") : undefined);
    const hlsNative = canPlayNativeHls(media);
    const hlsJs = isHlsJsSupported();

    const details = {
      h264: emptyCodec(),
      hevc: emptyCodec(),
      vp8: emptyCodec(),
      vp9: emptyCodec(),
      av1: emptyCodec(),
    } as KyrspectCapabilitySnapshot["details"];

    if (media) {
      for (const [key, type] of Object.entries(VIDEO_PROBES) as Array<
        [keyof typeof details, string]
      >) {
        const basic = canPlay(media, type);
        const info = await decodingInfo(type);
        details[key] = {
          supported: basic || info.supported,
          smooth: info.smooth,
          powerEfficient: info.powerEfficient,
        };
      }
    }

    const audio = {
      aac: Boolean(media && canPlay(media, AUDIO_PROBES.aac)),
      opus: Boolean(media && canPlay(media, AUDIO_PROBES.opus)),
      mp3: Boolean(media && canPlay(media, AUDIO_PROBES.mp3)),
      flac: Boolean(media && canPlay(media, AUDIO_PROBES.flac)),
      vorbis: Boolean(media && canPlay(media, AUDIO_PROBES.vorbis)),
    };

    return {
      h264: details.h264.supported,
      hevc: details.hevc.supported,
      vp8: details.vp8.supported,
      vp9: details.vp9.supported,
      av1: details.av1.supported,
      ...audio,
      hls: hlsNative || hlsJs,
      hlsNative,
      hlsJs,
      mse: typeof MediaSource !== "undefined",
      pip: typeof document !== "undefined" && Boolean(document.pictureInPictureEnabled),
      fullscreen:
        typeof document !== "undefined" &&
        Boolean(document.fullscreenEnabled || (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled),
      mediaCapabilities: Boolean(typeof navigator !== "undefined" && navigator.mediaCapabilities?.decodingInfo),
      details,
    };
  }
}
