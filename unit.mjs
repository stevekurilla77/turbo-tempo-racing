import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage(); const errs = [];
p.on('pageerror', e => errs.push('' + e)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
await p.goto((process.argv[2] || 'http://127.0.0.1:8787/') + '?speed=0.0001&autostart&v=' + Date.now()); // freeze real-time loop; we step manually
await p.waitForFunction(() => __tt.race && __tt.race.state === 'count');
const r = await p.evaluate(() => {
  const t = __tt, pl = t.player, tc = t.touch, out = {};
  const run = (sec, f) => { for (let k = 0; k < sec * 60; k++) { f && f(); t.sim(1 / 60); } };
  run(4.2); out.state = t.race.state;
  tc.gas = 1; run(2.5); out.vAfterGas = +pl.v.toFixed(1);
  // drift through the right bend: steer in to start, ease to neutral, counter-steer near exit, release
  const place = i => { pl.idx = i; pl.x = t.P[i].x; pl.z = t.P[i].z; pl.h = pl.vh = Math.atan2(t.T[i].x, t.T[i].z); pl.v = 40; pl.px = pl.pz = 0; pl.hitT = 9; };
  place(203); tc.r = 1; run(.15); tc.drift = 1; run(.25); out.drifting = pl.drift; tc.r = 0;
  let maxTier = 0; run(1.6, () => { maxTier = Math.max(maxTier, pl.tier); tc.l = pl.lat > 2 ? 1 : 0; tc.r = pl.lat < -2 ? 1 : 0; if (maxTier >= 2 || (maxTier >= 1 && Math.abs(pl.lat) > 9)) tc.drift = 0; });
  tc.drift = 0; tc.l = tc.r = 0; run(.05);
  out.maxTier = maxTier; out.boostAfter = +pl.boost.toFixed(2); out.driftBoosts = t.race.stats.driftBoosts.slice();
  // jump: drive onto piano ramp at speed, tap dash in air (flip)
  place(140); pl.lat = 0; let air = false, flipped = false; run(2, () => { if (pl.air && !air) { air = true; tc.dashPress = 1; } if (pl.trick > 0) flipped = true; });
  out.jumped = air; out.flip = flipped; out.tricks = t.race.stats.tricks; out.landedBoost = +pl.boost.toFixed(2);
  // drum pad bounce
  { const i = 520; place(i - 8); const S = [-t.T[i].z, t.T[i].x]; pl.x += S[0] * -4; pl.z += S[1] * -4; let a2 = false; run(1.2, () => { if (pl.air) a2 = true; }); out.padBounce = a2; }
  // alley: aim into the mouth
  { place(258); const st0 = t.race.stats.alley; let inA = false; const tgt = () => { }; run(6, () => { if (pl.alley) inA = true;
      const A = t.P[265], B = t.P[340]; const tt = inA ? 1.1 : .2; const tx = A.x + (B.x - A.x) * tt, tz = A.z + (B.z - A.z) * tt; const d = Math.atan2(tx - pl.x, tz - pl.z) - pl.h; const dd = Math.atan2(Math.sin(d), Math.cos(d)); tc.r = dd < -.05 ? 1 : 0; tc.l = dd > .05 ? 1 : 0; });
    tc.l = tc.r = 0; out.alleyEntered = inA; out.alleyExits = t.race.stats.alley - st0; }
  // band meter: high after style, drops on crash
  out.band = +t.race.band.toFixed(2); t.race.band = .9; const s = t.stands[0]; t.stands.forEach(x => x.down = 0); place(98); pl.v = 20; pl.hitT = 9; pl.x = s.x; pl.z = s.z; pl.y = 0; pl.air = false; run(.05); out.bandAfterCrash = +t.race.band.toFixed(2);
  out.aiMoves = t.race.stats.aiMoves; out.errors = t.errors.slice();
  return out;
});
console.log(JSON.stringify(r)); console.log('errs', errs); await b.close();
