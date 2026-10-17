// perf: draw calls / triangles / FPS while racing (autopilot), laptop + iPhone sizes. Headless SwiftShader = CPU rendering, so FPS is only useful as a before/after comparison.
import { chromium } from 'playwright';
const TQ = process.env.TRK ? `track=${process.env.TRK}&` : '', PRE = process.env.PRE || 'shots/v20-';
const EXE = '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const base = process.argv[2] || 'http://127.0.0.1:8787/', tag = process.argv[3] || '';
for (const [name, opt] of [['laptop', { viewport: { width: 1280, height: 720 } }], ['iphone', { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
  const ctx = await b.newContext(opt), p = await ctx.newPage(); const e = []; p.on('pageerror', x => e.push(String(x)));
  await p.goto(base + '?' + TQ + 'autopilot&autostart&car=trombone&cb=' + Date.now()); await p.waitForFunction(() => __tt.race.state === 'race', null, { timeout: 30000 }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => new Promise(res => { const inf = __tt.renderer.info; let n = 0, calls = 0, tris = 0, maxC = 0; const t0 = performance.now(); let worst = 0, last = t0;
    const f = (now) => { n++; calls += inf.render.calls; tris += inf.render.triangles; maxC = Math.max(maxC, inf.render.calls); worst = Math.max(worst, now - last); last = now; if (now - t0 < 10000) requestAnimationFrame(f); else res({ fps: +(n / ((now - t0) / 1000)).toFixed(1), avgCalls: Math.round(calls / n), maxCalls: maxC, avgTris: Math.round(tris / n), worstFrameMs: Math.round(worst), geometries: inf.memory.geometries, textures: inf.memory.textures }); };
    requestAnimationFrame(f); }));
  console.log(tag, name, JSON.stringify(r), 'errs', e.length); await ctx.close();
}
await b.close();
