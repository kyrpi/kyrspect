import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(process.argv[2] ?? "http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const read = () =>
  page.evaluate(() => {
    const root = document.querySelector("#player");
    const played = document.querySelector("#player .kyrspect-timeline-played");
    const knob = document.querySelector("#player .kyrspect-timeline-knob");
    return {
      accentVar: getComputedStyle(root).getPropertyValue("--kyrspect-accent").trim(),
      inlineAccent: root.style.getPropertyValue("--kyrspect-accent").trim(),
      playedColor: getComputedStyle(played).backgroundColor,
      knobColor: getComputedStyle(knob).backgroundColor,
    };
  });

const before = await read();

await page.evaluate(() => {
  const input = document.querySelector("#accent");
  input.value = "#00c853";
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.waitForTimeout(300);
const afterPicker = await read();

await page.hover("#player");
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/verify-theme.png" });

console.log(JSON.stringify({ before, afterPicker }, null, 2));
await browser.close();
