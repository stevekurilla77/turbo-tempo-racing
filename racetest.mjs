import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/'; const mode = process.argv[3] || 'all';
const errsOf = p => { const e = []; p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && e.push(m.type() + ' ' + m.text())); return e; };
async function waitDone(p, label, max = 240) { for (let i = 0; i < max; i++) { await p.waitForTimeout(1000); const s = await p.evaluate(() => ({ st: __tt.race.state, lap: __tt.player.lap, idx: __tt.player.idx, place: __tt.race.place, errs: __tt.errors.length })); if (i % 15 === 0) console.log(label, JSON.stringify(s)); if (s.st === 'done') return s; } return null; }
const finalShot = async (p, path) => { await p.evaluate(() => { __tt.finalLap(); }); await p.waitForTimeout(60);
  const info = await p.evaluate(() => { document.getAnimations().forEach(a => { a.currentTime = 420; a.pause(); }); const el = document.getElementById('finallap'), r = el.querySelector('.fl').getBoundingClientRect(), l = document.getElementById('lap');
    return { display: getComputedStyle(el).display, bannerW: Math.round(r.width), bannerTop: Math.round(r.top), bannerBottom: Math.round(r.bottom), vw: innerWidth, vh: innerHeight, lapFlash: l.classList.contains('flashlap') }; });
  await p.screenshot({ path }); await p.evaluate(() => document.getAnimations().forEach(a => a.play())); return info; };
const mmOverlap = p => p.evaluate(() => { const tst = document.getElementById('toast'), was = [tst.style.display, tst.textContent]; tst.style.display = 'block'; tst.textContent = 'Reese: Bass Blast!';
  const R = el => el.getBoundingClientRect(), ov = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  const vis = [...document.querySelectorAll('#hud .btn, #hud .box, #mmap')].filter(el => getComputedStyle(el).display !== 'none' && R(el).width), pairs = [];
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) if (ov(R(vis[i]), R(vis[j]))) pairs.push(vis[i].id + '/' + vis[j].id);
  const offscreen = vis.filter(el => { const r = R(el); return r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight; }).map(el => el.id);
  [tst.style.display, tst.textContent] = was;
  const m = document.getElementById('mmap').getBoundingClientRect(), hit = [];
  for (const el of document.querySelectorAll('#hud .btn, #hud .box')) { if (getComputedStyle(el).display === 'none') continue; const r = el.getBoundingClientRect(); if (r.width && !(r.right <= m.left || r.left >= m.right || r.bottom <= m.top || r.top >= m.bottom)) hit.push(el.id); }
  return { mm: [Math.round(m.left), Math.round(m.top), Math.round(m.width)], vw: innerWidth, vh: innerHeight, overlaps: hit, anyPairOverlap: pairs, offscreen }; });
