// v23 trophy driver shot: start a cup, jump straight to the trophy ceremony (test hook), screenshot. node trophyshot.mjs [car] [device] [out]
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const [car = 'sax', dev = 'laptop', out = '/tmp/trophy.png'] = process.argv.slice(2);
const ctx = await b.newContext(dev === 'iphone' ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage(); const e = []; p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && e.push(m.type() + ' ' + m.text()));
await p.goto(`http://127.0.0.1:8787/?track=brass&autopilot&car=${car}&cb=` + Date.now()); await p.waitForFunction(() => window.__tt && __tt.tsel, null, { timeout: 60000 });
await p.evaluate(() => { __tt.tsel.open(); }); await p.waitForTimeout(500); await p.evaluate(() => { __tt.tselT = 0; }); await p.waitForTimeout(400); await p.click('#tcupgo');
await p.waitForFunction(() => window.__tt && __tt.race && __tt.cup && __tt.cup.state && __tt.race.state === 'race', null, { timeout: 90000 });
await p.evaluate(() => { const C = __tt.cup.state; C.pts[C.car] = 30; C.last = C.last || {}; document.getElementById('hud').style.display = 'none'; document.getElementById('cupst').style.display = 'flex'; __tt.cup.trophy(); }); await p.waitForTimeout(2200);
const info = await p.evaluate(() => ({ t3d: !!__tt.trophy3D, title: document.getElementById('ctitle').textContent, cv: (() => { const c = document.getElementById('ctrophy3d'); return c && [c.clientWidth, c.clientHeight, c.style.display]; })() }));
await p.screenshot({ path: out }); console.log(JSON.stringify(info), JSON.stringify(e)); await b.close();
