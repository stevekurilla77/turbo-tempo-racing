import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/';
const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage(); const errs = [];
p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
await p.goto(base + '?autostart&autopilot&speed=3&' + (process.argv[3] || '') + '&v=' + Date.now());
let shot = 0; const want = { drift: 0, air: 0, alley: 0 };
for (let i = 0; i < 400; i++) {
  await p.waitForTimeout(500);
  const s = await p.evaluate(() => ({ st: __tt.race.state, lap: __tt.player.lap, idx: __tt.player.idx, place: __tt.race.place, drift: __tt.player.drift, tier: __tt.player.tier, air: __tt.player.air, alley: __tt.player.alley, band: +__tt.race.band.toFixed(2), stats: JSON.stringify(__tt.race.stats), errs: __tt.errors.length, v: +__tt.player.v.toFixed(1) }));
  if (i % 10 === 0) console.log(JSON.stringify(s));
  for (const k of ['drift', 'air', 'alley']) if (s[k] && !want[k]) { want[k] = 1; await p.screenshot({ path: `shots/v6-${k}.png` }); }
  if (s.st === 'done') { console.log('FINAL', JSON.stringify(s), await p.evaluate(() => __tt.cars.map(c => c.driver + ':' + c.lap + '/' + c.idx + (c.finished ? 'F' + c.finishTime.toFixed(1) : '')).join(' '))); await p.waitForTimeout(2500); await p.screenshot({ path: 'shots/v6-finish.png' }); break; }
}
console.log('errs', errs); await b.close();
