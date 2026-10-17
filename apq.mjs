import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 400, height: 225 } });
await p.goto(`http://127.0.0.1:8787/?track=${process.argv[2]}&autopilot&autostart&speed=4&car=${process.argv[3]}&solo${process.argv[4] || ''}&cb=` + Date.now());
let out; for (let i = 0; i < 300; i++) { await p.waitForTimeout(1000); out = await p.evaluate(() => __tt.race.state === 'done' && __tt.race.results ? { laps: __tt.race.results.laps.map(x => +x.toFixed(1)), crashes: __tt.race.stats.crashes } : null); if (out) break; }
console.log(process.argv.slice(2).join(' '), JSON.stringify(out)); await b.close();
