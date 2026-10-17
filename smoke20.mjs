import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const track = process.argv[2] || 'ghost';
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = [];
p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && e.push(m.type() + ' ' + m.text()));
await p.goto(`http://127.0.0.1:8787/?track=${track}&autostart&autopilot&speed=2&cb=` + Date.now()); await p.waitForTimeout(6000);
console.log(JSON.stringify(await p.evaluate(() => ({ st: __tt.race.state, idx: __tt.player.idx, v: __tt.player.v, city: window.__tt_city, calls: __tt.renderer.info.render.calls, tris: __tt.renderer.info.render.triangles, alley: [__tt_alley.t0, __tt_alley.t1, __tt_alley.L] }))));
await p.screenshot({ path: `/tmp/smoke-${track}.png` }); console.log(e.slice(0, 8)); await b.close();
