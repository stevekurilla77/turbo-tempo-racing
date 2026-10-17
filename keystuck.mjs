// v24 stuck-steering regression test (Steve: right arrow stuck in Woodwind Cup race 3).
// A) cup: hold → in race 2, cup transition, race 3 must start with no steer held
// B) a held key that stops auto-repeating without a keyup is released (~0.5 s); C) Cmd+arrow; D) blur / visibility / pagehide; E) pause
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/';
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1; };
const errsOf = p => { const e = []; p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => m.type() === 'error' && e.push(m.text())); return e; };
const held = p => p.evaluate(() => ({ R: __tt.keys.ArrowRight || 0, L: __tt.keys.ArrowLeft || 0, tr: __tt.touch.r, tl: __tt.touch.l, steer: +__tt.player.steer.toFixed(2), state: __tt.race.state, track: location.search.match(/track=(\w+)/)?.[1] }));
{ // A
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = errsOf(p);
  await p.goto(base + '?track=brass&autopilot&speed=4&laps=1&car=sax&cb=' + Date.now()); await p.waitForFunction(() => window.__tt && __tt.tsel, null, { timeout: 60000 });
  await p.evaluate(() => { __tt.tsel.open(); __tt.tsel.cup(1); }); await p.waitForTimeout(600); await p.evaluate(() => { __tt.tselT = 0; }); await p.waitForTimeout(400); await p.click('#tcupgo');
  for (let r = 0; r < 2; r++) {
    await p.waitForFunction(() => __tt.race && __tt.race.state === 'race', null, { timeout: 120000 });
    if (r === 1) { await p.keyboard.down('ArrowRight'); for (let k = 0; k < 6; k++) { await p.waitForTimeout(60); await p.keyboard.down('ArrowRight'); } console.log('race 2 holding', JSON.stringify(await held(p))); }
    await p.waitForFunction(() => __tt.cupShown > 0, null, { timeout: 400000, polling: 200 }); await p.waitForTimeout(1200); await p.keyboard.press('Enter'); }
  await p.waitForFunction(() => __tt.race && (__tt.race.state === 'count' || __tt.race.state === 'race'), null, { timeout: 120000 });
  const h0 = await held(p); await p.waitForFunction(() => __tt.race.state === 'race' && __tt.race.t > 2, null, { timeout: 120000 }); const h1 = await held(p);
  ok(h0.track === 'reed' && !h0.R && !h1.R && !h1.tr, 'cup race 3 (Reed Forest) starts with no right steer held ' + JSON.stringify([h0, h1]));
  await p.keyboard.up('ArrowRight'); console.log('A errs', JSON.stringify(e)); await p.close(); }
{ // B-E: a real (non-autopilot) single race on Reed Forest
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = errsOf(p);
  await p.goto(base + '?track=reed&nogate&autostart&car=sax&cb=' + Date.now()); await p.waitForFunction(() => __tt.race && __tt.race.state === 'race' && __tt.race.t > 1, null, { timeout: 90000 });
  await p.keyboard.down('ArrowRight'); for (let k = 0; k < 12; k++) { await p.waitForTimeout(50); await p.keyboard.down('ArrowRight'); } // OS auto-repeat
  const s1 = await held(p); ok(s1.R && s1.steer > .5, 'holding right steers right ' + JSON.stringify(s1));
  await p.waitForTimeout(1100); const s2 = await held(p); ok(!s2.R && Math.abs(s2.steer) < .2, 'repeats stopped with no keyup -> released and steering recentred ' + JSON.stringify(s2)); await p.keyboard.up('ArrowRight');
  await p.keyboard.down('ArrowLeft'); for (let k = 0; k < 4; k++) { await p.waitForTimeout(50); await p.keyboard.down('ArrowLeft'); } const s3 = await held(p); await p.keyboard.up('ArrowLeft'); await p.waitForTimeout(150); const s4 = await held(p); ok(s3.L && !s4.L, 'normal keyup releases immediately');
  await p.keyboard.down('Meta'); await p.keyboard.down('ArrowRight'); const s5 = await held(p); await p.keyboard.up('Meta'); const s6 = await held(p); await p.keyboard.up('ArrowRight'); ok(!s5.R && !s6.R, 'Cmd+arrow never sticks');
  for (const ev of ['blur', 'pagehide', 'contextmenu', 'visibilitychange']) { await p.keyboard.down('ArrowRight'); await p.keyboard.down('ArrowRight'); await p.evaluate(ev => (ev === 'visibilitychange' ? document : window).dispatchEvent(new Event(ev)), ev); const s = await held(p); ok(!s.R, `${ev} releases held keys`); await p.keyboard.up('ArrowRight'); }
  await p.evaluate(() => { __tt.touch.r = 1; }); await p.keyboard.down('ArrowRight'); await p.keyboard.press('Escape'); await p.waitForTimeout(200); const s7 = await held(p); await p.keyboard.press('Escape'); await p.waitForTimeout(300); const s8 = await held(p);
  ok(s7.state === 'paused' && !s7.R && !s7.tr && !s8.R && s8.state === 'race', 'pause + resume clear keyboard and touch steer ' + JSON.stringify([s7, s8])); await p.keyboard.up('ArrowRight');
  await p.keyboard.down('ArrowRight'); await p.keyboard.press('Escape'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(400); const s9 = await held(p); ok(s9.state === 'count' && !s9.R, 'restart clears held keys'); await p.keyboard.up('ArrowRight');
  console.log('B errs', JSON.stringify(e)); await p.close(); }
await b.close();
