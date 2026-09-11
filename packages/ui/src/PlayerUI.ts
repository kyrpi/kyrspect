import { formatClock, formatLiveOffset, ratioFromTimeRanges } from "./format";
import { resolveLabels, resolveLocale } from "./i18n";
import { icons } from "./icons";
import { resolveFrameSize, shouldFillHost } from "./layout";
import { createSparkHistory, renderStatsRows } from "./statsPanel";
import { injectStyles } from "./styles";
import { applyTheme, getRegisteredThemes } from "./theme";
import { createAudioWaveform, type AudioWaveformHandle } from "./waveform";
import type {
  PlayerLike,
  PlayerUIHandle,
  StatsField,
  ThemeInput,
  UIAspectRatio,
  UIControlsConfig,
  UIFit,
  UILabels,
  UILayout,
  UIOptions,
  UITheme,
} from "./types";

const DEFAULT_CONTROLS: Required<UIControlsConfig> = {
  play: true,
  timeline: true,
  volume: true,
  subtitles: true,
  settings: true,
  pip: true,
  fullscreen: true,
  playbackRate: true,
  quality: true,
  live: true,
  audioVisualizer: true,
};

function resolveControls(input: UIOptions["controls"]): Required<UIControlsConfig> {
  if (input === false) {
    return {
      play: false,
      timeline: false,
      volume: false,
      subtitles: false,
      settings: false,
      pip: false,
      fullscreen: false,
      playbackRate: false,
      quality: false,
      live: false,
      audioVisualizer: false,
    };
  }
  if (input === true || input === undefined) return { ...DEFAULT_CONTROLS };
  return { ...DEFAULT_CONTROLS, ...input };
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  }
  return node;
}

type MenuView =
  | "root"
  | "quality"
  | "captions"
  | "rate"
  | "audio"
  | "theme"
  | "advanced"
  | "advanced-subtitles"
  | "advanced-sub-font"
  | "advanced-sub-color"
  | "advanced-sub-bg"
  | "advanced-equalizer";

