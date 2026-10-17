// v20 track-select: screenshots (laptop + iPhone), keyboard + touch navigation, locked tracks, reload into Ghost Town with the chosen car
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/';
const errsOf = p => { const e = []; p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => (m.type() === 'error') && e.push(m.text())); return e; };
{ const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e = errsOf(p);
  await p.goto(base + '?cb=' + Date.now()); await p.waitForTimeout(1200); await p.keyboard.press('Enter'); await p.waitForTimeout(400); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  const st = () => p.evaluate(() => ({ state: __tt.race.state, cur: __tt.tsel.cur.id, built: __tt.tsel.cur.built, btn: document.getElementById('trace').textContent, disabled: document.getElementById('trace').disabled, cards: [...document.querySelectorAll('.tcard')].map(c => c.dataset.track + (c.classList.contains('locked') ? '(locked)' : '')) }));
  console.log('open', JSON.stringify(await st()));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500); console.log('right', JSON.stringify(await st())); await p.screenshot({ path: 'shots/v20-track-select.png' });
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); console.log('right2 (locked)', JSON.stringify(await st()));
  await p.keyboard.press('Enter'); await p.waitForTimeout(300); console.log('enter on locked stays', (await st()).state);
  for (let k = 0; k < 3; k++) { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250); const s = await st(); console.log('cup', k + 1, JSON.stringify(s.cards), s.btn); await p.screenshot({ path: `shots/v20-track-select-cup${k + 2}.png` }); }
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(200); console.log('back to', (await st()).cur);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); console.log('esc ->', await p.evaluate(() => __tt.race.state)); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500); console.log('brass Enter ->', JSON.stringify(await p.evaluate(() => ({ st: __tt.race.state, url: location.search, car: __tt.player.type }))));
  console.log('laptop errs', e); await p.close(); }
{ const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const e = errsOf(p);
  await p.goto(base + '?cb=' + Date.now()); await p.waitForTimeout(1200); await p.tap('#go'); await p.waitForTimeout(500); await p.tap('#gnext'); await p.waitForTimeout(300); await p.tap('#grace'); await p.waitForTimeout(500);
  const fit = await p.evaluate(() => { const R = el => el.getBoundingClientRect(); const els = ['ttitle', 'tcups', 'tcards', 'trace', 'tback'].map(id => [id, R(document.getElementById(id))]);
    return { vw: innerWidth, vh: innerHeight, offscreen: els.filter(([, r]) => r.top < 0 || r.bottom > innerHeight + 1 || r.left < 0 || r.right > innerWidth + 1).map(x => x[0]), trace: [Math.round(R(document.getElementById('trace')).height), Math.round(R(document.getElementById('trace')).width)], cardH: Math.round(R(document.querySelector('.tcard')).height) }; });
  console.log('iphone fit', JSON.stringify(fit)); await p.screenshot({ path: 'shots/v20-track-select-iphone.png' });
  await p.tap('.tcard[data-track=ghost]'); await p.waitForTimeout(300); const car = await p.evaluate(() => __tt.player.type); console.log('iphone tapped ghost', await p.evaluate(() => __tt.tsel.cur.id), 'car', car);
  await p.tap('#tcups .tcup:nth-child(3)'); await p.waitForTimeout(300); console.log('iphone cup3', await p.evaluate(() => [__tt.tsel.cur.id, document.getElementById('trace').textContent]));
  await p.tap('#tcups .tcup:nth-child(1)'); await p.waitForTimeout(300); await p.tap('.tcard[data-track=ghost]'); await p.waitForTimeout(200);
  await Promise.all([p.waitForNavigation({ timeout: 20000 }), p.tap('#trace')]); await p.waitForFunction(() => window.__tt && __tt.race && __tt.race.state === 'race', null, { timeout: 30000 });
  await p.waitForTimeout(2500); console.log('iphone reload ->', JSON.stringify(await p.evaluate(() => ({ url: location.search, st: __tt.race.state, car: __tt.player.type, track: window.__tt_city && Object.keys(window.__tt_city.landmarks || {}).length ? 'ghost' : 'brass', menuName: document.getElementById('mtrack').textContent }))));
  await p.screenshot({ path: 'shots/v20-ghost-iphone-race.png' }); console.log('iphone errs', e); await ctx.close(); }
await b.close();
