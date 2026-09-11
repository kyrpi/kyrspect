import type { PlayerLike, StatsField, UILabels } from "./types";

const SPARK_LIMIT = 44;

export interface SparkHistory {
  connection: number[];
  network: number[];
  buffer: number[];
}

export function createSparkHistory(): SparkHistory {
  return { connection: [], network: [], buffer: [] };
}

export function pushSpark(history: SparkHistory, key: keyof SparkHistory, value: number): void {
  history[key].push(Math.max(0, value));
  if (history[key].length > SPARK_LIMIT) history[key].shift();
}

const sessionCpnMap = new WeakMap<object, string>();

function getSessionCpn(player: PlayerLike): string {
  const obj = player as unknown as object;
  if (sessionCpnMap.has(obj)) return sessionCpnMap.get(obj)!;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const gen = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const cpn = `${gen(4)} ${gen(4)} ${gen(4)} ${gen(4)} ${gen(4)}`;
  sessionCpnMap.set(obj, cpn);
  return cpn;
}

function sparkline(type: "connection" | "network" | "buffer", values: number[]): string {
  const width = 220;
  const height = 11;
  const len = values.length;

  if (type === "buffer") {
    const max = Math.max(30, ...values, 10);
    if (len < 2) {
      const first = values[0] ?? 0;
      const h = len === 1 ? Math.min(height, Math.max(1, (first / max) * height)) : 0;
      return `<svg class="kyrspect-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        <rect width="${width}" height="${height}" fill="#000" />
        ${h > 0 ? `<rect x="0" y="${height - h}" width="${width}" height="${h}" fill="#eb9d52" />` : ""}
      </svg>`;
    }
    const points = values.map((val, i) => {
      const x = (i / (len - 1)) * width;
      const h = Math.min(height, Math.max(0.5, (val / max) * height));
      const y = height - h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const polyPoints = `0,${height} ${points.join(" ")} ${width},${height}`;
    return `<svg class="kyrspect-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <rect width="${width}" height="${height}" fill="#000" />
      <polygon points="${polyPoints}" fill="#eb9d52" />
      <polyline points="${points.join(" ")}" fill="none" stroke="#f8ba74" stroke-width="0.8" />
    </svg>`;
  }

  if (type === "connection") {
    const max = Math.max(...values, 1000000);
    const gradId = `kyr-cg-${Math.random().toString(36).slice(2, 7)}`;
    if (len < 2) {
      return `<svg class="kyrspect-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        <rect width="${width}" height="${height}" fill="#000" />
        <rect width="${width}" height="${height}" fill="#4a8ec2" fill-opacity="0.8" />
      </svg>`;
    }
    const points = values.map((val, i) => {
      const x = (i / (len - 1)) * width;
      const h = Math.min(height, Math.max(2, (val / max) * height));
      const y = height - h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const polyPoints = `0,${height} ${points.join(" ")} ${width},${height}`;
    return `<svg class="kyrspect-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#64b59b" />
          <stop offset="25%" stop-color="#498ec5" />
          <stop offset="65%" stop-color="#f6e594" />
          <stop offset="100%" stop-color="#72b896" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#000" />
      <polygon points="${polyPoints}" fill="url(#${gradId})" />
      <polyline points="${points.join(" ")}" fill="none" stroke="#f6e594" stroke-width="0.75" />
    </svg>`;
  }

  // network activity
  const max = Math.max(...values, 50000);
  const barW = Math.max(2, width / Math.max(len, 1));
  const rects = values
    .map((val, i) => {
      if (!val) return "";
      const x = (i / Math.max(len, 1)) * width;
      const ratio = val / max;
      const h = Math.min(height, Math.max(3, ratio * height));
      const color = ratio > 0.65 ? "#e74c3c" : ratio > 0.3 ? "#f39c12" : "#3f80c6";
      return `<rect x="${x.toFixed(1)}" y="${(height - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" />`;
    })
    .join("");

  return `<svg class="kyrspect-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <rect width="${width}" height="${height}" fill="#000" />
    ${rects}
  </svg>`;
}

function formatRes(width: number, height: number, frameRate?: number): string {
  if (!width || !height) return "—";
  const size = `${width}x${height}`;
  return frameRate ? `${size}@${Math.round(frameRate)}` : size;
}

function formatKbps(bitsPerSecond: number): string {
  if (!bitsPerSecond) return "0 Kbps";
  return `${Math.round(bitsPerSecond / 1000)} Kbps`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  return `${(bytes / 1024).toFixed(bytes >= 10240 ? 0 : 1)} KB`;
}

function fieldLabel(id: string, labels: UILabels): string {
  const map: Record<string, keyof UILabels> = {
    videoId: "statsVideoId",
    viewport: "statsViewport",
    resolution: "statsResolution",
    volume: "statsVolume",
    codecs: "statsCodecs",
    color: "statsColor",
    connection: "statsConnection",
    network: "statsNetwork",
    buffer: "statsBuffer",
    live: "statsLive",
    flags: "statsFlags",
    date: "statsDate",
  };
  const key = map[id];
  return key ? labels[key] : id;
}

function builtInValue(
  id: string,
  player: PlayerLike,
  stats: ReturnType<PlayerLike["getStats"]>,
): { text: string; spark?: { type: "connection" | "network" | "buffer"; key: keyof SparkHistory } } | null {
  switch (id) {
    case "videoId": {
      const scpn = getSessionCpn(player);
      const vid = stats.id && stats.id !== "—" ? stats.id : "";
      return { text: vid ? `${vid} / ${scpn}` : `— / ${scpn}` };
    }
    case "viewport":
      return {
        text: `${stats.viewport.width}x${stats.viewport.height} / ${stats.frames.dropped} dropped of ${stats.frames.decoded}`,
      };
    case "resolution":
      return {
        text: `${formatRes(stats.resolution.width, stats.resolution.height, stats.resolution.frameRate)} / ${formatRes(stats.optimal.width, stats.optimal.height, stats.optimal.frameRate)}`,
      };
    case "volume": {
      const vol = Math.round(stats.volume.level * 100);
      if (stats.volume.muted) {
        return { text: `0% / ${vol}% (muted)` };
      }
      return { text: `${vol}% / 100%` };
    }
    case "codecs":
      return { text: stats.codecs || "—" };
    case "color": {
      const color = stats.color || "bt709 / bt709";
      return { text: color.includes("/") ? color : `${color} / ${color}` };
    }
    case "connection":
      return { text: formatKbps(stats.network.bandwidthEstimate), spark: { type: "connection", key: "connection" } };
    case "network":
      return { text: formatBytes(stats.network.activityBytes), spark: { type: "network", key: "network" } };
    case "buffer":
      return { text: `${stats.buffer.ahead.toFixed(2)} s`, spark: { type: "buffer", key: "buffer" } };
    case "live":
      if (!player.isLive) return null;
      return { text: `${player.liveLatency?.toFixed(2) ?? "—"} s` };
    case "flags":
      return { text: stats.flags || "—" };
    case "date":
      return { text: new Date(stats.timestamp).toString() };
    default:
      return { text: "—" };
  }
}

export function renderStatsRows(
  body: HTMLElement,
  player: PlayerLike,
  fields: StatsField[],
  labels: UILabels,
  history: SparkHistory,
): void {
  const stats = player.getStats();
  pushSpark(history, "connection", stats.network.bandwidthEstimate);
  pushSpark(history, "network", stats.network.activityBytes);
  pushSpark(history, "buffer", stats.buffer.ahead);

  body.replaceChildren();
  for (const field of fields) {
    if (typeof field === "string") {
      const built = builtInValue(field, player, stats);
      if (!built) continue;
      body.append(
        row(
          fieldLabel(field, labels),
          built.text,
          built.spark ? sparkline(built.spark.type, history[built.spark.key]) : "",
        ),
      );
      continue;
    }
    const text =
      typeof field.value === "function" ? field.value(stats) : (field.value ?? "");
    body.append(row(field.label, text || "—"));
  }
}

function row(label: string, value: string, spark = ""): HTMLElement {
  const node = document.createElement("div");
  node.className = "kyrspect-stats-row";
  const key = document.createElement("span");
  key.className = "kyrspect-stats-key";
  key.textContent = label;
  const val = document.createElement("span");
  val.className = "kyrspect-stats-val";
  if (spark) {
    val.innerHTML = `${spark}<span class="kyrspect-stats-num">${value}</span>`;
  } else {
    val.textContent = value;
  }
  node.append(key, val);
  return node;
}
