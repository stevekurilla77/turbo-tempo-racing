import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })).newPage(); const errs = [];
p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
await p.goto((process.argv[2] || 'http://127.0.0.1:8787/') + '?autostart&autopilot&nodrift&v=' + Date.now());
for (const [name, lo, hi] of [['metronome', 50, 60], ['ramp', 146, 152], ['alleymouth', 250, 258], ['hill', 372, 380]]) {
  await p.waitForFunction(([lo, hi]) => __tt.race.state === 'race' && __tt.player.idx >= lo && __tt.player.idx <= hi, [lo, hi], { timeout: 120000, polling: 30 });
  await p.screenshot({ path: `shots/v6-${name}.png` });
}
console.log('errs', errs); await b.close();
