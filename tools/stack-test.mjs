import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:true, args:["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"] });
const p = await b.newPage();
const errs = [];
p.on("pageerror", e => errs.push(String(e)));
p.on("console", m => m.type()==="error" && errs.push(m.text()));

await p.setViewport({ width:1440, height:900, deviceScaleFactor:1 });
await p.goto("http://localhost:5173/", { waitUntil:"networkidle0" });
await new Promise(r=>setTimeout(r,2000));
await p.evaluate(()=>document.querySelector("#projects").scrollIntoView());
await new Promise(r=>setTimeout(r,1200));

const geom = await p.evaluate(()=>{
  const lis=[...document.querySelectorAll("#project-deck > li")];
  return {
    validMarkup: [...document.querySelectorAll("#project-deck > *")].every(e=>e.tagName==="LI"),
    count: lis.length,
    rects: lis.map(l=>{const r=l.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height),z:getComputedStyle(l).zIndex};}),
    expanded: lis.map(l=>l.querySelector("button").getAttribute("aria-expanded")),
  };
});
console.log("  ul > li only:", geom.validMarkup, " cards:", geom.count);
console.log("  aria-expanded:", geom.expanded.join(","));
console.log("  overlap between closed cards (negative = overlapping):");
for (let i=1;i<geom.rects.length;i++){
  const gap = geom.rects[i].top - geom.rects[i-1].bottom;
  console.log(`    ${String(i).padStart(2)} -> ${String(i+1).padStart(2)}   gap ${String(gap).padStart(5)}px   z ${geom.rects[i].z}`);
}
await p.screenshot({ path:"shots/stack-desktop.png", clip:{x:0,y:0,width:1440,height:900} });

// toggle: open card 3
await p.evaluate(()=>document.querySelectorAll("#project-deck > li > div > button")[2].click());
await new Promise(r=>setTimeout(r,1200));
const after = await p.evaluate(()=>{
  const lis=[...document.querySelectorAll("#project-deck > li")];
  return { expanded: lis.map(l=>l.querySelector("button").getAttribute("aria-expanded")),
           heights: lis.map(l=>Math.round(l.getBoundingClientRect().height)),
           diagrams: document.querySelectorAll('#projects svg[role="img"]').length };
});
console.log("  after clicking card 3 -> expanded:", after.expanded.join(","));
console.log("  card heights:", after.heights.join(","));
console.log("  diagrams rendered inline:", after.diagrams);

// mobile
await p.setViewport({ width:390, height:844, deviceScaleFactor:2 });
await new Promise(r=>setTimeout(r,1200));
await p.evaluate(()=>document.querySelector("#projects").scrollIntoView());
await new Promise(r=>setTimeout(r,1000));
const m = await p.evaluate(()=>({
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  scrollW: document.documentElement.scrollWidth, vw: window.innerWidth,
  spineH: Math.round(document.querySelector("#project-deck > li > div > button").getBoundingClientRect().height),
}));
console.log("  mobile: horizontal overflow", m.overflow, `(doc ${m.scrollW} vs vw ${m.vw})`, " spine height", m.spineH+"px");
await p.screenshot({ path:"shots/stack-mobile.png" });
console.log("  errors:", errs.filter(e=>!e.includes("404")).length ? errs.slice(0,3) : "none");
await b.close();
