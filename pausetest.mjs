// v24 pause menu test: Esc pauses (sim, timer, audio frozen), arrows/Enter navigate, Restart, Quit -> "Are you sure?" -> track select / menu (cup), touch ❚❚ button
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/', shot = process.argv[3] || '/tmp/pause.png';
const errsOf = p => { const e = []; p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && e.push(m.type() + ' ' + m.text())); return e; };
const st = p => p.evaluate(() => ({ state: __tt.race.state, t: +__tt.race.t.toFixed(2), ac: window.__ac && __ac.state, menu: getComputedStyle(document.getElementById('pausem')).display, conf: __tt.pause.conf, sel: __tt.pause.sel, tsel: getComputedStyle(document.getElementById('tsel')).display, overlay: getComputedStyle(document.getElementById('overlay')).display, cup: !!(__tt.cup.state), store: sessionStorage.getItem('tt_cup') }));
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1; };
{ // laptop single race
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = errsOf(p); p.on('framenavigated', f => f === p.mainFrame() && console.log('NAV', f.url()));
  await p.goto(base + '?track=bayou&nogate&autostart&car=sax&cb=' + Date.now()); await p.mouse.click(640, 360); await p.evaluate(() => { window.__gasI = setInterval(() => { if (__tt.race.state === 'race' || __tt.race.state === 'count') { __tt.touch.gas = 1; const s = __tt.aiSteer(); __tt.touch.r = s > .3 ? 1 : 0; __tt.touch.l = s < -.3 ? 1 : 0; } }, 16); });
  await p.waitForFunction(() => __tt.race.state === 'race' && __tt.race.t > 9, null, { timeout: 90000 });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(800);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); const a = await st(p); await p.waitForTimeout(1200); const a2 = await st(p);
  ok(a.state === 'paused' && a.menu === 'flex', 'Esc opens pause menu ' + JSON.stringify(a)); ok(a.t === a2.t, `timer frozen ${a.t} -> ${a2.t}`);
  console.log('audio while paused:', await p.evaluate(() => __tt.acState));
  await p.screenshot({ path: shot });
  await p.keyboard.press('Escape'); await p.waitForTimeout(500); const r1 = await st(p); ok(r1.state === 'race' && r1.menu === 'none' && r1.t > a.t, 'Esc again resumes ' + JSON.stringify(r1));
  await p.keyboard.up('ArrowUp');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100); ok((await st(p)).sel === 1, 'ArrowDown moves to Restart');
  await p.keyboard.press('Enter'); await p.waitForTimeout(600); const rs = await st(p); ok(rs.state === 'count' && rs.t < 1, 'Restart Race -> fresh countdown ' + JSON.stringify(rs));
  await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 60000 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(100); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  const c1 = await st(p); ok(c1.conf && c1.sel === 1 && c1.state === 'paused', 'Quit Race asks "Are you sure?" (No preselected) ' + JSON.stringify(c1)); await p.screenshot({ path: shot.replace('.png', '-confirm.png') });
  await p.keyboard.press('Enter'); await p.waitForTimeout(400); const c2 = await st(p); ok(!c2.conf && c2.state === 'paused', 'No returns to pause menu');
  ok((await st(p)).sel === 2, 'after No, Quit Race stays selected'); await p.keyboard.press('Enter'); await p.waitForTimeout(400); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  const q = await st(p); ok(q.state === 'tsel' && q.tsel === 'flex' && q.menu === 'none', 'Yes -> track select ' + JSON.stringify(q));
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500); const again = await st(p); ok(again.state === 'count' || again.state === 'race' || again.state === 'gate', 'can race again from track select (no softlock) ' + again.state);
  console.log('laptop errs', JSON.stringify(e)); await p.close(); }
{ // iPhone touch + cup
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const e = errsOf(p);
  await p.goto(base + '?track=brass&nogate&car=horn&cb=' + Date.now()); await p.waitForFunction(() => window.__tt && __tt.tsel, null, { timeout: 60000 });
  await p.evaluate(() => { __tt.tsel.open(); }); await p.waitForTimeout(500); await p.evaluate(() => { __tt.tselT = 0; }); await p.waitForTimeout(400); await p.tap('#tcupgo');
  await p.waitForFunction(() => __tt.race && (__tt.race.state === 'gate' || __tt.race.state === 'count' || __tt.race.state === 'race'), null, { timeout: 90000 });
  if (await p.evaluate(() => __tt.race.state === 'gate')) await p.tap('#gate', { force: true });
  await p.waitForFunction(() => __tt.race.state === 'race' && __tt.race.t > 1, null, { timeout: 60000 });
  const box = await p.evaluate(() => { const r = (id) => { const x = document.getElementById(id).getBoundingClientRect(); return [x.left, x.top, x.right, x.bottom]; }; return { pause: r('bpause'), mm: r('mmap'), place: r('place'), lap: r('lap') }; });
  const ov = (a, c) => !(a[2] <= c[0] || c[2] <= a[0] || a[3] <= c[1] || c[3] <= a[1]); ok(!ov(box.pause, box.mm) && !ov(box.pause, box.place) && !ov(box.pause, box.lap), 'pause button clear of minimap/place/lap ' + JSON.stringify(box));
  await p.tap('#bpause'); await p.waitForTimeout(400); const a = await st(p); ok(a.state === 'paused' && a.menu === 'flex', 'tap ❚❚ pauses'); await p.screenshot({ path: shot.replace('.png', '-iphone.png') });
  await p.tap('#presume'); await p.waitForTimeout(500); ok((await st(p)).state === 'race', 'tap Resume');
  await p.tap('#bpause'); await p.waitForTimeout(400); await p.tap('#pquit'); await p.waitForTimeout(400); ok((await st(p)).conf, 'cup Quit asks to confirm'); await p.screenshot({ path: shot.replace('.png', '-iphone-confirm.png') });
  await p.tap('#pyes'); await p.waitForTimeout(800); const q = await st(p); ok(q.state === 'menu' && q.overlay === 'flex' && !q.cup && q.store === null, 'cup Yes -> main menu, cup cleared ' + JSON.stringify(q));
  console.log('iphone errs', JSON.stringify(e)); await ctx.close(); }
await b.close();