if (mode === 'all' || mode === 'shots') { // garage shots for every car + lineup (laptop size)
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = errsOf(p);
  await p.goto(base + '?cb=' + Date.now()); await p.waitForTimeout(1200);
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  const roster = await p.evaluate(() => Object.keys(__tt.CARS));
  for (let k = 0; k < roster.length; k++) { await p.evaluate(i => { while (__tt.garage.idx !== i) __tt.garage.pick(1); }, k); await p.waitForTimeout(700); await p.screenshot({ path: `shots/v18-garage-${roster[k]}.png` }); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => { document.getElementById('overlay').style.display = 'none'; document.getElementById('hud').style.display = 'none'; __tt.lineup(); }); await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/v18-lineup.png' });
  console.log('shots errs', e); await p.close();
}
if (mode === 'all' || mode === 'laptop') { // keyboard: menu -> garage -> pick 3rd car -> autopilot full race
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = errsOf(p);
  await p.goto(base + '?autopilot&speed=4&cb=' + Date.now()); await p.waitForTimeout(1000);
  const ui = await p.evaluate(() => ({ touchUI: __tt.touchUI, btnsVisible: [...document.querySelectorAll('#hud .btn')].filter(x => getComputedStyle(x).display !== 'none').length }));
  await p.keyboard.press('Enter'); await p.waitForTimeout(400); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
  const pc = await p.evaluate(() => ({ type: __tt.player.type, top: __tt.player.top, turn: __tt.player.turn, ai: __tt.cars.slice(1).map(c => c.type), calls: __tt.renderer.info.render.calls, tris: __tt.renderer.info.render.triangles }));
  console.log('laptop', JSON.stringify(ui), JSON.stringify(pc));
  await p.waitForTimeout(3000); await p.screenshot({ path: 'shots/v18-laptop-race.png' }); await p.screenshot({ path: 'shots/v18-minimap-laptop.png' }); console.log('laptop minimap', JSON.stringify(await mmOverlap(p)));
  await p.waitForFunction(() => __tt.finalLapShown > 0, null, { timeout: 200000, polling: 20 }); console.log('laptop final lap (natural trigger count)', await p.evaluate(() => __tt.finalLapShown), 'shot', JSON.stringify(await finalShot(p, 'shots/v18-final-lap.png')));
  const d = await waitDone(p, 'laptop'); console.log('laptop done', JSON.stringify(d), JSON.stringify(await p.evaluate(() => __tt.race.results)));
  await p.waitForTimeout(2500); await p.screenshot({ path: 'shots/v18-laptop-results.png' });
  console.log('laptop errs', e); await p.close();
}
if (mode === 'all' || mode === 'iphone') { // touch: tap START -> garage -> next -> RACE; drive with on-screen touch state only (gas + ◀ ▶)
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const e = errsOf(p);
  await p.goto(base + '?speed=3&cb=' + Date.now()); await p.waitForTimeout(1200);
  await p.screenshot({ path: 'shots/v18-iphone-title.png' });
  await p.tap('#go', { force: true }); await p.waitForTimeout(600);
  await p.tap('#gnext', { force: true }); await p.waitForTimeout(400); await p.tap('#gnext', { force: true }); await p.waitForTimeout(700);
  await p.screenshot({ path: 'shots/v18-iphone-garage.png' });
  const sel = await p.evaluate(() => __tt.garage.idx);
  await p.tap('#grace', { force: true }); await p.waitForTimeout(800);
  const ui = await p.evaluate(() => ({ state: __tt.race.state, type: __tt.player.type, touchUI: __tt.touchUI, visible: [...document.querySelectorAll('#hud .btn')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.id), keysHint: getComputedStyle(document.getElementById('keys')).display }));
  console.log('iphone sel', sel, JSON.stringify(ui));
  // drive using the same touch flags the ◀ ▶ / GAS buttons set
  await p.evaluate(() => { setInterval(() => { const t = __tt.touch, s = __tt.aiSteer(); t.gas = 1; t.l = s < -.15 ? 1 : 0; t.r = s > .15 ? 1 : 0; }, 30); });
  await p.waitForTimeout(6000); await p.screenshot({ path: 'shots/v18-iphone-hud.png' }); await p.screenshot({ path: 'shots/v18-minimap-iphone.png' }); console.log('iphone minimap', JSON.stringify(await mmOverlap(p)));
  await p.waitForFunction(() => __tt.finalLapShown > 0, null, { timeout: 250000, polling: 20 }); console.log('iphone final lap (natural trigger count)', await p.evaluate(() => __tt.finalLapShown), 'shot', JSON.stringify(await finalShot(p, 'shots/v18-final-lap-iphone.png')));
  const d = await waitDone(p, 'iphone'); console.log('iphone done', JSON.stringify(d), JSON.stringify(await p.evaluate(() => ({ r: __tt.race.results, dashes: __tt.race.stats.dashes, tricks: __tt.race.stats.tricks }))));
  console.log('iphone errs', e); await ctx.close();
}
if (mode === 'all' || mode === 'ipad') { // iPad landscape + portrait: minimap must not cover any control
  for (const [w, h] of [[1180, 820], [820, 1180]]) { const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const e = errsOf(p);
    await p.goto(base + '?autostart&speed=2&cb=' + Date.now()); await p.waitForTimeout(5000); console.log('ipad', w, h, JSON.stringify(await mmOverlap(p)), 'errs', e);
    await p.screenshot({ path: `shots/v18-ipad-${w}x${h}.png` }); await ctx.close(); } }
if (mode === 'all' || mode === 'tunnel') { // shortcut screenshots (autopilot takes the alley)
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = errsOf(p);
  await p.goto(base + '?autopilot&autostart&car=trombone&speed=1&cb=' + Date.now());
  await p.waitForFunction(() => __tt.player.idx >= 226 && __tt.player.idx < 300 && __tt.race.state === 'race', null, { timeout: 120000, polling: 16 }); await p.screenshot({ path: 'shots/v18-tunnel.png' });
  await p.waitForFunction(() => __tt.player.alley && __tt.player.boost > 0, null, { timeout: 30000, polling: 16 }); await p.waitForTimeout(250); await p.screenshot({ path: 'shots/v18-tunnel-inside.png' });
  console.log('tunnel errs', e); await p.close();
}
if (mode === 'all' || mode === 'warp') { // warp ramp screenshots
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = errsOf(p);
  await p.goto(base + '?autopilot&autostart&car=trombone&speed=1&cb=' + Date.now());
  await p.waitForFunction(() => __tt.race.state === 'race' && __tt.player.lap === 0 && __tt.player.idx >= 178 && __tt.player.idx < 188, null, { timeout: 120000, polling: 16 }); await p.screenshot({ path: 'shots/v18-warp-ramp.png' });
  await p.waitForFunction(() => __tt.player.air && __tt.player.warp && __tt.player.y > 1.5, null, { timeout: 30000, polling: 16 }); await p.screenshot({ path: 'shots/v18-warp-air.png' });
  console.log('warp errs', e); await p.close();
}
await b.close();
