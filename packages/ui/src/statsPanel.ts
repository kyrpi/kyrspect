import type { PlayerLike, StatsField, UILabels } from "./types";

const SPARK_LIMIT = 28;

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

function sparkline(values: number[], color: string): string {
  const width = 56;
  const height = 10;
  if (values.length < 2) {
    return `<svg class="kyrspect-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true"></svg>`;
  }
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / max) * (height - 1.2) - 0.6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `<svg class="kyrspect-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.25" /></svg>`;
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
): { text: string; spark?: { key: keyof SparkHistory; color: string } } | null {
  switch (id) {
    case "videoId":
      return { text: stats.id || "—" };
    case "viewport":
      return {
        text: `${stats.viewport.width}x${stats.viewport.height} / ${stats.frames.dropped} dropped of ${stats.frames.decoded}`,
      };
    case "resolution":
      return {
        text: `${formatRes(stats.resolution.width, stats.resolution.height, stats.resolution.frameRate)} / ${formatRes(stats.optimal.width, stats.optimal.height, stats.optimal.frameRate)}`,
      };
    case "volume":
      return { text: `${Math.round(stats.volume.level * 100)}%${stats.volume.muted ? " muted" : ""}` };
    case "codecs":
      return { text: stats.codecs || "—" };
    case "color":
      return { text: stats.color || "—" };
    case "connection":
      return { text: formatKbps(stats.network.bandwidthEstimate), spark: { key: "connection", color: "#3ea6ff" } };
    case "network":
      return { text: formatBytes(stats.network.activityBytes), spark: { key: "network", color: "#7ab7ff" } };
    case "buffer":
      return { text: `${stats.buffer.ahead.toFixed(2)} s`, spark: { key: "buffer", color: "#ff9800" } };
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
      body.append(row(fieldLabel(field, labels), built.text, built.spark ? sparkline(history[built.spark.key], built.spark.color) : ""));
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
    val.innerHTML = `${spark}<span>${value}</span>`;
  } else {
    val.textContent = value;
  }
  node.append(key, val);
  return node;
}
