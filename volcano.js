// v26 Thunder Volcano: a smoking volcano the road climbs, glowing crater + lava falls, lava rivers across black sand, basalt columns,
// giant thunder drums pounded by drummers, lightning in a red storm sky, embers, obsidian shards and lava warning signs.
import { kit, THREE, canvasTex } from './scen.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildVolcano(ctx) {
  const { scene, P, S, T, N, W, E } = ctx; const K = kit(ctx, 53), { rnd, add, stage, anim, LM } = K;
  const sky = buildSky(scene, { top: 0x1a0a1a, mid: 0x4a1a2a, horizon: 0xc8502a, low: 0x5a2a20, sunDir: [300, 120, -500], sunCol: 0xff9a5a, sunSize: .9996, stars: .9,
    skyline: { col: '#1a0e10', win: '#ff6a2a', height: 130, draw: (g, w, h) => { g.fillStyle = '#1a0e10'; g.beginPath(); g.moveTo(0, h); let y = h - 30; for (let x = 0; x <= w; x += 12) { y = Math.max(h - 120, Math.min(h - 10, y + (Math.random() - .5) * 26)); g.lineTo(x, y); } g.lineTo(w, h); g.fill();
        g.strokeStyle = 'rgba(255,110,40,.7)'; g.lineWidth = 2; for (let k = 0; k < 14; k++) { const x = Math.random() * w; g.beginPath(); g.moveTo(x, h - 40 - Math.random() * 40); g.lineTo(x + (Math.random() - .5) * 20, h); g.stroke(); } } },
    clouds: [[0x3a2a2a, 14, 620, 150, 230], [0x5a3030, 8, 700, 110, 150]] });
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o }), B = c => new THREE.MeshBasicMaterial({ color: c });
  const M = { rock: [0x2a2226, 0x3a2e30, 0x1e1a1c, 0x4a3a36].map(c => L(c)), basalt: L(0x2e2a30), lava: B(0xff6a1a), lavaHot: B(0xffc040), crater: B(0xff8a2a), obsid: new THREE.MeshStandardMaterial({ color: 0x14101a, metalness: .6, roughness: .15 }),
    drumBody: L(0x8a2a1a), drumHead: L(0xf0e0c0), rope: L(0xd8b060), gold: new THREE.MeshStandardMaterial({ color: 0xffc040, metalness: .8, roughness: .3 }), black: L(0x141414), skin: [0x8a5a3a, 0xc89a70, 0xf0c8a0, 0x5a3a2a].map(c => L(c)),
    band: L(0xc8202a), white: L(0xf4f0e8), smoke: new THREE.MeshLambertMaterial({ color: 0x4a4048, transparent: true, opacity: .55, depthWrite: false }), bolt: new THREE.MeshBasicMaterial({ color: 0xf0f0ff, transparent: true, opacity: 0 }), wood: L(0x5a3a22) };
  const A = K.atlas([
    ['hot', 512, 128, K.textSign('⚠ CAUTION: HOT LAVA', '#ffc61a', '#1a1a1a', 'bold 44px Arial Black, Impact', '#1a1a1a')],
    ['thunder', 768, 128, K.textSign('THUNDER DRUM ZONE', '#1a1a1a', '#ff8a2a', 'bold 62px Arial Black, Impact', '#ff8a2a')],
    ['summit', 768, 128, K.textSign('▲ SUMMIT · LOW GEAR, LOUD DRUMS', '#2a1a1a', '#ffd34d', 'bold 42px Arial Black, Impact', '#ffd34d')],
    ['steep', 512, 128, K.textSign('STEEP DROP · HOLD ON!', '#ffc61a', '#1a1a1a', 'bold 42px Arial Black', '#1a1a1a')],
    ['taiko', 256, 256, (g, x, y, w, h) => { g.fillStyle = '#f0e0c0'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2 - 4, 0, 7); g.fill(); g.fillStyle = '#c8202a'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + w / 2 + Math.cos(k * 2.09) * 34, y + h / 2 + Math.sin(k * 2.09) * 34, 34, k * 2.09, k * 2.09 + PI); g.fill(); } }],
  ]);
  const live = (x, y, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); return g; };
  let nB = 0;
  // the volcano: big cone beyond the summit straight (the road climbs its flank), crater glow, lava falls, smoke + lightning
  let hi = 0; for (let i = 0; i < N; i++) if (E[i] > E[hi]) hi = i;
  const ph = P[hi], c = K.center, dx = ph.x - c[0], dz = ph.z - c[1], dl = Math.hypot(dx, dz) || 1, R0 = 150, cx = ph.x + dx / dl * (R0 + 70), cz = ph.z + dz / dl * (R0 + 70), H = 130;
  { const g = new THREE.Group(); g.position.set(cx, 0, cz); stage.add(g); add(new THREE.CylinderGeometry(30, R0, H, 28, 6), M.rock[1], 0, H / 2, 0, 0, g); add(new THREE.CylinderGeometry(R0 * .75, R0 * 1.1, 24, 24), M.rock[0], 0, 12, 0, .3, g);
    add(new THREE.CircleGeometry(26, 24), M.crater, 0, H - 1.5, 0, 0, g, -PI / 2); add(new THREE.TorusGeometry(28, 3, 6, 24), M.rock[2], 0, H, 0, 0, g, PI / 2);
    for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2 + .3, sl = Math.atan2(R0 - 30, H); const f = add(new THREE.BoxGeometry(5 + rnd() * 4, Math.hypot(R0 - 30, H) * .9, .6), k % 2 ? M.lava : M.lavaHot, 0, 0, 0, 0, g);
      const rm = (30 + R0) / 2 + 1.5; f.position.set(Math.sin(a) * rm, H / 2 + 4, Math.cos(a) * rm); f.rotation.set(-sl, a, 0, 'YXZ'); }
    nB++; LM.volcano = [Math.round(cx), Math.round(cz), H]; K.taken.push([cx, cz, R0 * 1.15]); }
  const puffs = []; for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(10 + rnd() * 8, 8, 6), M.smoke); scene.add(m); puffs.push([m, k / 10]); }
  const bolt = new THREE.Group(); scene.add(bolt); { let y = 260, x = 0; for (let k = 0; k < 7; k++) { const nx = x + (rnd() - .5) * 26, ny = y - 30; const sg = new THREE.Mesh(new THREE.BoxGeometry(1.4, Math.hypot(nx - x, 30), 1.4), M.bolt); sg.position.set((x + nx) / 2, (y + ny) / 2, 0); sg.rotation.z = -Math.atan2(nx - x, 30); bolt.add(sg); x = nx; y = ny; } }
  const lavaM = [M.lava, M.lavaHot, M.crater];
  // lava rivers: glowing meandering ribbons across the black sand (kept off the road)
  for (let k = 0; k < 9; k++) { const s = K.spot(14, { maxClear: 90, margin: 8 }); if (!s) continue; let x = s.x, z = s.z, a = rnd() * 6; for (let q = 0; q < 14; q++) { const nx = x + Math.cos(a) * 7, nz = z + Math.sin(a) * 7; if (!K.free(nx, nz, 3, 4)) break;
      add(new THREE.PlaneGeometry(3.4 + Math.sin(q) * .8, 7.6), q % 3 ? M.lava : M.lavaHot, (x + nx) / 2, .09 + q * .001, (z + nz) / 2, -a + PI / 2, stage, -PI / 2); x = nx; z = nz; a += (rnd() - .5) * .8; } }
  // basalt columns clusters + obsidian shards
  K.roadside(13, W / 2 + 12, 4, (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); stage.add(g); for (let q = 0; q < 6; q++) { const h = 3 + rnd() * 8; add(new THREE.CylinderGeometry(1, 1, h, 6), M.basalt, (rnd() - .5) * 5, h / 2, (rnd() - .5) * 5, 0, g); } }, .5);
  K.scatter(200, [K.bbox[0] - 140, K.bbox[1] + 140, K.bbox[2] - 140, K.bbox[3] + 140], 2.5, (x, z) => { if (rnd() < .5) add(new THREE.ConeGeometry(1 + rnd() * 1.5, 3 + rnd() * 5, 5), M.obsid, x, 2, z, rnd() * 6, stage, (rnd() - .5) * .5); else add(new THREE.DodecahedronGeometry(1.5 + rnd() * 3, 0), M.rock[Math.floor(rnd() * 4)], x, .8, z, rnd() * 6); });
  // giant thunder drums on rock stages, each pounded by two drummers
  const hits = [];
  for (let k = 0; k < 5; k++) { const s = K.spot(11, { maxClear: 34, margin: 5, key: k ? undefined : 'thunderDrums' }); if (!s) continue; nB++; const g = K.at(s); add(new THREE.CylinderGeometry(10, 11, 2, 10), M.rock[3], 0, 1, 0, 0, g);
    const dr = add(new THREE.CylinderGeometry(4.6, 4.6, 5, 20), M.drumBody, 0, 7, 0, 0, g, PI / 2); for (const z of [-2.55, 2.55]) { add(new THREE.CylinderGeometry(4.8, 4.8, .3, 20), M.drumHead, 0, 7, z, 0, g, PI / 2); A.plane('taiko', 7, 7, 0, 7, z * 1.08, z > 0 ? 0 : PI, g); }
    for (let q = 0; q < 10; q++) add(new THREE.SphereGeometry(.35, 6, 4), M.gold, Math.cos(q / 10 * PI * 2) * 4.75, 7 + Math.sin(q / 10 * PI * 2) * 4.75, 2.3, 0, g);
    add(new THREE.BoxGeometry(1, 3, 6), M.wood, -4, 2.5, 0, 0, g); add(new THREE.BoxGeometry(1, 3, 6), M.wood, 4, 2.5, 0, 0, g);
    const lg = live(s.x, 0, s.z, s.ry); for (const sd of [-1, 1]) { const b = new THREE.Group(); b.position.set(sd * 2.2, 2, 5.6); lg.add(b); add(new THREE.CylinderGeometry(.5, .6, 2, 8), M.black, 0, 1, 0, 0, b); add(new THREE.CylinderGeometry(.6, .55, 1.5, 8), M.band, 0, 2.7, 0, 0, b);
      add(new THREE.SphereGeometry(.5, 10, 8), M.skin[(k + sd + 2) % 4], 0, 3.9, 0, 0, b); add(new THREE.BoxGeometry(1.1, .25, .3), M.white, 0, 4.2, 0, 0, b); const arm = new THREE.Group(); arm.position.set(0, 3.2, -.2); b.add(arm); add(new THREE.CylinderGeometry(.09, .09, 2.6), M.wood, 0, 1.3, 0, 0, arm); add(new THREE.SphereGeometry(.3, 6, 5), M.drumHead, 0, 2.6, 0, 0, arm); hits.push([arm, k * .7 + (sd > 0 ? .5 : 0)]); }
    A.plane('thunder', 9, 1.5, 0, 1, 11.05, 0, g); }
  // warning signs (hot lava, summit, steep drop) - the summit/steep ones sit where the climb and the drop start
  const sign = (i, key, sd) => { const p = P[i], o = W / 2 + 9 + E[i] * 1.25 + 3, x = p.x + S[i].x * sd * o, z = p.z + S[i].z * sd * o; if (!K.free(x, z, 2, 2)) return; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-S[i].x * sd, -S[i].z * sd); stage.add(g);
    for (const px of [-2.6, 2.6]) add(new THREE.CylinderGeometry(.14, .14, 4), M.wood, px, 2, 0, 0, g); A.plane(key, 6, 1.5, 0, 3.6, .1, 0, g); };
  let up = 0, dn = 0; for (let i = 0; i < N; i++) { const g = (E[(i + 4) % N] - E[i]); if (g > E[(up + 4) % N] - E[up]) up = i; if (g < E[(dn + 4) % N] - E[dn]) dn = i; } [-1, 1].forEach(sd => { sign((up - 30 + N) % N, 'summit', sd); sign((dn - 25 + N) % N, 'steep', sd); });
  K.roadside(31, W / 2 + 10, 3, (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); for (const px of [-2.6, 2.6]) add(new THREE.CylinderGeometry(.14, .14, 3.4), M.wood, px, 1.7, 0, 0, g); A.plane('hot', 6, 1.5, 0, 3, .1, 0, g); }, .6);
  K.motes(120, [K.bbox[0] - 60, K.bbox[1] + 60, K.bbox[2] - 60, K.bbox[3] + 60], 1, 30, 0xff8a3a, 1.1);
  let flash = 0, nextBolt = 4;
  anim.push((dt, t) => { const pulse = .75 + .25 * Math.sin(t * 2.2); M.lava.color.setRGB(1, .42 * pulse, .1 * pulse); M.crater.color.setRGB(1, .55 + .2 * Math.sin(t * 3.1), .17);
    puffs.forEach(([m, o]) => { const u = (t * .05 + o) % 1; m.position.set(cx + Math.sin(o * 20 + t * .1) * 20 * u, H + 6 + u * 120, cz + u * 30); m.scale.setScalar(.6 + u * 2.2); });
    hits.forEach(([arm, o]) => { const u = (t * 1.25 + o) % 1; arm.rotation.x = u < .2 ? -2.2 + u * 9 : -.4 - (u - .2) * 2.2; });
    nextBolt -= dt; if (nextBolt < 0) { nextBolt = 5 + Math.random() * 6; flash = .35; bolt.position.set(cx + (Math.random() - .5) * 300, 0, cz + (Math.random() - .5) * 200); bolt.rotation.y = Math.random() * 6; }
    flash = Math.max(0, flash - dt); M.bolt.opacity = flash > 0 ? (Math.sin(flash * 60) > 0 ? 1 : .3) : 0; bolt.visible = flash > 0; });
  const baked = K.bake();
  return { stats: { buildings: nB, bakedMeshes: baked.length, landmarks: LM }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); } };
}
