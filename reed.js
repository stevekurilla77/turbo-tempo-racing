// v23 Reed Forest: misty morning woods of giant reeds. Flute trees and clarinet trees, giant mushrooms and flowers, a babbling
// stream with a little bridge, a woodwind bandshell (flute, oboe, bassoon players), drifting golden pollen and butterflies.
import { kit, THREE, canvasTex } from './scen.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildReedForest(ctx) {
  const { scene, P, S, N, W } = ctx; const K = kit(ctx, 91), { rnd, add, stage, anim, LM } = K;
  const sky = buildSky(scene, { top: 0x5aa8e0, mid: 0x9ad0e8, horizon: 0xf0e8c0, low: 0xd8e8c0, sunDir: [-300, 120, -500], sunCol: 0xfff0b0, sunSize: 1.1, stars: 0,
    skyline: { col: '#5a8a5a', win: '#fff', height: 130, draw: (g, w, h) => { g.fillStyle = '#8ab890'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 20) g.lineTo(x, h - 40 - Math.sin(x / 70) * 20 - Math.sin(x / 31) * 8); g.lineTo(w, h); g.fill();
      g.fillStyle = '#6a9a6a'; for (let x = 0; x < w; x += 3 + Math.random() * 6) { const th = 40 + Math.random() * 80; g.fillRect(x, h - th, 1.6, th); if (Math.random() < .4) { g.beginPath(); g.ellipse(x + 1, h - th, 2, 6, 0, 0, 7); g.fill(); } } } },
    clouds: [[0xffffff, 12, 640, 160, 250], [0xfff8e8, 7, 700, 100, 150]] });
  const M = { stalk: new THREE.MeshLambertMaterial({ color: 0x7ab848 }), stalk2: new THREE.MeshLambertMaterial({ color: 0x9ac85a }), node: new THREE.MeshLambertMaterial({ color: 0x5a9038 }), blade: new THREE.MeshLambertMaterial({ color: 0x6aa840, side: THREE.DoubleSide }),
    silver: new THREE.MeshPhongMaterial({ color: 0xd8dce4, specular: 0xffffff, shininess: 70 }), ebony: new THREE.MeshLambertMaterial({ color: 0x2a2228 }), wood: new THREE.MeshLambertMaterial({ color: 0x8a5a30 }), crown: new THREE.MeshLambertMaterial({ color: 0x5aa850 }), crown2: new THREE.MeshLambertMaterial({ color: 0x8ac860 }),
    cap: [0xe84a3a, 0xf0a030, 0xb070e0].map(c => new THREE.MeshLambertMaterial({ color: c })), stem: new THREE.MeshLambertMaterial({ color: 0xf4ecd8 }), dot: new THREE.MeshLambertMaterial({ color: 0xffffff }), stone: new THREE.MeshLambertMaterial({ color: 0x9a9a90 }),
    shell: new THREE.MeshLambertMaterial({ color: 0xf0e0b0, side: THREE.DoubleSide }), robe: [0x3a7ac8, 0xc84a7a, 0xe8a03a].map(c => new THREE.MeshLambertMaterial({ color: c })), fur: [0xc89a6a, 0x8a6a4a, 0xe8d8c0].map(c => new THREE.MeshLambertMaterial({ color: c })) };
  const waterTex = canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#4ab0d0'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; for (let k = 0; k < 30; k++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y + 6, x, y + 14); g.stroke(); } }, true);
  const waterM = new THREE.MeshLambertMaterial({ map: waterTex, emissive: 0x103040 }); anim.push((dt, t) => { waterTex.offset.y = -t * .25; });
  const A = K.atlas([
    ['flower', 512, 128, (g, x, y, w, h) => { const C = ['#ff6a8a', '#ffd34d', '#b080ff', '#ffffff']; for (let k = 0; k < 4; k++) { const cx = x + 64 + k * 128, cy = y + 64; g.fillStyle = C[k]; for (let p = 0; p < 6; p++) { const a = p / 6 * PI * 2; g.beginPath(); g.ellipse(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, 22, 13, a, 0, 7); g.fill(); } g.fillStyle = '#ffb020'; g.beginPath(); g.arc(cx, cy, 14, 0, 7); g.fill(); } }],
    ['fly', 256, 128, (g, x, y, w, h) => { for (let k = 0; k < 2; k++) { const cx = x + 64 + k * 128, cy = y + 64, c = ['#ff8a3a', '#5ad8ff'][k]; g.fillStyle = c; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(cx + sd * 28, cy - 12, 28, 22, sd * .4, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx + sd * 22, cy + 22, 18, 14, -sd * .4, 0, 7); g.fill(); } g.fillStyle = '#2a1a1a'; g.fillRect(cx - 3, cy - 30, 6, 60); } }],
    ['shell', 768, 128, K.textSign('♪ WOODWIND BANDSHELL ♪', '#2a5a2a', '#fff4c0', 'bold 52px Georgia, serif', '#fff4c0')],
    ['trail', 512, 128, K.textSign('REED FOREST TRAIL ➜', '#8a5a30', '#fff4d8', 'bold 46px Georgia, serif')],
    ['hush', 512, 128, K.textSign('QUIET! REEDS PRACTICING', '#fff4c0', '#2a5a2a', 'bold 38px Arial Black')],
  ]);
  let nB = 0;
  // ---------- giant reed stalks (segmented, with long blades) ----------
  const reed = (x, z, h) => { const lean = (rnd() - .5) * .14, segs = Math.max(3, Math.round(h / 4)), m = rnd() < .5 ? M.stalk : M.stalk2; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.set(lean, rnd() * PI * 2, 0); stage.add(g);
    add(new THREE.CylinderGeometry(.5, .62, h, 6, 1, true), m, 0, h / 2, 0, 0, g); for (let k = 1; k < segs; k += 2) add(new THREE.CylinderGeometry(.66, .66, .35, 6, 1, true), M.node, 0, k * h / segs, 0, 0, g);
    for (let k = 0; k < 3; k++) { const y = h * (.35 + k * .2), a = rnd() * PI * 2; add(new THREE.PlaneGeometry(1.3, h * .3), M.blade, Math.cos(a) * 1.4, y + h * .1, Math.sin(a) * 1.4, -a, g, 0, .45); }
    add(new THREE.CylinderGeometry(.55, .25, 2.2, 6), M.wood, 0, h + 1, 0, 0, g); };
  K.roadside(4, W / 2 + 9, 1.4, (x, z) => reed(x, z, 12 + rnd() * 14), .6);
  K.scatter(380, [K.bbox[0] - 110, K.bbox[1] + 110, K.bbox[2] - 110, K.bbox[3] + 110], 1.5, (x, z) => reed(x, z, 14 + rnd() * 20));
  // ---------- flute trees + clarinet trees ----------
  const fluteTree = (s) => { nB++; const g = K.at(s), h = 16 + rnd() * 6; g.rotation.y += rnd() * PI;
    add(new THREE.CylinderGeometry(.75, .75, h, 14), M.silver, 0, h / 2, 0, 0, g); for (let k = 0; k < 6; k++) add(new THREE.CylinderGeometry(.3, .3, .14, 10), M.ebony, 0, 3 + k * 1.7, .72, 0, g, PI / 2);
    for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(.18, .18, 1.6, 6), M.silver, .9, 4 + k * 3, 0, 0, g, 0, PI / 2);
    for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(new THREE.SphereGeometry(3.4, 9, 7), k % 2 ? M.crown : M.crown2, Math.cos(a) * 2.6, h + 1.4 + (k % 2), Math.sin(a) * 2.6, 0, g); } add(new THREE.SphereGeometry(3.8, 9, 7), M.crown, 0, h + 3.4, 0, 0, g); };
  const clarTree = (s) => { nB++; const g = K.at(s), h = 15 + rnd() * 5; g.rotation.y += rnd() * PI;
    add(new THREE.CylinderGeometry(.65, .65, h, 12), M.ebony, 0, h / 2 + 2, 0, 0, g); add(new THREE.CylinderGeometry(.7, 2.2, 3, 16, 1, true), M.ebony, 0, 1.5, 0, 0, g).material.side = THREE.DoubleSide;
    for (let k = 0; k < 8; k++) { add(new THREE.CylinderGeometry(.22, .22, .12, 8), M.silver, 0, 4 + k * 1.4, .66, 0, g, PI / 2); if (k % 2) add(new THREE.BoxGeometry(.12, 1.2, .12), M.silver, .55, 4.6 + k * 1.4, .45, 0, g); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * PI * 2 + .4; add(new THREE.SphereGeometry(3, 9, 7), k % 2 ? M.crown2 : M.crown, Math.cos(a) * 2.3, h + 2.6, Math.sin(a) * 2.3, 0, g); } add(new THREE.SphereGeometry(3.3, 9, 7), M.crown2, 0, h + 4.4, 0, 0, g); };
  for (let k = 0; k < 16; k++) { const s = K.site(Math.floor(N * (k + .5) / 16), k % 2 ? 1 : -1, W / 2 + 14 + (k % 3) * 4, 4.5); if (s) (k % 2 ? fluteTree : clarTree)(s); }
  // ---------- giant mushrooms + flowers ----------
  const shroom = (x, z, sc) => { const m = M.cap[Math.floor(rnd() * 3)]; add(new THREE.CylinderGeometry(.35 * sc, .5 * sc, 2 * sc, 8), M.stem, x, sc, z); add(new THREE.SphereGeometry(1.4 * sc, 10, 4, 0, PI * 2, 0, PI / 2), m, x, 2 * sc - .1, z).scale.y = .7;
    for (let k = 0; k < 3; k++) { const a = rnd() * PI * 2; add(new THREE.SphereGeometry(.2 * sc, 5, 3), M.dot, x + Math.cos(a) * sc * .8, 2 * sc + .55 * sc, z + Math.sin(a) * sc * .8); } };
  K.roadside(11, W / 2 + 8.2, 1.4, (x, z) => shroom(x, z, .8 + rnd() * 1.2), .5);
  K.scatter(160, [K.bbox[0] - 40, K.bbox[1] + 40, K.bbox[2] - 40, K.bbox[3] + 40], 2.5, (x, z) => shroom(x, z, 1.5 + rnd() * 2.5));
  K.roadside(3, W / 2 + 7.5, .6, (x, z, ry) => { const k = Math.floor(rnd() * 4), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry + (rnd() - .5); stage.add(g); add(new THREE.CylinderGeometry(.03, .03, 1), M.node, 0, .5, 0, 0, g);
    const f = add(new THREE.PlaneGeometry(1, 1), A.mat, 0, 1.1, 0, 0, g); f.geometry = new THREE.PlaneGeometry(1, 1); const R = A.R.flower, uv = f.geometry.attributes.uv, u0 = R[0] + (R[2] - R[0]) * k / 4, u1 = R[0] + (R[2] - R[0]) * (k + 1) / 4;
    for (let i = 0; i < 4; i++) uv.setXY(i, i % 2 ? u1 : u0, i < 2 ? R[3] : R[1]); }, .5);
  // ---------- stream with a stone bridge: longest free straight line through the infield ----------
  { let best = null; for (let k = 0; k < 300; k++) { const x = K.bbox[0] + rnd() * (K.bbox[1] - K.bbox[0]), z = K.bbox[2] + rnd() * (K.bbox[3] - K.bbox[2]), a = rnd() * PI; if (!K.inside(x, z)) continue;
      let L = 0; for (let d = 4; d < 140; d += 4) { if (!K.free(x + Math.cos(a) * d, z + Math.sin(a) * d, 4, 2) || !K.free(x - Math.cos(a) * d, z - Math.sin(a) * d, 4, 2)) break; L = d; } if (!best || L > best[3]) best = [x, z, a, L]; }
    if (best && best[3] > 20) { nB++; const [x, z, a, L] = best; LM.stream = [Math.round(x), Math.round(z), Math.round(L * 2)]; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -a + PI / 2; stage.add(g);
      const w = add(new THREE.PlaneGeometry(6, L * 2), waterM, 0, .06, 0, 0, g, -PI / 2); waterTex.repeat.set(1, L / 12);
      for (let k = -L; k < L; k += 2.4) for (const sd of [-1, 1]) add(new THREE.DodecahedronGeometry(.6 + rnd() * .5), M.stone, sd * (3.4 + rnd() * .6), .2, k + rnd(), 0, g);
      // little arched bridge with railings
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 4, 18, 1, false, -.6, 1.2), M.stone); arch.rotation.set(0, 0, PI / 2); arch.position.set(0, -4.4, 0); arch.rotation.order = 'ZYX'; g.add(arch);
      const deck = add(new THREE.BoxGeometry(10, .4, 3.6), M.wood, 0, 1.4, 0, 0, g); for (const sd of [-1, 1]) add(new THREE.BoxGeometry(10, .25, .2), M.wood, 0, 2.4, sd * 1.7, 0, g);
      K.taken.push([x, z, 8]); } }
  // ---------- woodwind bandshell ----------
  { const s = K.site(Math.floor(N * .05), -1, W / 2 + 20, 11, 'bandshell') || K.site(Math.floor(N * .5), 1, W / 2 + 20, 11, 'bandshell'); if (s) { nB++; const g = K.at(s);
      add(new THREE.CylinderGeometry(8, 8, 1, 20, 1, false, -PI / 2, PI), M.wood, 0, .5, -1, 0, g); const sh = add(new THREE.SphereGeometry(8.5, 18, 10, PI / 2, PI, 0, PI / 2), M.shell, 0, 1, -1, 0, g);
      for (let k = 0; k < 4; k++) add(new THREE.TorusGeometry(8.5 - k * .01, .15, 4, 24, PI), M.wood, 0, 1, -1 - k * 0, 0, g, 0, 0).rotation.set(0, 0, 0);
      A.plane('shell', 11, 1.8, 0, 10.6, -1, 0, g); const band = [];
      const inst = [[new THREE.CylinderGeometry(.08, .08, 1.6, 8), M.silver, PI / 2], [new THREE.CylinderGeometry(.07, .14, 1.4, 8), M.ebony, .5], [new THREE.CylinderGeometry(.16, .2, 2.4, 8), M.wood, .2]];
      for (let k = 0; k < 3; k++) { const b = new THREE.Group(); b.position.set(-3.6 + k * 3.6, 1, -2.6); g.add(b); add(new THREE.CylinderGeometry(.55, .7, 1.8, 9), M.robe[k], 0, 1, 0, 0, b); add(new THREE.SphereGeometry(.55, 10, 8), M.fur[k], 0, 2.4, 0, 0, b);
        for (const sx of [-.32, .32]) add(new THREE.SphereGeometry(.2, 6, 5), M.fur[k], sx, 2.95, 0, 0, b); const im = add(inst[k][0], inst[k][1], k === 0 ? .6 : 0, k === 2 ? 1.6 : 1.8, .6, 0, b, k === 0 ? 0 : -inst[k][2], k === 0 ? inst[k][2] : 0); band.push(b); }
      anim.push((dt, t) => band.forEach((b, k) => { b.rotation.y = Math.sin(t * 2.3 + k * 2) * .25; b.position.y = 1 + Math.abs(Math.sin(t * 4.5 + k)) * .12; })); } }
  // trail signs
  K.roadside(80, W / 2 + 10, 2, (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); for (const px of [-2.2, 2.2]) add(new THREE.CylinderGeometry(.15, .18, 2.8, 6), M.wood, px, 1.4, 0, 0, g); A.plane(rnd() < .5 ? 'trail' : 'hush', 5, 1.25, 0, 2.3, .14, 0, g); }, .8);
  // ---------- pollen + butterflies ----------
  K.motes(140, [K.bbox[0] - 30, K.bbox[1] + 30, K.bbox[2] - 30, K.bbox[3] + 30], 1, 10, 0xffe070, 1);
  const flies = []; for (let k = 0; k < 14; k++) { const i = Math.floor(rnd() * N), sd = rnd() < .5 ? -1 : 1, o = W / 2 + 6 + rnd() * 10; const g = new THREE.Group(); g.position.set(P[i].x + S[i].x * sd * o, 2 + rnd() * 3, P[i].z + S[i].z * sd * o); scene.add(g);
    const R = A.R.fly, c = k % 2; for (const sd2 of [-1, 1]) { const geo = new THREE.PlaneGeometry(.6, .9); const uv = geo.attributes.uv; const um = R[0] + (R[2] - R[0]) * (c * 2 + 1) / 4, ue = R[0] + (R[2] - R[0]) * (c * 2 + (sd2 > 0 ? 2 : 0)) / 4;
      for (let v = 0; v < 4; v++) uv.setXY(v, (v % 2 ? 1 : 0) === (sd2 > 0 ? 0 : 1) ? um : ue, v < 2 ? R[3] : R[1]); geo.translate(sd2 * .3, 0, 0); const w = new THREE.Mesh(geo, A.mat); g.add(w); }
    flies.push([g, g.position.clone(), rnd() * 6]); }
  anim.push((dt, t) => flies.forEach(([g, b, ph]) => { const f = Math.sin(t * 14 + ph) * 1.1; g.children[0].rotation.y = f; g.children[1].rotation.y = -f; g.position.set(b.x + Math.sin(t * .6 + ph) * 3, b.y + Math.sin(t * 1.3 + ph) * .8, b.z + Math.cos(t * .5 + ph) * 3); g.rotation.y = t * .6 + ph; }));
  const baked = K.bake();
  return { stats: { buildings: nB, bakedMeshes: baked.length, landmarks: LM }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); } };
}
