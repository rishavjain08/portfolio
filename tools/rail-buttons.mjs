import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:true, args:["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width:1440, height:900, deviceScaleFactor:2 });
await p.goto("http://localhost:5173/", { waitUntil:"networkidle0" });
await p.evaluate(()=>document.querySelector("#projects")?.scrollIntoView({block:"start"}));
await new Promise(r=>setTimeout(r,1200));

const left = () => p.evaluate(()=>Math.round(document.querySelector("#projects ul").scrollLeft));
// Re-query on every interaction: React replaces these nodes when disabled flips.
const click = async (label) => {
  const ok = await p.evaluate((l)=>{
    const el=[...document.querySelectorAll("#projects button")].find(b=>b.getAttribute("aria-label")===l);
    if(!el||el.disabled) return false;
    el.click(); return true;
  }, label);
  await new Promise(r=>setTimeout(r,750));
  return ok;
};
const disabled = (label) => p.evaluate((l)=>{
  const el=[...document.querySelectorAll("#projects button")].find(b=>b.getAttribute("aria-label")===l);
  return el ? el.disabled : null;
}, label);

console.log("  at start -> prev disabled:", await disabled("Previous projects"), "| next disabled:", await disabled("Next projects"));
console.log("  --- Next x4");
for (let i=0;i<4;i++) console.log(`    clicked=${await click("Next projects")}  rail=${await left()}`);
console.log("  at end   -> prev disabled:", await disabled("Previous projects"), "| next disabled:", await disabled("Next projects"));
console.log("  --- Prev x4");
for (let i=0;i<4;i++) console.log(`    clicked=${await click("Previous projects")}  rail=${await left()}`);
console.log("  back at start:", await left() === 0);
await p.screenshot({ path:"shots/rail-controls.png" });
await b.close();
