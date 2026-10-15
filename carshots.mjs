import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs=[];
p.on('pageerror',e=>errs.push(''+e)); p.on('console',m=>(m.type()==='error'||m.type()==='warning')&&errs.push(m.text()));
await p.goto('http://127.0.0.1:8787/?cb='+Date.now()); await p.waitForTimeout(1200);
await p.evaluate(()=>document.getElementById('go').click());
await p.waitForFunction(()=>__tt.race.state==='race',null,{timeout:30000});
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(3000);
await p.screenshot({path:'shots/v11-race-behind.png'});
await p.keyboard.up('ArrowUp'); await p.waitForTimeout(2500);
// showcase: orbit 3/4 front view (car's local frame via heading)
await p.evaluate(()=>{ const h=__tt.player.h, f=[Math.sin(h),Math.cos(h)], r=[Math.cos(h),-Math.sin(h)]; __tt.camOverride=[f[0]*5.5+r[0]*4.2, 2.4, f[1]*5.5+r[1]*4.2]; document.getElementById('hud').style.display='none'; });
await p.waitForTimeout(400); await p.screenshot({path:'shots/v11-car-front34.png'});
await p.evaluate(()=>{ const h=__tt.player.h, f=[Math.sin(h),Math.cos(h)], r=[Math.cos(h),-Math.sin(h)]; __tt.camOverride=[-f[0]*5.5-r[0]*4, 2.2, -f[1]*5.5-r[1]*4]; });
await p.waitForTimeout(400); await p.screenshot({path:'shots/v11-car-rear34.png'});
console.log('errs',errs, await p.evaluate(()=>__tt.errors)); await b.close();
