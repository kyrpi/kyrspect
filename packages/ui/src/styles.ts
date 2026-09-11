export const PLAYER_STYLE_ID = "kyrspect-styles";

export const PLAYER_CSS = `
.kyrspect-player {
  --kyrspect-accent: #6d4aff;
  --kyrspect-accent-soft: rgba(109, 74, 255, 0.22);
  --kyrspect-background: #000;
  --kyrspect-surface: rgba(16, 16, 20, 0.88);
  --kyrspect-surface-border: rgba(255, 255, 255, 0.08);
  --kyrspect-text: #fff;
  --kyrspect-text-muted: rgba(255, 255, 255, 0.72);
  --kyrspect-control-size: 36px;
  --kyrspect-icon-size: 22px;
  --kyrspect-radius: 12px;
  --kyrspect-font: "Segoe UI Variable", Inter, Roboto, Arial, Helvetica, sans-serif;
  --kyrspect-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  --kyrspect-backdrop-blur: 22px;
  --kyrspect-live: #ff4d6a;
  --kyrspect-track: rgba(255, 255, 255, 0.22);
  --kyrspect-buffered: rgba(255, 255, 255, 0.42);
  --kyrspect-played: var(--kyrspect-accent);
  --kyrspect-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --kyrspect-duration: 220ms;
  --kyrspect-aspect: 16 / 9;
  --kyrspect-ratio: 1.777;
  --kyrspect-fit: contain;
  position: relative;
  display: block;
  width: 100%;
  max-width: 100%;
  min-height: 200px;
  overflow: hidden;
  background: var(--kyrspect-background);
  color: var(--kyrspect-text);
  font-family: var(--kyrspect-font);
  border-radius: var(--kyrspect-radius);
  user-select: none;
  isolation: isolate;
  line-height: 1.2;
}

.kyrspect-sizer {
  display: block;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  pointer-events: none;
}

@supports (aspect-ratio: 1 / 1) {
  .kyrspect-sizer {
    height: auto;
    padding-bottom: 0;
    aspect-ratio: var(--kyrspect-aspect, 16 / 9);
  }
}

.kyrspect-player:focus,
.kyrspect-player:focus-visible {
  outline: none;
}

.kyrspect-player:not(.kyrspect-ui-visible):not(.kyrspect-paused):not(.kyrspect-error) {
  cursor: none;
}

.kyrspect-player *,
.kyrspect-player *::before,
.kyrspect-player *::after {
  box-sizing: border-box;
}

.kyrspect-video {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: var(--kyrspect-fit, contain);
  background: #000;
  border: 0;
}

.kyrspect-captions {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 10px;
  text-align: center;
  pointer-events: none;
  z-index: 5;
  font-size: var(--kyrspect-sub-font-size, 1.05rem);
  font-family: var(--kyrspect-sub-font-family, inherit);
  font-weight: 500;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.88);
  transition: bottom var(--kyrspect-duration) var(--kyrspect-ease);
}

.kyrspect-player.kyrspect-ui-visible .kyrspect-captions,
.kyrspect-player.kyrspect-paused .kyrspect-captions,
.kyrspect-player.kyrspect-error .kyrspect-captions {
  bottom: 64px;
}

.kyrspect-caption-cue {
  display: inline-block;
  padding: 0.15em 0.45em;
  background: var(--kyrspect-sub-bg-color, rgba(8, 8, 8, 0.72));
  border-radius: 6px;
  color: var(--kyrspect-sub-color, #fff);
  font-family: var(--kyrspect-sub-font-family, inherit);
  font-size: var(--kyrspect-sub-font-size, 1.05rem);
}

.kyrspect-video::cue {
  background: var(--kyrspect-sub-bg-color, rgba(8, 8, 8, 0.72));
  color: var(--kyrspect-sub-color, #fff);
  font-family: var(--kyrspect-sub-font-family, inherit);
  font-size: var(--kyrspect-sub-font-size, 1.05rem);
}

.kyrspect-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
  background: transparent;
}

.kyrspect-gradient {
  position: absolute;
  inset: 0;
  height: auto;
  background:
    linear-gradient(to bottom, rgba(0, 0, 0, 0.42) 0%, transparent 24%),
    linear-gradient(to top, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.28) 36%, transparent 72%);
  opacity: 0;
  transition: opacity var(--kyrspect-duration) var(--kyrspect-ease);
  pointer-events: none;
}

.kyrspect-player.kyrspect-ui-visible .kyrspect-gradient,
.kyrspect-player.kyrspect-paused .kyrspect-gradient,
.kyrspect-player.kyrspect-error .kyrspect-gradient {
  opacity: 1;
}

.kyrspect-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.kyrspect-center > * {
  grid-area: 1 / 1;
}

.kyrspect-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.22);
  border-top-color: #fff;
  border-radius: 50%;
  animation: kyrspect-spin 0.7s linear infinite;
  opacity: 0;
  transition: opacity 140ms linear;
}

.kyrspect-player.kyrspect-loading .kyrspect-spinner {
  opacity: 1;
}

.kyrspect-big-play {
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  background: rgba(12, 12, 16, 0.58);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  pointer-events: auto;
  opacity: 0;
  transform: scale(0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  transition: opacity var(--kyrspect-duration) var(--kyrspect-ease), transform var(--kyrspect-duration) var(--kyrspect-ease), background 140ms linear;
}

.kyrspect-big-play svg {
  width: 28px;
  height: 28px;
  fill: currentColor;
}

.kyrspect-player.kyrspect-paused:not(.kyrspect-error):not(.kyrspect-loading) .kyrspect-big-play {
  opacity: 1;
  transform: scale(1);
}

.kyrspect-bezel {
  position: relative;
  width: 60px;
  height: 60px;
  border: 0;
  border-radius: 50%;
  background: rgba(12, 12, 16, 0.5);
  color: #fff;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0;
  backdrop-filter: blur(10px);
}

.kyrspect-bezel svg {
  width: 30px;
  height: 30px;
  fill: currentColor;
}

.kyrspect-bezel.is-anim {
  animation: kyrspect-bezel 0.48s var(--kyrspect-ease);
}

.kyrspect-big-play:hover {
  background: rgba(12, 12, 16, 0.74);
}

.kyrspect-big-play:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.kyrspect-player .kyrspect-error-box {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.78);
  pointer-events: auto;
  z-index: 6;
}

.kyrspect-player.kyrspect-error .kyrspect-error-box {
  display: flex;
}

.kyrspect-player.kyrspect-error .kyrspect-spinner {
  opacity: 0;
}

.kyrspect-error-title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 500;
}

.kyrspect-error-retry {
  margin-top: 12px;
  border: 0;
  border-radius: 999px;
  padding: 9px 16px;
  background: var(--kyrspect-accent);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.02em;
}

.kyrspect-error-retry:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.kyrspect-controls {
  position: relative;
  z-index: 5;
  padding: 0 10px 6px;
  pointer-events: none;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity var(--kyrspect-duration) var(--kyrspect-ease), transform var(--kyrspect-duration) var(--kyrspect-ease);
}

.kyrspect-player.kyrspect-ui-visible .kyrspect-controls,
.kyrspect-player.kyrspect-paused .kyrspect-controls,
.kyrspect-player.kyrspect-error .kyrspect-controls {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.kyrspect-waveform {
  position: relative;
  width: 100%;
  height: 36px;
  margin-bottom: -7px;
  cursor: pointer;
  touch-action: none;
  overflow: hidden;
  display: none;
  z-index: 1;
  transition: opacity var(--kyrspect-duration) var(--kyrspect-ease), height var(--kyrspect-duration) var(--kyrspect-ease);
}

.kyrspect-waveform.is-active {
  display: block;
}

.kyrspect-waveform-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.kyrspect-waveform-hover-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.7);
  pointer-events: none;
  transform: translateX(-50%);
}

.kyrspect-timeline {
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
  margin-bottom: 1px;
}

.kyrspect-timeline:focus-visible {
  outline: none;
}

.kyrspect-timeline-track {
  position: relative;
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: var(--kyrspect-track);
  overflow: visible;
  transition: height 140ms var(--kyrspect-ease);
}

.kyrspect-timeline:hover .kyrspect-timeline-track,
.kyrspect-timeline:focus-visible .kyrspect-timeline-track,
.kyrspect-timeline.kyrspect-seeking-hover .kyrspect-timeline-track {
  height: 4px;
}

.kyrspect-timeline-buffered,
.kyrspect-timeline-preview,
.kyrspect-timeline-played {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  border-radius: inherit;
}

.kyrspect-timeline-buffered {
  background: var(--kyrspect-buffered);
}

.kyrspect-timeline-preview {
  background: rgba(255, 255, 255, 0.35);
  width: 0;
}

.kyrspect-timeline-played {
  background: var(--kyrspect-played, var(--kyrspect-accent));
  box-shadow: 0 0 12px var(--kyrspect-accent-soft);
}

.kyrspect-timeline-knob {
  position: absolute;
  top: 50%;
  left: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 140ms var(--kyrspect-ease);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12), 0 0 0 3px var(--kyrspect-accent-soft);
  pointer-events: none;
  z-index: 2;
}

.kyrspect-timeline:hover .kyrspect-timeline-knob,
.kyrspect-timeline:focus-visible .kyrspect-timeline-knob,
.kyrspect-timeline.kyrspect-seeking-hover .kyrspect-timeline-knob {
  transform: translate(-50%, -50%) scale(1);
}

.kyrspect-timeline-hover {
  position: absolute;
  top: -28px;
  transform: translateX(-50%);
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(16, 16, 20, 0.92);
  color: #fff;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  opacity: 0;
  backdrop-filter: blur(10px);
}

.kyrspect-timeline:hover .kyrspect-timeline-hover,
.kyrspect-timeline.kyrspect-seeking-hover .kyrspect-timeline-hover {
  opacity: 1;
}

.kyrspect-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  min-height: var(--kyrspect-control-size);
}

.kyrspect-bar-left,
.kyrspect-bar-right {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
}

.kyrspect-btn {
  appearance: none;
  width: var(--kyrspect-control-size);
  height: var(--kyrspect-control-size);
  border: 0;
  padding: 0;
  background: transparent;
  color: #fff;
  display: grid;
  place-items: center;
  border-radius: 10px;
  cursor: pointer;
  opacity: 0.94;
  transition: background 160ms var(--kyrspect-ease), opacity 120ms linear;
}

.kyrspect-btn svg {
  width: var(--kyrspect-icon-size);
  height: var(--kyrspect-icon-size);
  fill: currentColor;
}

.kyrspect-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.12);
}

.kyrspect-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 0;
}

.kyrspect-player button:focus:not(:focus-visible),
.kyrspect-player button:active,
.kyrspect-player [role="button"]:focus:not(:focus-visible),
.kyrspect-player [role="button"]:active,
.kyrspect-player [role="menuitem"]:focus:not(:focus-visible),
.kyrspect-player [role="menuitem"]:active,
.kyrspect-btn:focus:not(:focus-visible),
.kyrspect-btn:active,
.kyrspect-big-play:focus:not(:focus-visible),
.kyrspect-big-play:active,
.kyrspect-menu-item:focus:not(:focus-visible),
.kyrspect-menu-item:active,
.kyrspect-menu-back:focus:not(:focus-visible),
.kyrspect-menu-back:active,
.kyrspect-context-item:focus:not(:focus-visible),
.kyrspect-context-item:active,
.kyrspect-rate-btn:focus:not(:focus-visible),
.kyrspect-rate-btn:active,
.kyrspect-rate-chip:focus:not(:focus-visible),
.kyrspect-rate-chip:active {
  outline: none !important;
  box-shadow: none;
}

.kyrspect-menu-item:focus-visible,
.kyrspect-volume-slider:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 0;
}

.kyrspect-btn[aria-pressed="true"] {
  color: #fff;
}

.kyrspect-time {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 6px;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: #fff;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.kyrspect-time-sep {
  opacity: 0.62;
}

.kyrspect-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  margin-left: 2px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
}

.kyrspect-live[hidden] {
  display: none;
}

.kyrspect-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--kyrspect-live);
}

.kyrspect-live.is-live .kyrspect-live-dot {
  animation: kyrspect-pulse 1.4s ease-out infinite;
}

.kyrspect-live:not(.is-live) {
  color: var(--kyrspect-text-muted);
}

.kyrspect-live:not(.is-live) .kyrspect-live-dot {
  background: #aaa;
}

.kyrspect-volume {
  display: flex;
  align-items: center;
  min-width: var(--kyrspect-control-size);
}

.kyrspect-volume-slider {
  width: 0;
  opacity: 0;
  height: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  accent-color: #fff;
  appearance: none;
  cursor: pointer;
  transition: width var(--kyrspect-duration) var(--kyrspect-ease), opacity 140ms linear, margin var(--kyrspect-duration) var(--kyrspect-ease);
}

.kyrspect-volume-slider::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
}

.kyrspect-volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 11px;
  height: 11px;
  margin-top: -4px;
  border: 0;
  border-radius: 50%;
  background: #fff;
}

.kyrspect-volume-slider::-moz-range-track {
  height: 3px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
}

.kyrspect-volume-slider::-moz-range-thumb {
  width: 11px;
  height: 11px;
  border: 0;
  border-radius: 50%;
  background: #fff;
}

.kyrspect-volume:hover .kyrspect-volume-slider,
.kyrspect-volume:focus-within .kyrspect-volume-slider {
  width: 64px;
  opacity: 1;
  margin: 0 6px 0 2px;
}

.kyrspect-menu {
  position: absolute;
  right: 10px;
  bottom: 50px;
  min-width: 240px;
  max-height: min(340px, 72%);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
  padding: 6px 0;
  border-radius: var(--kyrspect-radius, 14px);
  background: var(--kyrspect-surface, rgba(16, 16, 20, 0.88));
  border: 1px solid var(--kyrspect-surface-border, rgba(255, 255, 255, 0.08));
  box-shadow: var(--kyrspect-shadow);
  backdrop-filter: blur(var(--kyrspect-backdrop-blur, 22px));
  -webkit-backdrop-filter: blur(var(--kyrspect-backdrop-blur, 22px));
  z-index: 8;
  display: none;
  /* Overlay is pointer-events: none so clicks reach the video; the menu
     must opt back in or Quality / Speed / Captions cannot be selected. */
  pointer-events: auto;
}

.kyrspect-menu::-webkit-scrollbar {
  width: 4px;
}

.kyrspect-menu::-webkit-scrollbar-track {
  background: transparent;
}

.kyrspect-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 4px;
}

.kyrspect-menu[data-open="true"] {
  display: block;
  animation: kyrspect-menu-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes kyrspect-menu-in {
  0% {
    opacity: 0;
    transform: translateY(6px);
    overflow: hidden;
  }
  99% {
    overflow: hidden;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    overflow-y: auto;
  }
}

.kyrspect-menu[data-open="true"] > * {
  animation: kyrspect-menu-view-fade 140ms ease-out;
}

@keyframes kyrspect-menu-view-fade {
  from {
    opacity: 0.3;
  }
  to {
    opacity: 1;
  }
}

.kyrspect-menu-title,
.kyrspect-menu-back {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 14px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  text-align: left;
}

.kyrspect-menu-back {
  cursor: pointer;
}

.kyrspect-menu-back svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.kyrspect-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 13px;
  padding: 8px 14px;
  cursor: pointer;
  text-align: left;
}

.kyrspect-menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.kyrspect-menu-check {
  width: 20px;
  height: 20px;
  flex: none;
  opacity: 0;
}

.kyrspect-menu-check svg,
.kyrspect-menu-chevron svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.kyrspect-menu-item[aria-checked="true"] .kyrspect-menu-check {
  opacity: 1;
}

.kyrspect-menu-label {
  flex: 1;
  min-width: 0;
}

.kyrspect-menu-value {
  color: rgba(255, 255, 255, 0.68);
  white-space: nowrap;
  font-size: 12px;
}

.kyrspect-menu-chevron {
  width: 18px;
  height: 18px;
  flex: none;
  opacity: 0.86;
}

.kyrspect-menu-toggle {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  transition: background var(--kyrspect-duration) var(--kyrspect-ease);
  flex: none;
  display: inline-flex;
  align-items: center;
}

.kyrspect-menu-toggle-thumb {
  position: absolute;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform var(--kyrspect-duration) var(--kyrspect-ease);
}

.kyrspect-menu-item[aria-checked="true"] .kyrspect-menu-toggle {
  background: var(--kyrspect-accent);
}

.kyrspect-menu-item[aria-checked="true"] .kyrspect-menu-toggle-thumb {
  transform: translateX(14px);
}

.kyrspect-menu-color-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  display: inline-block;
  flex: none;
  margin-right: 4px;
}

.kyrspect-context {
  position: absolute;
  z-index: 12;
  min-width: 260px;
  max-width: min(400px, calc(100% - 16px));
  padding: 6px 0;
  border-radius: 14px;
  background: rgba(16, 16, 20, 0.9);
  box-shadow: var(--kyrspect-shadow);
  backdrop-filter: blur(22px);
  display: none;
  pointer-events: auto;
}

.kyrspect-context[data-open="true"] {
  display: block;
}

.kyrspect-context-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 13px;
  padding: 8px 14px;
  cursor: pointer;
  text-align: left;
}

.kyrspect-context-item:hover,
.kyrspect-context-item:focus-visible {
  background: rgba(255, 255, 255, 0.08);
}

.kyrspect-context-icon {
  width: 18px;
  height: 18px;
  flex: none;
  display: grid;
  place-items: center;
}

.kyrspect-context-icon svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.kyrspect-context-label {
  flex: 1;
  min-width: 0;
}

.kyrspect-context-check {
  width: 16px;
  height: 16px;
  flex: none;
  opacity: 0;
}

.kyrspect-context-check svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.kyrspect-context-item[aria-checked="true"] .kyrspect-context-check {
  opacity: 1;
}

.kyrspect-toast {
  position: absolute;
  left: 50%;
  bottom: 62px;
  z-index: 13;
  transform: translateX(-50%) translateY(8px);
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(16, 16, 20, 0.92);
  color: #fff;
  font-size: 12px;
  pointer-events: none;
  opacity: 0;
  backdrop-filter: blur(12px);
  transition: opacity var(--kyrspect-duration) var(--kyrspect-ease), transform var(--kyrspect-duration) var(--kyrspect-ease);
}

.kyrspect-toast.is-on {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.kyrspect-menu[data-view="rate"] {
  min-width: 300px;
  max-width: 340px;
  padding: 0 0 10px;
}

.kyrspect-rate-panel {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
}

.kyrspect-rate-display {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  padding: 20px 0 14px;
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
}

.kyrspect-rate-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.kyrspect-rate-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 20px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  transition: background 0.15s ease, transform 0.1s ease;
  line-height: 1;
}

.kyrspect-rate-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.kyrspect-rate-btn:active {
  transform: scale(0.92);
}

.kyrspect-rate-btn:focus-visible {
  outline: 2px solid #fff;
  transform: none !important;
  transition: none !important;
}

.kyrspect-rate-range-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}

.kyrspect-rate-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  margin: 0;
  border: none;
  padding: 0;
}

.kyrspect-rate-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: transparent;
}

.kyrspect-rate-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  margin-top: -7px;
  transition: transform 0.1s ease;
}

.kyrspect-rate-range::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.kyrspect-rate-range::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: transparent;
}

.kyrspect-rate-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.kyrspect-rate-chips {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.kyrspect-rate-chip-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.kyrspect-rate-chip {
  width: 100%;
  height: 38px;
  border-radius: 19px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid transparent;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, border-color 0.15s ease;
  padding: 0;
}

.kyrspect-rate-chip:hover {
  background: rgba(255, 255, 255, 0.22);
}

.kyrspect-rate-chip[aria-checked="true"] {
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.4);
}

.kyrspect-rate-chip-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
  white-space: nowrap;
}

.kyrspect-player .kyrspect-stats {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 9;
  min-width: 320px;
  max-width: min(560px, calc(100% - 20px));
  padding: 8px 12px 8px 10px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-family: Roboto, Arial, Helvetica, sans-serif;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 1.38;
  pointer-events: auto;
  display: none;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  user-select: text;
}

.kyrspect-stats-head {
  height: 0;
  margin: 0;
  padding: 0;
  overflow: visible;
}

.kyrspect-stats-title {
  display: none;
}

.kyrspect-stats-close {
  position: absolute;
  top: 6px;
  right: 8px;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-family: monospace, sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 0;
  line-height: 1;
  opacity: 0.9;
  pointer-events: auto;
  z-index: 2;
}

.kyrspect-stats-close:hover {
  opacity: 1;
  color: #ddd;
}

.kyrspect-stats-body {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 10px;
  row-gap: 2px;
  align-items: center;
}

.kyrspect-stats-row {
  display: contents;
}

.kyrspect-stats-key {
  color: #fff;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
  justify-self: end;
  line-height: 1.38;
}

.kyrspect-stats-val {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #fff;
  font-weight: 400;
  text-align: left;
  justify-self: start;
  word-break: break-word;
  line-height: 1.38;
}

.kyrspect-stats-row:first-child .kyrspect-stats-val {
  padding-right: 24px;
}

.kyrspect-stats-num {
  white-space: nowrap;
}

.kyrspect-spark {
  width: clamp(140px, 25vw, 220px);
  height: 11px;
  flex: none;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: inline-block;
  vertical-align: middle;
}

.kyrspect-player.kyrspect-stats-open .kyrspect-stats {
  display: block;
}

.kyrspect-player.kyrspect-portrait:not(.kyrspect-layout-reels):not(.kyrspect-fill) {
  width: min(100%, calc(min(85vh, 920px) * var(--kyrspect-ratio, 0.5625)));
  margin-inline: auto;
}

.kyrspect-player.kyrspect-layout-reels {
  --kyrspect-control-size: 40px;
  --kyrspect-icon-size: 24px;
  --kyrspect-radius: 0;
  --kyrspect-fit: cover;
  height: 100%;
  min-height: 0;
  border-radius: inherit;
}

.kyrspect-player.kyrspect-layout-reels:not(.kyrspect-fill) .kyrspect-sizer {
  height: 0;
  padding-bottom: 177.78%;
}

@supports (aspect-ratio: 1 / 1) {
  .kyrspect-player.kyrspect-layout-reels:not(.kyrspect-fill) .kyrspect-sizer {
    height: auto;
    padding-bottom: 0;
    aspect-ratio: var(--kyrspect-aspect, 9 / 16);
  }
}

.kyrspect-player.kyrspect-layout-reels.kyrspect-fill,
.kyrspect-player.kyrspect-layout-reels.kyrspect-fill .kyrspect-sizer {
  height: 100%;
}

.kyrspect-player.kyrspect-layout-reels.kyrspect-fill .kyrspect-sizer {
  padding-bottom: 0;
  aspect-ratio: auto;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-gradient {
  background:
    linear-gradient(to bottom, rgba(0, 0, 0, 0.28) 0%, transparent 18%),
    linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.18) 42%, transparent 70%);
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-controls {
  padding: 0 12px 14px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-bar {
  min-height: 44px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-bar-right {
  position: absolute;
  right: 8px;
  bottom: 62px;
  flex-direction: column;
  gap: 8px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-bar-right .kyrspect-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(8, 8, 10, 0.32);
  backdrop-filter: blur(10px);
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-bar-right .kyrspect-btn:hover {
  background: rgba(8, 8, 10, 0.5);
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-volume-slider {
  display: none;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-waveform {
  height: 28px;
  margin: 0 -4px -6px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-timeline {
  height: 14px;
  margin: 0 -4px 2px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-timeline-track {
  height: 2px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-timeline:hover .kyrspect-timeline-track,
.kyrspect-player.kyrspect-layout-reels .kyrspect-timeline.kyrspect-seeking-hover .kyrspect-timeline-track {
  height: 3px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-menu {
  right: 60px;
  bottom: 86px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-captions {
  left: 14px;
  right: 72px;
  text-align: left;
  font-size: 0.98rem;
}

.kyrspect-player.kyrspect-layout-reels.kyrspect-ui-visible .kyrspect-captions,
.kyrspect-player.kyrspect-layout-reels.kyrspect-paused .kyrspect-captions,
.kyrspect-player.kyrspect-layout-reels.kyrspect-error .kyrspect-captions {
  bottom: 58px;
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-big-play {
  width: 52px;
  height: 52px;
  background: rgba(8, 8, 10, 0.4);
}

.kyrspect-player.kyrspect-layout-reels .kyrspect-stats {
  top: 12px;
  left: 12px;
  max-width: calc(100% - 72px);
}

.kyrspect-player:fullscreen,
.kyrspect-player:-webkit-full-screen,
.kyrspect-player:-moz-full-screen,
.kyrspect-player.kyrspect-fullscreen {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  border-radius: 0 !important;
}

.kyrspect-player:fullscreen .kyrspect-sizer,
.kyrspect-player:-webkit-full-screen .kyrspect-sizer,
.kyrspect-player:-moz-full-screen .kyrspect-sizer,
.kyrspect-player.kyrspect-fullscreen .kyrspect-sizer {
  height: 100% !important;
  padding-bottom: 0 !important;
  aspect-ratio: auto !important;
}

@media (max-width: 640px) {
  .kyrspect-player:not(.kyrspect-layout-reels) {
    --kyrspect-control-size: 32px;
    --kyrspect-icon-size: 20px;
    border-radius: 10px;
  }

  .kyrspect-player:not(.kyrspect-layout-reels) .kyrspect-controls {
    padding: 0 8px 5px;
  }

  .kyrspect-player:not(.kyrspect-layout-reels) .kyrspect-volume-slider {
    display: none;
  }

  .kyrspect-player:not(.kyrspect-layout-reels) .kyrspect-time {
    font-size: 11px;
    margin: 0 4px;
  }

  .kyrspect-player:not(.kyrspect-layout-reels) .kyrspect-captions {
    left: 5%;
    right: 5%;
    font-size: 0.95rem;
  }
}

/* Re-assert the container box last with two-class specificity so neither host
   page CSS nor player state classes can collapse the player. */
.kyrspect-player.kyrspect-player {
  position: relative;
  display: block;
  overflow: hidden;
}

.kyrspect-player.kyrspect-player > .kyrspect-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

@keyframes kyrspect-spin {
  to { transform: rotate(360deg); }
}

@keyframes kyrspect-pulse {
  70% { box-shadow: 0 0 0 6px rgba(255, 0, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
}

@keyframes kyrspect-bezel {
  0% { opacity: 1; transform: scale(0.85); }
  100% { opacity: 0; transform: scale(1.25); }
}

/* Light theme variations */
.kyrspect-player.kyrspect-theme-light .kyrspect-gradient {
  background:
    linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 0%, transparent 22%),
    linear-gradient(to top, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 36%, transparent 72%);
}

.kyrspect-player.kyrspect-theme-light .kyrspect-btn {
  color: #111827;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.kyrspect-player.kyrspect-theme-light .kyrspect-time {
  color: #111827;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-menu {
  color: #111827;
  scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-menu::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
}

.kyrspect-player.kyrspect-theme-light .kyrspect-menu-title,
.kyrspect-player.kyrspect-theme-light .kyrspect-menu-back {
  color: #111827;
  border-bottom-color: rgba(0, 0, 0, 0.08);
}

.kyrspect-player.kyrspect-theme-light .kyrspect-menu-item {
  color: #111827;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-menu-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.kyrspect-player.kyrspect-theme-light .kyrspect-menu-value {
  color: rgba(17, 24, 39, 0.65);
}

.kyrspect-player.kyrspect-theme-light .kyrspect-timeline-hover {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.kyrspect-player.kyrspect-theme-light .kyrspect-speed-panel {
  color: #111827;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-speed-readout-num {
  color: #111827;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-speed-pill {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-speed-pill:hover {
  background: rgba(0, 0, 0, 0.12);
}

.kyrspect-player.kyrspect-theme-light .kyrspect-speed-pill.is-active {
  background: #111827;
  color: #fff;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-speed-btn {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

.kyrspect-player.kyrspect-theme-light .kyrspect-speed-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.12);
}

/* Glass theme variations */
.kyrspect-player.kyrspect-theme-glass .kyrspect-menu {
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.kyrspect-player.kyrspect-theme-glass .kyrspect-controls {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Legacy Device / Performance Mode (Eski Cihaz / Performans Modu) */
.kyrspect-player.kyrspect-performance-mode,
.kyrspect-player.kyrspect-performance-mode *,
.kyrspect-player.kyrspect-performance-mode *::before,
.kyrspect-player.kyrspect-performance-mode *::after {
  animation: none !important;
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition: none !important;
  transition-duration: 0.001ms !important;
  transition-delay: 0s !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  filter: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.kyrspect-player.kyrspect-performance-mode .kyrspect-waveform {
  display: none !important;
}

.kyrspect-player.kyrspect-performance-mode .kyrspect-menu {
  background: rgba(20, 20, 24, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: none;
}

.kyrspect-player.kyrspect-performance-mode.kyrspect-theme-light .kyrspect-menu {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.16);
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .kyrspect-spinner,
  .kyrspect-live-dot,
  .kyrspect-controls,
  .kyrspect-gradient,
  .kyrspect-big-play,
  .kyrspect-bezel,
  .kyrspect-timeline-track,
  .kyrspect-timeline-knob {
    animation: none;
    transition: none;
  }
}
`;

export function injectStyles(): void {
  if (typeof document === "undefined") return;
  let style = document.getElementById(PLAYER_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = PLAYER_STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== PLAYER_CSS) {
    style.textContent = PLAYER_CSS;
  }
}
