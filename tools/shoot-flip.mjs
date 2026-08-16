import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:true, args:["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width:1440, height:900, deviceScaleFactor:2 });
await p.goto("http://localhost:5173/", { waitUntil:"networkidle0" });
await new Promise(r=>setTimeout(r,2000));
await p.evaluate(()=>document.querySelector("#projects")?.scrollIntoView({block:"start"}));
await new Promise(r=>setTimeout(r,1500));

// Resting state
await p.screenshot({ path:"shots/rail-rest.png" });

// Hover the third card to flip it
const cards = await p.$$('#projects li [role="button"]');
console.log("  cards found:", cards.length);
if (cards[2]) { await cards[2].hover(); await new Promise(r=>setTimeout(r,1100)); }
await p.screenshot({ path:"shots/rail-flipped.png" });

// Rail metrics
const m = await p.evaluate(()=>{
  const ul = document.querySelector("#projects ul");
  return { scrollW: ul.scrollWidth, clientW: ul.clientWidth, overflow: ul.scrollWidth - ul.clientWidth };
});
console.log(`  rail: content ${m.scrollW}px in ${m.clientW}px viewport -> ${m.overflow}px of horizontal travel`);
await b.close();
