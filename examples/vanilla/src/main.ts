import { Kyrspect } from "@kyrspect/core";

const player = new Kyrspect("#player", {
  src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  autoplay: false,
  controls: true,
});

player.on("ready", () => {
  console.log("Kyrspect ready");
});

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-src]")) {
  button.addEventListener("click", () => {
    document.querySelector(".is-active")?.classList.remove("is-active");
    button.classList.add("is-active");
    const src = button.dataset.src;
    if (src) void player.load(src);
  });
}
