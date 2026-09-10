import { Kyrspect, type StatsField } from "@kyrspect/core";

const DEFAULT_SRC = "/sample.mp4";
const DEFAULT_ACCENT = "#6d4aff";

function statsFor(src: string): { id: string; fields: StatsField[] } {
  if (src.includes("live") || src.includes("2000341")) {
    return { id: "live-hls", fields: ["videoId", "viewport", "resolution", "connection", "buffer", "live", "flags", "date"] };
  }
  if (src.includes(".m3u8")) {
    return { id: "hls", fields: ["videoId", "viewport", "resolution", "codecs", "connection", "network", "buffer", "flags", "date"] };
  }
  if (src.includes(".mpd") || src.toLowerCase().includes("dash")) {
    return { id: "dash", fields: ["videoId", "viewport", "resolution", "codecs", "connection", "network", "buffer", "live", "flags", "date"] };
  }
  if (src.includes(".webm")) {
    return { id: "webm", fields: ["videoId", "resolution", "volume", "buffer", "date"] };
  }
  if (src.includes("sample.mp4")) {
    return { id: "local-mp4", fields: ["videoId", "viewport", "resolution", "volume", "buffer", "date"] };
  }
  return { id: "progressive", fields: ["videoId", "viewport", "resolution", "codecs", "volume", "buffer", "date"] };
}

function sourceWithStats(src: string) {
  const { id, fields } = statsFor(src);
  return { src, id, stats: { fields } };
}

const player = new Kyrspect("#player", {
  src: sourceWithStats(DEFAULT_SRC),
  tracks: [
    { src: "/sample.vtt", kind: "subtitles", label: "Türkçe", lang: "tr", default: true },
  ],
  captions: {
    mode: "custom",
  },
  controls: true,
  autoplay: true,
  muted: true,
  debug: true,
  hls: {
    preferNative: false,
  },
  ui: {
    theme: {
      accent: DEFAULT_ACCENT,
      accentSoft: "rgba(109, 74, 255, 0.22)",
      live: "#ff4d6a",
    },
  },
});

const url = document.querySelector<HTMLInputElement>("#url")!;
const form = document.querySelector<HTMLFormElement>("#loader")!;
const accent = document.querySelector<HTMLInputElement>("#accent")!;
const language = document.querySelector<HTMLSelectElement>("#language")!;
const layout = document.querySelector<HTMLSelectElement>("#layout")!;
const host = document.querySelector<HTMLElement>("#player")!;
const diag = document.querySelector<HTMLDListElement>("#diag dl")!;
url.value = DEFAULT_SRC;
accent.value = DEFAULT_ACCENT;
language.value = "auto";
layout.value = "standard";

language.addEventListener("change", () => {
  player.setLanguage(language.value);
  document.documentElement.lang = player.language;
});

layout.addEventListener("change", () => {
  const reels = layout.value === "reels";
  host.classList.toggle("is-reels", reels);
  player.setLayout(reels ? "reels" : "standard");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (url.value) void player.load(sourceWithStats(url.value));
});

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-src]")) {
  button.addEventListener("click", () => {
    const src = button.dataset.src;
    if (!src) return;
    url.value = src;
    document.querySelector(".presets button.is-active")?.classList.remove("is-active");
    button.classList.add("is-active");
    void player.load(sourceWithStats(src));
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

accent.addEventListener("input", () => {
  const color = accent.value;
  document.documentElement.style.setProperty("--accent", color);
  player.setTheme({
    accent: color,
    accentSoft: hexToRgba(color, 0.22),
    live: color,
  });
});

const rows: Array<[string, () => string]> = [
  ["Engine", () => {
    const src = url.value;
    if (src.includes(".mpd") || src.toLowerCase().includes("dash")) return "DASH";
    if (src.includes(".m3u8") || player.getQualities().length) return "HLS";
    return "Native";
  }],
  ["Codec", () => player.getQualities()[0]?.codecs || "—"],
  ["Resolution", () => {
    const q = player.getQuality();
    return q.width && q.height ? `${q.width}×${q.height}` : "—";
  }],
  ["Quality", () => {
    const q = player.getQuality();
    return `${q.mode} ${q.height ? `${q.height}p` : ""}`.trim();
  }],
  ["Bitrate", () => {
    const br = player.getQuality().bitrate;
    return br ? `${(br / 1_000_000).toFixed(2)} Mbps` : "—";
  }],
  ["Bandwidth", () => {
    const bw = player.bandwidthEstimate;
    return bw ? `${(bw / 1_000_000).toFixed(2)} Mbps` : "—";
  }],
  ["Buffer", () => `${player.bufferHealth.toFixed(1)} s`],
  ["Dropped frames", () => String(player.getStats().frames.dropped)],
  ["Live latency", () => (player.isLive ? `${player.liveLatency?.toFixed(1) ?? "—"} s` : "—")],
];

function renderDiag() {
  diag.replaceChildren();
  for (const [label, value] of rows) {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value();
    wrap.append(dt, dd);
    diag.append(wrap);
  }
}

let raf = 0;
player.on("ready", renderDiag);
player.on("qualitychange", renderDiag);
player.on("bandwidthchange", renderDiag);
player.on("timeupdate", () => {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    renderDiag();
  });
});
player.on("ready", () => console.log("Kyrspect ready"));

renderDiag();
