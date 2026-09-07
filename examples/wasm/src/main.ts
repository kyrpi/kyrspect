import "./style.css";
import { KyrspectWasm } from "@kyrspect/wasm";

const SAMPLE_VTT = `WEBVTT

1
00:00:00.500 --> 00:00:04.000
Kyrspect WebAssembly engine.

2
00:00:04.500 --> 00:00:08.000
Adaptive bitrate is running.

3
00:00:08.500 --> 00:00:13.000
Kyrspect UI with buffer tracking.

4
00:00:14.000 --> 00:00:20.000
Video playback for the web.
`;

const PRESETS = {
  sample: {
    src: "/sample.mp4",
    title: "Local Sample Video",
    isLive: false,
  },
  mux_hls: {
    src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "Tears of Steel",
    isLive: false,
  },
  sintel_hls: {
    src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    title: "Sintel Animation",
    isLive: false,
  },
  live_hls: {
    src: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
    title: "Akamai Live Stream",
    isLive: true,
  },
  bbb_dash: {
    src: "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd",
    title: "Big Buck Bunny DASH",
    isLive: false,
  },
};

const THEMES: Record<string, any> = {
  indigo: {
    accent: "#6366f1",
    accentSoft: "rgba(99, 102, 241, 0.2)",
    background: "#0a0c10",
    text: "#ffffff",
    radius: "8px",
  },
  cyberpunk: {
    accent: "#06b6d4",
    accentSoft: "rgba(6, 182, 212, 0.25)",
    background: "#0f172a",
    text: "#38bdf8",
    radius: "4px",
  },
  emerald: {
    accent: "#10b981",
    accentSoft: "rgba(16, 185, 129, 0.2)",
    background: "#064e3b",
    text: "#a7f3d0",
    radius: "12px",
  },
  sunset: {
    accent: "#f43f5e",
    accentSoft: "rgba(244, 63, 94, 0.2)",
    background: "#1c1917",
    text: "#fecdd3",
    radius: "10px",
  },
};

let player: KyrspectWasm | null = null;

async function init() {
  const container = document.getElementById("wasm-player-container")!;

  player = new KyrspectWasm(container, {
    src: PRESETS.sample.src,
    autoplay: false,
    controls: true,
    debug: true,
    ui: {
      theme: THEMES.indigo,
      language: "en",
    },
  });

  player.parseVtt(SAMPLE_VTT, "English", "en", true);

  const fpsEl = document.getElementById("stat-fps")!;
  const droppedEl = document.getElementById("stat-dropped")!;
  const bufferSecEl = document.getElementById("stat-buffer-sec")!;
  const bufferBarEl = document.getElementById("buffer-bar-fill")!;
  const bandwidthEl = document.getElementById("stat-bandwidth")!;
  const qualityEl = document.getElementById("stat-quality")!;
  const cuesEl = document.getElementById("active-cues")!;
  const statusEl = document.getElementById("stat-status")!;

  player.on("statsupdate", (stats: any) => {
    fpsEl.textContent = `${stats.resolution.frameRate || 0} FPS`;
    droppedEl.textContent = `${stats.frames.dropped} / ${stats.frames.decoded}`;
    const ahead = Math.round(stats.buffer.ahead * 10) / 10;
    bufferSecEl.textContent = `${ahead}s`;

    const barPct = Math.min(100, Math.round((ahead / 15) * 100));
    bufferBarEl.style.width = `${barPct}%`;

    const bwMbps = Math.round((stats.network.bandwidthEstimate / 1_000_000) * 10) / 10;
    bandwidthEl.textContent = `${bwMbps} Mbps`;

    qualityEl.textContent = stats.optimal.height ? `${stats.optimal.height}p` : "Auto";
    statusEl.textContent = player?.paused ? "PAUSED" : "PLAYING";
  });

  player.on("cuechange", (data: any) => {
    if (data.activeCues && data.activeCues.length > 0) {
      cuesEl.textContent = data.activeCues.map((c: any) => c.text).join(" | ");
      cuesEl.style.color = "#38bdf8";
    } else {
      cuesEl.textContent = "No subtitle";
      cuesEl.style.color = "var(--text-muted)";
    }
  });

  const buttons = document.querySelectorAll(".source-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.getAttribute("data-key") as keyof typeof PRESETS;
      const preset = PRESETS[key];
      if (preset && player) {
        player.load({ src: preset.src, isLive: preset.isLive });
        player.play().catch(() => {});
      }
    });
  });

  const themeSelect = document.getElementById("theme-select") as HTMLSelectElement;
  themeSelect.addEventListener("change", () => {
    const th = THEMES[themeSelect.value];
    if (th && player) {
      player.setTheme(th);
    }
  });

  const langSelect = document.getElementById("lang-select") as HTMLSelectElement;
  langSelect.addEventListener("change", () => {
    if (player) {
      player.setLanguage(langSelect.value);
    }
  });
}

window.addEventListener("DOMContentLoaded", init);
