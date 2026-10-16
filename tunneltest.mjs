// v15 timed shortcut test: default car (trombone) on autopilot, with vs without Backbeat Alley
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/', runs = +(process.argv[3] || 1);
async function run(alley) {
  const p = await b.newPage({ viewport: { width: 640, height: 360 } }); const e = []; p.on('pageerror', x => e.push(String(x)));
  await p.goto(base + `?autopilot&autostart&car=trombone&speed=3&alley=${alley}&cb=` + Date.now());
  await p.evaluate(() => { const L = window.__L = { laps: [], seg: [], alleyUses: 0, inAlley: 0, aiAlley: 0 }; let prevIdx = -1, prevLap = -1, segStart = null;
    const poll = () => { const pl = __tt.player, r = __tt.race; if (r.state === 'race') {
      if (pl.lap !== prevLap) { L.laps.push(r.t); prevLap = pl.lap; }
      if (prevIdx >= 0 && prevIdx < 215 && pl.idx >= 215 && pl.idx < 260) segStart = r.t;
      if (segStart !== null && prevIdx < 370 && pl.idx >= 370 && pl.idx < 420) { L.seg.push(r.t - segStart); segStart = null; }
      if (pl.alley) L.inAlley++; L.aiAlley = Math.max(L.aiAlley, __tt.cars.filter(c => !c.isPlayer && c.alley).length);
      prevIdx = pl.idx; } requestAnimationFrame(poll); }; poll(); });
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(1000); const st = await p.evaluate(() => __tt.race.state); if (st === 'done') break; }
  const L = await p.evaluate(() => ({ ...__L, alleyStat: __tt.race.stats.alley, wall: __tt.race.stats.crashes, finish: __tt.player.finishTime, place: __tt.race.place, aiUsedAlley: __tt.cars.filter(c => !c.isPlayer).map(c => c.type + ':' + c.useAlley).join(' ') }));
  const lapT = L.laps.map((t, i) => i ? +(t - L.laps[i - 1]).toFixed(2) : null).slice(1);
  if (L.finish) lapT.push(+(L.finish - L.laps[L.laps.length - 1]).toFixed(2));
  await p.close(); return { alley, laps: lapT, seg: L.seg.map(x => +x.toFixed(2)), finish: +L.finish.toFixed(2), alleyStat: L.alleyStat, place: L.place, aiAlleyMax: L.aiAlley, errs: e };
}
for (let k = 0; k < runs; k++) for (const a of [1, 0]) console.log(JSON.stringify(await run(a)));
await b.close();
