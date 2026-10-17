import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', x => console.log('PAGEERR', x.message, x.stack?.split('\n').slice(0,3).join(' | '))); p.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
await p.goto('http://127.0.0.1:8787/?' + (process.argv[2] || 'track=school') + '&autopilot&autostart&nogate&cb=' + Date.now()); await p.waitForTimeout(+(process.argv[3] || 6000));
console.log(await p.evaluate(() => window.__tt ? JSON.stringify({ st: __tt.race.state, t: __tt.race.t, city: window.__tt_city }) : 'no __tt')); await b.close();
