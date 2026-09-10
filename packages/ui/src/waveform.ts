import type { PlayerLike } from "./types";

export interface WaveformOptions {
  visible?: boolean;
  onSeek?: (seconds: number) => void;
}

export interface AudioWaveformHandle {
  update(playedRatio: number, bufferedRatio: number): void;
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  destroy(): void;
}

function generateWaveformPattern(seedStr: string, count: number): number[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  }
  const next = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  const pattern: number[] = [];
  let prev = 0.35;
  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const macroEnvelope =
      0.35 +
      0.45 * Math.sin(progress * Math.PI) +
      0.15 * Math.sin(progress * Math.PI * 4);
    const noise = (next() - 0.5) * 0.4;
    prev = prev * 0.4 + (macroEnvelope + noise) * 0.6;
    pattern.push(Math.max(0.12, Math.min(0.95, prev)));
  }
  return pattern;
}

export function createAudioWaveform(
  container: HTMLElement,
  player: PlayerLike,
  options: WaveformOptions = {},
): AudioWaveformHandle {
  let isVisible = options.visible ?? false;
  let currentPlayedRatio = 0;
  let currentBufferedRatio = 0;
  let hoverRatio: number | null = null;
  let isDragging = false;
  let animationFrameId = 0;

  const canvas = document.createElement("canvas");
  canvas.className = "kyrspect-waveform-canvas";
  canvas.setAttribute("role", "presentation");
  container.append(canvas);

  const hoverLine = document.createElement("div");
  hoverLine.className = "kyrspect-waveform-hover-line";
  hoverLine.style.display = "none";
  container.append(hoverLine);

  container.classList.toggle("is-active", isVisible);
  container.style.display = isVisible ? "block" : "none";

  const cachedProfile = generateWaveformPattern(
    (player.media?.currentSrc || player.media?.src || "kyrspect-audio") + (player.duration || 100),
    160,
  );

  let analyser: AnalyserNode | null = null;
  let freqData: Uint8Array | null = null;

  const setupAnalyser = () => {
    if (analyser || typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx || !player.media) return;

      const mediaWithAnalyser = player.media as HTMLMediaElement & { __kyrspect_analyser?: AnalyserNode };
      if (mediaWithAnalyser.__kyrspect_analyser) {
        analyser = mediaWithAnalyser.__kyrspect_analyser;
        freqData = new Uint8Array(analyser.frequencyBinCount);
        return;
      }

      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaElementSource(player.media);
      const node = audioCtx.createAnalyser();
      node.fftSize = 128;
      node.smoothingTimeConstant = 0.75;
      source.connect(node);
      node.connect(audioCtx.destination);
      mediaWithAnalyser.__kyrspect_analyser = node;
      analyser = node;
      freqData = new Uint8Array(node.frequencyBinCount);
    } catch {
      analyser = null;
      freqData = null;
    }
  };

  const getAccentColor = (): string => {
    if (typeof window === "undefined" || !container.ownerDocument) return "#6d4aff";
    const computed = window.getComputedStyle(container);
    return computed.getPropertyValue("--kyrspect-accent").trim() || "#6d4aff";
  };

  const getTrackColor = (): string => {
    if (typeof window === "undefined" || !container.ownerDocument) return "rgba(255, 255, 255, 0.25)";
    const computed = window.getComputedStyle(container);
    return (
      computed.getPropertyValue("--kyrspect-track").trim() ||
      "rgba(255, 255, 255, 0.25)"
    );
  };

  const render = () => {
    if (!isVisible) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    if (width <= 0 || height <= 0) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const targetCanvasWidth = Math.round(width * dpr);
    const targetCanvasHeight = Math.round(height * dpr);

    if (canvas.width !== targetCanvasWidth || canvas.height !== targetCanvasHeight) {
      canvas.width = targetCanvasWidth;
      canvas.height = targetCanvasHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const barWidth = 2.5;
    const barGap = 2;
    const totalStep = barWidth + barGap;
    const barCount = Math.max(10, Math.floor((width - barGap) / totalStep));
    const startX = Math.max(0, (width - (barCount * totalStep - barGap)) / 2);

    const accentColor = getAccentColor();
    const trackColor = getTrackColor();
    const isPlaying = !player.paused && !player.ended;
    const currentTime = player.currentTime || 0;

    if (isPlaying && !analyser) {
      setupAnalyser();
    }

    if (isPlaying && analyser && freqData) {
      try {
        analyser.getByteFrequencyData(freqData as unknown as Uint8Array<ArrayBuffer>);
      } catch {
        // Ignored
      }
    }

    const bottomY = height;
    const maxBarHeight = height - 2;

    for (let i = 0; i < barCount; i++) {
      const x = startX + i * totalStep;
      const barRatio = i / barCount;

      const profileIdx = Math.floor(barRatio * (cachedProfile.length - 1));
      let amp = cachedProfile[profileIdx] ?? 0.4;

      if (isPlaying) {
        if (freqData && freqData.length > 0) {
          const freqIndex = Math.floor((i / barCount) * (freqData.length * 0.75));
          const freqValue = (freqData[freqIndex] ?? 0) / 255;
          amp = amp * 0.7 + freqValue * 0.6;
        } else {
          const distFromCurrent = Math.abs(barRatio - currentPlayedRatio);
          const playheadPulse =
            distFromCurrent < 0.15
              ? Math.sin(currentTime * 8 + i * 0.4) * 0.22 * (1 - distFromCurrent / 0.15)
              : 0;
          const ambientWave = Math.sin(currentTime * 3 + i * 0.15) * 0.08;
          amp = Math.max(0.1, Math.min(0.98, amp + playheadPulse + ambientWave));
        }
      }

      const barHeight = Math.max(3, amp * maxBarHeight);
      const topY = bottomY - barHeight;

      const isPlayed = barRatio <= currentPlayedRatio;
      const isHoverPreview =
        hoverRatio !== null &&
        barRatio <= hoverRatio &&
        barRatio > currentPlayedRatio;

      if (isPlayed) {
        ctx.fillStyle = accentColor;
      } else if (isHoverPreview) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      } else {
        ctx.fillStyle = trackColor;
      }

      const radius = Math.min(barWidth / 2, barHeight / 2);
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(x, topY, barWidth, barHeight, radius);
        ctx.fill();
      } else {
        ctx.fillRect(x, topY, barWidth, barHeight);
      }
    }

    ctx.restore();

    if (isPlaying && isVisible && typeof requestAnimationFrame !== "undefined") {
      animationFrameId = requestAnimationFrame(render);
    }
  };

  const scheduleRender = () => {
    if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(animationFrameId);
    if (typeof requestAnimationFrame !== "undefined") {
      animationFrameId = requestAnimationFrame(render);
    } else {
      render();
    }
  };

  const timeFromPointer = (event: PointerEvent): number => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const dur = Number.isFinite(player.duration) ? player.duration : 0;
    return ratio * dur;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    isDragging = true;
    if (typeof canvas.setPointerCapture === "function") {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Ignored
      }
    }

    const seconds = timeFromPointer(event);
    player.seek(seconds);
    options.onSeek?.(seconds);
    scheduleRender();
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    hoverRatio = ratio;

    hoverLine.style.display = "block";
    hoverLine.style.left = `${ratio * 100}%`;

    if (isDragging) {
      const seconds = timeFromPointer(event);
      player.seek(seconds);
      options.onSeek?.(seconds);
    }
    scheduleRender();
  };

  const onPointerLeave = () => {
    hoverRatio = null;
    hoverLine.style.display = "none";
    scheduleRender();
  };

  const onPointerUp = (event: PointerEvent) => {
    if (isDragging) {
      isDragging = false;
      if (typeof canvas.releasePointerCapture === "function") {
        try {
          canvas.releasePointerCapture(event.pointerId);
        } catch {
          // Ignored
        }
      }
    }
    scheduleRender();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      scheduleRender();
    });
    resizeObserver.observe(container);
  }

  const unsubs: Array<() => void> = [
    player.on("play", () => {
      setupAnalyser();
      scheduleRender();
    }),
    player.on("pause", scheduleRender),
    player.on("ended", scheduleRender),
    player.on("seeked", scheduleRender),
  ];

  return {
    update(playedRatio: number, bufferedRatio: number) {
      currentPlayedRatio = Math.max(0, Math.min(1, playedRatio));
      currentBufferedRatio = Math.max(0, Math.min(1, bufferedRatio));
      scheduleRender();
    },
    setVisible(visible: boolean) {
      isVisible = visible;
      container.classList.toggle("is-active", visible);
      container.style.display = visible ? "block" : "none";
      if (visible) {
        scheduleRender();
      } else {
        if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(animationFrameId);
      }
    },
    isVisible() {
      return isVisible;
    },
    destroy() {
      if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      for (const unsub of unsubs) unsub();
      canvas.remove();
      hoverLine.remove();
    },
  };
}
