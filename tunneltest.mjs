// v15 timed shortcut test: default car (trombone) on autopilot, with vs without Backbeat Alley
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const TQ = (process.env.TRK ? `track=${process.env.TRK}&` : '') + (process.env.XQ || ''), [SA, SB] = (process.env.SEG || '215,370').split(',').map(Number);
const base = process.argv[2] || 'http://127.0.0.1:8787/', runs = +(process.argv[3] || 1);
async function run(alley) {
  const p = await b.newPage({ viewport: { width: 640, height: 360 } }); const e = []; p.on('pageerror', x => e.push(String(x)));
  await p.goto(base + `?${TQ}autopilot&autostart&car=trombone&speed=3&alley=${alley}&cb=` + Date.now());
  await p.evaluate(([SA, SB]) => { const L = window.__L = { laps: [], seg: [], alleyUses: 0, inAlley: 0, aiAlley: 0 }; let prevIdx = -1, prevLap = -1, segStart = null;
    const poll = () => { const pl = __tt.player, r = __tt.race; if (r.state === 'race') {
      if (pl.lap !== prevLap) { L.laps.push(r.t); prevLap = pl.lap; }
      if (prevIdx >= 0 && prevIdx < SA && pl.idx >= SA && pl.idx < SA + 45) segStart = r.t;
      if (segStart !== null && prevIdx < SB && pl.idx >= SB && pl.idx < SB + 50) { L.seg.push(r.t - segStart); segStart = null; }
      if (pl.alley) L.inAlley++; L.aiAlley = Math.max(L.aiAlley, __tt.cars.filter(c => !c.isPlayer && c.alley).length);
      prevIdx = pl.idx; } requestAnimationFrame(poll); }; poll(); }, [SA, SB]);
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(1000); const st = await p.evaluate(() => __tt.race.state); if (st === 'done') break; }
  const L = await p.evaluate(() => ({ ...__L, alleyStat: __tt.race.stats.alley, wall: __tt.race.stats.crashes, finish: __tt.player.finishTime, place: __tt.race.place, aiUsedAlley: __tt.cars.filter(c => !c.isPlayer).map(c => c.type + ':' + c.useAlley).join(' ') }));
  const lapT = L.laps.map((t, i) => i ? +(t - L.laps[i - 1]).toFixed(2) : null).slice(1);
  if (L.finish) lapT.push(+(L.finish - L.laps[L.laps.length - 1]).toFixed(2));
  await p.close(); return { alley, laps: lapT, seg: L.seg.map(x => +x.toFixed(2)), finish: +L.finish.toFixed(2), alleyStat: L.alleyStat, place: L.place, aiAlleyMax: L.aiAlley, errs: e };
}
const all = { 1: [], 0: [] }; for (let k = 0; k < runs; k++) for (const a of [1, 0]) { const r = await run(a); all[a].push(r); console.log(JSON.stringify(r)); }
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? +(s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2).toFixed(2) : null; };
const segs = a => all[a].flatMap(r => r.seg), laps = a => all[a].flatMap(r => r.laps.slice(1));
console.log('SUMMARY', JSON.stringify({ segAlley: med(segs(1)), segRoad: med(segs(0)), segSave: +(med(segs(0)) - med(segs(1))).toFixed(2), lapAlley: med(laps(1)), lapRoad: med(laps(0)), lapSave: +(med(laps(0)) - med(laps(1))).toFixed(2), n: segs(1).length + '/' + segs(0).length }));
await b.close();
