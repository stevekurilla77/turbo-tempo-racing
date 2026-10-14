import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/';
const ori = (p, beta) => p.evaluate(b => dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: b, gamma: -80 })), beta);
const res = {};
for (const [w, h, tag] of [[844, 390, 'iphone'], [1180, 820, 'ipad']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  // emulate iOS permission API (granted) + a live sensor
  await ctx.addInitScript(() => { DeviceOrientationEvent.requestPermission = () => { window.__permAsked = (window.__permAsked || 0) + 1; return Promise.resolve('granted'); }; });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  await p.goto(base + '?v=' + Date.now()); await p.waitForTimeout(500);
  const r = { defaultMode: await p.evaluate(() => __tt.tilt.mode), pickerVisible: await p.isVisible('#steermode') };
  await p.evaluate(() => __tt.angleOverride = 90); await ori(p, 4);
  await p.tap('#go'); r.permAsked = await p.evaluate(() => window.__permAsked || 0);
  await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 30000 }); await ori(p, 4);
  r.btnsHidden = !(await p.isVisible('#bl')) && !(await p.isVisible('#br'));
  const cdp = await ctx.newCDPSession(p); const c = async s => { const q = await p.locator(s).boundingBox(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; };
  const G = await c('#bgas'), B = await c('#bbrake'), D = await c('#bdrift'), R = await c('#recenter');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: G.x, y: G.y, id: 1 }] });
  await p.waitForTimeout(1500);
  const sv = async (beta, ang) => { await p.evaluate(a => __tt.angleOverride = a, ang); await ori(p, beta); await p.waitForTimeout(450); return p.evaluate(() => +__tt.player.steer.toFixed(2)); };
  r.neutral = await p.evaluate(() => +__tt.tilt.neutral.toFixed(1));
  r.dead = await sv(4 + 2, 90);          // 2° from neutral -> deadzone
  r.right90 = await sv(4 + 15, 90);      // tilt +15° in landscape 90 -> steer right (+)
  r.full90 = await sv(4 + 30, 90);       // past full lock -> 1
  r.left90 = await sv(4 - 15, 90);
  r.right270 = await sv(-(4 + 15), 270); // other landscape: same physical tilt reads with opposite beta sign
  await p.screenshot({ path: `shots/v7-${tag}-tilt.png` });
  // recenter: hold a 12° tilt then tap RECENTER -> neutral moves -> steer back to ~0
  await sv(4 + 12, 90);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: G.x, y: G.y, id: 1 }, { x: R.x, y: R.y, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: R.x, y: R.y, id: 2 }] });
  await p.waitForTimeout(500); r.afterRecenter = await p.evaluate(() => +__tt.player.steer.toFixed(2));
  // multitouch: gas + brake + drift together (tilt mode)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: G.x, y: G.y, id: 1 }, { x: B.x, y: B.y, id: 3 }, { x: D.x, y: D.y, id: 4 }] });
  await p.waitForTimeout(200); r.multi = await p.evaluate(() => ['bgas', 'bbrake', 'bdrift'].filter(i => document.getElementById(i).classList.contains('on')).join(','));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  r.errs = errs; res[tag] = r; await ctx.close();
}
// fallback 1: permission denied
{ const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { DeviceOrientationEvent.requestPermission = () => Promise.resolve('denied'); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  await p.goto(base + '?v=' + Date.now()); await p.waitForTimeout(400); await p.tap('#go'); await p.waitForTimeout(800);
  res.denied = { mode: await p.evaluate(() => __tt.tilt.mode), btnsVisible: await p.isVisible('#bl'), errs }; await ctx.close(); }
// fallback 2: no sensor events at all
{ const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  await p.goto(base + '?v=' + Date.now()); await p.waitForTimeout(400); await p.tap('#go'); await p.waitForTimeout(2500);
  res.noSensor = { mode: await p.evaluate(() => __tt.tilt.mode), btnsVisible: await p.isVisible('#bl'), errs };
  // remembered choice: pick BUTTONS on the menu of a fresh load -> persists
  await p.goto(base + '?v=' + Date.now()); await p.waitForTimeout(300); await p.tap('#smBtn'); await p.goto(base + '?v=' + Date.now()); await p.waitForTimeout(300);
  res.remembered = await p.evaluate(() => __tt.tilt.mode); await ctx.close(); }
console.log(JSON.stringify(res, null, 1)); await b.close();
