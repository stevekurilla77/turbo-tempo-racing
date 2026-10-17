import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const [car = 'tuba', trk = 'brass', delay = '200', out = '/tmp/blast.png'] = process.argv.slice(2);
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = []; p.on('pageerror', x => e.push(String(x)));
await p.goto(`http://127.0.0.1:8787/?track=${trk}&autopilot&autostart&speed=${process.env.SPD || 1}&car=${car}&cb=` + Date.now());
for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => __tt.race.state === 'race' && __tt.race.t > 4.2)) break; }
const r = await p.evaluate(() => { const c = __tt.player; const near = __tt.cars.filter(o => o !== c && Math.hypot(o.x - c.x, o.z - c.z) < 14).length; c.meter = 1; return near; });
for (let k = 0; k < 4; k++) { await p.waitForTimeout(+delay); await p.screenshot({ path: out.replace('.png', '-' + k + '.png') }); }
console.log(JSON.stringify({ near: r, blasts: await p.evaluate(() => __tt.blasts || 0), errs: e }));
// car select text
const g = await b.newPage({ viewport: { width: 844, height: 390 } }); await g.goto('http://127.0.0.1:8787/?cb=' + Date.now()); await g.waitForTimeout(1500); await g.mouse.click(422, 300); await g.keyboard.press('Enter'); await g.waitForTimeout(1200);
console.log(await g.evaluate(() => document.getElementById('gtag')?.innerText)); await g.screenshot({ path: '/tmp/garage.png' });
await b.close();
