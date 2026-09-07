import { Kyrspect } from "@kyrspect/core";

const player = new Kyrspect("#player", {
  src: "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd",
  autoplay: false,
  muted: true,
  controls: true,
  dash: { capLevelToPlayerSize: true },
  debug: true,
});

player.on("ready", () => {
  console.log("levels", player.getQualities());
});

player.on("qualitychange", (event) => {
  console.log("qualitychange", event);
});
