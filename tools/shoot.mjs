/**
 * Render the hero at a given scroll progress and save a PNG.
 *
 *   node tools/shoot.mjs <outfile> [progress] [url]
 *
 * The pinned section is (pages - 1) viewports tall, so scrollY maps linearly
 * to timeline progress. ScrollTrigger runs with scrub: 1, which means the
 * scrubbed value lags the scrollbar by about a second; the settle wait below
 * covers that plus the lazy 3D chunk and any texture decode.
 */
import puppeteer from "puppeteer";

const [, , out = "shot.png", progressArg = "0.45", url = "http://localhost:5173/"] = process.argv;
const progress = Number(progressArg);

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };
const PAGES = 2.6;   // keep in sync with stage.scrollPages

const browser = await puppeteer.launch({
  headless: true,
  args: [
    // Software WebGL: headless has no GPU, and without these the canvas is blank.
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--no-sandbox",
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(String(e)));

  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

  // Wait for a canvas that has actually been sized, not just inserted.
  await page.waitForFunction(
    () => {
      const c = document.querySelector("canvas");
      return c && c.width > 0 && c.height > 0;
    },
    { timeout: 30000 },
  );

  const y = Math.round(progress * (PAGES - 1) * VIEWPORT.height);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);

  // Let scrub: 1 catch up, then let a few frames render at the settled pose.
  await new Promise((r) => setTimeout(r, 3500));

  await page.screenshot({ path: out });

  const shot = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    return { w: c?.width ?? 0, h: c?.height ?? 0 };
  });

  console.log(`  saved ${out}  progress=${progress}  scrollY=${y}  canvas=${shot.w}x${shot.h}`);
  if (problems.length) {
    console.log("  page errors:");
    for (const p of problems.slice(0, 6)) console.log("   ", p.slice(0, 160));
  } else {
    console.log("  no page errors");
  }
} finally {
  await browser.close();
}
