// v24 touch-play measurement: an iPhone-sized touch session driven only through the on-screen button flags (GAS + ◀ ▶),
// like a real thumb: hold a direction while the corner needs it (hysteresis), no autopilot. node touchrate.mjs tag diff [tracks] [cars]
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const [tag = 'x', diff = 'rehearsal', trk = 'brass,ghost,stadium,water,bayou,reed', carsArg = 'sax,trumpet,tuba,snare,horn,xylo'] = process.argv.slice(2); const CARS = carsArg.split(',');
const res = []; let k = 0;
for (const t of trk.split(',')) { const car = CARS[k++ % CARS.length];
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const e = []; p.on('pageerror', x => e.push(String(x)));
  await p.goto(`http://127.0.0.1:8787/?track=${t}&autostart&nogate&speed=${process.env.SPD || 1}&car=${car}&diff=${diff}${process.env.EXTRA || ''}&cb=` + Date.now());
  await p.waitForFunction(() => window.__tt && __tt.touch && __tt.race, null, { timeout: 60000 });
  await p.evaluate(([al, MODE]) => { __tt.botTouch = true; let hold = 0, acc = 0; if (al) setInterval(() => { if (__tt.race.state === 'race') __tt.player.useAlley = true; }, 500); setInterval(() => { const T = __tt.touch, s = __tt.aiSteer(); T.gas = 1; if (MODE === 'pwm') { acc += Math.max(-1, Math.min(1, s * (+(window.__G || .8)))); if (acc > .5) { hold = 1; acc -= 1; } else if (acc < -.5) { hold = -1; acc += 1; } else hold = 0; } else { if (hold === 0) { if (s > .3) hold = 1; else if (s < -.3) hold = -1; } else if (hold * s < .1) hold = 0; } T.r = hold > 0 ? 1 : 0; T.l = hold < 0 ? 1 : 0; const P = __tt.player; if (__tt.race.state === 'race') { const S = __tt.tstat = __tt.tstat || { n: 0, v: 0, off: 0, wall: 0 }; S.n++; if (S.n % 20 === 0) (__tt.trace = __tt.trace || []).push([+__tt.race.t.toFixed(1), P.idx, +P.lat.toFixed(1), +P.v.toFixed(0), P.alley ? 1 : 0, +P.steer.toFixed(1)]); S.v += P.v / P.top; if (Math.abs(P.lat) > 14.5) S.off++; } }, 25); }, [!!process.env.ALLEY, process.env.MODE || 'hold']);
  let out = null; for (let i = 0; i < 400; i++) { await p.waitForTimeout(1000); out = await p.evaluate(() => __tt.race.state === 'done' && __tt.race.results ? { place: __tt.race.results.place, time: +__tt.race.results.time.toFixed(1), laps: __tt.race.results.laps.map(x => +x.toFixed(1)), drifts: __tt.race.stats.drifts, boosts: __tt.race.stats.driftBoosts, touchUI: __tt.touchUI, crashes: __tt.race.stats.crashes, vfrac: +(__tt.tstat.v / __tt.tstat.n).toFixed(2), offFrac: +(__tt.tstat.off / __tt.tstat.n).toFixed(2) } : null); if (out) break; }
  if (process.env.TRACE) console.log(JSON.stringify(await p.evaluate(() => __tt.trace))); res.push({ t, car, ...out, errs: e.length }); console.log(JSON.stringify(res[res.length - 1])); await ctx.close(); }
const n = res.length, win = res.filter(r => r.place === 1).length, pod = res.filter(r => r.place <= 3).length;
console.log('TOUCH', JSON.stringify({ tag, diff, n, win: +(win / n).toFixed(2), podium: +(pod / n).toFixed(2), places: res.map(r => r.place).join('') }));
await b.close();
