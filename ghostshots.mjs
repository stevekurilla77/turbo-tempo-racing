// v20 Ghost Town Gulch screenshots (laptop 1280x720): in-race views + fixed cams on landmarks
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/', pre = process.argv[3] || '/tmp/g-', spots = (process.argv[4] || '15,30;200,215;255,270;440,455').split(';').map(s => s.split(',').map(Number));
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = []; p.on('pageerror', x => e.push(String(x))); p.on('console', m => m.type() === 'error' && e.push(m.text()));
await p.goto(base + '?track=ghost&autopilot&autostart&car=trombone&speed=1&cb=' + Date.now()); await p.waitForFunction(() => __tt.race && __tt.race.state === 'race', null, { timeout: 30000 });
const LM = await p.evaluate(() => window.__tt_city.landmarks); console.log('landmarks', JSON.stringify(LM));
if (process.argv[5]) await p.evaluate(() => { __tt.player.useAlley = true; });
for (const [k, [lo, hi]] of spots.entries()) { await p.waitForFunction(([a, z]) => __tt.player.idx >= a && __tt.player.idx < z, [lo, hi], { timeout: 150000, polling: 16 }); if (spots[k][2]) await p.waitForTimeout(spots[k][2]); await p.screenshot({ path: `${pre}race-${k}.png` }); console.log('shot', k, await p.evaluate(() => [__tt.player.idx, __tt.player.inAlley])); }
const cams = process.argv[6] ? JSON.parse(process.argv[6]) : [];
for (const [k, c] of cams.entries()) { await p.evaluate(c => { __tt.camFixed = c; }, c); await p.waitForTimeout(700); await p.screenshot({ path: `${pre}cam-${k}.png` }); }
console.log('errs', e); await b.close();
