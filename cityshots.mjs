// v19 scenery screenshots: two in-race city views + a sky view (laptop 1280x720)
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/', pre = process.argv[3] || 'shots/v19-';
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = []; p.on('pageerror', x => e.push(String(x))); p.on('console', m => m.type() === 'error' && e.push(m.text()));
await p.goto(base + '?autopilot&autostart&car=trombone&speed=1&cb=' + Date.now()); await p.waitForFunction(() => __tt.race && __tt.race.state === 'race', null, { timeout: 30000 });
console.log('city', JSON.stringify(await p.evaluate(() => window.__tt_city || window.__tt_track || null)));
const at = async (lo, hi, path) => { await p.waitForFunction(([a, z]) => __tt.player.idx >= a && __tt.player.idx < z, [lo, hi], { timeout: 120000, polling: 16 }); await p.screenshot({ path }); };
const spots = (process.argv[4] || '10,30;395,420').split(';').map(s => s.split(',').map(Number));
await at(spots[0][0], spots[0][1], pre + 'city-1.png'); await at(spots[1][0], spots[1][1], pre + 'city-2.png');
await p.evaluate(() => { const pl = __tt.player; __tt.camFixed = [[pl.x, 70, pl.z], [pl.x - 500, 75, pl.z - 600]]; }); await p.waitForTimeout(600); await p.screenshot({ path: pre + 'sky.png' });
await p.evaluate(() => { const pl = __tt.player; __tt.camFixed = [[pl.x, 6, pl.z], [pl.x + 420, 260, pl.z + 380]]; }); await p.waitForTimeout(600); await p.screenshot({ path: pre + 'sky-moon.png' });
console.log('errs', e); await b.close();
