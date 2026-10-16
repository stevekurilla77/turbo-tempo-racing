// v17: measure warp ramps (default trombone, autopilot): speed before ramp vs after landing, and time over each ramp section, warps on vs ?nowarp
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/', runs = +(process.argv[3] || 1);
async function run(nowarp) {
  const p = await b.newPage({ viewport: { width: 640, height: 360 } }); const e = []; p.on('pageerror', x => e.push(String(x)));
  await p.goto(base + `?autopilot&autostart&car=trombone&speed=3${nowarp ? '&nowarp' : ''}&cb=` + Date.now());
  await p.evaluate(() => { const W = [15, 190, 482]; const R = window.__R = { secs: [], jumps: [] }; let prev = -1; const st = {};
    const poll = () => { const c = __tt.player, r = __tt.race; if (r.state === 'race') { const i = c.idx;
      for (const w of W) { const a = (w - 12 + 600) % 600, z = (w + 45) % 600, crossed = (q) => prev >= 0 && ((q - prev + 600) % 600) < 30 && ((i - q + 600) % 600) < 30 && prev !== i && ((q - prev + 600) % 600) <= ((i - prev + 600) % 600);
        if (crossed(a)) st[w] = { t: r.t, v0: c.v, vmax: 0, lap: c.lap };
        if (st[w]) st[w].vmax = Math.max(st[w].vmax, c.v);
        if (st[w] && crossed(z)) { R.secs.push({ w, lap: st[w].lap, t: +(r.t - st[w].t).toFixed(2), vIn: +(st[w].v0 * 1.6).toFixed(0), vPeakMph: +(st[w].vmax * 1.6).toFixed(0) }); st[w] = null; } }
      prev = i; } requestAnimationFrame(poll); }; poll(); });
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(1000); if (await p.evaluate(() => __tt.race.state) === 'done') break; }
  const out = await p.evaluate(() => ({ secs: __R.secs, finish: +__tt.player.finishTime.toFixed(2), place: __tt.race.place, warps: __tt.race.stats.warps, hits: __tt.warpHits || null, finalLapShown: __tt.finalLapShown || 0 }));
  await p.close(); return { nowarp, ...out, errs: e };
}
for (let k = 0; k < runs; k++) for (const nw of [0, 1]) console.log(JSON.stringify(await run(nw)));
await b.close();
