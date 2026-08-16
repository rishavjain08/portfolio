import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:true, args:["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"] });
const p = await b.newPage();
const errs=[]; p.on("pageerror",e=>errs.push(String(e)));
p.on("console",m=>{ if(m.type()==="error") errs.push(m.text()); });
await p.setViewport({ width:1440, height:1000, deviceScaleFactor:2 });
await p.goto("http://localhost:5173/", { waitUntil:"networkidle0" });
await p.evaluate(()=>document.querySelector("#projects")?.scrollIntoView({block:"start"}));
await new Promise(r=>setTimeout(r,1500));

const cards = await p.$$('#projects li [role="button"]');
await cards[0].click();
await new Promise(r=>setTimeout(r,2600));

const state = await p.evaluate(()=>{
  const d = document.querySelector('[role="dialog"]');
  return {
    open: !!d,
    title: d?.querySelector("#project-dialog-title")?.textContent,
    nodes: d?.querySelectorAll('svg [role="button"]').length ?? 0,
    paths: d?.querySelectorAll("svg path").length ?? 0,
    packets: d?.querySelectorAll("svg circle animateMotion").length ?? 0,
    bodyLocked: getComputedStyle(document.body).overflow,
    focusInside: d?.contains(document.activeElement) ?? false,
  };
});
console.log("  dialog open      ", state.open);
console.log("  title            ", state.title);
console.log("  diagram nodes    ", state.nodes);
console.log("  svg paths        ", state.paths);
console.log("  animated packets ", state.packets);
console.log("  body scroll      ", state.bodyLocked);
console.log("  focus moved in   ", state.focusInside);
await p.screenshot({ path:"shots/dialog.png" });

// Escape should close it and restore scrolling.
await p.keyboard.press("Escape");
await new Promise(r=>setTimeout(r,700));
const after = await p.evaluate(()=>({
  open: !!document.querySelector('[role="dialog"]'),
  body: getComputedStyle(document.body).overflow,
}));
console.log("  after Escape     ", "open:", after.open, "| body:", after.body);
console.log(errs.length ? "  errors: "+errs.slice(0,3).join(" | ").slice(0,180) : "  no page errors");
await b.close();
