import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:5173/";
const shotPath = process.argv[3] ?? "scripts/diagnose.png";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const logs = [];
page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
page.on("requestfailed", (req) =>
  logs.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText}`),
);

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(6000);

const report = await page.evaluate(() => {
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      w: Math.round(r.width),
      h: Math.round(r.height),
      display: cs.display,
      position: cs.position,
      zIndex: cs.zIndex,
      opacity: cs.opacity,
      visibility: cs.visibility,
      overflow: cs.overflow,
      aspectRatio: cs.aspectRatio,
      minHeight: cs.minHeight,
      paddingBottom: cs.paddingBottom,
    };
  };

  const root = document.querySelector("#player");
  const video = document.querySelector("#player video");
  const sizer = document.querySelector("#player .kyrspect-sizer");
  const overlay = document.querySelector("#player .kyrspect-overlay");
  const controls = document.querySelector("#player .kyrspect-controls");
  const styleTag = document.getElementById("kyrspect-styles");

  return {
    rootClasses: root?.className ?? null,
    rootChildren: root ? Array.from(root.children).map((c) => c.tagName + "." + c.className) : null,
    root: box(root),
    sizer: box(sizer),
    video: box(video),
    overlay: box(overlay),
    controls: box(controls),
    styleInjected: Boolean(styleTag),
    styleLength: styleTag?.textContent?.length ?? 0,
    videoState: video
      ? {
          src: video.currentSrc || video.src || "(none)",
          readyState: video.readyState,
          networkState: video.networkState,
          paused: video.paused,
          muted: video.muted,
          currentTime: Number(video.currentTime.toFixed(2)),
          duration: Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : null,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          error: video.error ? { code: video.error.code, message: video.error.message } : null,
          buffered: video.buffered.length ? Number(video.buffered.end(0).toFixed(2)) : 0,
        }
      : null,
    diagnostics: Array.from(document.querySelectorAll("#diag dl div")).map(
      (d) => `${d.querySelector("dt")?.textContent}: ${d.querySelector("dd")?.textContent}`,
    ),
  };
});

await page.screenshot({ path: shotPath, fullPage: false });

console.log(JSON.stringify(report, null, 2));
console.log("\n--- console ---");
console.log(logs.join("\n") || "(no console output)");

await browser.close();
