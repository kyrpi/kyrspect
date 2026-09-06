import { Kyrspect } from "@kyrspect/core";

const player = new Kyrspect("#player", {
  src: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
  autoplay: true,
  muted: true,
  controls: true,
  live: { lowLatency: false, targetLatency: 3 },
  hls: { preferNative: false },
});

player.on("liveedge", (event) => {
  console.log("live edge", event.atLiveEdge, "latency", player.liveLatency);
});
