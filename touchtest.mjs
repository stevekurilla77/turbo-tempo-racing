import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/';
for (const [w, h, tag] of [[844, 390, 'iphone'], [1180, 820, 'ipad']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  await p.goto(base + '?v=' + Date.now()); await p.waitForTimeout(600);
  await p.screenshot({ path: `shots/v2-${tag}-title.png` });
  await p.tap('#go'); await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 30000 });
  const cdp = await ctx.newCDPSession(p);
  const c = async s => { const r = await p.locator(s).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const g = await c('#bgas'), r = await c('#br');
  const st = () => p.evaluate(() => ({ v: +__tt.player.v.toFixed(1), h: +__tt.player.h.toFixed(3), steer: +__tt.player.steer.toFixed(2), state: __tt.race.state, gasOn: document.getElementById('bgas').classList.contains('on'), rOn: document.getElementById('br').classList.contains('on') }));
  const s0 = await st(); await p.waitForTimeout(1000); const sIdle = await st(); // no auto-accelerate
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.x, y: g.y, id: 1 }] });
  await p.waitForTimeout(1500); const sGas = await st();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.x, y: g.y, id: 1 }, { x: r.x, y: r.y, id: 2 }] });
  await p.waitForTimeout(150); const sRamp = await st();
  await p.waitForTimeout(600); const sBoth = await st();
  await p.screenshot({ path: `shots/v2-${tag}-race.png` });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: r.x, y: r.y, id: 2 }] }); // lift steer finger, keep gas
  await p.waitForTimeout(600); const sRel = await st();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(300);
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(800); const vk0 = (await st()).v; await p.waitForTimeout(800); const vk = (await st()).v; await p.keyboard.up('ArrowUp');
  const lay = await p.evaluate(() => ({ cw: document.querySelector('canvas').clientWidth, ch: document.querySelector('canvas').clientHeight, iw: innerWidth, ih: innerHeight, sx: scrollX, sy: scrollY }));
  console.log(tag, JSON.stringify({ s0, sIdle, sGas, sRamp, sBoth, sRel, vk0, vk, lay, errs }));
  await ctx.close();
}
await b.close();
