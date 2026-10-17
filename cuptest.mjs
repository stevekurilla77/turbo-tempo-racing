// v22 cup mode test: start a cup from track select, run its 3 races (1 lap each, test-only), standings after each, trophy at the end.
// node cuptest.mjs [base] [cupIndex] [top] [device] [pre]
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const [base = 'http://127.0.0.1:8787/', ci = '0', top = '62', dev = 'laptop', pre = '/tmp/cup-'] = process.argv.slice(2);
const ctx = await b.newContext(dev === 'iphone' ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage(); const e = []; p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && e.push(m.type() + ' ' + m.text()));
await p.goto(base + '?track=brass&autopilot&speed=4&laps=1&car=sax&cb=' + Date.now()); await p.waitForFunction(() => window.__tt && __tt.tsel, null, { timeout: 60000 });
await p.evaluate(ci => { __tt.tsel.open(); for (let k = 0; k < ci; k++) __tt.tsel.cup(1); }, +ci); await p.waitForTimeout(600);
const tsel = await p.evaluate(() => ({ cupBtn: document.getElementById('tcupgo').textContent, disabled: document.getElementById('tcupgo').disabled, single: document.getElementById('trace').textContent }));
console.log('tsel', JSON.stringify(tsel)); await p.screenshot({ path: pre + 'tsel.png' });
await p.evaluate(() => { __tt.tselT = 0; }); await p.waitForTimeout(500); await p.click('#tcupgo');
for (let r = 0; r < 3; r++) {
  await p.waitForFunction(() => window.__tt && __tt.race && __tt.race.state === 'race', null, { timeout: 90000 });
  const info = await p.evaluate(top => { __tt.player.top = top; return { url: location.search, cup: __tt.cup.state && { id: __tt.cup.state.id, i: __tt.cup.state.i, ai: __tt.cup.state.ai.join(','), car: __tt.cup.state.car }, lineup: __tt.cars.map(c => c.type).join(',') }; }, +top);
  console.log('race', r, JSON.stringify(info));
  await p.waitForFunction(() => __tt.cupShown > 0, null, { timeout: 400000, polling: 100 }); await p.waitForTimeout(1200);
  const st = await p.evaluate(() => ({ title: document.getElementById('ctitle').textContent, sub: document.getElementById('csub').textContent, rows: [...document.querySelectorAll('#ctable tr')].map(tr => tr.textContent), next: document.getElementById('cnext').textContent, fits: document.getElementById('cupst').scrollHeight <= innerHeight + 1 }));
  console.log('standings', r, JSON.stringify(st)); await p.screenshot({ path: `${pre}standings-${r + 1}.png` });
  if (dev === 'iphone') await p.tap('#cnext'); else await p.keyboard.press('Enter');
}
await p.waitForFunction(() => __tt.trophyShown > 0, null, { timeout: 30000 }); await p.waitForTimeout(1500);
const tr = await p.evaluate(() => ({ title: document.getElementById('ctitle').textContent, sub: document.getElementById('csub').textContent, rows: [...document.querySelectorAll('#ctable tr')].map(tr => tr.textContent), btns: [...document.querySelectorAll('#cbtns button')].filter(b => b.offsetParent).map(b => b.textContent), fits: document.getElementById('cupst').scrollHeight <= innerHeight + 1, tryAgain: document.body.innerText.toUpperCase().includes('TRY AGAIN'), fin: JSON.parse(sessionStorage.getItem('tt_cup')).fin }));
console.log('trophy', JSON.stringify(tr)); await p.screenshot({ path: pre + 'trophy.png' });
// menu button leaves the cup cleanly
await p.evaluate(() => document.getElementById('cmenu').click()); await p.waitForTimeout(400);
console.log('after-menu', JSON.stringify(await p.evaluate(() => ({ state: __tt.race.state, cup: __tt.cup.state, store: sessionStorage.getItem('tt_cup') }))));
console.log('errors', JSON.stringify(e)); await b.close();
