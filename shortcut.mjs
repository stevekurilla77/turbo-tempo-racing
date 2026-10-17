// v26 shortcut value: solo autopilot laps with the shortcut vs without (alley=0). Flying laps (2,3) only. node shortcut.mjs track [runs] [base]
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const [trk = 'water', runs = '1', base = 'http://127.0.0.1:8787/'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const one = async (alley) => { const p = await b.newPage({ viewport: { width: 640, height: 360 } }); const e = []; p.on('pageerror', x => e.push(String(x)));
  await p.goto(base + `?track=${trk}&autopilot&autostart&nogate&solo&speed=4&car=trombone${alley ? '' : '&alley=0'}&cb=` + Date.now());
  await p.waitForFunction(() => __tt.race && __tt.race.state === 'done', null, { timeout: 400000, polling: 1000 });
  const r = await p.evaluate(() => ({ laps: __tt.race.lapTimes.map(x => +x.toFixed(2)), alley: __tt.race.stats.alley, warps: __tt.race.stats.warps })); await p.close(); return { ...r, e }; };
const res = { on: [], off: [] };
for (let k = 0; k < +runs; k++) { const [a, o] = await Promise.all([one(true), one(false)]); res.on.push(a); res.off.push(o); }
const fly = rs => { const l = rs.flatMap(r => r.laps.slice(1)); return l.reduce((s, x) => s + x, 0) / l.length; };
const on = fly(res.on), off = fly(res.off);
console.log(trk, JSON.stringify({ lapWith: +on.toFixed(2), lapWithout: +off.toFixed(2), saved: +(off - on).toFixed(2), on: res.on.map(r => [r.laps, r.alley, r.warps]), off: res.off.map(r => [r.laps, r.alley]), errs: [...res.on, ...res.off].flatMap(r => r.e) }));
await b.close();
