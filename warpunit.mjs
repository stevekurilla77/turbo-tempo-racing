// v17 controlled warp-ramp measurement: trombone placed 25 samples before each ramp at its top speed (43), no boosts, rivals parked far away.
// Times the run from 25 samples before to 80 samples after the ramp lip, with the ramp active vs disabled (__tt.nowarp).
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/';
const p = await b.newPage({ viewport: { width: 640, height: 360 } }); const e = []; p.on('pageerror', x => e.push(String(x)));
await p.goto(base + '?autopilot&autostart&car=trombone&nodrift&speed=0.01&cb=' + Date.now()); await p.waitForTimeout(1500);
const res = await p.evaluate(() => { const out = [], c = __tt.player, r = __tt.race, N = 600, P = __tt.P, T = __tt.T;
  for (const w of __tt.WARPS) for (const nw of [false, true]) {
    __tt.nowarp = nw; r.state = 'race'; const i0 = (w.i - 25 + N) % N;
    Object.assign(c, { idx: i0, x: P[i0].x, z: P[i0].z, h: Math.atan2(T[i0].x, T[i0].z), v: c.top, lat: 0, boost: 0, dash: 0, meter: 0, warpT: 0, air: false, y: 0, vy: 0, drift: 0, onRamp: false, onWarp: null, warp: false, alley: false, useAlley: false, px: 0, pz: 0 }); c.vh = c.h;
    let t = 0, vmax = 0, air = 0, vLand = null; const end = (w.i + w.len + 80) % N;
    while (t < 12) { for (const o of __tt.cars) if (!o.isPlayer) { const j = (w.i + 300) % N; Object.assign(o, { idx: j, x: P[j].x, z: P[j].z, v: 0 }); }
      c.meter = 0; const wasAir = c.air; __tt.sim(1 / 60); t += 1 / 60; vmax = Math.max(vmax, c.v); if (c.air) air += 1 / 60; if (wasAir && !c.air && vLand === null) vLand = c.v;
      if ((c.idx - end + N) % N < 20) break; }
    out.push({ ramp: w.i, warp: !nw, time: +t.toFixed(2), vInMph: Math.round(c.top * 1.6), vPeakMph: Math.round(vmax * 1.6), vLandMph: vLand && Math.round(vLand * 1.6), air: +air.toFixed(2), latEnd: +c.lat.toFixed(1) }); }
  return out; });
for (const r of res) console.log(JSON.stringify(r));
for (const w of [...new Set(res.map(r => r.ramp))]) { const a = res.find(r => r.ramp === w && r.warp), n = res.find(r => r.ramp === w && !r.warp); console.log('ramp', w, 'saved', (n.time - a.time).toFixed(2), 's  peak', a.vPeakMph, 'mph vs', n.vPeakMph); }
console.log('errs', e); await b.close();
