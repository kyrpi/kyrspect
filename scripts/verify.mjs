import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173/";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const notFound = [];
page.on("response", (res) => {
  if (res.status() === 404) notFound.push(res.url());
});

await page.goto(base, { waitUntil: "networkidle" });

const probe = () =>
  page.evaluate(() => {
    const root = document.querySelector("#player");
    const video = document.querySelector("#player video");
    const controls = document.querySelector("#player .kyrspect-controls");
    const errorBox = document.querySelector("#player .kyrspect-error-box");
    const rootRect = root.getBoundingClientRect();
    return {
      rootDisplay: getComputedStyle(root).display,
      rootSize: `${Math.round(rootRect.width)}x${Math.round(rootRect.height)}`,
      rootClasses: root.className,
      controlsOpacity: controls ? getComputedStyle(controls).opacity : null,
      errorBoxDisplay: errorBox ? getComputedStyle(errorBox).display : null,
      video: {
        src: (video.currentSrc || video.src || "(none)").slice(0, 60),
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        currentTime: Number(video.currentTime.toFixed(2)),
        error: video.error?.code ?? null,
      },
    };
  });

const results = {};

await page.waitForTimeout(2500);
results["1-local-mp4"] = await probe();

// Hover to reveal the control bar.
await page.hover("#player");
await page.waitForTimeout(400);
results["2-controls-on-hover"] = await probe();
await page.screenshot({ path: "scripts/verify-controls.png" });

// HLS through hls.js.
await page.click('button[data-src*="x36xhzz"]');
await page.waitForTimeout(6000);
await page.hover("#player");
await page.waitForTimeout(300);
results["3-hls"] = await probe();
await page.screenshot({ path: "scripts/verify-hls.png" });

// Error state must not collapse the root element. A local, non-playable URL
// fails fast and deterministically.
await page.fill("#url", "http://localhost:5173/definitely-missing.mp4");
await page.click('#loader button[type="submit"]');
await page
  .waitForFunction(() => document.querySelector("#player").classList.contains("kyrspect-error"), {
    timeout: 15000,
  })
  .catch(() => console.error("!! error state never became active"));
await page.waitForTimeout(300);
results["4-error-state"] = await probe();
await page.screenshot({ path: "scripts/verify-error.png" });

console.log(JSON.stringify(results, null, 2));
console.log("\n404 responses:", notFound.length ? notFound : "(none)");

await browser.close();
