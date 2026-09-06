import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Kyrspect,
  type QualityChangeEvent,
  type QualityState,
  type KyrspectError,
  type KyrspectEventMap,
  type KyrspectOptions,
  type SourceInput,
} from "@kyrspect/core";

export interface KyrspectHandle {
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;
  mute(): void;
  unmute(): void;
  setVolume(value: number): void;
  setPlaybackRate(rate: number): void;
  setQuality(level: number | "auto"): void;
  setLanguage(language: string): void;
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  getPlayer(): Kyrspect | null;
}

export interface KyrspectPlayerProps extends Omit<KyrspectOptions, "src"> {
  src?: SourceInput;
  className?: string;
  style?: CSSProperties;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onQualityChange?: (event: QualityChangeEvent) => void;
  onError?: (error: KyrspectError) => void;
}

export const KyrspectPlayer = forwardRef<KyrspectHandle, KyrspectPlayerProps>(function KyrspectPlayer(
  {
    src,
    className,
    style,
    onReady,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onQualityChange,
    onError,
    ...options
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Kyrspect | null>(null);
  const callbacks = useRef({ onReady, onPlay, onPause, onEnded, onTimeUpdate, onQualityChange, onError });
  callbacks.current = { onReady, onPlay, onPause, onEnded, onTimeUpdate, onQualityChange, onError };

  const optionKey = useMemo(
    () =>
      JSON.stringify({
        autoplay: options.autoplay,
        muted: options.muted,
        controls: options.controls,
        poster: options.poster,
        debug: options.debug,
        loop: options.loop,
        preload: options.preload,
        language: options.language,
        layout: options.ui?.layout,
        aspectRatio: options.ui?.aspectRatio,
        fit: options.ui?.fit,
      }),
    [options.autoplay, options.muted, options.controls, options.poster, options.debug, options.loop, options.preload, options.language, options.ui?.layout, options.ui?.aspectRatio, options.ui?.fit],
  );

  const skipSrcSync = useRef(true);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const player = new Kyrspect(node, { ...options, src });
    playerRef.current = player;
    skipSrcSync.current = true;

    const unsubs = [
      player.on("ready", () => callbacks.current.onReady?.()),
      player.on("play", () => callbacks.current.onPlay?.()),
      player.on("pause", () => callbacks.current.onPause?.()),
      player.on("ended", () => callbacks.current.onEnded?.()),
      player.on("timeupdate", (event) => callbacks.current.onTimeUpdate?.(event.currentTime)),
      player.on("qualitychange", (event) => callbacks.current.onQualityChange?.(event)),
      player.on("error", (error) => callbacks.current.onError?.(error)),
    ];

    return () => {
      for (const off of unsubs) off();
      player.destroy();
      playerRef.current = null;
    };
    // Recreate only when core flags change — src is synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionKey]);

  useEffect(() => {
    if (skipSrcSync.current) {
      skipSrcSync.current = false;
      return;
    }
    const player = playerRef.current;
    if (!player || src == null) return;
    void player.load(src);
  }, [src]);

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.play() ?? Promise.resolve(),
    pause: () => playerRef.current?.pause(),
    seek: (seconds) => playerRef.current?.seek(seconds),
    mute: () => playerRef.current?.mute(),
    unmute: () => playerRef.current?.unmute(),
    setVolume: (value) => playerRef.current?.setVolume(value),
    setPlaybackRate: (rate) => playerRef.current?.setPlaybackRate(rate),
    setQuality: (level) => playerRef.current?.setQuality(level),
    setLanguage: (language) => playerRef.current?.setLanguage(language),
    enterFullscreen: () => playerRef.current?.enterFullscreen() ?? Promise.resolve(),
    exitFullscreen: () => playerRef.current?.exitFullscreen() ?? Promise.resolve(),
    getPlayer: () => playerRef.current,
  }));

  return <div ref={containerRef} className={className} style={{ width: "100%", ...style }} />;
});

type StateSlice = {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  quality: QualityState | null;
  buffering: boolean;
  fullscreen: boolean;
  live: boolean;
};

const EMPTY_STATE: StateSlice = {
  playing: false,
  currentTime: 0,
  duration: Number.NaN,
  volume: 1,
  quality: null,
  buffering: false,
  fullscreen: false,
  live: false,
};

export function useKyrspect(handle?: { current: KyrspectHandle | null }): Kyrspect | null {
  return handle?.current?.getPlayer() ?? null;
}

export function useKyrspectState(player: Kyrspect | null, interval = 250): StateSlice {
  const [state, setState] = useState<StateSlice>(EMPTY_STATE);

  const sync = useCallback(
    (instance: Kyrspect, patch?: Partial<StateSlice>) => {
      setState((current) => ({
        playing: !instance.paused,
        currentTime: instance.currentTime,
        duration: instance.duration,
        volume: instance.volume,
        quality: instance.getQuality(),
        buffering: instance.getState().buffering,
        fullscreen: instance.isFullscreen(),
        live: instance.isLive,
        ...patch,
      }));
    },
    [],
  );

  useEffect(() => {
    if (!player) {
      setState(EMPTY_STATE);
      return;
    }

    let lastTime = 0;
    const events: Array<keyof KyrspectEventMap> = [
      "play",
      "pause",
      "ended",
      "qualitychange",
      "fullscreenchange",
      "durationchange",
      "volumechange",
      "bufferstart",
      "bufferend",
      "liveedge",
      "ready",
    ];
    const unsubs = events.map((name) => player.on(name, () => sync(player)));
    unsubs.push(
      player.on("timeupdate", () => {
        const now = performance.now();
        if (now - lastTime < interval) return;
        lastTime = now;
        setState((current) =>
          current.currentTime === player.currentTime
            ? current
            : { ...current, currentTime: player.currentTime, playing: !player.paused },
        );
      }),
    );
    sync(player);
    return () => {
      for (const off of unsubs) off();
    };
  }, [player, interval, sync]);

  return state;
}

export type { KyrspectPlayerProps as KyrspectReactProps };
