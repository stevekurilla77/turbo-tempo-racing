// v22 per-track screenshots: in-race views at index ranges + optional fixed cams. node trackshots.mjs track pre "lo,hi;..." "x,y,z,lx,ly,lz;..." [alley]
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const [trk, pre, sp = '', cams = '', alley = '1'] = process.argv.slice(2); const base = process.env.BASE || 'http://127.0.0.1:8787/';
const spots = sp ? sp.split(';').map(s => s.split(',').map(Number)) : [], fixed = cams ? cams.split(';').map(s => s.split(',').map(Number)) : [];
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = []; p.on('pageerror', x => e.push(String(x))); p.on('console', m => m.type() === 'error' && e.push(m.text()));
await p.goto(base + `?track=${trk}&autopilot&autostart&car=trombone&speed=1&alley=${alley}&cb=` + Date.now()); await p.waitForFunction(() => __tt.race && __tt.race.state === 'race', null, { timeout: 60000 });
console.log('landmarks', JSON.stringify(await p.evaluate(() => window.__tt_city && window.__tt_city.landmarks)));
for (const [k, c] of fixed.entries()) { await p.evaluate(c => { __tt.camFixed = [[c[0], c[1], c[2]], [c[3], c[4], c[5]]]; }, c); await p.waitForTimeout(1500); await p.screenshot({ path: `${pre}cam-${k}.png` }); }
await p.evaluate(() => { __tt.camFixed = null; });
for (const [k, [lo, hi, wait]] of spots.entries()) { await p.waitForFunction(([a, z]) => __tt.player.idx >= a && __tt.player.idx < z, [lo, hi], { timeout: 200000, polling: 16 }); if (wait) await p.waitForTimeout(wait); await p.screenshot({ path: `${pre}race-${k}.png` }); console.log('shot', k, await p.evaluate(() => [__tt.player.idx, __tt.player.alley ? 1 : 0])); }
console.log('errors', JSON.stringify(e)); await b.close();
