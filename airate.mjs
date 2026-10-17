// v23 AI fairness measurement: autopilot driver (clean, or with N spin-out mistakes) vs the AI, per difficulty. node airate.mjs tag mistakes diff [tracks] [runsPerTrack]
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const [tag = 'x', mk = '0', diff = '', trk = 'brass,ghost,stadium,water,bayou,reed', runs = '1'] = process.argv.slice(2); const CARS = ['trombone', 'trumpet', 'sax', 'tuba', 'clarinet', 'snare', 'horn', 'xylo'];
const res = []; let k = 0;
for (let r = 0; r < +runs; r++) for (const t of trk.split(',')) { const car = CARS[(k++ * 3 + (+mk) * 5 + diff.length) % CARS.length];
  const p = await b.newPage({ viewport: { width: 400, height: 225 } }); const e = []; p.on('pageerror', x => e.push(String(x)));
  await p.goto(`http://127.0.0.1:8787/?track=${t}&autopilot&autostart&speed=4&car=${car}&mistake=${mk}${diff ? '&diff=' + diff : ''}&cb=` + Date.now());
  let out = null; for (let i = 0; i < 400; i++) { await p.waitForTimeout(1000); out = await p.evaluate(() => __tt.race.state === 'done' && __tt.race.results ? { place: __tt.race.results.place, time: +__tt.race.results.time.toFixed(1), mistakes: __tt.mistakes || 0, blasts: __tt.blasts || 0, onMe: __tt.blastHitsOnPlayer || 0, order: __tt.race.results.order.map(s => s.split(' — ')[0]).join('>') } : null); if (out) break; }
  // gap to the winner / to the next car (seconds) right at the finish
  res.push({ t, car, ...out, errs: e.length }); console.log(JSON.stringify(res[res.length - 1])); await p.close(); }
const n = res.length, win = res.filter(r => r.place === 1).length, pod = res.filter(r => r.place <= 3).length;
console.log('RATE', JSON.stringify({ tag, mistakes: +mk, diff: diff || 'default', n, win: +(win / n).toFixed(2), podium: +(pod / n).toFixed(2), places: res.map(r => r.place).join('') }));
await b.close();
