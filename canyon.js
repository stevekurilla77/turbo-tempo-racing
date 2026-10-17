// v26 Drumline Desert Canyon: a figure-8 through red-rock country. Layered mesas and buttes, drum-shaped hoodoos, saguaros, rolling
// tumbleweeds, a drumline marching on a low mesa, a cymbal arch over the start straight, ECHO signs, circling hawks and the Drumline Bridge.
import { kit, THREE, canvasTex } from './scen.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildCanyon(ctx) {
  const { scene, P, S, T, N, W, E } = ctx; const K = kit(ctx, 41), { rnd, add, stage, anim, LM } = K;
  const sky = buildSky(scene, { top: 0x2a6ad0, mid: 0x7ab0e0, horizon: 0xffd8a0, low: 0xe8a070, sunDir: [-420, 200, -300], sunCol: 0xfff0c0, sunSize: .999, stars: 0,
    skyline: { col: '#b0603a', height: 120, mesa: true }, clouds: [[0xfff4e8, 8, 650, 170, 240], [0xffe0c0, 5, 720, 120, 150]] });
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const M = { rock: [0xb8582e, 0xc8703a, 0xa04a2a, 0xd88a50, 0x8a3a22].map(c => L(c)), sand: L(0xe0a868), cactus: L(0x4a8a3a), cactusD: L(0x3a7030), white: L(0xf8f4ea), red: L(0xc8202a), navy: L(0x1a2a6a), gold: new THREE.MeshStandardMaterial({ color: 0xffc040, metalness: .8, roughness: .3 }),
    black: L(0x1a1a1a), skin: [0x8a5a3a, 0xc89a70, 0xf0c8a0, 0x5a3a2a].map(c => L(c)), plume: L(0xffd34d), weed: L(0xa8844a), hawk: L(0x5a3a22), wood: L(0x8a5a32) };
  const A = K.atlas([
    ['echo', 768, 128, K.textSign('ECHO CANYON · CLAP!  CLAP!', '#f4e0b0', '#8a2a1a', 'bold 52px Arial Black, Impact', '#8a2a1a')],
    ['bridge', 1024, 96, K.textSign('♪ DRUMLINE BRIDGE ♪', '#1a2a6a', '#ffd34d', 'bold 60px Arial Black, Impact', '#ffd34d')],
    ['cadence', 768, 128, K.textSign('DESERT DRUMLINE · CADENCE AHEAD', '#c8202a', '#fff', 'bold 44px Arial Black, Impact', '#fff')],
    ['water', 512, 128, K.textSign('LAST WATER 40 BEATS', '#f4e0b0', '#3a2a1a', 'bold 40px Arial Black')],
    ['slot', 512, 128, K.textSign('SLOT CANYON →', '#8a3a22', '#ffe0a0', 'bold 56px Arial Black, Impact')],
    ['snare', 256, 256, (g, x, y, w, h) => { g.fillStyle = '#f8f4ea'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2 - 4, 0, 7); g.fill(); g.strokeStyle = '#c8202a'; g.lineWidth = 14; g.stroke(); g.fillStyle = '#c8202a'; g.font = 'bold 120px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', x + w / 2, y + h / 2 + 6); }],
  ]);
  const live = (s) => { const g = new THREE.Group(); g.position.set(s.x, s.y || 0, s.z); g.rotation.y = s.ry || 0; scene.add(g); return g; };
  let nB = 0;
  // layered rock: stacked strata, each a little narrower (mesas, buttes, hoodoos)
  const strata = (g, r, h, layers, top = .75) => { let y = 0; for (let k = 0; k < layers; k++) { const f = 1 - (1 - top) * k / layers, lh = h / layers * (.7 + rnd() * .6); add(new THREE.CylinderGeometry(r * (f - .04), r * f, lh, 9 + Math.floor(rnd() * 4)), M.rock[(k + Math.floor(rnd() * 2)) % 5], 0, y + lh / 2, 0, rnd() * 6, g); y += lh; } return y; };
  // big mesas far out (seen across the desert) and buttes in the lobes
  for (let k = 0; k < 14; k++) { const r = 28 + rnd() * 34, s = K.spot(r, { margin: 20, pad: 260, maxClear: 260 }); if (!s) continue; nB++; const g = K.at(s); strata(g, r, 22 + rnd() * 34, 5); }
  for (let k = 0; k < 10; k++) { const r = 8 + rnd() * 10, s = K.spot(r, { margin: 10, maxClear: 70 }); if (!s) continue; nB++; const g = K.at(s); strata(g, r, 18 + rnd() * 22, 4, .6); }
  // drum hoodoos: rock column topped by a snare drum (white head, red shell, gold hoops)
  K.roadside(23, W / 2 + 15, 4, (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); stage.add(g); const h = strata(g, 2.4 + rnd(), 7 + rnd() * 6, 3, .6);
    add(new THREE.CylinderGeometry(2.6, 2.6, 2, 16), M.red, 0, h + 1, 0, 0, g); add(new THREE.CylinderGeometry(2.62, 2.62, .25, 16), M.white, 0, h + 2.05, 0, 0, g); for (const y of [h + .1, h + 1.9]) add(new THREE.TorusGeometry(2.65, .12, 5, 18), M.gold, 0, y, 0, 0, g, PI / 2);
    for (const sx of [-.8, .8]) add(new THREE.CylinderGeometry(.08, .08, 3), M.wood, sx, h + 3, 0, 0, g, .3, sx * .4); nB++; }, .6);
  // saguaros + small rocks
  const saguaro = (x, z, h) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rnd() * 6; stage.add(g); add(new THREE.CylinderGeometry(.55, .65, h, 8), M.cactus, 0, h / 2, 0, 0, g); add(new THREE.SphereGeometry(.55, 8, 5), M.cactus, 0, h, 0, 0, g);
    for (const sd of [-1, 1]) if (rnd() < .8) { const y = h * (.35 + rnd() * .25), ah = h * .3; add(new THREE.CylinderGeometry(.4, .4, 1.4, 7), M.cactusD, sd * .9, y, 0, 0, g, 0, PI / 2); add(new THREE.CylinderGeometry(.4, .42, ah, 7), M.cactusD, sd * 1.6, y + ah / 2, 0, 0, g); add(new THREE.SphereGeometry(.4, 7, 4), M.cactusD, sd * 1.6, y + ah, 0, 0, g); } };
  K.roadside(9, W / 2 + 11, 2, (x, z) => saguaro(x, z, 4 + rnd() * 3), .45);
  K.scatter(260, [K.bbox[0] - 140, K.bbox[1] + 140, K.bbox[2] - 140, K.bbox[3] + 140], 2, (x, z) => rnd() < .6 ? saguaro(x, z, 4 + rnd() * 4) : add(new THREE.DodecahedronGeometry(1 + rnd() * 2.5, 0), M.rock[Math.floor(rnd() * 5)], x, .6, z, rnd() * 6));
  // drumline on a low mesa: 3 snares, 2 quads, 3 bass drums, marching in place with sticks flying
  { const s = K.spot(16, { maxClear: 42, key: 'drumlineMesa' }); if (s) { nB++; const g = K.at(s); const h = strata(g, 15, 3.5, 2, .92); const lg = live({ ...s, y: h }), mem = [];
      for (let k = 0; k < 8; k++) { const b = new THREE.Group(); b.position.set(-8.4 + k * 2.4, 0, 2 + (k % 2) * 1.5); lg.add(b); const kind = k < 3 ? 0 : k < 5 ? 1 : 2;
        add(new THREE.CylinderGeometry(.4, .48, 1.6, 8), M.white, 0, .8, 0, 0, b); add(new THREE.CylinderGeometry(.5, .45, 1.3, 8), M.red, 0, 2.25, 0, 0, b); add(new THREE.SphereGeometry(.4, 10, 8), M.skin[k % 4], 0, 3.25, 0, 0, b);
        add(new THREE.CylinderGeometry(.42, .42, .7, 10), M.navy, 0, 3.75, 0, 0, b); add(new THREE.ConeGeometry(.16, .7, 6), M.plume, 0, 4.4, 0, 0, b);
        if (kind === 0) add(new THREE.CylinderGeometry(.6, .6, .5, 14), M.white, 0, 1.9, .65, 0, b); else if (kind === 1) for (let q = 0; q < 4; q++) add(new THREE.CylinderGeometry(.28 + q * .05, .28 + q * .05, .6, 10), M.white, -.6 + q * .4, 1.9, .65 + Math.abs(q - 1.5) * .12, 0, b);
        else { const bd = add(new THREE.CylinderGeometry(.8 + (k - 5) * .15, .8 + (k - 5) * .15, .6, 16), M.red, 0, 1.9, .7, 0, b, 0, PI / 2); bd.rotation.set(0, 0, PI / 2); }
        const st = []; for (const sx of [-.35, .35]) { const sk = add(new THREE.CylinderGeometry(.04, .04, .9), M.wood, sx, 2.3, .7, 0, b); sk.geometry.translate(0, .4, 0); st.push(sk); } mem.push([b, st, k]); }
      anim.push((dt, t) => mem.forEach(([b, st, k]) => { b.position.y = Math.abs(Math.sin(t * 4)) * .2; st.forEach((sk, q) => { sk.rotation.x = -.6 + Math.max(0, Math.sin(t * 16 + q * PI + k * .3)) * 1.1; }); }));
      A.plane('cadence', 12, 2, 0, 1.8, 15.3, 0, g); } }
  // cymbal arch over the start straight: two red-rock pillars, a sandstone beam and a pair of crash cymbals
  { const i = 75, p = P[i], s1 = S[i], o = W / 2 + 11, ry = Math.atan2(T[i].x, T[i].z), g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = ry; stage.add(g); nB++;
    for (const sd of [-1, 1]) { const pg = new THREE.Group(); pg.position.set(sd * o, 0, 0); g.add(pg); strata(pg, 3.4, 20, 4, .7); }
    add(new THREE.BoxGeometry(o * 2 + 6, 3, 5), M.rock[3], 0, 21, 0, 0, g); add(new THREE.BoxGeometry(o * 2 + 8, .8, 6), M.rock[2], 0, 22.8, 0, 0, g);
    for (const sd of [-1, 1]) { const c = add(new THREE.CylinderGeometry(4.5, 4.5, .25, 28), M.gold, sd * 4.2, 27, 0, 0, g, PI / 2 - .25 * sd); add(new THREE.SphereGeometry(.9, 10, 6), M.gold, sd * 4.2 + sd * -.05, 27, 0, 0, g); }
    A.plane('echo', 14, 2.3, 0, 21, 2.6, 0, g); A.plane('echo', 14, 2.3, 0, 21, -2.6, PI, g); LM.cymbalArch = [Math.round(p.x), Math.round(p.z), i]; }
  // the Drumline Bridge: banners hung on both deck edges + a snare-drum medallion on each pier side
  { let bi = -1; for (let i = 0; i < N; i++) if (E[i] > (bi < 0 ? 0 : E[bi])) bi = i; if (bi >= 0 && E[bi] > 5) { const p = P[bi], s1 = S[bi];
      for (const sd of [-1, 1]) { const x = p.x + s1.x * sd * (W / 2 + 8.7), z = p.z + s1.z * sd * (W / 2 + 8.7); A.plane('bridge', 24, 2.2, x, E[bi] - 2.4, z, Math.atan2(s1.x * sd, s1.z * sd)); }
      LM.bridge = [Math.round(p.x), Math.round(p.z), bi, +E[bi].toFixed(1)]; } }
  // echo signs + slot-canyon arrow
  K.roadside(37, W / 2 + 10, 3, (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); for (const px of [-2.6, 2.6]) add(new THREE.CylinderGeometry(.14, .14, 3.4), M.wood, px, 1.7, 0, 0, g);
    A.plane(['echo', 'water', 'slot'][Math.floor(rnd() * 3)], 6, 1.4, 0, 3, .1, 0, g); A.plane('snare', 1.6, 1.6, 0, 4.6, .1, 0, g); }, .7);
  // tumbleweeds rolling across the sand (outside the road) + hawks circling
  const weeds = []; for (let k = 0; k < 10; k++) { const s = K.spot(10, { maxClear: 80, margin: 6 }); if (!s) continue; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), new THREE.MeshLambertMaterial({ color: 0xa8844a, wireframe: true })); m.position.set(s.x, 1.1, s.z); scene.add(m); weeds.push([m, s.x, s.z, rnd() * 6]); }
  const hawks = []; for (let k = 0; k < 4; k++) { const g = new THREE.Group(); const c = K.center, R = 80 + rnd() * 140; scene.add(g); add(new THREE.ConeGeometry(.5, 2.2, 5), M.hawk, 0, 0, 0, 0, g, PI / 2); for (const sd of [-1, 1]) add(new THREE.BoxGeometry(3.4, .1, 1.1), M.hawk, sd * 1.8, 0, 0, 0, g, 0, sd * .15); hawks.push([g, c, R, rnd() * 6, 45 + rnd() * 30]); }
  anim.push((dt, t) => { weeds.forEach(([m, x, z, ph]) => { const u = Math.sin(t * .35 + ph) * 7; m.position.set(x + u, 1.1 + Math.abs(Math.sin(t * 2.4 + ph)) * .8, z + Math.cos(t * .2 + ph) * 2); m.rotation.z = -u * .9; });
    hawks.forEach(([g, c, R, ph, y]) => { const a = t * .12 + ph; g.position.set(c[0] + Math.cos(a) * R, y + Math.sin(t * .5 + ph) * 3, c[1] + Math.sin(a) * R); g.rotation.y = -a; g.children[1].rotation.z = -.15 + Math.sin(t * 3 + ph) * .25; g.children[2].rotation.z = .15 - Math.sin(t * 3 + ph) * .25; }); });
  K.motes(70, [K.bbox[0], K.bbox[1], K.bbox[2], K.bbox[3]], 1, 6, 0xffe0a0, .7);
  const baked = K.bake();
  return { stats: { buildings: nB, bakedMeshes: baked.length, landmarks: LM }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); } };
}
