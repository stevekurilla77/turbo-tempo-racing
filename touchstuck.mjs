// v25 stuck touch-steering regression test (Steve, iPhone: steering stayed right after lifting his finger).
// Real CDP touch events on an iPhone-sized page, non-autopilot race. Every scenario must end with no steer held.
import { chromium } from 'playwright';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/';
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1; };
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); const e = []; p.on('pageerror', x => e.push('pageerror ' + x)); p.on('console', m => m.type() === 'error' && e.push(m.text()));
const cdp = await ctx.newCDPSession(p);
// CDP: touchEnd/touchCancel list the fingers being lifted ([] = all)
const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id, radiusX: 8, radiusY: 8, force: 1 })) });
const center = id => p.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; }, id);
const st = () => p.evaluate(() => ({ ev: __tt.touchEvents, l: __tt.touch.l, r: __tt.touch.r, gas: __tt.touch.gas, steer: +__tt.player.steer.toFixed(2), input: __tt.steerInput, state: __tt.race.state, on: document.getElementById('br').classList.contains('on') }));
const clearEnd = async (m) => { await p.waitForTimeout(450); const s = await st(); ok(!s.r && !s.l && Math.abs(s.steer) < .2 && !s.on, m + ' -> no steer held ' + JSON.stringify(s)); };
await p.goto(base + '?track=reed&nogate&autostart&car=clarinet&cb=' + Date.now());
await p.waitForFunction(() => __tt.race && __tt.race.state === 'race' && __tt.race.t > 1, null, { timeout: 90000 });
const R = await center('br'), L = await center('bl'), G = await center('bgas'); console.log('buttons', JSON.stringify({ R, L, G }));
// 0. sanity: holding the right arrow (finger perfectly still) keeps steering right
await T('touchStart', [[...R, 1]]); await p.waitForTimeout(700); const s0 = await st(); ok(s0.r === 1 && s0.steer > .5, 'still finger on ▶ keeps steering ' + JSON.stringify(s0));
// 1. slide off the button, then lift
await T('touchMove', [[R[0] + 40, R[1] - 50, 1]]); await T('touchMove', [[R[0] + 130, R[1] - 140, 1]]); const s1 = await st(); ok(!s1.r, 'slid off ▶: released while finger still down'); await T('touchEnd', []); await clearEnd('slide off');
// 1b. slide from ▶ onto ◀
await T('touchStart', [[...R, 1]]); await p.waitForTimeout(150); await T('touchMove', [[...L, 1]]); const s1b = await st(); ok(s1b.l && !s1b.r, 'slide ▶ -> ◀ switches steer'); await T('touchEnd', []); await clearEnd('slide ▶ -> ◀ then lift');
// 2+3. MAIN REGRESSION (Steve's exact repro): one thumb holds GAS the whole time, the other holds RIGHT (and LEFT);
// lift the steering thumb while gas stays down -> steering must be 0 on the very next frame. Then both lift orders.
const frame = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
for (const [nm, B, k] of [['▶ RIGHT', R, 'r'], ['◀ LEFT', L, 'l']]) {
  // gas down, steer down, steer up while gas held
  await T('touchStart', [[...G, 1]]); await frame(); await T('touchStart', [[...G, 1], [...B, 2]]); await p.waitForTimeout(400); await frame();
  const a1 = await st(); ok(a1.gas && a1[k] && Math.abs(a1.steer) > .5, 'gas + ' + nm + ' held, car turning ' + JSON.stringify(a1));
  await T('touchEnd', [[...B, 2]]); await frame(); const a2 = await st();
  ok(a2.gas === 1 && !a2.l && !a2.r && a2.input === 0, 'lift ' + nm + ' thumb, gas thumb still down: steer input 0 on next frame ' + JSON.stringify(a2));
  await p.waitForTimeout(400); const a3 = await st(); ok(a3.gas === 1 && Math.abs(a3.steer) < .05, '... and car goes straight while gas held ' + JSON.stringify(a3));
  await T('touchEnd', []); await frame(); await clearEnd(nm + ': steer lifted first, then gas');
  // other order: lift gas first, steer must stay until its own thumb lifts
  await T('touchStart', [[...B, 2]]); await frame(); await T('touchStart', [[...B, 2], [...G, 1]]); await p.waitForTimeout(250); await T('touchEnd', [[...G, 1]]); await frame();
  const a4 = await st(); ok(!a4.gas && a4[k] === 1, 'lift gas first: ' + nm + ' still held ' + JSON.stringify(a4));
  await T('touchEnd', []); await frame(); await clearEnd(nm + ': gas lifted first, then steer');
  // gas held, steer tapped repeatedly (finger ids reused / new ids) -> nothing sticks
  await T('touchStart', [[...G, 1]]); for (let i = 0; i < 4; i++) { await T('touchStart', [[...G, 1], [...B, 10 + i]]); await p.waitForTimeout(60); await T('touchEnd', [[...B, 10 + i]]); await frame(); }
  const a5 = await st(); ok(a5.gas === 1 && !a5[k], nm + ' tapped 4x while gas held: not stuck ' + JSON.stringify(a5)); await T('touchEnd', []); await frame();
}
// 4. iOS gesture cancel (edge swipe / notification pull)
await T('touchStart', [[...R, 3]]); await p.waitForTimeout(250); await T('touchCancel', []); await clearEnd('touchcancel');
// 5. banner + toast + a blocking overlay appear over the button mid-press
await T('touchStart', [[...R, 4]]); await p.waitForTimeout(200);
await p.evaluate(() => { const f = document.getElementById('finallap'); f.style.display = 'block'; const t = document.getElementById('toast'); t.style.display = 'block'; t.textContent = "Kai's Drum Roll! 🎶";
  const r = document.getElementById('br').getBoundingClientRect(), o = document.createElement('div'); o.id = 'blocker'; Object.assign(o.style, { position: 'fixed', left: r.left - 20 + 'px', top: r.top - 20 + 'px', width: r.width + 40 + 'px', height: r.height + 40 + 'px', zIndex: 50, background: 'rgba(255,0,0,.2)' }); document.body.appendChild(o); });
await p.waitForTimeout(200); await T('touchEnd', []); await clearEnd('banner/overlay appeared mid-press');
await p.evaluate(() => { document.getElementById('blocker').remove(); document.getElementById('finallap').style.display = 'none'; });
// 6. finger on ▶ while the HUD goes away (pause with a second finger), resume
await T('touchStart', [[...R, 5]]); await p.waitForTimeout(200); await p.evaluate(() => __tt.pause.pause()); await p.waitForTimeout(100); const s6 = await st(); ok(!s6.r, 'pause while ▶ held releases it');
await p.evaluate(() => __tt.pause.act('presume')); await clearEnd('pause + resume with finger still down'); await T('touchEnd', []);
// 7. blur / visibility / pagehide while held
for (const ev of ['blur', 'visibilitychange', 'pagehide']) { await T('touchStart', [[...R, 6]]); await p.waitForTimeout(100); await p.evaluate(ev => (ev === 'visibilitychange' ? document : window).dispatchEvent(new Event(ev)), ev); const s = await st(); ok(!s.r, ev + ' releases ▶'); await T('touchEnd', []); }
// 8. watchdog: a steer flag left set with no live finger (any future lost-event path) is cleared within ~300 ms
await p.evaluate(() => { __tt.touch.r = 1; }); await p.waitForTimeout(400); await clearEnd('flag set with no finger -> watchdog');
console.log('errs', JSON.stringify(e)); await b.close();
