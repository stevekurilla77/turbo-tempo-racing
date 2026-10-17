import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/'; const errs = [];
for (const q of ['', 'steer=smooth']) {
  const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage();
  p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  await p.goto(base + '?autostart&' + q + '&v=' + Date.now());
  await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 30000 });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(2500);
  const h0 = await p.evaluate(() => __tt.player.h); await p.keyboard.down('ArrowRight');
  await p.waitForTimeout(200); const s1 = await p.evaluate(() => __tt.player.steer);
  await p.waitForTimeout(400); const h1 = await p.evaluate(() => __tt.player.h);
  await p.keyboard.up('ArrowRight'); await p.keyboard.up('ArrowUp');
  console.log(q || 'sensitive', { steerAfter200ms: +s1.toFixed(2), headingChange600ms: +(h0 - h1).toFixed(3) });
}
console.log('errs', errs); await b.close();
