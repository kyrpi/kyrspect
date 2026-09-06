import { Kyrspect } from "@kyrspect/core";

const player = new Kyrspect("#player", {
  src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
  autoplay: false,
  muted: true,
  controls: true,
  hls: { preferNative: false },
  debug: true,
});

player.on("ready", () => {
  console.log("levels", player.getQualities());
});

player.on("qualitychange", (event) => {
  console.log("qualitychange", event);
});
