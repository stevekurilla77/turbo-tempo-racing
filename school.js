// v26 School Halls: Tempo Middle School on a sunny school day. Brick main building with clock + flagpole, the locker-hallway wing the
// shortcut runs through, a gym with a barrel roof and scoreboard, the band room (marching band practising on the lot), a music classroom
// with a chalkboard staff, yellow buses, basketball courts, a football field with bleachers, trees, bike racks and cheering classmates.
import { kit, THREE, canvasTex, facadeBox } from './scen.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildSchool(ctx) {
  const { scene, P, S, N, W, ALLEY_A, ALLEY_B, ALLEY_HW } = ctx; const K = kit(ctx, 26), { rnd, add, stage, anim, LM } = K;
  const sky = buildSky(scene, { top: 0x3a8ae0, mid: 0x7ab8f0, horizon: 0xd8ecf8, low: 0xb8d8a8, sunDir: [300, 260, -400], sunCol: 0xfff4d0, sunSize: .9993, stars: 0,
    skyline: { col: '#7a9aa0', win: '#fff', height: 110, draw: (g, w, h) => { let x = 0; while (x < w) { const k = Math.random(); g.fillStyle = k < .5 ? '#8aa8a8' : '#7a9a90';
        if (k < .55) { const bw = 18 + Math.random() * 18, bh = 10 + Math.random() * 10; g.fillRect(x, h - bh, bw, bh); g.beginPath(); g.moveTo(x - 3, h - bh); g.lineTo(x + bw / 2, h - bh - 10); g.lineTo(x + bw + 3, h - bh); g.fill(); x += bw + 4; }
        else if (k < .93) { g.fillStyle = '#6a9a70'; const r = 7 + Math.random() * 9; g.beginPath(); g.arc(x + r, h - 8 - r, r, 0, 7); g.fill(); g.fillRect(x + r - 1, h - 10, 2, 10); x += r * 2; }
        else { g.fillStyle = '#9ab0b8'; g.fillRect(x + 6, h - 40, 2, 40); g.fillRect(x + 18, h - 40, 2, 40); g.beginPath(); g.ellipse(x + 13, h - 46, 12, 9, 0, 0, 7); g.fill(); x += 34; } } g.fillStyle = '#7a9a80'; g.fillRect(0, h - 6, w, 6); } },
    clouds: [[0xffffff, 14, 640, 160, 260], [0xf4f8ff, 8, 720, 110, 160]] });
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o }), B = c => new THREE.MeshBasicMaterial({ color: c });
  const M = { brick: L(0xa84a34), trim: L(0xf0e8d8), roof: L(0x4a4a52), navy: L(0x1a2a6a), orange: L(0xff8a2a), white: L(0xf8f8f0), yellow: L(0xffc61a), black: L(0x1a1a1a), glass: B(0x9ad0f0), gray: L(0x8a8a90), green: L(0x3a9a3a),
    turf: L(0x4aa84a), court: L(0x2a6aa8), metal: L(0xc8ccd4), trunk: L(0x6a4a2a), leaf: [0x3a8a3a, 0x4aa040, 0x6ab84a].map(c => L(c)), gold: new THREE.MeshStandardMaterial({ color: 0xffc040, metalness: .8, roughness: .3 }),
    shirt: [0xff5a5a, 0x3a8aff, 0xffd34d, 0x7a4ad8, 0x2ac88a, 0xff8ad0].map(c => L(c)), skin: [0x8a5a3a, 0xc89a70, 0xf0c8a0, 0x5a3a2a].map(c => L(c)), hair: [0x2a1a10, 0x6a3a1a, 0xe0b050, 0x1a1a1a].map(c => L(c)) };
  // brick facade with windows: 8-unit tile
  const fac = (wall, win, frame) => { const t = canvasTex(128, 128, g => { g.fillStyle = wall; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(255,255,255,.12)'; for (let y = 0; y < 128; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
      g.fillStyle = frame; g.fillRect(22, 26, 84, 66); g.fillStyle = win; g.fillRect(28, 32, 34, 54); g.fillRect(66, 32, 34, 54); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(30, 34, 8, 40); g.fillRect(68, 34, 8, 40); }, true); return L(0xffffff, { map: t }); };
  const FAC = fac('#a84a34', '#8ac0e0', '#f0e8d8'), FAC2 = fac('#c8a070', '#9ad0f0', '#1a2a6a'), FAC3 = fac('#d0c8b8', '#7ab0d8', '#ff8a2a');
  const A = K.atlas([
    ['school', 1024, 128, K.textSign('TEMPO MIDDLE SCHOOL', '#1a2a6a', '#fff', 'bold 72px Georgia, serif', '#ff8a2a')],
    ['gym', 1024, 128, K.textSign('HOME OF THE TEMPO TIGERS', '#ff8a2a', '#1a2a6a', 'bold 64px Arial Black, Impact', '#1a2a6a')],
    ['band', 768, 128, K.textSign('♪ BAND ROOM ♪', '#1a2a6a', '#ffd34d', 'bold 76px Arial Black, Impact', '#ffd34d')],
    ['music', 512, 256, (g, x, y, w, h) => { g.fillStyle = '#2a4a3a'; g.fillRect(x, y, w, h); g.strokeStyle = '#8a5a2a'; g.lineWidth = 14; g.strokeRect(x + 7, y + 7, w - 14, h - 14); g.strokeStyle = '#e8f0e8'; g.lineWidth = 2;
      for (let l = 0; l < 5; l++) { g.beginPath(); g.moveTo(x + 40, y + 70 + l * 16); g.lineTo(x + w - 40, y + 70 + l * 16); g.stroke(); } g.fillStyle = '#e8f0e8'; g.font = 'bold 96px Georgia, serif'; g.fillText('𝄞', x + 40, y + 150);
      [[150, 118], [200, 102], [250, 94], [300, 86], [350, 102], [400, 118]].forEach(([nx, ny]) => { g.beginPath(); g.ellipse(x + nx, y + ny, 10, 7, -.4, 0, 7); g.fill(); g.fillRect(x + nx + 8, y + ny - 44, 2.5, 44); });
      g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText('MUSIC ROOM 104', x + w / 2, y + 220); }],
    ['concert', 768, 128, K.textSign('SPRING CONCERT FRIDAY!', '#fff4c0', '#c0303a', 'bold 56px Arial Black, Impact', '#c0303a')],
    ['tigers', 512, 128, K.textSign('GO TIGERS!', '#ff8a2a', '#fff', 'bold 72px Arial Black, Impact', '#fff')],
    ['slow', 512, 128, K.textSign('SLOW · BAND PRACTICE', '#ffd34d', '#1a1a1a', 'bold 42px Arial Black')],
    ['bus', 512, 64, K.textSign('SCHOOL BUS', '#ffc61a', '#1a1a1a', 'bold 44px Arial Black')],
    ['score', 512, 256, (g, x, y, w, h) => { g.fillStyle = '#1a1a1a'; g.fillRect(x, y, w, h); g.fillStyle = '#ff8a2a'; g.font = 'bold 40px Arial Black'; g.textAlign = 'center'; g.fillText('TIGERS   GUESTS', x + w / 2, y + 60); g.fillStyle = '#ff3a2a'; g.font = 'bold 96px monospace'; g.fillText('88 · 76', x + w / 2, y + 170); g.fillStyle = '#ffd34d'; g.font = 'bold 30px Arial'; g.fillText('♪ PEP BAND ♪', x + w / 2, y + 230); }],
    ['pennant', 256, 128, (g, x, y, w, h) => { g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h / 2); g.lineTo(x, y + h); g.fill(); g.fillStyle = '#1a2a6a'; g.font = 'bold 36px Arial Black'; g.fillText('GO!', x + 20, y + 76); }],
  ]);
  let nB = 0; const live = (s) => { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; scene.add(g); return g; };
  // ---------- the hallway wing: brick building wrapped around the locker-hallway shortcut ----------
  { const a = P[ALLEY_A], b = P[ALLEY_B], L2 = Math.hypot(b.x - a.x, b.z - a.z), dx = (b.x - a.x) / L2, dz = (b.z - a.z) / L2, sx = -dz, sz = dx, ry = Math.atan2(dx, dz);
    let t0 = .1, t1 = .9; const ok = t => { for (const u of [-ALLEY_HW - 9, ALLEY_HW + 9]) { const x = a.x + dx * L2 * t + sx * u, z = a.z + dz * L2 * t + sz * u; if (K.clear(x, z) < W / 2 + 9) return false; } return true; };
    while (t0 < .45 && !ok(t0)) t0 += .01; while (t1 > .55 && !ok(t1)) t1 -= .01;
    const len = (t1 - t0) * L2, cx = a.x + dx * L2 * (t0 + t1) / 2, cz = a.z + dz * L2 * (t0 + t1) / 2, g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; stage.add(g);
    for (const sd of [-1, 1]) { add(facadeBox(8, 11, len, 8), FAC, sd * (ALLEY_HW + 4.6), 5.5, 0, 0, g); add(new THREE.BoxGeometry(9, .8, len + 1), M.trim, sd * (ALLEY_HW + 4.6), 11.2, 0, 0, g); }
    add(new THREE.BoxGeometry(ALLEY_HW * 2 + 2, 2.6, len), M.brick, 0, 9.7, 0, 0, g); add(new THREE.BoxGeometry(ALLEY_HW * 2 + 18, .6, len + 1), M.roof, 0, 11.4, 0, 0, g);
    for (const e of [-1, 1]) { A.plane('school', 13, 1.6, 0, 9.8, e * (len / 2 + .05), e > 0 ? 0 : PI, g); add(new THREE.BoxGeometry(2.2, 2.2, .3), M.white, 0, 12.8, e * len / 2, 0, g); }
    nB++; K.taken.push([cx, cz, len / 2 + 10]); LM.hallwayWing = [Math.round(cx), Math.round(cz), Math.round(len)]; }
  // ---------- main school building (clock tower, columns, flagpole) ----------
  const flags = [];
  { const s = K.spot(30, { inn: true, maxClear: 44, key: 'mainSchool' }) || K.spot(30, { maxClear: 60, key: 'mainSchool' }); if (s) { nB++; const g = K.at(s);
      add(facadeBox(52, 14, 18, 8), FAC, 0, 7, -6, 0, g); add(new THREE.BoxGeometry(54, 1, 20), M.trim, 0, 14.5, -6, 0, g);
      add(facadeBox(12, 22, 12, 8), FAC, 0, 11, -4, 0, g); add(new THREE.ConeGeometry(8.6, 7, 4), M.roof, 0, 25.5, -4, PI / 4, g); add(new THREE.CylinderGeometry(3, 3, .4, 24), M.white, 0, 17.5, 2.05, 0, g, PI / 2);
      const lg = live(s), hand = add(new THREE.BoxGeometry(.3, 2.4, .2), M.black, 0, 17.5, 2.35, 0, lg); hand.geometry.translate(0, 1.1, 0); anim.push((dt, t) => { hand.rotation.z = -t * .2; });
      for (let k = -2; k <= 2; k++) add(new THREE.CylinderGeometry(.6, .7, 9, 10), M.white, k * 3, 4.5, 4.2, 0, g); add(new THREE.BoxGeometry(17, 1.2, 4), M.white, 0, 9.4, 4.2, 0, g); add(new THREE.BoxGeometry(16, .8, 3), M.gray, 0, .4, 6, 0, g);
      A.plane('school', 24, 3, 0, 12.5, 3.1, 0, g); const pole = add(new THREE.CylinderGeometry(.18, .22, 18, 8), M.metal, 18, 9, 8, 0, g); 
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4, 6, 1), new THREE.MeshLambertMaterial({ map: canvasTex(64, 40, c => { c.fillStyle = '#1a2a6a'; c.fillRect(0, 0, 64, 40); c.fillStyle = '#ff8a2a'; c.fillRect(0, 13, 64, 14); c.fillStyle = '#fff'; c.font = 'bold 22px Georgia'; c.fillText('♪', 26, 34); }), side: THREE.DoubleSide }));
      flag.position.set(20.1, 16.4, 8); lg.add(flag); flags.push(flag); } }
  // ---------- gym: barrel roof, big doors, scoreboard ----------
  { const s = K.spot(26, { maxClear: 46, key: 'gym' }); if (s) { nB++; const g = K.at(s);
      add(facadeBox(40, 12, 30, 8), FAC2, 0, 6, -4, 0, g); const roof = add(new THREE.CylinderGeometry(15.5, 15.5, 41, 18, 1, false, -PI / 2, PI), M.orange, 0, 7, -4, 0, g, 0, PI / 2); roof.scale.set(1, .5, 1);
      add(new THREE.BoxGeometry(10, 7, .4), M.navy, 0, 3.5, 11.1, 0, g); A.plane('gym', 30, 3.6, 0, 9.6, 11.15, 0, g); A.plane('score', 8, 4, 14, 15, 11.2, 0, g); add(new THREE.BoxGeometry(8.6, 4.6, .4), M.black, 14, 15, 10.9, 0, g); add(new THREE.CylinderGeometry(.3, .3, 6), M.metal, 14, 10, 10.9, 0, g); } }
  // ---------- band room: big windows, giant painted notes, a marching band practising on the lot ----------
  const band = [];
  { const s = K.spot(24, { maxClear: 46, key: 'bandRoom' }); if (s) { nB++; const g = K.at(s);
      add(facadeBox(30, 10, 16, 8), FAC3, 0, 5, -8, 0, g); add(new THREE.BoxGeometry(31, .8, 17), M.navy, 0, 10.4, -8, 0, g); A.plane('band', 20, 3.3, 0, 7.8, .05, 0, g); A.plane('concert', 14, 2.3, 0, 2.6, .06, 0, g);
      add(new THREE.BoxGeometry(26, .1, 12), M.gray, 0, .06, 7, 0, g);
      const inst = [[new THREE.TorusGeometry(.7, .18, 6, 14), M.gold], [new THREE.CylinderGeometry(.5, .5, .5, 12), M.white], [new THREE.CylinderGeometry(.05, .25, 1.2, 8), M.gold]];
      const lb = live(s); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const b = new THREE.Group(); b.position.set(-7.5 + c * 5, 0, 4 + r * 3.5); lb.add(b); const k = (r + c) % 3, sh = M.shirt[(r * 4 + c) % 6];
        add(new THREE.CylinderGeometry(.42, .5, 1.6, 8), M.navy, 0, .8, 0, 0, b); add(new THREE.CylinderGeometry(.5, .45, 1.2, 8), sh, 0, 2.2, 0, 0, b); add(new THREE.SphereGeometry(.42, 10, 8), M.skin[(r + c) % 4], 0, 3.2, 0, 0, b); add(new THREE.CylinderGeometry(.36, .4, .55, 10), M.white, 0, 3.7, 0, 0, b); add(new THREE.SphereGeometry(.12, 6, 5), M.orange, 0, 4.05, 0, 0, b);
        add(inst[k][0], inst[k][1], 0, 2.4, .6, 0, b, k === 0 ? 0 : PI / 2 * (k === 2 ? 1 : 0)); band.push([b, r * 4 + c]); }
      anim.push((dt, t) => band.forEach(([b, k]) => { b.position.y = Math.abs(Math.sin(t * 4.6 + (k % 2) * PI)) * .25; b.rotation.y = Math.sin(t * .9) * .4; })); } }
  // ---------- music classroom with a chalkboard staff and a piano in the yard ----------
  { const s = K.spot(16, { maxClear: 40, key: 'musicRoom' }); if (s) { nB++; const g = K.at(s);
      add(facadeBox(22, 8, 12, 8), FAC, 0, 4, -6, 0, g); add(new THREE.BoxGeometry(23, .8, 13), M.roof, 0, 8.4, -6, 0, g); A.plane('music', 9, 4.5, 0, 4.6, .06, 0, g);
      add(new THREE.BoxGeometry(4, 2, 1.6), M.black, 7, 1.2, 4, 0, g); add(new THREE.BoxGeometry(4, .3, .6), M.white, 7, 2.1, 4.9, 0, g); for (let k = 0; k < 7; k++) add(new THREE.BoxGeometry(.3, .15, .4), M.black, 5.3 + k * .55, 2.3, 4.85, 0, g);
      for (let k = 0; k < 4; k++) { add(new THREE.CylinderGeometry(.05, .05, 2.2), M.black, -8 + k * 2.4, 1.1, 4, 0, g); add(new THREE.BoxGeometry(1.4, .9, .05), M.black, -8 + k * 2.4, 2.3, 4, 0, g, -.4); } } }
  // ---------- buses, courts, football field + bleachers ----------
  const bus = (s) => { nB++; const g = K.at(s); g.rotation.y += PI / 2; add(new THREE.BoxGeometry(3.4, 3.4, 13), M.yellow, 0, 2.3, 0, 0, g); add(new THREE.BoxGeometry(3.42, .9, 13.02), M.glass, 0, 3.2, 0, 0, g); add(new THREE.BoxGeometry(3.4, 1.8, 2.2), M.yellow, 0, 1.5, 7.4, 0, g);
    add(new THREE.BoxGeometry(3.44, .2, 13.04), M.black, 0, 1.9, 0, 0, g); for (const z of [-4.5, 4.5]) for (const x of [-1.7, 1.7]) add(new THREE.CylinderGeometry(.7, .7, .5, 10), M.black, x, .7, z, 0, g, 0, PI / 2); A.plane('bus', 7, .9, 1.73, 2.6, 0, PI / 2, g); };
  for (let k = 0; k < 6; k++) { const s = K.site(Math.floor(N * (k * .17 + .1)) % N, -1, W / 2 + 14, 7.5); if (s) bus(s); }
  for (let k = 0; k < 2; k++) { const s = K.spot(16, { maxClear: 60 }); if (!s) continue; nB++; const g = K.at(s); add(new THREE.PlaneGeometry(26, 15), M.court, 0, .07, 0, 0, g, -PI / 2);
    for (const e of [-1, 1]) { add(new THREE.CylinderGeometry(.15, .15, 4.5), M.metal, e * 12, 2.25, 0, 0, g); add(new THREE.BoxGeometry(.2, 1.6, 2.4), M.white, e * 11.7, 4.4, 0, 0, g); add(new THREE.TorusGeometry(.5, .06, 4, 12), M.orange, e * 11.1, 3.7, 0, 0, g, PI / 2); }
    add(new THREE.PlaneGeometry(.2, 15), M.white, 0, .08, 0, 0, g, -PI / 2); }
  { const s = K.spot(40, { maxClear: 70, key: 'field' }); if (s) { nB++; const g = K.at(s); add(new THREE.PlaneGeometry(70, 36), M.turf, 0, .06, 0, 0, g, -PI / 2); for (let k = -3; k <= 3; k++) add(new THREE.PlaneGeometry(.4, 34), M.white, k * 10, .08, 0, 0, g, -PI / 2);
      for (const e of [-1, 1]) { add(new THREE.CylinderGeometry(.2, .2, 4), M.yellow, e * 34, 2, 0, 0, g); add(new THREE.BoxGeometry(.3, .3, 6), M.yellow, e * 34, 4, 0, 0, g); for (const z of [-3, 3]) add(new THREE.CylinderGeometry(.15, .15, 6), M.yellow, e * 34, 7, z, 0, g); }
      for (let r = 0; r < 5; r++) add(new THREE.BoxGeometry(50, .5, 1.6), r % 2 ? M.metal : M.navy, 0, .8 + r * 1.1, 21 + r * 1.6, 0, g); A.plane('tigers', 14, 3.5, 0, 8, 29, PI, g); } }
  // ---------- outdoor locker breezeway along the road + trees + bike racks ----------
  const lockerTex = canvasTex(128, 64, g => { for (let x = 0; x < 128; x += 16) { g.fillStyle = ['#ff8a2a', '#2a5ab0', '#ffd34d', '#2ac88a'][(x / 16) % 4]; g.fillRect(x, 0, 15, 64); g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 6; y < 18; y += 3) g.fillRect(x + 4, y, 8, 1); g.fillStyle = '#eee'; g.fillRect(x + 11, 30, 2, 6); } }, true);
  const lockerM = L(0xffffff, { map: lockerTex });
  K.roadside(14, W / 2 + 11, 3, (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); add(new THREE.BoxGeometry(6, 3.2, 1.2), lockerM, 0, 1.6, -.5, 0, g); add(new THREE.BoxGeometry(7, .3, 4), M.navy, 0, 4.6, .6, 0, g); for (const sx of [-3.2, 3.2]) add(new THREE.CylinderGeometry(.12, .12, 4.6), M.metal, sx, 2.3, 2.2, 0, g); }, .35);
  const tree = (x, z, h) => { const g = new THREE.Group(); g.position.set(x, 0, z); stage.add(g); add(new THREE.CylinderGeometry(.35, .5, h * .5, 7), M.trunk, 0, h * .25, 0, 0, g); const m = M.leaf[Math.floor(rnd() * 3)]; add(new THREE.SphereGeometry(h * .3, 9, 7), m, 0, h * .62, 0, 0, g); add(new THREE.SphereGeometry(h * .22, 8, 6), m, h * .18, h * .52, h * .08, 0, g); };
  K.roadside(7, W / 2 + 10, 2.5, (x, z) => tree(x, z, 7 + rnd() * 5), .55);
  K.scatter(220, [K.bbox[0] - 110, K.bbox[1] + 110, K.bbox[2] - 110, K.bbox[3] + 110], 3, (x, z) => tree(x, z, 8 + rnd() * 6));
  K.roadside(40, W / 2 + 9, 2, (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); for (const px of [-2.2, 2.2]) add(new THREE.CylinderGeometry(.12, .12, 3), M.metal, px, 1.5, 0, 0, g); A.plane(rnd() < .5 ? 'slow' : 'tigers', 5, 1.25, 0, 2.6, .1, 0, g); }, .8);
  // ---------- light poles with music-note banners, portable classrooms, playground, tiger drummer mascot ----------
  const banTex = canvasTex(128, 256, g => { for (let k = 0; k < 2; k++) { const x = k * 64; g.fillStyle = k ? '#ff8a2a' : '#1a2a6a'; g.fillRect(x, 0, 64, 256); g.fillStyle = k ? '#1a2a6a' : '#ffd34d'; g.font = 'bold 72px Georgia'; g.textAlign = 'center'; g.fillText(k ? '♫' : '♪', x + 32, 120); g.font = 'bold 22px Arial Black'; g.fillText('TIGERS', x + 32, 200); } });
  const banM = new THREE.MeshLambertMaterial({ map: banTex, side: THREE.DoubleSide });
  K.roadside(12, W / 2 + 8.8, 1, (x, z, ry, i) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); add(new THREE.CylinderGeometry(.16, .2, 9, 7), M.metal, 0, 4.5, 0, 0, g); add(new THREE.BoxGeometry(.2, .2, 2.4), M.metal, 0, 9, .9, 0, g); add(new THREE.BoxGeometry(.6, .3, 1), M.white, 0, 8.8, 1.9, 0, g);
    const b = add(new THREE.PlaneGeometry(1.3, 2.6), banM, .05, 6.6, .8, PI / 2, g); const uv = b.geometry.attributes.uv, k = (i / 12 | 0) % 2; for (let v = 0; v < 4; v++) uv.setX(v, (uv.getX(v) + k) / 2); }, .8);
  for (let k = 0; k < 4; k++) { const s = K.spot(9, { maxClear: 36 }); if (!s) continue; nB++; const g = K.at(s); add(facadeBox(16, 4.4, 8, 8), FAC3, 0, 2.9, 0, 0, g); add(new THREE.BoxGeometry(16.6, .4, 8.6), M.roof, 0, 5.3, 0, 0, g); add(new THREE.BoxGeometry(3, .8, 2), M.gray, 0, .4, 5, 0, g);
    for (const x of [-7, 7]) add(new THREE.BoxGeometry(.6, .8, .6), M.gray, x, .4, 0, 0, g); A.plane(k % 2 ? 'concert' : 'slow', 7, 1.2, 0, 3.4, 4.05, 0, g); }
  { const s = K.spot(12, { maxClear: 40, key: 'playground' }); if (s) { nB++; const g = K.at(s); add(new THREE.CircleGeometry(11, 20), L(0xd8b080), 0, .05, 0, 0, g, -PI / 2);
      for (const x of [-4, 4]) for (const z of [-1.5, 1.5]) add(new THREE.CylinderGeometry(.12, .12, 5.5), M.orange, x, 2.6, z, 0, g, z > 0 ? -.25 : .25); add(new THREE.CylinderGeometry(.12, .12, 8.4), M.orange, 0, 5.2, 0, 0, g, 0, PI / 2);
      for (const x of [-2, 2]) { add(new THREE.BoxGeometry(1.2, .15, .5), M.navy, x, 1.2, 0, 0, g); for (const sx of [-.5, .5]) add(new THREE.CylinderGeometry(.03, .03, 3.9), M.metal, x + sx, 3.2, 0, 0, g); }
      add(new THREE.BoxGeometry(2.4, 3, 2.4), M.yellow, 7, 1.5, 4, 0, g); const sl = add(new THREE.BoxGeometry(1.6, .2, 6), M.green, 7, 1.6, 7.5, 0, g, .5); } }
  { const s = K.site(Math.floor(N * .985), 1, W / 2 + 13, 5, 'mascot') || K.site(14, -1, W / 2 + 13, 5, 'mascot'); if (s) { nB++; const g = K.at(s); add(new THREE.CylinderGeometry(3, 3.4, 1.2, 16), M.gray, 0, .6, 0, 0, g);
      add(new THREE.CylinderGeometry(1.3, 1.5, 3, 10), M.orange, 0, 2.8, 0, 0, g); add(new THREE.SphereGeometry(1.3, 12, 10), M.orange, 0, 5.2, 0, 0, g); for (const sx of [-.8, .8]) add(new THREE.ConeGeometry(.4, .7, 6), M.orange, sx, 6.4, 0, 0, g); add(new THREE.SphereGeometry(.6, 8, 6), M.white, 0, 5, 1.05, 0, g);
      for (const [sx, sz] of [[-.9, 1.25], [0, 1.31], [.9, 1.25], [-.5, .8], [.5, .8]]) add(new THREE.BoxGeometry(.18, .9, .1), M.black, sx * .9, 5.3 + Math.abs(sx) * .2, sz * .97, 0, g, 0, sx * .3);
      add(new THREE.CylinderGeometry(1.6, 1.6, 1.4, 16), M.navy, 0, 2.8, 1.6, 0, g, PI / 2); for (const z of [.9, 2.3]) add(new THREE.CylinderGeometry(1.62, 1.62, .1, 16), M.white, 0, 2.8, z, 0, g, PI / 2); A.plane('tigers', 4.8, 1.2, 0, .7, 3.05, 0, g); } }
  // ---------- cheering classmates with pennants ----------
  const kids = [];
  K.roadside(17, W / 2 + 9.5, 3, (x, z, ry, i) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); for (let k = 0; k < 4; k++) { const b = new THREE.Group(); b.position.set(-2.4 + k * 1.6, 0, rnd()); g.add(b);
      const sh = M.shirt[Math.floor(rnd() * 6)]; b.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .35, 1.1, 7), sh)); b.children[0].position.y = 1.1; const hd = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), M.skin[Math.floor(rnd() * 4)]); hd.position.y = 1.95; b.add(hd);
      const hr = new THREE.Mesh(new THREE.SphereGeometry(.32, 8, 6, 0, PI * 2, 0, PI / 2), M.hair[Math.floor(rnd() * 4)]); hr.position.y = 2; b.add(hr); for (const sx of [-.3, .3]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .6), M.navy); leg.position.set(sx * .5, .3, 0); b.add(leg); }
      if (k % 2) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .6), A.mat); p.geometry = new THREE.PlaneGeometry(1.2, .6); const R = A.R.pennant, uv = p.geometry.attributes.uv; for (let v = 0; v < 4; v++) uv.setXY(v, v % 2 ? R[2] : R[0], v < 2 ? R[3] : R[1]); p.position.set(.6, 2.6, 0); b.add(p); }
      kids.push([b, rnd() * 6]); } }, .5);
  anim.push((dt, t) => { kids.forEach(([b, ph]) => { b.position.y = Math.max(0, Math.sin(t * 6 + ph)) * .35; }); flags.forEach(f => { f.rotation.y = Math.sin(t * 2) * .25; }); });
  const baked = K.bake();
  return { stats: { buildings: nB, bakedMeshes: baked.length, landmarks: LM }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); } };
}
