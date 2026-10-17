// v18 finish/result screen tests: win + non-win finishes, rivals finishing first, all 3 buttons, keyboard Enter
import { chromium } from 'playwright';
const TQ = process.env.TRK ? `track=${process.env.TRK}&` : '', PRE = process.env.PRE || 'shots/v20-';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/', only = process.argv[3] || 'all';
const errsOf = p => { const e = []; p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && e.push(m.type() + ' ' + m.text())); return e; };
const iphone = () => b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const laptop = () => b.newContext({ viewport: { width: 1280, height: 720 } });
async function race(ctx, { top, speed = 4, shotFlag, shotRes, label }) {
  const p = await ctx.newPage(); const e = errsOf(p);
  await p.goto(base + `?${TQ}autopilot&autostart&car=trombone&speed=${speed}&cb=` + Date.now());
  await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 30000 });
  // test setup only: change the test driver's top speed to force a win (fast) or a back-of-the-pack finish (slow)
  if (shotFlag) await p.evaluate(() => { __tt.resultDelay = 5000; }); // screenshot run only: hold the FINISH! moment a bit longer before the results
  await p.evaluate(t => { __tt.player.top = t; __tt.log = { rivalDoneWhileRacing: 0, stateWhenRivalDone: [] };
    const poll = () => { const r = __tt.race; for (const c of __tt.cars) if (!c.isPlayer && c.finished && !c._seen) { c._seen = 1; __tt.log.rivalDoneWhileRacing++; __tt.log.stateWhenRivalDone.push(r.state + (__tt.player.finished ? '/playerDone' : '/playerRacing')); } requestAnimationFrame(poll); }; poll(); }, top);
  await p.waitForFunction(() => __tt.finishShown > 0, null, { timeout: 300000, polling: 16 });
  await p.waitForTimeout(650); if (shotFlag) await p.screenshot({ path: shotFlag });
  const fx = await p.evaluate(() => ({ display: getComputedStyle(document.getElementById('finishfx')).display, state: __tt.race.state, playerV: +__tt.player.v.toFixed(1) }));
  await p.waitForFunction(() => document.getElementById('results').style.display === 'flex', null, { timeout: 15000 });
  await p.waitForTimeout(900); if (shotRes) await p.screenshot({ path: shotRes });
  const res = await p.evaluate(() => { const q = id => document.getElementById(id), btns = ['ragain', 'rchange', 'rmenu'].map(id => { const r = q(id).getBoundingClientRect(); return [id, Math.round(r.width), Math.round(r.height), r.bottom <= innerHeight && r.top >= 0]; });
    return { title: q('rtitle').textContent, sub: q('rsub').textContent, stats: [...q('rstats').children].map(d => d.textContent), order: q('rorder').textContent, btns, results: __tt.race.results, log: __tt.log, finishShown: __tt.finishShown, resultsShown: __tt.resultsShown,
      tryAgainText: document.body.innerText.toUpperCase().includes('TRY AGAIN'), fitsH: q('results').scrollHeight <= innerHeight + 1 }; });
  console.log(label, 'finishfx', JSON.stringify(fx)); console.log(label, 'result', JSON.stringify({ ...res, results: { place: res.results.place, time: res.results.time.toFixed(2), best: res.results.best.toFixed(2), laps: res.results.laps.map(x => x.toFixed(2)) } }));
  return { p, e };
}
if (only === 'all' || only === 'iphone') {
  { const ctx = await iphone(); const { p, e } = await race(ctx, { top: 62, shotFlag: PRE + 'finish-flag.png', shotRes: PRE + 'you-won.png', label: 'iphone-win' });
    await p.tap('#ragain'); await p.waitForTimeout(500); console.log('iphone-win tap RACE AGAIN', JSON.stringify(await p.evaluate(() => ({ state: __tt.race.state, car: __tt.player.type, results: document.getElementById('results').style.display, hud: document.getElementById('hud').style.display }))));
    console.log('iphone-win errs', e); await ctx.close(); }
  { const ctx = await iphone(); const { p, e } = await race(ctx, { top: 30, shotRes: PRE + 'place-result.png', label: 'iphone-place' });
    await p.tap('#rchange'); await p.waitForTimeout(500); console.log('iphone-place tap CHANGE CAR', JSON.stringify(await p.evaluate(() => ({ state: __tt.race.state, garage: document.getElementById('garage').style.display, gidx: __tt.garage.idx }))));
    console.log('iphone-place errs', e); await ctx.close(); }
}
if (only === 'all' || only === 'laptop') {
  { const ctx = await laptop(); const { p, e } = await race(ctx, { top: 62, shotRes: PRE + 'you-won-laptop.png', label: 'laptop-win' });
    await p.keyboard.press('Enter'); await p.waitForTimeout(500); console.log('laptop Enter', JSON.stringify(await p.evaluate(() => ({ state: __tt.race.state, car: __tt.player.type, results: document.getElementById('results').style.display }))));
    console.log('laptop-win errs', e); await ctx.close(); }
  { const ctx = await laptop(); const { p, e } = await race(ctx, { top: 36, shotRes: PRE + 'place-result-laptop.png', label: 'laptop-place' });
    await p.click('#rmenu'); await p.waitForTimeout(500); console.log('laptop MENU', JSON.stringify(await p.evaluate(() => ({ state: __tt.race.state, overlay: getComputedStyle(document.getElementById('overlay')).display, startBtn: !!document.getElementById('go') }))));
    await p.keyboard.press('Enter'); await p.waitForTimeout(400); console.log('laptop menu->Enter', await p.evaluate(() => __tt.race.state));
    console.log('laptop-place errs', e); await ctx.close(); }
}
await b.close();
