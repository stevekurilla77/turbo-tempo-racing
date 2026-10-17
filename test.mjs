import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errs.push(m.type()+': '+m.text()); }); p.on('pageerror', e => errs.push('pageerror: ' + e));
const mode = process.argv[2] || 'auto';
await p.goto(`http://127.0.0.1:8787/?autostart&autopilot&speed=${process.argv[3]||3}`);
await p.waitForTimeout(800);
await p.screenshot({ path: 'shots/01-start.png' });
const s0 = await p.evaluate(() => ({ x: __tt.player.x, z: __tt.player.z }));
let shot = 2;
for (let i = 0; i < 90; i++) {
  await p.waitForTimeout(2000);
  const st = await p.evaluate(() => ({ state: __tt.race.state, lap: __tt.player.lap, idx: __tt.player.idx, v: __tt.player.v.toFixed(1), lat: __tt.player.lat.toFixed(1), place: __tt.race.place, gh: __tt.race.gatesHit, gt: __tt.race.gatesTotal, style: Math.round(__tt.race.style), dash: __tt.race.dashes, hits: __tt.race.hits, errs: __tt.errors.length, ai: __tt.cars.map(c=>c.lap+':'+c.idx).join(' ') }));
  console.log(JSON.stringify(st));
  if (i === 2 || i === 6 || i===10) await p.screenshot({ path: `shots/0${shot++}-race.png` });
  if (st.state === 'done') { await p.waitForTimeout(2500); await p.screenshot({ path: 'shots/09-finish.png' }); console.log(JSON.stringify(await p.evaluate(() => __tt.race.results))); break; }
}
const s1 = await p.evaluate(() => ({ x: __tt.player.x, z: __tt.player.z }));
console.log('moved', Math.hypot(s1.x - s0.x, s1.z - s0.z).toFixed(1)); console.log('ERRORS', errs);
await b.close();
