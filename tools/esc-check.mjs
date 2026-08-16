import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:true, args:["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width:1440, height:1000 });
await p.goto("http://localhost:5173/", { waitUntil:"networkidle0" });
await p.evaluate(()=>document.querySelector("#projects")?.scrollIntoView({block:"start"}));
await new Promise(r=>setTimeout(r,1200));
const cards = await p.$$('#projects li [role="button"]');
await cards[0].click();
await new Promise(r=>setTimeout(r,1200));
await p.keyboard.press("Escape");
for (const ms of [400, 800, 1600, 3000]) {
  await new Promise(r=>setTimeout(r, ms === 400 ? 400 : ms - 400));
  const open = await p.evaluate(()=>!!document.querySelector('[role="dialog"]'));
  console.log(`  t+${String(ms).padStart(4)}ms  dialog present: ${open}`);
}
await b.close();
