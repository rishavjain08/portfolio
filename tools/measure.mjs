import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: true, args: ["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 2500));
const m = await p.evaluate(() => ({
  doc: document.documentElement.scrollHeight,
  vh: window.innerHeight,
  pinSpacers: document.querySelectorAll(".pin-spacer").length,
}));
console.log(`  viewport         ${m.vh}px`);
console.log(`  document height  ${m.doc}px = ${(m.doc / m.vh).toFixed(2)} viewports`);
console.log(`  gsap pin-spacers ${m.pinSpacers}`);
console.log(`  expected         3.00 viewports for scrollPages: 3`);
await b.close();
