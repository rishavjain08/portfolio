import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:true, args:["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width:1440, height:900 });
await p.goto("http://localhost:5173/", { waitUntil:"networkidle0" });
await p.evaluate(()=>document.querySelector("#projects")?.scrollIntoView({block:"start"}));
await new Promise(r=>setTimeout(r,1200));

const info = () => p.evaluate(()=>{
  const ul=document.querySelector("#projects ul");
  const li=ul.querySelector("li");
  const cs=getComputedStyle(ul);
  return { left: Math.round(ul.scrollLeft), cardW: Math.round(li.getBoundingClientRect().width),
           gap: cs.columnGap, snap: cs.scrollSnapType, behavior: cs.scrollBehavior };
});
console.log("  geometry:", JSON.stringify(await info()));

const click = (l) => p.evaluate((lbl)=>{
  const el=[...document.querySelectorAll("#projects button")].find(b=>b.getAttribute("aria-label")===lbl);
  if(el && !el.disabled) el.click();
}, l);

console.log("\n  Next x4, reading at +150ms then +1400ms");
for (let i=0;i<4;i++){
  await click("Next projects");
  await new Promise(r=>setTimeout(r,150));
  const a=(await info()).left;
  await new Promise(r=>setTimeout(r,1250));
  const c=(await info()).left;
  console.log(`    click ${i+1}: t+150=${a}  settled=${c}`);
}
await b.close();
