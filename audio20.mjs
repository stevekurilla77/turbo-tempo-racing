import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const tr of ['ghost', 'brass']) { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error') && errs.push(m.text()));
  await p.goto(`http://127.0.0.1:8787/?track=${tr}&speed=2&cb=` + Date.now()); await p.waitForTimeout(800); await p.tap('#go'); await p.waitForTimeout(500); await p.tap('#grace'); await p.waitForTimeout(600); await p.tap('#trace');
  await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 30000 }); await p.waitForTimeout(3000);
  console.log(tr, JSON.stringify(await p.evaluate(() => ({ steps: __tt.musicSteps, piano: __tt.pianoNotes || 0, st: __tt.race.state }))), errs); await ctx.close(); }
await b.close();
