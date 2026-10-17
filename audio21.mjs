import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const list = (process.argv[2] || 'brass,ghost,brass:stadium,brass:water,ghost:bayou,ghost:reed').split(',');
for (const it of list) { const [tr, mus] = it.split(':'); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error') && errs.push(m.text()));
  await p.goto(`http://127.0.0.1:8787/?track=${tr}${mus ? '&music=' + mus : ''}&speed=2&autopilot&cb=` + Date.now()); await p.waitForTimeout(800); await p.tap('#go'); await p.waitForTimeout(500); await p.tap('#grace'); await p.waitForTimeout(600); await p.tap('#trace');
  await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 30000 }); await p.waitForTimeout(2000); const a = await p.evaluate(() => [__tt.musicTheme, __tt.musicSteps]);
  await p.evaluate(() => __tt.finalLap()); await p.waitForTimeout(1500); const f = await p.evaluate(() => [__tt.race.fastMusic, __tt.musicSteps]);
  console.log(it, JSON.stringify({ theme: a[0], steps: a[1], fastAfterFinalLap: f[0], steps2: f[1] }), errs); await ctx.close(); }
await b.close();
