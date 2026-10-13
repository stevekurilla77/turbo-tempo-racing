import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })).newPage();
const errs=[]; p.on('pageerror', e => errs.push(''+e));
await p.goto((process.argv[2]||'http://127.0.0.1:8787/') + '?autostart&autopilot&v=' + Date.now());
await p.waitForFunction(() => { const g = __tt.gates[__tt.race.gateNext]; return __tt.race.state === 'race' && __tt.race.gatesTotal >= 1 && ((g.i - __tt.player.idx + 600) % 600) < 22; }, null, { timeout: 120000, polling: 50 });
await p.screenshot({ path: 'shots/v4-glow-gate.png' }); console.log('errs', errs); await b.close();
