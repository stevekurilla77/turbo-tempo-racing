// v22 Splash Tempo Water Park: sunny day. Wave pool + splash pools with animated water, a slide tower with helix tubes,
// palms, striped umbrellas + loungers, a tipping bucket, a steel-pan beach stage, lifeguard chairs and bouncing beach balls.
import { kit, THREE, canvasTex } from './scen.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildWaterPark(ctx) {
  const { scene, P, S, N, W, ALLEY_A, ALLEY_B } = ctx; const K = kit(ctx, 53), { rnd, add, stage, anim, LM } = K;
  const sky = buildSky(scene, { top: 0x2a7ae0, mid: 0x5ab0f0, horizon: 0xc8ecff, low: 0xe8f4f0, sunDir: [400, 260, -500], sunCol: 0xfff4c0, sunSize: 1.2, stars: 0,
    skyline: { col: '#5a9a7a', win: '#fff', height: 90, draw: (g, w, h) => { g.fillStyle = '#7ab8a0'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 32) g.lineTo(x, h - 30 - Math.sin(x / 90) * 18 - Math.sin(x / 23) * 6); g.lineTo(w, h); g.fill();
      for (let k = 0; k < 26; k++) { const x = Math.random() * w, y = h - 40 - Math.random() * 25, s = 8 + Math.random() * 10; g.strokeStyle = '#3a6a4a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, h - 20); g.quadraticCurveTo(x + 4, y + s, x + 2, y); g.stroke(); g.fillStyle = '#3a7a4a';
        for (let f = 0; f < 6; f++) { const a = f / 6 * PI * 2; g.beginPath(); g.ellipse(x + 2 + Math.cos(a) * s * .6, y + Math.sin(a) * s * .3, s * .7, 2.5, a, 0, 7); g.fill(); } }
      for (let k = 0; k < 5; k++) { const x = 100 + k * 200 + Math.random() * 60; g.strokeStyle = ['#ff5a8a', '#ffd34d', '#40d8ff', '#7aff8a', '#ff8a3a'][k]; g.lineWidth = 5; g.beginPath(); for (let a = 0; a < 14; a += .3) g.lineTo(x + Math.cos(a) * 12, h - 95 + a * 5); g.stroke(); } } },
    clouds: [[0xffffff, 14, 640, 150, 240], [0xf0f8ff, 8, 700, 90, 140]] });
  const M = { white: new THREE.MeshLambertMaterial({ color: 0xf8f8f8 }), tile: new THREE.MeshLambertMaterial({ color: 0xe8f8ff }), deck: new THREE.MeshLambertMaterial({ color: 0xf0e0b8 }), trunk: new THREE.MeshLambertMaterial({ color: 0x9a7048 }),
    red: new THREE.MeshLambertMaterial({ color: 0xff5a4a }), yellow: new THREE.MeshLambertMaterial({ color: 0xffd34d }), aqua: new THREE.MeshLambertMaterial({ color: 0x40c8e8 }), pink: new THREE.MeshLambertMaterial({ color: 0xff6aa8 }),
    green: new THREE.MeshLambertMaterial({ color: 0x5ad86a }), orange: new THREE.MeshLambertMaterial({ color: 0xff9a3a }), steel: new THREE.MeshLambertMaterial({ color: 0xc8ccd8 }), pan: new THREE.MeshPhongMaterial({ color: 0xd8dce8, specular: 0xffffff, shininess: 80 }),
    wood: new THREE.MeshLambertMaterial({ color: 0xc89a5a }), skin: [0x8a5a3a, 0xe8b890, 0xc08a5a, 0x5a3a2a].map(c => new THREE.MeshLambertMaterial({ color: c })) };
  // animated water: one canvas texture shared by every pool, scrolled each frame
  const waterTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2ab8e8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2.5;
    for (let k = 0; k < 40; k++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 10, y - 8, x + 24, y + 8, x + 34, y - 2); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 60; k++) g.fillRect(Math.random() * w, Math.random() * h, 6, 2); }, true);
  const waterM = new THREE.MeshLambertMaterial({ map: waterTex, emissive: 0x0a3a50 }); waterTex.repeat.set(3, 3);
  anim.push((dt, t) => { waterTex.offset.set(Math.sin(t * .3) * .08, t * .03); });
  const A = K.atlas([
    ['frond', 256, 64, (g, x, y, w, h) => { g.fillStyle = '#3aa040'; g.beginPath(); g.moveTo(x + 4, y + h / 2); g.quadraticCurveTo(x + w / 2, y - 8, x + w - 4, y + h / 2 + 6); g.quadraticCurveTo(x + w / 2, y + h + 4, x + 4, y + h / 2); g.fill(); g.strokeStyle = '#2a7a30'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 4, y + h / 2); g.lineTo(x + w - 6, y + h / 2 + 4); g.stroke();
      g.strokeStyle = '#1a1a1a'; g.globalAlpha = .0; }],
    ['park', 1024, 256, (g, x, y, w, h) => { const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#40d8ff'); gr.addColorStop(1, '#1a6ad8'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.strokeStyle = '#fff'; g.lineWidth = 10; g.strokeRect(x + 8, y + 8, w - 16, h - 16);
      g.fillStyle = '#ffd34d'; g.font = 'bold 96px Arial Black, Impact'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SPLASH TEMPO', x + w / 2, y + 100); g.fillStyle = '#fff'; g.font = 'bold 54px Arial Black'; g.fillText('〰 WATER PARK 〰', x + w / 2, y + 190); }],
    ['stage', 768, 128, K.textSign('STEEL PAN STAGE ♪', '#ff6a3a', '#fff', 'bold 60px Arial Black, Impact', '#ffd34d')],
    ['wave', 512, 128, K.textSign('WAVE POOL', '#1a6ad8', '#fff', 'bold 70px Arial Black, Impact', '#40d8ff')],
    ['slide', 512, 128, K.textSign('TEMPO TWISTER', '#ff5a8a', '#fff', 'bold 58px Arial Black, Impact', '#fff')],
    ['splash', 512, 128, K.textSign('SPLASH ZONE!', '#ffd34d', '#1a3a8a', 'bold 64px Arial Black, Impact')],
    ['guard', 256, 128, K.textSign('LIFEGUARD', '#ff3a3a', '#fff', 'bold 40px Arial Black')],
    ['flamingo', 128, 192, (g, x, y) => { g.fillStyle = '#ff7ab0'; g.beginPath(); g.ellipse(x + 64, y + 80, 34, 22, -.2, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#ff7ab0'; g.beginPath(); g.moveTo(x + 90, y + 70); g.quadraticCurveTo(x + 120, y + 30, x + 92, y + 14); g.stroke();
      g.fillStyle = '#ff7ab0'; g.beginPath(); g.arc(x + 90, y + 14, 10, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.moveTo(x + 98, y + 12); g.lineTo(x + 112, y + 22); g.lineTo(x + 98, y + 20); g.fill(); g.strokeStyle = '#e85a90'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 60, y + 100); g.lineTo(x + 60, y + 188); g.moveTo(x + 70, y + 100); g.lineTo(x + 76, y + 150); g.lineTo(x + 62, y + 160); g.stroke(); }],
  ]);
  const stripeTex = (a, b, n = 8) => canvasTex(128, 16, (g, w, h) => { for (let k = 0; k < n; k++) { g.fillStyle = k % 2 ? a : b; g.fillRect(k * w / n, 0, w / n + 1, h); } });
  const umbM = [['#ff5a4a', '#fff'], ['#40c8e8', '#fff'], ['#ffd34d', '#ff6aa8'], ['#5ad86a', '#fff']].map(([a, b]) => new THREE.MeshLambertMaterial({ map: stripeTex(a, b), side: THREE.DoubleSide }));
  const ballM = new THREE.MeshLambertMaterial({ map: canvasTex(128, 64, (g, w, h) => { ['#ff3a3a', '#fff', '#ffd34d', '#fff', '#3a8aff', '#fff'].forEach((c, k) => { g.fillStyle = c; g.fillRect(k * w / 6, 0, w / 6 + 1, h); }); }) });
  let nB = 0;
  // ---------- pools ----------
  const pool = (x, z, rx, rz, ry, label) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); nB++;
    add(new THREE.CylinderGeometry(1, 1, .5, 28), M.tile, 0, .1, 0, 0, g).scale.set(rx + 2.2, 1, rz + 2.2); add(new THREE.CylinderGeometry(1, 1, .55, 28), M.white, 0, .12, 0, 0, g).scale.set(rx + .7, 1, rz + .7);
    const w = add(new THREE.CircleGeometry(1, 28), waterM, 0, .42, 0, 0, g, -PI / 2); w.scale.set(rx, rz, 1);
    if (label) { for (const px of [-4, 4]) add(new THREE.BoxGeometry(.25, 4, .25), M.steel, px, 2, -rz - 2.4, 0, g); A.plane(label, 9, 2.25, 0, 4.4, -rz - 2.4, 0, g); }
    // ladders + lounge chairs + umbrellas round the deck
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + .3, px = Math.cos(a) * (rx + 4.5), pz = Math.sin(a) * (rz + 4.5); if (k % 2) { add(new THREE.BoxGeometry(1.2, .35, 3), M.white, px, .4, pz, -a, g); add(new THREE.BoxGeometry(1.2, .3, 1.2), M.white, px + Math.cos(a) * 1.2, .8, pz + Math.sin(a) * 1.2, -a, g, 0, 0); }
      else { add(new THREE.CylinderGeometry(.08, .08, 3.4), M.steel, px, 1.7, pz, 0, g); add(new THREE.ConeGeometry(2.4, .9, 8, 1, true), umbM[k % 4], px, 3.6, pz, 0, g); } }
    return g; };
  const ctr = K.center;
  // big wave pool in the infield, then smaller splash pools wherever there is room
  { let best = null; for (let k = 0; k < 400; k++) { const x = K.bbox[0] + rnd() * (K.bbox[1] - K.bbox[0]), z = K.bbox[2] + rnd() * (K.bbox[3] - K.bbox[2]); const c = K.clear(x, z); if (!K.free(x, z, 14, 4) || !K.inside(x, z)) continue; if (!best || c > best[2]) best = [x, z, c]; }
    if (best) { const r = Math.min(30, best[2] - W / 2 - 10); K.taken.push([best[0], best[1], r + 5]); const g = pool(best[0], best[1], r, r * .7, rnd() * PI, 'wave'); LM.wavePool = [Math.round(best[0]), Math.round(best[1]), Math.round(r)];
      // rolling waves: a few long white crests that sweep across
      const crestM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55, depthWrite: false }); const crests = [];
      for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.2, .8), crestM); c.rotation.x = -PI / 2; g.add(c); crests.push(c); }
      anim.push((dt, t) => crests.forEach((c, k) => { const u = ((t * .12 + k / 4) % 1) * 2 - 1; c.position.set(0, .5, u * r * .62); c.scale.x = Math.sqrt(Math.max(.05, 1 - u * u)); })); } }
  K.scatter(60, [K.bbox[0] - 30, K.bbox[1] + 30, K.bbox[2] - 30, K.bbox[3] + 30], 10, (x, z, k) => { if (nB > 9) return; K.taken.push([x, z, 12]); pool(x, z, 6 + rnd() * 4, 5 + rnd() * 3, rnd() * PI, nB === 2 ? 'splash' : null); });
  // ---------- slide tower (Tempo Twister) next to the slide shortcut ----------
  { const a = P[ALLEY_A], b = P[ALLEY_B], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2; let s = null; for (const [i, sd] of [[ALLEY_A - 8, 1], [ALLEY_A - 8, -1], [ALLEY_B + 8, 1], [ALLEY_B + 8, -1]]) { s = K.site(i, sd, W / 2 + 18, 10, 'tower'); if (s) break; }
    if (s) { nB++; const g = K.at(s), H = 26; for (const [px, pz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) add(new THREE.BoxGeometry(.6, H, .6), M.yellow, px, H / 2, pz, 0, g);
      for (let y = 6; y <= H; y += 6.5) add(new THREE.BoxGeometry(7.4, .5, 7.4), M.white, 0, y, 0, 0, g); add(new THREE.ConeGeometry(6, 4, 4), M.red, 0, H + 2, 0, PI / 4, g); A.plane('slide', 8, 2, 0, H - 3, 3.75, 0, g);
      const cols = [M.pink, M.aqua, M.green];
      for (let h = 0; h < 3; h++) { const pts = []; const R = 7 + h * 1.5, turns = 2 + h * .5, ph = h * 2.1; for (let k = 0; k <= 60; k++) { const u = k / 60, a2 = ph + u * turns * PI * 2; pts.push(new THREE.Vector3(Math.cos(a2) * R, H - 2 - u * (H - 3) - h * 2, Math.sin(a2) * R)); }
        const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .9 + .2 * (h === 1), 8), cols[h]); g.add(tube); }
      const splash = add(new THREE.CylinderGeometry(1, 1, .4, 20), waterM, 0, .35, 0, 0, g); splash.scale.set(10, 1, 10); add(new THREE.CylinderGeometry(1, 1, .3, 20), M.white, 0, .15, 0, 0, g).scale.set(11, 1, 11);
      // riders zooming down the helix
      const riders = []; for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.7, 8, 6), [M.red, M.yellow, M.orange][k]); g.add(m); riders.push(m); }
      anim.push((dt, t) => riders.forEach((m, k) => { const u = (t * .12 + k * .33) % 1, h = k, R = 7 + h * 1.5, a2 = h * 2.1 + u * (2 + h * .5) * PI * 2; m.position.set(Math.cos(a2) * R, H - 2 - u * (H - 3) - h * 2 + 1, Math.sin(a2) * R); })); } }
  // ---------- tipping bucket ----------
  { const s = K.site(Math.floor(N * .45), -1, W / 2 + 22, 8, 'bucket') || K.site(Math.floor(N * .7), 1, W / 2 + 22, 8, 'bucket'); if (s) { nB++; const g = K.at(s);
      for (const [px, pz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) add(new THREE.CylinderGeometry(.35, .35, 14), M.aqua, px, 7, pz, 0, g); add(new THREE.BoxGeometry(9, .6, .6), M.yellow, 0, 14, 0, 0, g);
      const piv = new THREE.Group(); piv.position.set(0, 13, 0); g.add(piv); const bk = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.8, 3, 14, 1, true), M.red); bk.material = M.red; bk.position.y = -2; piv.add(bk);
      const pour = new THREE.Mesh(new THREE.CylinderGeometry(1, 3, 12, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: .55, depthWrite: false })); pour.position.set(0, 6, 0); g.add(pour);
      add(new THREE.CylinderGeometry(1, 1, .3, 20), waterM, 0, .3, 0, 0, g).scale.set(6, 1, 6);
      anim.push((dt, t) => { const c = t % 9, tip = c > 7.6 ? Math.sin((c - 7.6) / 1.4 * PI) : 0; piv.rotation.z = tip * 1.9; pour.visible = tip > .55; pour.scale.y = .8 + Math.sin(t * 20) * .05; }); } }
  // ---------- steel pan stage ----------
  { const s = K.site(Math.floor(N * .12), -1, W / 2 + 22, 12, 'stage') || K.site(Math.floor(N * .85), 1, W / 2 + 22, 12, 'stage'); if (s) { nB++; const g = K.at(s);
      add(new THREE.CylinderGeometry(9, 9, 1, 20, 1, false, -PI / 2, PI), M.wood, 0, .5, -2, 0, g); add(new THREE.CylinderGeometry(9.5, 9.5, 9, 20, 1, true, PI / 2, PI), M.aqua, 0, 4.5, -2, 0, g).material.side = THREE.DoubleSide;
      A.plane('stage', 12, 2, 0, 10, -2, 0, g); const players = [];
      for (let k = 0; k < 4; k++) { const px = -5.4 + k * 3.6, pz = -3.5 + Math.abs(k - 1.5) * .8; add(new THREE.CylinderGeometry(1.1, 1.1, .5, 16), M.pan, px, 2.3, pz + 1.4, 0, g); add(new THREE.CylinderGeometry(.06, .06, 1.2), M.steel, px, 1.6, pz + 1.4, 0, g);
        const body = new THREE.Group(); body.position.set(px, 1, pz); g.add(body); add(new THREE.CylinderGeometry(.5, .6, 1.8, 8), [M.yellow, M.pink, M.green, M.orange][k], 0, 1, 0, 0, body); add(new THREE.SphereGeometry(.45, 10, 8), M.skin[k], 0, 2.3, 0, 0, body); players.push(body); }
      anim.push((dt, t) => players.forEach((b, k) => { b.position.y = 1 + Math.abs(Math.sin(t * 6.7 + k)) * .2; b.rotation.y = Math.sin(t * 3.3 + k) * .3; })); } }
  // big park sign + lifeguard chairs
  { const s = K.site(8, 1, W / 2 + 14, 8, 'sign') || K.site(8, -1, W / 2 + 14, 8); if (s) { const g = K.at(s); for (const px of [-7, 7]) add(new THREE.CylinderGeometry(.4, .4, 9), M.white, px, 4.5, 0, 0, g); A.plane('park', 16, 4, 0, 8, .3, 0, g); } }
  for (const fr of [.3, .62, .9]) { const s = K.site(Math.floor(N * fr), 1, W / 2 + 11, 3) || K.site(Math.floor(N * fr), -1, W / 2 + 11, 3); if (!s) continue; const g = K.at(s);
    for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new THREE.BoxGeometry(.25, 5, .25), M.white, px, 2.5, pz, 0, g); add(new THREE.BoxGeometry(2.4, .3, 2.4), M.white, 0, 5, 0, 0, g); A.plane('guard', 2.4, 1.2, 0, 4.2, 1.15, 0, g);
    add(new THREE.ConeGeometry(2, .7, 8, 1, true), umbM[0], 0, 8, 0, 0, g); add(new THREE.CylinderGeometry(.06, .06, 3), M.steel, 0, 6.5, 0, 0, g); add(new THREE.CylinderGeometry(.4, .45, 1.2, 8), M.red, 0, 5.8, 0, 0, g); add(new THREE.SphereGeometry(.35, 8, 6), M.skin[1], 0, 6.7, 0, 0, g); }
  // ---------- palms + umbrellas + flamingos along the road ----------
  const palm = (x, z, h) => { const lean = (rnd() - .5) * .5, lr = rnd() * PI * 2; let px = x, pz = z, py = 0; for (let k = 0; k < 4; k++) { const seg = h / 4, ox = Math.cos(lr) * Math.sin(lean) * seg * (k + 1) * .5, oz = Math.sin(lr) * Math.sin(lean) * seg * (k + 1) * .5;
      add(new THREE.CylinderGeometry(.42 - k * .06, .5 - k * .06, seg, 7), M.trunk, x + ox, py + seg / 2, z + oz); px = x + ox; pz = z + oz; py += seg; }
    for (let f = 0; f < 7; f++) { const a = f / 7 * PI * 2; const g = new THREE.Group(); g.position.set(px, py, pz); g.rotation.y = a; stage.add(g); A.plane('frond', 6, 1.6, 2.8, -.5, 0, 0, g).rotation.set(-PI / 2 + .2, 0, -.35); }
    add(new THREE.SphereGeometry(.5, 6, 5), M.trunk, px, py - .3, pz); };
  K.roadside(13, W / 2 + 10, 2.5, (x, z) => palm(x, z, 9 + rnd() * 6), .8);
  K.roadside(23, W / 2 + 16, 2, (x, z, ry) => { add(new THREE.CylinderGeometry(.08, .08, 3.4), M.steel, x, 1.7, z); add(new THREE.ConeGeometry(2.4, .9, 8, 1, true), umbM[Math.floor(rnd() * 4)], x, 3.6, z); add(new THREE.BoxGeometry(1.1, .35, 2.8), M.white, x + 1.8, .4, z, ry); }, .7);
  K.roadside(37, W / 2 + 7, 1, (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); A.plane('flamingo', 1.6, 2.4, 0, 1.2, 0, 0, g); }, .6);
  K.scatter(160, [K.bbox[0] - 70, K.bbox[1] + 70, K.bbox[2] - 70, K.bbox[3] + 70], 3, (x, z) => palm(x, z, 10 + rnd() * 8));
  // striped cabanas + snack hut scattered on the sand
  K.scatter(120, [K.bbox[0] - 40, K.bbox[1] + 40, K.bbox[2] - 40, K.bbox[3] + 40], 4, (x, z, k) => { if (k % 4) return; K.taken.push([x, z, 4]); const ry = rnd() * PI; add(new THREE.BoxGeometry(4, 2.6, 4), M.white, x, 1.3, z, ry); add(new THREE.ConeGeometry(3.6, 2, 4, 1, true), umbM[k % 4], x, 3.6, z, ry + PI / 4); });
  // bouncing beach balls on the deck
  const balls = []; K.scatter(30, [K.bbox[0], K.bbox[1], K.bbox[2], K.bbox[3]], 2, (x, z, k) => { if (balls.length > 8) return; const m = new THREE.Mesh(new THREE.SphereGeometry(.9, 12, 8), ballM); m.position.set(x, 1, z); scene.add(m); balls.push([m, rnd() * 6]); });
  anim.push((dt, t) => balls.forEach(([m, ph]) => { m.position.y = .9 + Math.abs(Math.sin(t * 2.2 + ph)) * 3; m.rotation.y = t + ph; m.rotation.x = t * .7; }));
  // spray sparkles
  K.motes(50, [K.bbox[0], K.bbox[1], K.bbox[2], K.bbox[3]], 1, 6, 0xe8ffff, 1);
  const baked = K.bake();
  return { stats: { buildings: nB, bakedMeshes: baked.length, landmarks: LM }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); } };
}
