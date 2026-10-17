import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/';
for (const [w, h, tag] of [[844, 390, 'iphone'], [1180, 820, 'ipad']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  await p.goto(base + '?v=' + Date.now()); await p.waitForTimeout(500);
  await p.tap('#go'); await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 30000 });
  const cdp = await ctx.newCDPSession(p);
  const c = async s => { const r = await p.locator(s).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const G = await c('#bgas'), D = await c('#bdrift'); let L;
  const st = () => p.evaluate(() => ({ v: +__tt.player.v.toFixed(1), drift: __tt.player.drift, tier: __tt.player.tier, boost: +__tt.player.boost.toFixed(2), on: ['bgas', 'bl', 'br', 'bdrift'].filter(i => document.getElementById(i).classList.contains('on')).join(','), ac: __tt.acState, steps: __tt.musicSteps || 0 }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: G.x, y: G.y, id: 1 }] });
  await p.waitForFunction(() => __tt.player.v > 30, null, { timeout: 30000 });
  // put the car at the entry of the long right-hand bend (~idx 185) to test a real cornering drift
  const dir = await p.evaluate(() => { const pl = __tt.player; const i = 203; pl.idx = i; pl.x = __tt.P[i].x; pl.z = __tt.P[i].z; pl.h = pl.vh = Math.atan2(__tt.T[i].x, __tt.T[i].z); pl.v = 40; return Math.sign(__tt.RL[218]); });
  const s1 = await st(); s1.dir = dir;
  L = await c(dir > 0 ? '#br' : '#bl');
  // the bend after the start goes left; steer left + drift, 3 fingers
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: G.x, y: G.y, id: 1 }, { x: L.x, y: L.y, id: 2 }] });
  await p.waitForTimeout(250);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: G.x, y: G.y, id: 1 }, { x: L.x, y: L.y, id: 2 }, { x: D.x, y: D.y, id: 3 }] });
  await p.waitForTimeout(300); const s2 = await st();
  // ease off the steer (keep gas + drift held): drift holds a medium arc
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: L.x, y: L.y, id: 2 }] });
  let maxTier = 0; for (let k = 0; k < 40 && maxTier < 1; k++) { await p.waitForTimeout(30); const t = await p.evaluate(() => __tt.player.tier); maxTier = Math.max(maxTier, t); }
  await p.screenshot({ path: `shots/v6-${tag}-drift-touch.png` });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: D.x, y: D.y, id: 3 }] });
  await p.waitForTimeout(60); const s3 = await st();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: G.x, y: G.y, id: 1 }] });
  console.log(tag, JSON.stringify({ s1, s2, maxTier, s3, stats: await p.evaluate(() => __tt.race.stats), errs }));
  await ctx.close();
}
await b.close();