export function attachDefaultUI(player: PlayerLike, options: UIOptions = {}): PlayerUIHandle {
  injectStyles();

  let language = options.language;
  let labels = resolveLabels(language, options.labels);
  const controls = resolveControls(options.controls ?? true);
  const hideDelay = options.hideDelay ?? (options.layout === "reels" ? 2200 : 3000);
  const showOnPause = options.showOnPause ?? true;
  let layout: UILayout = options.layout === "reels" ? "reels" : "standard";
  let aspectRatio: UIAspectRatio = options.aspectRatio ?? "auto";
  let fit: UIFit = options.fit ?? (layout === "reels" ? "cover" : "contain");
  const fillPreference = options.fill;
  const root = player.el;

  root.classList.add("kyrspect", "kyrspect-player");
  let activeThemeResolved: UITheme = applyTheme(root, options.theme);
  if (player.options.debug) root.classList.add("kyrspect-debug");
  if (!root.hasAttribute("tabindex")) root.tabIndex = 0;
  root.setAttribute("role", "region");
  root.setAttribute("lang", resolveLocale(language));
  root.setAttribute("aria-label", labels.player);

  const getThemeLocalizedLabel = (themeId: string, fallback?: string): string => {
    const key = `theme${themeId.charAt(0).toUpperCase() + themeId.slice(1)}` as keyof UILabels;
    return (labels[key] as string) || fallback || themeId;
  };

  let performanceMode = Boolean(options.performanceMode);
  if (performanceMode) {
    root.classList.add("kyrspect-performance-mode");
    root.dataset.performanceMode = "true";
  }

  const applyPerformanceMode = (enabled: boolean, notifyPlayer = false) => {
    performanceMode = enabled;
    root.classList.toggle("kyrspect-performance-mode", enabled);
    root.dataset.performanceMode = String(enabled);
    if (notifyPlayer) {
      const playerAny = player as unknown as { setPerformanceMode?: (enabled: boolean) => void };
      if (typeof playerAny.setPerformanceMode === "function") {
        playerAny.setPerformanceMode(enabled);
      }
    }
  };

  player.media.classList.add("kyrspect-video");
  player.media.style.zIndex = "1";

  const applyFrame = () => {
    const frame = resolveFrameSize(aspectRatio, player.media, layout);
    const portrait = frame.height > frame.width;
    fit = options.fit ?? (layout === "reels" ? "cover" : "contain");
    root.classList.toggle("kyrspect-layout-reels", layout === "reels");
    root.classList.toggle("kyrspect-layout-standard", layout === "standard");
    root.classList.toggle("kyrspect-portrait", portrait);
    root.classList.toggle("kyrspect-landscape", !portrait);
    root.classList.toggle("kyrspect-fill", shouldFillHost(layout, fillPreference, root));
    root.style.setProperty("--kyrspect-aspect", `${frame.width} / ${frame.height}`);
    root.style.setProperty("--kyrspect-ratio", String(frame.width / frame.height));
    root.style.setProperty("--kyrspect-fit", fit);
    root.dataset.layout = layout;
  };

  const overlay = el("div", "kyrspect-overlay");
  overlay.appendChild(el("div", "kyrspect-gradient"));

  const center = el("div", "kyrspect-center");
  const spinner = el("div", "kyrspect-spinner");
  spinner.setAttribute("aria-hidden", "true");
  const bezel = el("div", "kyrspect-bezel");
  bezel.setAttribute("aria-hidden", "true");
  const bigPlay = el("button", "kyrspect-big-play", {
    type: "button",
    "aria-label": labels.play,
  });
  bigPlay.innerHTML = icons.play;
  center.append(spinner, bezel, bigPlay);

  const errorBox = el("div", "kyrspect-error-box");
  const errorTitle = el("p", "kyrspect-error-title");
  errorTitle.textContent = labels.errorTitle;
  const retry = el("button", "kyrspect-error-retry", { type: "button" });
  retry.textContent = labels.retry;
  errorBox.append(errorTitle, retry);

  const controlBar = el("div", "kyrspect-controls");
  let audioVisualizerEnabled = Boolean(options.audioVisualizer ?? false);
  const waveformEl = el("div", "kyrspect-waveform");
  const waveform: AudioWaveformHandle = createAudioWaveform(waveformEl, player, {
    visible: audioVisualizerEnabled,
  });

  const timeline = el("div", "kyrspect-timeline", {
    role: "slider",
    tabindex: "0",
    "aria-label": labels.seek,
    "aria-valuemin": "0",
    "aria-valuemax": "0",
    "aria-valuenow": "0",
  });
  const track = el("div", "kyrspect-timeline-track");
  const buffered = el("div", "kyrspect-timeline-buffered");
  const preview = el("div", "kyrspect-timeline-preview");
  const played = el("div", "kyrspect-timeline-played");
  const knob = el("div", "kyrspect-timeline-knob");
  const hover = el("div", "kyrspect-timeline-hover");
  track.append(buffered, preview, played, knob);
  timeline.append(track, hover);

  const bar = el("div", "kyrspect-bar");
  const left = el("div", "kyrspect-bar-left");
  const right = el("div", "kyrspect-bar-right");

  const playBtn = button("play", labels.play, icons.play);
  const muteBtn = button("mute", labels.mute, icons.volumeHigh);
  const volumeWrap = el("div", "kyrspect-volume");
  const volume = el("input", "kyrspect-volume-slider", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.05",
    "aria-label": labels.volume,
  }) as HTMLInputElement;
  volumeWrap.append(muteBtn, volume);

  const time = el("div", "kyrspect-time");
  const current = el("span");
  const sep = el("span", "kyrspect-time-sep");
  sep.textContent = "/";
  const duration = el("span");
  time.append(current, sep, duration);

  const liveBtn = el("button", "kyrspect-live", {
    type: "button",
    "aria-label": labels.live,
  });
  liveBtn.innerHTML = `<span class="kyrspect-live-dot"></span><span>${labels.live}</span>`;

  const ccBtn = button("subtitles", labels.subtitles, icons.subtitles);
  ccBtn.setAttribute("aria-haspopup", "menu");
  ccBtn.setAttribute("aria-expanded", "false");
  const settingsBtn = button("settings", labels.settings, icons.settings);
  settingsBtn.setAttribute("aria-haspopup", "menu");
  settingsBtn.setAttribute("aria-expanded", "false");
  const pipBtn = button("pip", labels.pip, icons.pip);
  const fsBtn = button("fullscreen", labels.fullscreen, icons.fullscreen);

  if (controls.play) left.append(playBtn);
  if (controls.volume) left.append(volumeWrap);
  left.append(time);
  if (controls.live) left.append(liveBtn);
  if (controls.subtitles) right.append(ccBtn);
  if (controls.settings) right.append(settingsBtn);
  if (controls.pip) right.append(pipBtn);
  if (controls.fullscreen) right.append(fsBtn);

  if (controls.audioVisualizer) controlBar.append(waveformEl);
  if (controls.timeline) controlBar.append(timeline);
  bar.append(left, right);
  controlBar.append(bar);

  const menu = el("div", "kyrspect-menu", {
    role: "menu",
    "aria-label": labels.settings,
  });
  menu.dataset.open = "false";

  let statsFields: StatsField[] = options.statsFields ?? (typeof player.getStatsFields === "function" ? player.getStatsFields() : []);
  const sparkHistory = createSparkHistory();
  const debug = el("div", "kyrspect-stats");
  const statsHead = el("div", "kyrspect-stats-head");
  const statsTitle = el("div", "kyrspect-stats-title");
  statsTitle.textContent = labels.statsForNerds;
  const statsClose = el("button", "kyrspect-stats-close", {
    type: "button",
    "aria-label": labels.statsClose,
  });
  statsClose.textContent = "[X]";
  statsHead.append(statsTitle, statsClose);
  const statsBody = el("div", "kyrspect-stats-body");
  debug.append(statsHead, statsBody);
  const context = el("div", "kyrspect-context", {
    role: "menu",
    "aria-label": labels.player,
  });
  context.dataset.open = "false";
  const toast = el("div", "kyrspect-toast");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const captions = el("div", "kyrspect-captions");
  captions.setAttribute("aria-live", "polite");

  overlay.append(center, errorBox, controlBar, menu, debug, context, toast);
  root.append(captions, overlay);

  let hideTimer = 0;
  let toastTimer = 0;
  let menuOpen = false;
  let contextOpen = false;
  let statsOpen = false;
  let statsTimer: any = null;
  let menuView: MenuView = "root";
  let dragging = false;
  let raf = 0;
  const unsubs: Array<() => void> = [];

  const visible = () => {
    root.classList.add("kyrspect-ui-visible");
    scheduleHide();
  };

  const scheduleHide = () => {
    window.clearTimeout(hideTimer);
    if (menuOpen || contextOpen || (showOnPause && player.paused)) return;
    hideTimer = window.setTimeout(() => {
      if (!player.paused && !menuOpen && !contextOpen) root.classList.remove("kyrspect-ui-visible");
    }, hideDelay);
  };

  const setPausedClass = () => {
    root.classList.toggle("kyrspect-paused", player.paused || player.ended);
    playBtn.innerHTML = player.paused ? icons.play : icons.pause;
    playBtn.setAttribute("aria-label", player.paused ? labels.play : labels.pause);
    bigPlay.setAttribute("aria-label", player.paused ? labels.play : labels.pause);
    if (player.paused && showOnPause) root.classList.add("kyrspect-ui-visible");
    scheduleHide();
  };

  const updateVolume = () => {
    const level = player.muted ? 0 : player.volume;
    muteBtn.innerHTML =
      level === 0 ? icons.volumeMuted : level < 0.5 ? icons.volumeLow : icons.volumeHigh;
    muteBtn.setAttribute("aria-label", player.muted ? labels.unmute : labels.mute);
    volume.value = String(level);
    volume.setAttribute("aria-valuetext", `${Math.round(level * 100)}%`);
  };

  const updateLive = () => {
    const live = player.isLive;
    liveBtn.hidden = !live || !controls.live;
    liveBtn.classList.toggle("is-live", live && player.atLiveEdge());
    sep.hidden = live;
    duration.hidden = live;
  };

  const updateTime = () => {
    const dur = player.duration;
    const t = player.currentTime;
    if (player.isLive) {
      const behind = Number.isFinite(dur) ? Math.max(0, dur - t) : (player.liveLatency ?? 0);
      current.textContent = player.atLiveEdge() ? labels.live : formatLiveOffset(behind);
    } else {
      const long = Number.isFinite(dur) && dur >= 3600;
      current.textContent = formatClock(t, long);
      duration.textContent = Number.isFinite(dur) ? formatClock(dur, long) : "--:--";
    }
    const max = Number.isFinite(dur) ? dur : 0;
    timeline.setAttribute("aria-valuemax", String(Math.floor(max)));
    timeline.setAttribute("aria-valuenow", String(Math.floor(t)));
    timeline.setAttribute("aria-valuetext", current.textContent ?? "");
    const playedRatio = player.isLive && Number.isFinite(dur)
      ? (dur <= 0 ? 1 : t / dur)
      : ratioFromTimeRanges(player.buffered, t, dur, "played");
    const bufferedRatio = ratioFromTimeRanges(player.buffered, t, dur, "buffered");
    const playedPct = `${Math.max(0, Math.min(1, playedRatio)) * 100}%`;
    played.style.width = playedPct;
    knob.style.left = playedPct;
    buffered.style.width = `${Math.max(0, Math.min(1, bufferedRatio)) * 100}%`;
    if (audioVisualizerEnabled) {
      waveform.update(playedRatio, bufferedRatio);
    }
  };

  const updateFsPip = () => {
    const fs = player.isFullscreen();
    root.classList.toggle("kyrspect-fullscreen", fs);
    fsBtn.innerHTML = fs ? icons.exitFullscreen : icons.fullscreen;
    fsBtn.setAttribute("aria-label", fs ? labels.exitFullscreen : labels.fullscreen);
    const pip = player.isPictureInPicture();
    pipBtn.innerHTML = icons.pip;
    pipBtn.setAttribute("aria-label", pip ? labels.exitPip : labels.pip);
    pipBtn.hidden = !controls.pip || !player.isPipAvailable();
    fsBtn.hidden = !controls.fullscreen || !player.isFullscreenAvailable();
  };

  let activeSubtitleId: string | null = null;
  let activeAudioId: string | null = null;

  const updateTracks = () => {
    const subs = player.getSubtitleTracks();
    ccBtn.hidden = !controls.subtitles || subs.length === 0;
    ccBtn.setAttribute("aria-pressed", String(Boolean(activeSubtitleId)));
  };

  const isSettingsView = (view: MenuView) => view !== "captions";

  const syncMenuChrome = () => {
    settingsBtn.setAttribute("aria-expanded", String(menuOpen && isSettingsView(menuView)));
    ccBtn.setAttribute("aria-expanded", String(menuOpen && menuView === "captions"));
  };

  const renderMenu = () => {
    menu.dataset.view = menuView;
    syncMenuChrome();
    menu.replaceChildren();
    menu.dataset.view = menuView;

    const subtitleFonts = [
      { id: "default", label: labels.fontDefault, value: "inherit" },
      { id: "sans", label: labels.fontSans, value: "Arial, Helvetica, sans-serif" },
      { id: "serif", label: labels.fontSerif, value: "Georgia, 'Times New Roman', serif" },
      { id: "mono", label: labels.fontMono, value: "'Roboto Mono', 'Courier New', monospace" },
      { id: "cursive", label: labels.fontCursive, value: "'Trebuchet MS', 'Comic Sans MS', cursive" },
    ];

    const subtitleColors = [
      { id: "white", label: labels.colorWhite, value: "#ffffff" },
      { id: "yellow", label: labels.colorYellow, value: "#ffff00" },
      { id: "green", label: labels.colorGreen, value: "#00ff00" },
      { id: "cyan", label: labels.colorCyan, value: "#00ffff" },
      { id: "red", label: labels.colorRed, value: "#ff3b30" },
    ];

    const subtitleBgs = [
      { id: "black-semi", label: labels.bgBlackSemi, value: "rgba(8, 8, 8, 0.75)" },
      { id: "black-solid", label: labels.bgBlackSolid, value: "#000000" },
      { id: "transparent", label: labels.bgTransparent, value: "transparent" },
      { id: "dark-blue", label: labels.bgDarkBlue, value: "rgba(10, 25, 47, 0.85)" },
      { id: "dark-gray", label: labels.bgDarkGray, value: "rgba(45, 45, 45, 0.85)" },
    ];

    const equalizerOptions: Array<{ id: string; label: string }> = [
      { id: "flat", label: labels.eqFlat },
      { id: "bass-boost", label: labels.eqBassBoost },
      { id: "bass-reducer", label: labels.eqBassReducer },
      { id: "treble-boost", label: labels.eqTrebleBoost },
      { id: "vocal", label: labels.eqVocal },
      { id: "rock", label: labels.eqRock },
      { id: "pop", label: labels.eqPop },
      { id: "classical", label: labels.eqClassical },
      { id: "electronic", label: labels.eqElectronic },
    ];

    const getSubStyle = () => {
      const fromPlayer = player.getSubtitleStyle ? player.getSubtitleStyle() : {};
      return {
        fontFamily: fromPlayer.fontFamily ?? "inherit",
        color: fromPlayer.color ?? "#ffffff",
        backgroundColor: fromPlayer.backgroundColor ?? "rgba(8, 8, 8, 0.75)",
      };
    };

    const setSubStyle = (patch: Record<string, string | undefined>) => {
      player.setSubtitleStyle?.(patch);
      if (patch.fontFamily) root.style.setProperty("--kyrspect-sub-font-family", patch.fontFamily);
      if (patch.color) root.style.setProperty("--kyrspect-sub-color", patch.color);
      if (patch.backgroundColor) root.style.setProperty("--kyrspect-sub-bg-color", patch.backgroundColor);
    };

    const isDualChannel = () => {
      return player.isDualChannelAudioEnabled ? player.isDualChannelAudioEnabled() : false;
    };
    const setDualChannel = (enabled: boolean) => {
      player.setDualChannelAudio?.(enabled);
    };

    const getEqPreset = () => {
      return player.getEqualizerPreset ? player.getEqualizerPreset() : "flat";
    };
    const setEqPreset = (preset: string) => {
      player.setEqualizerPreset?.(preset);
    };

    const addHeader = (text: string, back?: boolean) => {
      if (!back) {
        const title = el("div", "kyrspect-menu-title");
        title.textContent = text;
        menu.append(title);
        return;
      }
      const header = el("button", "kyrspect-menu-back", { type: "button" });
      header.innerHTML = `${icons.back}<span>${text}</span>`;
      header.addEventListener("click", (event) => {
        event.stopPropagation();
        if (
          menuView === "advanced-sub-font" ||
          menuView === "advanced-sub-color" ||
          menuView === "advanced-sub-bg"
        ) {
          menuView = "advanced-subtitles";
        } else if (
          menuView === "advanced-subtitles" ||
          menuView === "advanced-equalizer"
        ) {
          menuView = "advanced";
        } else {
          menuView = "root";
        }
        renderMenu();
      });
      menu.append(header);
    };
    const addItem = (
      label: string,
      onClick: () => void,
      options: {
        checked?: boolean;
        value?: string;
        chevron?: boolean;
        current?: string;
        toggle?: boolean;
        icon?: string;
        colorDot?: string;
      } = {},
    ) => {
      const item = el("button", "kyrspect-menu-item", {
        type: "button",
        role: options.toggle ? "menuitemcheckbox" : options.chevron ? "menuitem" : "menuitemradio",
        "aria-checked": String(Boolean(options.checked)),
      });
      if (options.value) item.dataset.value = options.value;
      if (!options.chevron && !options.toggle) {
        const check = el("span", "kyrspect-menu-check");
        check.innerHTML = icons.check;
        item.append(check);
      }
      if (options.colorDot) {
        const dot = el("span", "kyrspect-menu-color-dot");
        dot.style.backgroundColor = options.colorDot;
        item.append(dot);
      }
      if (options.icon) {
        const ico = el("span", "kyrspect-menu-check");
        ico.style.opacity = "1";
        ico.innerHTML = options.icon;
        item.append(ico);
      }
      const text = el("span", "kyrspect-menu-label");
      text.textContent = label;
      item.append(text);
      if (options.current) {
        const current = el("span", "kyrspect-menu-value");
        current.textContent = options.current;
        item.append(current);
      }
      if (options.toggle) {
        const toggle = el("span", "kyrspect-menu-toggle");
        toggle.setAttribute("aria-hidden", "true");
        const thumb = el("span", "kyrspect-menu-toggle-thumb");
        toggle.append(thumb);
        item.append(toggle);
      }
      if (options.chevron) {
        const chevron = el("span", "kyrspect-menu-chevron");
        chevron.innerHTML = icons.chevron;
        item.append(chevron);
      }
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        onClick();
      });
      menu.append(item);
    };

    if (menuView === "root") {
      if (controls.quality && player.getQualities().length > 0) {
        const q = player.getQuality();
        addItem(labels.quality, () => {
          menuView = "quality";
          renderMenu();
        }, {
          chevron: true,
          current: q.mode === "auto"
            ? (q.height ? `${labels.qualityAuto} ${q.height}p` : labels.qualityAuto)
            : `${q.height || q.level}p`,
        });
      }
      if (controls.playbackRate) {
        addItem(labels.playbackRate, () => {
          menuView = "rate";
          renderMenu();
        }, {
          chevron: true,
          current: player.playbackRate === 1 ? labels.playbackRateNormal : `${player.playbackRate}`,
        });
      }
      if (controls.subtitles && player.getSubtitleTracks().length > 0) {
        const active = player.getSubtitleTracks().find((track) => track.id === activeSubtitleId);
        addItem(labels.subtitles, () => {
          menuView = "captions";
          renderMenu();
        }, {
          chevron: true,
          current: active ? (active.label || active.language) : labels.subtitlesOff,
        });
      }
      if (player.getAudioTracks().length > 1) {
        const active = player.getAudioTracks().find((track) => track.id === activeAudioId);
        addItem(labels.audio, () => {
          menuView = "audio";
          renderMenu();
        }, {
          chevron: true,
          current: active ? (active.label || active.language) : "",
        });
      }
      if (controls.audioVisualizer) {
        addItem(
          labels.audioVisualizer,
          () => {
            audioVisualizerEnabled = !audioVisualizerEnabled;
            waveform.setVisible(audioVisualizerEnabled);
            renderMenu();
          },
          {
            toggle: true,
            checked: audioVisualizerEnabled,
            current: audioVisualizerEnabled ? labels.on : labels.off,
            icon: icons.waveform,
          },
        );
      }
      if (controls.settings) {
        const activeThemeId = root.dataset.theme || "default";
        const themeLabel = getThemeLocalizedLabel(activeThemeId, activeThemeResolved.label);
        addItem(
          labels.theme,
          () => {
            menuView = "theme";
            renderMenu();
          },
          {
            chevron: true,
            current: themeLabel,
            colorDot: activeThemeResolved.accent,
          },
        );
        addItem(
          labels.advancedSettings,
          () => {
            menuView = "advanced";
            renderMenu();
          },
          {
            chevron: true,
            icon: icons.sliders,
          },
        );
      }
    } else if (menuView === "theme") {
      addHeader(labels.theme, true);
      const activeThemeId = root.dataset.theme || "default";
      const themes = getRegisteredThemes();
      for (const t of themes) {
        const itemLabel = getThemeLocalizedLabel(t.id, t.label);
        addItem(
          itemLabel,
          () => {
            activeThemeResolved = applyTheme(root, t.id);
            const playerAny = player as unknown as { setTheme?: (theme: ThemeInput) => void };
            if (typeof playerAny.setTheme === "function") {
              playerAny.setTheme(t.id);
            }
            renderMenu();
          },
          {
            checked: activeThemeId === t.id,
            colorDot: t.theme.accent,
          },
        );
      }
    } else if (menuView === "quality") {
      addHeader(labels.quality, true);
      addItem(labels.qualityAuto, () => {
        player.enableAutoQuality();
        closeMenu();
      }, { checked: player.getQuality().mode === "auto" });
      const qualities = [...player.getQualities()].sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
      for (const quality of qualities) {
        const active = player.getQuality().mode === "manual" && player.getQuality().height === quality.height;
        addItem(quality.name || `${quality.height}p`, () => {
          player.setQuality(quality.height || quality.id);
          closeMenu();
        }, { checked: active });
      }
    } else if (menuView === "rate") {
      addHeader(labels.playbackRate, true);

      const panel = el("div", "kyrspect-rate-panel");
      const display = el("div", "kyrspect-rate-display");
      display.textContent = `${player.playbackRate.toFixed(2)}x`;

      const controlsRow = el("div", "kyrspect-rate-controls");
      const minusBtn = el("button", "kyrspect-rate-btn", {
        type: "button",
        "aria-label": "Decrease speed",
      });
      minusBtn.textContent = "−";

      const sliderWrap = el("div", "kyrspect-rate-range-wrap");
      const slider = el("input", "kyrspect-rate-range", {
        type: "range",
        min: "0.25",
        max: "3",
        step: "0.05",
        value: String(player.playbackRate),
        "aria-label": labels.playbackRate,
      }) as HTMLInputElement;

      const updateSliderBackground = (val: number) => {
        const pct = Math.max(0, Math.min(100, ((val - 0.25) / (3.0 - 0.25)) * 100));
        slider.style.background = `linear-gradient(to right, #fff 0%, #fff ${pct}%, rgba(255, 255, 255, 0.25) ${pct}%, rgba(255, 255, 255, 0.25) 100%)`;
      };
      updateSliderBackground(player.playbackRate);

      const plusBtn = el("button", "kyrspect-rate-btn", {
        type: "button",
        "aria-label": "Increase speed",
      });
      plusBtn.textContent = "+";

      sliderWrap.append(slider);
      controlsRow.append(minusBtn, sliderWrap, plusBtn);

      const chipsRow = el("div", "kyrspect-rate-chips");
      const presets = [1, 1.25, 1.5, 2, 3];
      const chipButtons: HTMLButtonElement[] = [];

      const formatRatePill = (rate: number): string => {
        if (resolveLocale(language) === "tr") {
          return rate === 1 ? "1,0" : rate === 2 ? "2,0" : rate === 3 ? "3,0" : String(rate).replace(".", ",");
        }
        return rate === 1 ? "1.0" : rate === 2 ? "2.0" : rate === 3 ? "3.0" : String(rate);
      };

      const updateActiveChips = () => {
        const cur = player.playbackRate;
        for (const btn of chipButtons) {
          const r = Number(btn.dataset.rate);
          const active = Math.abs(cur - r) < 0.01;
          btn.setAttribute("aria-checked", String(active));
        }
      };

      for (const rate of presets) {
        const col = el("div", "kyrspect-rate-chip-col");
        const chip = el("button", "kyrspect-rate-chip kyrspect-menu-item", {
          type: "button",
          role: "menuitemradio",
          "aria-checked": String(player.playbackRate === rate),
        }) as HTMLButtonElement;
        chip.dataset.rate = String(rate);
        chip.dataset.value = String(rate);
        chip.textContent = rate === 1.5 && resolveLocale(language) === "en" ? "1.5" : formatRatePill(rate);

        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          player.setPlaybackRate(rate);
          closeMenu();
        });

        col.append(chip);
        if (rate === 1) {
          const sub = el("span", "kyrspect-rate-chip-label");
          sub.textContent = labels.playbackRateNormal;
          col.append(sub);
        }
        chipButtons.push(chip);
        chipsRow.append(col);
      }

      const applyRate = (val: number) => {
        val = Math.round(val * 100) / 100;
        val = Math.max(0.25, Math.min(3, val));
        player.setPlaybackRate(val);
        display.textContent = `${val.toFixed(2)}x`;
        slider.value = String(val);
        updateSliderBackground(val);
        updateActiveChips();
      };

      minusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applyRate(player.playbackRate - 0.05);
      });

      plusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applyRate(player.playbackRate + 0.05);
      });

      slider.addEventListener("input", (e) => {
        e.stopPropagation();
        const val = parseFloat(slider.value);
        applyRate(val);
      });

      panel.append(display, controlsRow, chipsRow);
      menu.append(panel);
    } else if (menuView === "captions") {
      addHeader(labels.subtitles, true);
      addItem(labels.subtitlesOff, () => {
        player.disableSubtitles();
        closeMenu();
      }, { checked: !activeSubtitleId });
      for (const track of player.getSubtitleTracks()) {
        addItem(track.label || track.language, () => {
          player.setSubtitleTrack(track.id);
          closeMenu();
        }, { checked: activeSubtitleId === track.id });
      }
    } else if (menuView === "audio") {
      addHeader(labels.audio, true);
      for (const track of player.getAudioTracks()) {
        addItem(track.label || track.language, () => {
          player.setAudioTrack(track.id);
          closeMenu();
        }, { checked: activeAudioId === track.id });
      }
    } else if (menuView === "advanced") {
      addHeader(labels.advancedSettings, true);
      addItem(
        labels.performanceMode,
        () => {
          applyPerformanceMode(!performanceMode, true);
          renderMenu();
        },
        {
          toggle: true,
          checked: performanceMode,
          current: performanceMode ? labels.on : labels.off,
          icon: icons.gauge,
        },
      );
      addItem(
        labels.subtitleSettings,
        () => {
          menuView = "advanced-subtitles";
          renderMenu();
        },
        {
          chevron: true,
          icon: icons.textAa,
        },
      );
      addItem(
        labels.audioDualChannel,
        () => {
          setDualChannel(!isDualChannel());
          renderMenu();
        },
        {
          toggle: true,
          checked: isDualChannel(),
          current: isDualChannel() ? labels.on : labels.off,
        },
      );
      const activePresetLabel =
        equalizerOptions.find((eq) => eq.id === getEqPreset())?.label ?? labels.eqFlat;
      addItem(
        labels.equalizer,
        () => {
          menuView = "advanced-equalizer";
          renderMenu();
        },
        {
          chevron: true,
          current: activePresetLabel,
          icon: icons.sliders,
        },
      );
    } else if (menuView === "advanced-subtitles") {
      addHeader(labels.subtitleSettings, true);
      const cur = getSubStyle();
      const currentFont =
        subtitleFonts.find((f) => f.value === cur.fontFamily)?.label ?? labels.fontDefault;
      const currentColor =
        subtitleColors.find((c) => c.value.toLowerCase() === cur.color.toLowerCase())?.label ?? labels.colorWhite;
      const currentBg =
        subtitleBgs.find((b) => b.value.toLowerCase() === cur.backgroundColor.toLowerCase())?.label ?? labels.bgBlackSemi;

      addItem(
        labels.subtitleFont,
        () => {
          menuView = "advanced-sub-font";
          renderMenu();
        },
        {
          chevron: true,
          current: currentFont,
          icon: icons.textAa,
        },
      );
      addItem(
        labels.subtitleColor,
        () => {
          menuView = "advanced-sub-color";
          renderMenu();
        },
        {
          chevron: true,
          current: currentColor,
          colorDot: cur.color,
          icon: icons.palette,
        },
      );
      addItem(
        labels.subtitleBgColor,
        () => {
          menuView = "advanced-sub-bg";
          renderMenu();
        },
        {
          chevron: true,
          current: currentBg,
        },
      );
    } else if (menuView === "advanced-sub-font") {
      addHeader(labels.subtitleFont, true);
      const cur = getSubStyle();
      for (const font of subtitleFonts) {
        addItem(
          font.label,
          () => {
            setSubStyle({ fontFamily: font.value });
            renderMenu();
          },
          { checked: cur.fontFamily === font.value, value: font.id },
        );
      }
    } else if (menuView === "advanced-sub-color") {
      addHeader(labels.subtitleColor, true);
      const cur = getSubStyle();
      for (const color of subtitleColors) {
        addItem(
          color.label,
          () => {
            setSubStyle({ color: color.value });
            renderMenu();
          },
          {
            checked: cur.color.toLowerCase() === color.value.toLowerCase(),
            colorDot: color.value,
            value: color.id,
          },
        );
      }
    } else if (menuView === "advanced-sub-bg") {
      addHeader(labels.subtitleBgColor, true);
      const cur = getSubStyle();
      for (const bg of subtitleBgs) {
        addItem(
          bg.label,
          () => {
            setSubStyle({ backgroundColor: bg.value });
            renderMenu();
          },
          {
            checked: cur.backgroundColor.toLowerCase() === bg.value.toLowerCase(),
            value: bg.id,
          },
        );
      }
    } else if (menuView === "advanced-equalizer") {
      addHeader(labels.equalizer, true);
      const activeEq = getEqPreset();
      for (const eq of equalizerOptions) {
        addItem(
          eq.label,
          () => {
            setEqPreset(eq.id);
            renderMenu();
          },
          { checked: activeEq === eq.id, value: eq.id },
        );
      }
    }
  };

  const openMenuAt = (view: MenuView) => {
    closeContext();
    menuOpen = true;
    menuView = view;
    menu.dataset.open = "true";
    renderMenu();
    root.classList.add("kyrspect-ui-visible");
  };

  const closeMenu = () => {
    menuOpen = false;
    menu.dataset.open = "false";
    delete menu.dataset.view;
    syncMenuChrome();
    scheduleHide();
  };

  const toggleSettingsMenu = () => {
    if (menuOpen && isSettingsView(menuView)) {
      closeMenu();
      return;
    }
    openMenuAt("root");
  };

  const toggleCaptionsMenu = () => {
    if (menuOpen && menuView === "captions") {
      closeMenu();
      return;
    }
    openMenuAt("captions");
  };

  const dismissTransientOverlays = () => {
    if (menuOpen) closeMenu();
    if (contextOpen) closeContext();
  };

  const videoUrl = (withTime = false): string => {
    const raw = player.media.currentSrc || player.media.src || "";
    const fallback = typeof window !== "undefined" ? window.location.href : raw;
    if (!raw) return fallback;
    try {
      const url = new URL(raw, typeof window !== "undefined" ? window.location.href : undefined);
      if (withTime && Number.isFinite(player.currentTime)) {
        url.searchParams.set("t", String(Math.floor(player.currentTime)));
      }
      return url.toString();
    } catch {
      return raw;
    }
  };

  const copyText = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through */
    }
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  };

  const showToast = (message: string) => {
    toast.textContent = message;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 1600);
  };

  const debugSnapshot = () => {
    const stats = player.getStats();
    return JSON.stringify(
      {
        src: videoUrl(),
        paused: player.paused,
        muted: player.muted,
        loop: player.loop,
        playbackRate: player.playbackRate,
        language: resolveLocale(language),
        ...stats,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      },
      null,
      2,
    );
  };

  const openStats = () => {
    statsOpen = true;
    root.classList.add("kyrspect-stats-open");
    renderStats();
    if (!statsTimer) {
      statsTimer = window.setInterval(() => {
        if (statsOpen) renderStats();
      }, 500);
    }
  };

  const closeStats = () => {
    statsOpen = false;
    root.classList.remove("kyrspect-stats-open");
    if (statsTimer) {
      window.clearInterval(statsTimer);
      statsTimer = null;
    }
  };

  const renderStats = () => {
    const fields = statsFields.length ? statsFields : player.getStatsFields();
    statsTitle.textContent = labels.statsForNerds;
    statsClose.setAttribute("aria-label", labels.statsClose);
    renderStatsRows(statsBody, player, fields, labels, sparkHistory);
  };

  const closeContext = () => {
    contextOpen = false;
    context.dataset.open = "false";
    scheduleHide();
  };

  const renderContext = () => {
    context.replaceChildren();
    const addContextItem = (
      icon: string,
      label: string,
      onClick: () => void,
      options: { checked?: boolean } = {},
    ) => {
      const item = el("button", "kyrspect-context-item", {
        type: "button",
        role: "menuitem",
      });
      if (options.checked != null) item.setAttribute("aria-checked", String(options.checked));
      const glyph = el("span", "kyrspect-context-icon");
      glyph.innerHTML = icon;
      const text = el("span", "kyrspect-context-label");
      text.textContent = label;
      const check = el("span", "kyrspect-context-check");
      check.innerHTML = icons.check;
      item.append(glyph, text, check);
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        onClick();
      });
      context.append(item);
    };

    addContextItem(icons.loop, labels.loop, () => {
      player.setLoop(!player.loop);
      closeContext();
    }, { checked: player.loop });
    addContextItem(icons.pip, labels.miniplayer, () => {
      if (player.isPictureInPicture()) void player.exitPictureInPicture();
      else void player.enterPictureInPicture();
      closeContext();
    });
    addContextItem(icons.link, labels.copyVideoUrl, () => {
      void copyText(videoUrl()).then((ok) => {
        if (ok) showToast(labels.copied);
      });
      closeContext();
    });
    addContextItem(icons.link, labels.copyVideoUrlAtTime, () => {
      void copyText(videoUrl(true)).then((ok) => {
        if (ok) showToast(labels.copied);
      });
      closeContext();
    });
    addContextItem(icons.code, labels.copyEmbed, () => {
      const embed = `<iframe src="${videoUrl()}" width="640" height="360" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      void copyText(embed).then((ok) => {
        if (ok) showToast(labels.copied);
      });
      closeContext();
    });
    addContextItem(icons.bug, labels.copyDebug, () => {
      void copyText(debugSnapshot()).then((ok) => {
        if (ok) showToast(labels.copied);
      });
      closeContext();
    });
    addContextItem(icons.question, labels.troubleshoot, () => {
      void copyText(debugSnapshot()).then((ok) => {
        if (ok) showToast(labels.copied);
      });
      if (root.classList.contains("kyrspect-error")) void player.reload();
      closeContext();
    });
    addContextItem(icons.info, labels.statsForNerds, () => {
      if (statsOpen) closeStats();
      else openStats();
      closeContext();
    }, { checked: statsOpen });
    addContextItem(icons.link, labels.about, () => {
      window.open("https://github.com/kyrpi/kyrspect", "_blank", "noopener,noreferrer");
      closeContext();
    });
  };

  const openContext = (event: MouseEvent) => {
    event.preventDefault();
    closeMenu();
    contextOpen = true;
    renderContext();
    context.dataset.open = "true";
    const rootRect = root.getBoundingClientRect();
    context.style.left = "0px";
    context.style.top = "0px";
    const menuRect = context.getBoundingClientRect();
    let left = event.clientX - rootRect.left;
    let top = event.clientY - rootRect.top;
    left = Math.min(left, rootRect.width - menuRect.width - 8);
    top = Math.min(top, rootRect.height - menuRect.height - 8);
    context.style.left = `${Math.max(8, left)}px`;
    context.style.top = `${Math.max(8, top)}px`;
  };

  const timeFromPointer = (event: PointerEvent): number => {
    const rect = timeline.getBoundingClientRect();
    const ratio = rect.width <= 0 ? 0 : Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const dur = player.duration;
    if (!Number.isFinite(dur) || dur <= 0) return 0;
    return ratio * dur;
  };

  const onTimelineMove = (event: PointerEvent) => {
    const seconds = timeFromPointer(event);
    hover.textContent = formatClock(seconds, seconds >= 3600);
    const rect = timeline.getBoundingClientRect();
    const x = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left));
    hover.style.left = `${x}px`;
    preview.style.width = rect.width <= 0 ? "0%" : `${(x / rect.width) * 100}%`;
    if (dragging) player.seek(seconds);
  };

  timeline.addEventListener("pointerdown", (event) => {
    dismissTransientOverlays();
    dragging = true;
    timeline.classList.add("kyrspect-seeking-hover");
    timeline.setPointerCapture(event.pointerId);
    player.seek(timeFromPointer(event));
  });
  timeline.addEventListener("pointermove", onTimelineMove);
  timeline.addEventListener("pointerup", () => {
    dragging = false;
    timeline.classList.remove("kyrspect-seeking-hover");
  });
  timeline.addEventListener("pointerleave", () => {
    if (!dragging) {
      timeline.classList.remove("kyrspect-seeking-hover");
      preview.style.width = "0%";
    }
  });
  timeline.addEventListener("keydown", (event) => {
    const dur = Number.isFinite(player.duration) ? player.duration : 0;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      player.seek(Math.min(dur, player.currentTime + 5));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      player.seek(Math.max(0, player.currentTime - 5));
    } else if (event.key === "Home") {
      event.preventDefault();
      player.seek(0);
    } else if (event.key === "End") {
      event.preventDefault();
      player.seek(dur);
    }
  });

  const flashBezel = (playingNext: boolean) => {
    bezel.innerHTML = playingNext ? icons.play : icons.pause;
    bezel.classList.remove("is-anim");
    void bezel.offsetWidth;
    bezel.classList.add("is-anim");
  };

  const togglePlayback = () => {
    if (player.paused) void player.play();
    else player.pause();
  };

  const isChromeTarget = (target: EventTarget | null) => {
    const node = target instanceof Element ? target : null;
    return Boolean(
      node?.closest(
        ".kyrspect-controls, .kyrspect-menu, .kyrspect-context, .kyrspect-stats, .kyrspect-error-box, .kyrspect-btn, .kyrspect-live, .kyrspect-timeline, .kyrspect-volume-slider",
      ),
    );
  };

  let clickTimer = 0;
  const onSurfaceClick = (event: MouseEvent) => {
    if (contextOpen) {
      closeContext();
      return;
    }
    if (isChromeTarget(event.target) || menuOpen) return;
    if (event.detail > 1) return;
    window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => {
      flashBezel(player.paused);
      togglePlayback();
    }, 220);
  };
  const onSurfaceDblClick = (event: MouseEvent) => {
    if (isChromeTarget(event.target)) return;
    window.clearTimeout(clickTimer);
    void player.toggleFullscreen();
  };

  playBtn.addEventListener("click", () => {
    dismissTransientOverlays();
    togglePlayback();
  });
  bigPlay.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePlayback();
  });
  root.addEventListener("click", onSurfaceClick);
  root.addEventListener("dblclick", onSurfaceDblClick);
  root.addEventListener("contextmenu", openContext);
  context.addEventListener("click", (event) => event.stopPropagation());
  context.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  statsClose.addEventListener("click", (event) => {
    event.stopPropagation();
    closeStats();
  });
  debug.addEventListener("click", (event) => event.stopPropagation());
  muteBtn.addEventListener("click", () => {
    dismissTransientOverlays();
    if (player.muted) player.unmute();
    else player.mute();
  });
  volume.addEventListener("input", () => {
    dismissTransientOverlays();
    const value = Number(volume.value);
    player.setVolume(value);
    if (value > 0 && player.muted) player.unmute();
  });
  liveBtn.addEventListener("click", () => {
    dismissTransientOverlays();
    player.seekToLiveEdge();
  });
  ccBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCaptionsMenu();
  });
  settingsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSettingsMenu();
  });
  menu.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  pipBtn.addEventListener("click", () => {
    dismissTransientOverlays();
    if (player.isPictureInPicture()) void player.exitPictureInPicture();
    else void player.enterPictureInPicture();
  });
  fsBtn.addEventListener("click", () => {
    dismissTransientOverlays();
    void player.toggleFullscreen();
  });
  retry.addEventListener("click", () => {
    void player.reload();
  });
  root.addEventListener("mousemove", visible);
  root.addEventListener("mouseenter", visible);
  root.addEventListener("mouseleave", () => {
    if (!player.paused && !menuOpen && !contextOpen) root.classList.remove("kyrspect-ui-visible");
  });
  const onDocClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (menuOpen && !menu.contains(target) && !settingsBtn.contains(target) && !ccBtn.contains(target)) {
      closeMenu();
    }
    if (contextOpen && !context.contains(target)) closeContext();
  };
  const onDocKey = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (contextOpen) {
      event.preventDefault();
      closeContext();
      return;
    }
    if (statsOpen) {
      event.preventDefault();
      closeStats();
      return;
    }
    if (menuOpen) {
      event.preventDefault();
      closeMenu();
    }
  };
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onDocKey);

  const tick = () => {
    updateTime();
    if (statsOpen) renderStats();
    raf = 0;
  };

  const requestTick = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(tick);
  };

  unsubs.push(
    player.on("play", setPausedClass),
    player.on("pause", () => {
      setPausedClass();
      visible();
    }),
    player.on("ended", setPausedClass),
    player.on("playing", () => {
      root.classList.remove("kyrspect-error", "kyrspect-loading");
      setPausedClass();
    }),
    player.on("volumechange", updateVolume),
    player.on("timeupdate", requestTick),
    player.on("durationchange", () => {
      updateLive();
      updateTime();
      applyFrame();
    }),
    player.on("qualitylevelsloaded", () => {
      if (menuOpen) renderMenu();
      updateTracks();
    }),
    player.on("qualitychange", () => {
      if (menuOpen) renderMenu();
    }),
    player.on("subtitlechange", ((event?: { track?: { id: string } | null }) => {
      activeSubtitleId = event?.track?.id ?? null;
      updateTracks();
      if (menuOpen) renderMenu();
    }) as () => void),
    player.on("audiotrackchange", ((event?: { track?: { id: string } | null }) => {
      activeAudioId = event?.track?.id ?? null;
      if (menuOpen) renderMenu();
    }) as () => void),
    player.on("fullscreenchange", updateFsPip),
    player.on("pictureinpicturechange", updateFsPip),
    player.on("liveedge", updateLive),
    player.on("error", () => {
      root.classList.add("kyrspect-error");
      root.classList.remove("kyrspect-loading");
    }),
    player.on("ready", () => {
      root.classList.remove("kyrspect-error", "kyrspect-loading");
      setPausedClass();
      updateLive();
      updateTracks();
      updateFsPip();
      updateTime();
      applyFrame();
      visible();
    }),
    player.on("loadedmetadata", applyFrame),
    player.on("statsupdate", () => {
      if (statsOpen) renderStats();
    }),
    player.on("ratechange", () => {
      if (menuOpen && menuView === "rate") renderMenu();
    }),
  );

  const applyLanguage = (next?: string, overrides?: Partial<UILabels>) => {
    language = next ?? language;
    labels = resolveLabels(language, overrides ?? options.labels);
    root.setAttribute("lang", resolveLocale(language));
    root.setAttribute("aria-label", labels.player);
    timeline.setAttribute("aria-label", labels.seek);
    volume.setAttribute("aria-label", labels.volume);
    liveBtn.setAttribute("aria-label", labels.live);
    const liveText = liveBtn.querySelector("span:last-child");
    if (liveText) liveText.textContent = labels.live;
    ccBtn.setAttribute("aria-label", labels.subtitles);
    settingsBtn.setAttribute("aria-label", labels.settings);
    menu.setAttribute("aria-label", labels.settings);
    context.setAttribute("aria-label", labels.player);
    statsTitle.textContent = labels.statsForNerds;
    statsClose.setAttribute("aria-label", labels.statsClose);
    retry.textContent = labels.retry;
    if (!root.classList.contains("kyrspect-error")) {
      errorTitle.textContent = labels.errorTitle;
    }
    setPausedClass();
    updateVolume();
    updateFsPip();
    updateTime();
    if (menuOpen) renderMenu();
    if (contextOpen) renderContext();
    if (statsOpen) renderStats();
  };

  const frameObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => applyFrame())
    : null;
  frameObserver?.observe(root);
  if (root.parentElement) frameObserver?.observe(root.parentElement);

  setPausedClass();
  updateVolume();
  updateTime();
  updateLive();
  updateFsPip();
  updateTracks();
  applyFrame();
  visible();

  return {
    setLoading(visibleLoading: boolean) {
      const errored = root.classList.contains("kyrspect-error");
      root.classList.toggle("kyrspect-loading", visibleLoading && !errored);
    },
    setError(message: string | null) {
      root.classList.toggle("kyrspect-error", Boolean(message));
      if (message) {
        root.classList.remove("kyrspect-loading");
        errorTitle.textContent = message;
      } else {
        errorTitle.textContent = labels.errorTitle;
      }
    },
    setTheme(theme: ThemeInput) {
      activeThemeResolved = applyTheme(root, theme);
      if (menuOpen && (menuView === "root" || menuView === "theme")) {
        renderMenu();
      }
    },
    getTheme() {
      return activeThemeResolved;
    },
    getThemeName() {
      return root.dataset.theme || "default";
    },
    setPerformanceMode(enabled: boolean) {
      applyPerformanceMode(enabled, false);
      if (menuOpen) renderMenu();
    },
    isPerformanceMode() {
      return performanceMode;
    },
    setLanguage(next: string, overrides?: Partial<UILabels>) {
      applyLanguage(next, overrides);
    },
    setStatsFields(fields: StatsField[]) {
      statsFields = fields;
      if (statsOpen) renderStats();
    },
    setLayout(next: UILayout) {
      layout = next === "reels" ? "reels" : "standard";
      applyFrame();
    },
    setAspectRatio(next?: UIAspectRatio) {
      aspectRatio = next ?? "auto";
      applyFrame();
    },
    setAudioVisualizer(visible: boolean) {
      audioVisualizerEnabled = visible;
      waveform.setVisible(visible);
      if (menuOpen && menuView === "root") renderMenu();
    },
    isAudioVisualizerVisible() {
      return audioVisualizerEnabled;
    },
    destroy() {
      if (statsTimer) {
        window.clearInterval(statsTimer);
        statsTimer = null;
      }
      window.clearTimeout(hideTimer);
      window.clearTimeout(clickTimer);
      window.clearTimeout(toastTimer);
      if (raf) window.cancelAnimationFrame(raf);
      frameObserver?.disconnect();
      for (const off of unsubs) off();
      waveform.destroy();
      waveformEl.remove();
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onDocKey);
      root.removeEventListener("click", onSurfaceClick);
      root.removeEventListener("dblclick", onSurfaceDblClick);
      root.removeEventListener("contextmenu", openContext);
      root.removeEventListener("mousemove", visible);
      root.removeEventListener("mouseenter", visible);
      captions.remove();
      overlay.remove();
      root.classList.remove(
        "kyrspect-ui-visible",
        "kyrspect-paused",
        "kyrspect-loading",
        "kyrspect-error",
        "kyrspect-debug",
        "kyrspect-stats-open",
        "kyrspect-fullscreen",
        "kyrspect-layout-reels",
        "kyrspect-layout-standard",
        "kyrspect-portrait",
        "kyrspect-landscape",
        "kyrspect-fill",
      );
      delete root.dataset.layout;
      root.style.removeProperty("--kyrspect-aspect");
      root.style.removeProperty("--kyrspect-ratio");
      root.style.removeProperty("--kyrspect-fit");
    },
  };
}

function button(name: string, label: string, icon: string): HTMLButtonElement {
  const node = document.createElement("button");
  node.className = "kyrspect-btn";
  node.type = "button";
  node.dataset.control = name;
  node.setAttribute("aria-label", label);
  node.innerHTML = icon;
  return node;
}
