// v26 elevation / figure-8 test: full autopilot race vs AI; every car's track index must advance smoothly (no branch jumps at the crossing),
// laps count 3 for everyone, no safety respawns, cars on the lower road stay at ground level under the bridge, warps still fire.
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const [trk = 'canyon', base = 'http://127.0.0.1:8787/', diff = 'concert'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } }); const e = []; p.on('pageerror', x => e.push(String(x)));
await p.goto(base + `?track=${trk}&autopilot&autostart&nogate&speed=4&diff=${diff}&car=trombone&cb=` + Date.now());
await p.waitForFunction(() => __tt.race && __tt.race.state === 'race', null, { timeout: 90000 });
await p.evaluate(() => { const N = 600; window.__mon = { jump: 0, jumpAt: null, under: [], over: [], minY: 1e9, maxY: -1e9, grade: [] }; let last = __tt.cars.map(c => c.idx);
  setInterval(() => { __tt.cars.forEach((c, k) => { let d = c.idx - last[k]; if (d > N / 2) d -= N; if (d < -N / 2) d += N; if (Math.abs(d) > Math.abs(__mon.jump) && !c.alley && !(last[k] > 0 && c.alley !== undefined && __mon.wasAlley && __mon.wasAlley[k])) { __mon.jump = d; __mon.jumpAt = [k, last[k], c.idx]; } last[k] = c.idx; });
    __mon.wasAlley = __tt.cars.map(c => c.alley); }, 20); });
const r = await p.evaluate(() => new Promise(res => { const t0 = performance.now(); const chk = () => { if (__tt.race.state === 'done' || performance.now() - t0 > 300000) res(1); else setTimeout(chk, 500); }; chk(); }));
const out = await p.evaluate(() => ({ state: __tt.race.state, laps: __tt.cars.map(c => c.lap), finished: __tt.cars.map(c => !!c.finished), place: __tt.race.place, recovers: __tt.recovers || 0, jump: __mon.jump, jumpAt: __mon.jumpAt, warpHits: __tt.warpHits, gateHits: __tt.gateHits, lapTimes: __tt.race.lapTimes.map(x => +x.toFixed(1)) }));
console.log(trk, JSON.stringify(out), 'errs', JSON.stringify(e)); await b.close();
