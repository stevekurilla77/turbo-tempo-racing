// v23 Bayou Jazz Swamp: moonlit misty swamp. Cypress trees dripping moss, stilt shacks with lanterns, a riverboat with a turning
// paddle wheel, a jazz dock bandstand, swamp pools with lily pads and peeking gator eyes, cattails and drifting fireflies.
import { kit, THREE, canvasTex, textPlane } from './scen.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildBayou(ctx) {
  const { scene, P, S, N, W, brassMat } = ctx; const K = kit(ctx, 77), { rnd, add, stage, anim, LM } = K;
  const sky = buildSky(scene, { top: 0x050a18, mid: 0x10243a, horizon: 0x3a5a6a, low: 0x1a2a2a, sunDir: [-500, -60, 300], sunCol: 0x3a5a6a, moonDir: [-260, 230, -520], stars: 1.2,
    skyline: { col: '#0e1c1a', win: '#000', height: 120, draw: (g, w, h) => { g.fillStyle = '#122420'; for (let x = 0; x < w; x += 14 + Math.random() * 30) { const th = 50 + Math.random() * 60, cw = 14 + Math.random() * 16; g.fillRect(x + cw / 2 - 2, h - th, 4, th);
        g.beginPath(); g.ellipse(x + cw / 2, h - th, cw, 7, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + cw / 2 + 4, h - th + 12, cw * .8, 5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(90,110,90,.5)'; for (let k = 0; k < 6; k++) g.fillRect(x + Math.random() * cw * 1.6 - cw * .3, h - th + 4, 1.5, 10 + Math.random() * 18); g.fillStyle = '#122420'; }
      g.fillRect(0, h - 22, w, 22); } },
    clouds: [[0x4a6070, 9, 640, 130, 220]] });
  const M = { trunk: new THREE.MeshLambertMaterial({ color: 0x4a3a2a }), leaf: new THREE.MeshLambertMaterial({ color: 0x2a4a2a }), leaf2: new THREE.MeshLambertMaterial({ color: 0x3a5a30 }), plank: new THREE.MeshLambertMaterial({ color: 0x6a5238 }),
    tin: new THREE.MeshLambertMaterial({ color: 0x7a8288 }), shack: [0x5a7a7a, 0x8a5a4a, 0x7a6a4a, 0x4a6a8a].map(c => new THREE.MeshLambertMaterial({ color: c })), glow: new THREE.MeshBasicMaterial({ color: 0xffc860 }), win: new THREE.MeshBasicMaterial({ color: 0xffb048 }),
    white: new THREE.MeshLambertMaterial({ color: 0xe8e4d8 }), red: new THREE.MeshLambertMaterial({ color: 0xb02a2a }), black: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }), pad: new THREE.MeshLambertMaterial({ color: 0x3a8a3a, side: THREE.DoubleSide }),
    eye: new THREE.MeshBasicMaterial({ color: 0xd8ff40 }), gator: new THREE.MeshLambertMaterial({ color: 0x2a4a28 }), cat: new THREE.MeshLambertMaterial({ color: 0x5a3a1a }), reed: new THREE.MeshLambertMaterial({ color: 0x4a6a2a }),
    suit: [0x2a2a4a, 0x6a2a2a, 0xe8e0c8, 0x2a4a3a].map(c => new THREE.MeshLambertMaterial({ color: c })), skin: [0x5a3a2a, 0x8a5a3a, 0xc89a70, 0x3a2a1a].map(c => new THREE.MeshLambertMaterial({ color: c })) };
  const waterTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#16302e'; g.fillRect(0, 0, w, h); for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${120 + Math.random() * 80},${160 + Math.random() * 60},${150 + Math.random() * 40},${.08 + Math.random() * .15})`; g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 20, 1.5); }
    g.fillStyle = 'rgba(60,110,50,.35)'; for (let k = 0; k < 25; k++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, 7); g.fill(); } }, true);
  waterTex.repeat.set(4, 4); const waterM = new THREE.MeshLambertMaterial({ map: waterTex, emissive: 0x08161a }); anim.push((dt, t) => waterTex.offset.set(t * .006, Math.sin(t * .2) * .03));
  const A = K.atlas([
    ['moss', 128, 256, (g, x, y, w, h) => { for (let k = 0; k < 40; k++) { const sx = x + 6 + Math.random() * (w - 12), len = h * (.35 + Math.random() * .6); g.strokeStyle = `rgba(${130 + Math.random() * 40},${150 + Math.random() * 30},${110 + Math.random() * 30},.9)`; g.lineWidth = 2 + Math.random() * 3; g.beginPath(); g.moveTo(sx, y); g.quadraticCurveTo(sx + (Math.random() - .5) * 20, y + len / 2, sx + (Math.random() - .5) * 12, y + len); g.stroke(); } }],
    ['jazz', 768, 160, (g, x, y, w, h) => { g.fillStyle = '#2a1a3a'; g.fillRect(x, y, w, h); g.strokeStyle = '#ffc860'; g.lineWidth = 8; g.strokeRect(x + 8, y + 8, w - 16, h - 16); g.fillStyle = '#ffc860'; g.font = 'italic bold 72px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪ Jazz Dock ♪', x + w / 2, y + h / 2 + 4); }],
    ['belle', 768, 128, (g, x, y, w, h) => { g.fillStyle = '#f0e8d8'; g.fillRect(x, y, w, h); g.fillStyle = '#8a1a1a'; g.font = 'bold 76px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BAYOU BELLE', x + w / 2, y + h / 2 + 4); }],
    ['gumbo', 512, 128, K.textSign('GUMBO & GROOVES', '#1a3a2a', '#ffc860', 'bold 52px Georgia, serif', '#ffc860')],
    ['bait', 512, 128, K.textSign('BAIT · BRASS · BEIGNETS', '#6a2a1a', '#fff', 'bold 40px Georgia, serif')],
    ['slow', 512, 128, K.textSign('GATORS AHEAD ~ HONK!', '#ffd34d', '#1a1a1a', 'bold 44px Arial Black')],
  ]);
  let nB = 0;
  // ---------- swamp pools (dark water, lily pads, gator eyes) ----------
  const eyes = [];
  const pond = (x, z, r) => { nB++; const w = add(new THREE.CircleGeometry(1, 24), waterM, x, .03, z, 0, stage, -PI / 2); w.scale.set(r, r * (.6 + rnd() * .4), 1);
    for (let k = 0; k < 6 + r / 3; k++) { const a = rnd() * PI * 2, d = rnd() * r * .7; add(new THREE.CircleGeometry(.7 + rnd() * .8, 9, .3, PI * 1.8), M.pad, x + Math.cos(a) * d, .08, z + Math.sin(a) * d * .7, 0, stage, -PI / 2, rnd() * 6); }
    if (rnd() < .7) { const g = new THREE.Group(); g.position.set(x + (rnd() - .5) * r * .6, 0, z + (rnd() - .5) * r * .4); g.rotation.y = rnd() * PI * 2; scene.add(g); const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, .35, 2.4), M.gator); head.position.y = .1; g.add(head);
      for (const sx of [-.35, .35]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.16, 6, 5), M.eye); e.position.set(sx, .32, -.6); g.add(e); } eyes.push([g, rnd() * 6]); } };
  K.scatter(220, [K.bbox[0] - 80, K.bbox[1] + 80, K.bbox[2] - 80, K.bbox[3] + 80], 12, (x, z) => { if (nB > 14) return; const r = 10 + rnd() * 14; if (!K.free(x, z, r * .9, 3)) return; K.taken.push([x, z, r]); pond(x, z, r); });
  anim.push((dt, t) => eyes.forEach(([g, ph]) => { const c = (t * .25 + ph) % 6; g.position.y = c < 3 ? -.05 + Math.sin(t * 1.2 + ph) * .04 : -.6; g.rotation.y += dt * .05; }));
  // ---------- cypress trees with spanish moss ----------
  const cypress = (x, z, h) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rnd() * PI * 2; stage.add(g);
    add(new THREE.CylinderGeometry(.5, 1.6, 3, 8), M.trunk, 0, 1.5, 0, 0, g); add(new THREE.CylinderGeometry(.35, .5, h - 3, 7), M.trunk, 0, 3 + (h - 3) / 2, 0, 0, g);
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + rnd(); add(new THREE.ConeGeometry(.3, 1.2, 5), M.trunk, Math.cos(a) * 2.4, .5, Math.sin(a) * 2.4, 0, g); } // knees
    for (let k = 0; k < 3; k++) { const y = h * (.65 + k * .14), r = 4.2 - k * .9; add(new THREE.CylinderGeometry(r * .7, r, 1.4, 9), k % 2 ? M.leaf2 : M.leaf, (rnd() - .5) * 1.5, y, (rnd() - .5) * 1.5, 0, g);
      for (let m = 0; m < 3; m++) { const a = m / 3 * PI * 2 + k; A.plane('moss', 1.6, 3.4, Math.cos(a) * r * .75, y - 2.2, Math.sin(a) * r * .75, a, g); } } };
  K.roadside(9, W / 2 + 11, 3, (x, z) => cypress(x, z, 12 + rnd() * 8), .75);
  K.scatter(260, [K.bbox[0] - 110, K.bbox[1] + 110, K.bbox[2] - 110, K.bbox[3] + 110], 3.5, (x, z) => cypress(x, z, 13 + rnd() * 10));
  // ---------- stilt shacks with lanterns ----------
  const shack = (s) => { nB++; const g = K.at(s), m = M.shack[Math.floor(rnd() * 4)];
    for (const [px, pz] of [[-3, -2.5], [3, -2.5], [-3, 2.5], [3, 2.5], [-3, 4.5], [3, 4.5]]) add(new THREE.CylinderGeometry(.2, .2, 3), M.plank, px, 1.5, pz, 0, g);
    add(new THREE.BoxGeometry(7, .3, 8), M.plank, 0, 3, 1, 0, g); add(new THREE.BoxGeometry(6, 3.6, 5), m, 0, 4.9, -.5, 0, g);
    for (const sd of [-1, 1]) add(new THREE.BoxGeometry(3.8, .15, 6), M.tin, sd * 1.7, 7.3, -.5, 0, g, 0, sd * -.45);
    add(new THREE.PlaneGeometry(1.2, 1), M.win, -1.6, 5.2, 2.02, 0, g); add(new THREE.PlaneGeometry(1.1, 2), M.black, 1.2, 4.1, 2.02, 0, g);
    add(new THREE.CylinderGeometry(.05, .05, 1.6), M.black, 2.8, 4.6, 3.8, 0, g); add(new THREE.SphereGeometry(.35, 8, 6), M.glow, 2.8, 5.5, 3.8, 0, g);
    add(new THREE.BoxGeometry(1.2, .8, .8), M.plank, -2, 3.5, 3.8, 0, g); if (rnd() < .6) A.plane(rnd() < .5 ? 'gumbo' : 'bait', 5, 1.25, 0, 3.6, 5.05, 0, g); };
  for (let k = 0; k < 9; k++) { const s = K.site(Math.floor(N * (k + .3) / 9), k % 2 ? 1 : -1, W / 2 + 15, 6); if (s) shack(s); }
  // ---------- riverboat on the biggest open water ----------
  { let best = null; for (let k = 0; k < 500; k++) { const x = K.bbox[0] - 60 + rnd() * (K.bbox[1] - K.bbox[0] + 120), z = K.bbox[2] - 60 + rnd() * (K.bbox[3] - K.bbox[2] + 120); if (!K.free(x, z, 20, 4)) continue; const c = K.clear(x, z); if (c > 62) continue; if (!best || c > best[2]) best = [x, z, c]; }
    if (best) { nB++; const [x, z] = best; K.taken.push([x, z, 26]); LM.riverboat = [Math.round(x), Math.round(z)]; const w = add(new THREE.CircleGeometry(1, 28), waterM, x, .04, z, 0, stage, -PI / 2); w.scale.set(28, 20, 1);
      const boat = new THREE.Group(); boat.position.set(x, 0, z); boat.rotation.y = Math.atan2(K.center[0] - x, K.center[1] - z) + PI / 2; scene.add(boat);
      const hull = new THREE.Mesh(new THREE.BoxGeometry(8, 1.6, 22), M.white); hull.position.y = .6; boat.add(hull); const h2 = new THREE.Mesh(new THREE.BoxGeometry(7, 2.4, 16), M.white); h2.position.set(0, 2.6, 1); boat.add(h2);
      const h3 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2, 9), M.white); h3.position.set(0, 4.8, 2); boat.add(h3); const trim = new THREE.Mesh(new THREE.BoxGeometry(7.2, .3, 16.2), M.red); trim.position.set(0, 3.9, 1); boat.add(trim);
      for (let k = 0; k < 6; k++) for (const sx of [-3.52, 3.52]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1), M.win); wn.position.set(sx, 2.8, -5 + k * 2.4); wn.rotation.y = sx > 0 ? PI / 2 : -PI / 2; boat.add(wn); }
      for (const sx of [-1.4, 1.4]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, 7, 10), M.black); st.position.set(sx, 9, -2); boat.add(st); const cr = new THREE.Mesh(new THREE.CylinderGeometry(.9, .6, .6, 10), M.black); cr.position.set(sx, 12.6, -2); boat.add(cr); }
      for (const sx of [-1, 1]) { const nm = new THREE.Mesh(textPlane(A.tex, 6, 1, A.R.belle), A.mat); nm.position.set(sx * 4.05, 1.1, 0); nm.rotation.y = sx * PI / 2; boat.add(nm); }
      const wheel = new THREE.Group(); wheel.position.set(0, 2.2, 12.5); boat.add(wheel); const hub = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 7, 10), M.red); hub.rotation.z = PI / 2; wheel.add(hub);
      for (let k = 0; k < 8; k++) { const pd = new THREE.Mesh(new THREE.BoxGeometry(6.6, .25, 2.6), M.red); const a = k / 8 * PI * 2; pd.position.set(0, Math.cos(a) * 2.4, Math.sin(a) * 2.4); pd.rotation.x = -a; wheel.add(pd); }
      const smoke = []; for (let k = 0; k < 6; k++) { const sm = new THREE.Mesh(new THREE.SphereGeometry(.9, 7, 5), new THREE.MeshBasicMaterial({ color: 0x8a9aa0, transparent: true, opacity: .35, depthWrite: false })); boat.add(sm); smoke.push(sm); }
      anim.push((dt, t) => { wheel.rotation.x -= dt * 1.4; boat.position.y = Math.sin(t * .8) * .12; boat.rotation.z = Math.sin(t * .6) * .015; smoke.forEach((m, k) => { const u = (t * .3 + k / 6) % 1; m.position.set((k % 2 ? 1.4 : -1.4) + u * 2, 13 + u * 7, -2 - u * 3); m.scale.setScalar(.6 + u * 1.6); m.material.opacity = .35 * (1 - u); }); }); } }
  // ---------- jazz dock bandstand ----------
  { const s = K.site(Math.floor(N * .08), -1, W / 2 + 18, 11, 'jazzDock') || K.site(Math.floor(N * .55), 1, W / 2 + 18, 11, 'jazzDock'); if (s) { nB++; const g = K.at(s);
      const w = add(new THREE.CircleGeometry(1, 20), waterM, 0, .04, -6, 0, g, -PI / 2); w.scale.set(14, 9, 1);
      add(new THREE.BoxGeometry(14, .4, 10), M.plank, 0, 1, -3, 0, g); for (const [px, pz] of [[-6.5, -7.5], [6.5, -7.5], [-6.5, 1.5], [6.5, 1.5]]) { add(new THREE.CylinderGeometry(.25, .25, 7), M.white, px, 4, pz, 0, g); add(new THREE.SphereGeometry(.3, 8, 6), M.glow, px, 7.6, pz, 0, g); }
      add(new THREE.ConeGeometry(10, 3, 8), M.red, 0, 8.6, -3, PI / 8, g); A.plane('jazz', 9, 1.9, 0, 6.3, 1.6, 0, g);
      const band = []; const horns = [[new THREE.CylinderGeometry(.08, .12, 1.4, 8), M.black], [new THREE.CylinderGeometry(.1, .35, 1.4, 8), brassMat], [new THREE.TorusGeometry(.7, .18, 8, 16), brassMat], [new THREE.CylinderGeometry(.06, .25, 1.1, 8), brassMat]];
      for (let k = 0; k < 4; k++) { const b = new THREE.Group(); b.position.set(-4.5 + k * 3, 1.2, -4 + (k % 2) * .8); g.add(b); add(new THREE.CylinderGeometry(.45, .55, 1.9, 8), M.suit[k], 0, 1, 0, 0, b); add(new THREE.SphereGeometry(.42, 10, 8), M.skin[k], 0, 2.3, 0, 0, b);
        add(new THREE.CylinderGeometry(.5, .5, .12, 10), M.black, 0, 2.7, 0, 0, b); const hn = add(horns[k][0], horns[k][1], 0, 1.4, .6, 0, b, k === 2 ? 0 : -.9); band.push(b); }
      anim.push((dt, t) => band.forEach((b, k) => { b.rotation.z = Math.sin(t * 4.3 + k * 1.3) * .08; b.position.y = 1.2 + Math.abs(Math.sin(t * 4.3 + k)) * .15; })); } }
  // ---------- cattails, lantern posts, warning signs ----------
  K.roadside(5, W / 2 + 8.5, 1.2, (x, z) => { for (let k = 0; k < 5; k++) { const ox = (rnd() - .5) * 2, oz = (rnd() - .5) * 2, h = 1.6 + rnd() * 1.4; add(new THREE.CylinderGeometry(.04, .05, h, 4), M.reed, x + ox, h / 2, z + oz); if (k % 2 === 0) add(new THREE.CylinderGeometry(.14, .14, .6, 6), M.cat, x + ox, h + .1, z + oz); } }, .55);
  K.roadside(24, W / 2 + 9.5, 1, (x, z) => { add(new THREE.CylinderGeometry(.12, .15, 4.2, 6), M.plank, x, 2.1, z); add(new THREE.BoxGeometry(.9, .2, .2), M.plank, x + .4, 4.1, z); add(new THREE.SphereGeometry(.32, 8, 6), M.glow, x + .8, 3.7, z); }, .9);
  K.roadside(70, W / 2 + 10, 2, (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); for (const px of [-2, 2]) add(new THREE.BoxGeometry(.2, 2.6, .2), M.plank, px, 1.3, 0, 0, g); A.plane('slow', 5, 1.25, 0, 2.2, .12, 0, g); }, .7);
  // fireflies + low mist
  K.motes(160, [K.bbox[0] - 40, K.bbox[1] + 40, K.bbox[2] - 40, K.bbox[3] + 40], 1, 7, 0xd8ff6a, 1.1);
  const mistM = new THREE.MeshBasicMaterial({ color: 0x8aaaa8, transparent: true, opacity: .22, depthWrite: false, map: canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }); const mist = [];
  for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), mistM); m.rotation.x = -PI / 2; m.position.set(K.center[0] + (rnd() - .5) * 200, 1.3 + k * .4, K.center[1] + (rnd() - .5) * 200); scene.add(m); mist.push([m, rnd() * 6]); }
  anim.push((dt, t) => mist.forEach(([m, ph]) => { m.position.x += Math.sin(t * .05 + ph) * dt * 1.5; }));
  const baked = K.bake();
  return { stats: { buildings: nB, bakedMeshes: baked.length, landmarks: LM }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); } };
}
