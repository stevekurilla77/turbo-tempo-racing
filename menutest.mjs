import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/'; let ok = true;
for (const [w, h] of [[844, 340], [667, 320], [568, 300], [844, 390], [1180, 820]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  await p.goto(base + '?v=' + Date.now()); await p.waitForTimeout(700);
  const r = await p.evaluate(() => { const g = document.getElementById('go').getBoundingClientRect(), s = document.getElementById('sens').getBoundingClientRect(), m = document.getElementById('steermode').getBoundingClientRect(); return { go: [g.left, g.top, g.right, g.bottom].map(Math.round), sens: Math.round(s.bottom), steer: Math.round(m.top), vw: innerWidth, vh: innerHeight }; });
  await p.screenshot({ path: `shots/v9-menu-${w}x${h}.png` });
  const inside = r.go[0] >= 0 && r.go[1] >= 0 && r.go[2] <= r.vw && r.go[3] <= r.vh;
  const tap = inside ? await p.tap('#go').then(() => p.waitForTimeout(300)).then(() => p.evaluate(() => __tt.race.state)) : 'n/a';
  ok = ok && inside && !errs.length && tap === 'count';
  console.log(`${w}x${h}`, JSON.stringify({ ...r, inside, tap, errs }));
  await ctx.close();
}
console.log(ok ? 'ALL OK' : 'FAIL'); await b.close();
