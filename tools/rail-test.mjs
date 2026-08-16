import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless:true, args:["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width:1440, height:900 });
await p.goto("http://localhost:5173/", { waitUntil:"networkidle0" });
await p.evaluate(()=>document.querySelector("#projects")?.scrollIntoView({block:"start"}));
await new Promise(r=>setTimeout(r,1200));

const box = await (await p.$("#projects ul")).boundingBox();
const cx = box.x + box.width/2, cy = box.y + box.height/2;
const left = () => p.evaluate(()=>Math.round(document.querySelector("#projects ul").scrollLeft));
const pageY = () => p.evaluate(()=>Math.round(window.scrollY));
const max = await p.evaluate(()=>{const u=document.querySelector("#projects ul");return u.scrollWidth-u.clientWidth;});
console.log(`  max scrollLeft = ${max}`);

await p.mouse.move(cx, cy);
console.log("\n  FORWARD (deltaY +400 x5)");
for (let i=0;i<5;i++){ await p.mouse.wheel({deltaY:400}); await new Promise(r=>setTimeout(r,260)); console.log(`    rail=${await left()}  page=${await pageY()}`); }

console.log("\n  BACKWARD (deltaY -400 x6)");
for (let i=0;i<6;i++){ await p.mouse.wheel({deltaY:-400}); await new Promise(r=>setTimeout(r,260)); console.log(`    rail=${await left()}  page=${await pageY()}`); }

console.log(`\n  returned to start? ${await left() === 0 ? "YES" : "NO — stuck at " + await left()}`);
await b.close();
