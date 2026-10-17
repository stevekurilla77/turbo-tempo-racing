// v22 Marching Band Stadium: floodlit night stadium. Football field with an animated marching band that morphs formations,
// grandstands with crowds, east grandstand over the players' tunnel, floodlight towers, scoreboard, band-bus parking lot.
import { kit, THREE, canvasTex } from './scen.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildStadium(ctx) {
  const { scene, P, S, T, N, W, E, ALLEY_A, ALLEY_B, ALLEY_HW, brassMat } = ctx; const K = kit(ctx, 31), { rnd, add, stage, anim, LM } = K;
  const sky = buildSky(scene, { top: 0x050820, mid: 0x152560, horizon: 0x4a5aa8, low: 0x1a1a3a, sunDir: [-600, -40, -300], sunCol: 0x4a5aa8, moonDir: [300, 260, -500], stars: 1.5,
    skyline: { col: '#141a3a', win: '#ffe6a0', city: true, height: 110 }, clouds: [[0x3a4a8a, 10, 640, 120, 200]] });
  const M = { white: new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }), steel: new THREE.MeshLambertMaterial({ color: 0x8a90a0 }), dark: new THREE.MeshLambertMaterial({ color: 0x22283a }), blue: new THREE.MeshLambertMaterial({ color: 0x1a3a8a }),
    gold: new THREE.MeshLambertMaterial({ color: 0xffd34d }), red: new THREE.MeshLambertMaterial({ color: 0xc0203a }), lamp: new THREE.MeshBasicMaterial({ color: 0xf8fbff }), asphalt: new THREE.MeshLambertMaterial({ color: 0x3a3a44 }), bus: new THREE.MeshLambertMaterial({ color: 0xf0b020 }), glass: new THREE.MeshBasicMaterial({ color: 0x2a3a5a }) };
  // ---------- atlas ----------
  const A = K.atlas([
    ['score', 1024, 384, (g, x, y, w, h) => { g.fillStyle = '#0a0a14'; g.fillRect(x, y, w, h); g.strokeStyle = '#ffd34d'; g.lineWidth = 12; g.strokeRect(x + 8, y + 8, w - 16, h - 16); g.textAlign = 'center'; g.fillStyle = '#ffd34d'; g.font = 'bold 70px Arial Black, Impact'; g.fillText('MARCHING BAND STADIUM', x + w / 2, y + 100);
      g.font = 'bold 56px Courier New, monospace'; g.fillStyle = '#ff5a3a'; g.fillText('BRASS  88', x + w / 4 + 20, y + 210); g.fillStyle = '#5ad8ff'; g.fillText('REEDS  86', x + 3 * w / 4 - 20, y + 210); g.fillStyle = '#7aff8a'; g.font = 'bold 48px Arial Black'; g.fillText('♪  GO BAND GO!  ♪', x + w / 2, y + 320); }],
    ['crowd', 512, 128, (g, x, y, w, h) => { g.fillStyle = '#1a1a2a'; g.fillRect(x, y, w, h); const C = ['#ffd34d', '#c0203a', '#1a3a8a', '#fff', '#ff8a3a', '#7ad8ff', '#e8b890', '#8a5a3a', '#f0c8a0']; for (let r = 0; r < 4; r++) for (let c = 0; c < 32; c++) { const cx = x + c * 16 + 8 + (r % 2) * 4, cy = y + r * 32 + 20; g.fillStyle = C[(c * 7 + r * 3) % C.length]; g.fillRect(cx - 6, cy, 12, 12); g.fillStyle = C[6 + (c + r) % 3]; g.beginPath(); g.arc(cx, cy - 4, 5, 0, 7); g.fill(); } }],
    ['goband', 512, 128, K.textSign('GO BAND!', '#c0203a', '#fff', 'bold 72px Arial Black, Impact', '#ffd34d')],
    ['brassup', 512, 128, K.textSign('BRASS UP!', '#1a3a8a', '#ffd34d', 'bold 72px Arial Black, Impact', '#fff')],
    ['drumline', 512, 128, K.textSign('DRUMLINE ♪ LOUD', '#ffd34d', '#1a1a2a', 'bold 56px Arial Black, Impact')],
    ['busside', 512, 128, (g, x, y, w, h) => { g.fillStyle = '#f0b020'; g.fillRect(x, y, w, h); g.fillStyle = '#1a1a2a'; g.font = 'bold 44px Arial Black'; g.textAlign = 'center'; g.fillText('BAND BUS', x + w / 2, y + 80); g.fillStyle = '#2a3a5a'; for (let k = 0; k < 7; k++) g.fillRect(x + 20 + k * 70, y + 8, 56, 26); }],
  ]);
  // ---------- infield: football field ----------
  const [cx, cz] = [130, 10]; let FW = 74, FL = 170; while (!(K.free(cx - FW / 2, cz - FL / 2, 2, 6) && K.free(cx + FW / 2, cz + FL / 2, 2, 6) && K.free(cx - FW / 2, cz + FL / 2, 2, 6) && K.free(cx + FW / 2, cz - FL / 2, 2, 6)) && FL > 60) { FW *= .93; FL *= .93; }
  const fieldTex = canvasTex(256, 512, (g, w, h) => { for (let k = 0; k < 20; k++) { g.fillStyle = k % 2 ? '#2f7a32' : '#378a3a'; g.fillRect(0, k * h / 20, w, h / 20 + 1); }
    const ez = h / 12; g.fillStyle = '#1a3a8a'; g.fillRect(0, 0, w, ez); g.fillStyle = '#c0203a'; g.fillRect(0, h - ez, w, ez); g.fillStyle = '#fff'; g.font = 'bold 30px Arial Black'; g.textAlign = 'center'; g.fillText('BRASS', w / 2, ez * .72); g.fillText('BAND', w / 2, h - ez * .28);
    g.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 0; k <= 10; k++) g.fillRect(0, ez + k * (h - 2 * ez) / 10 - 1, w, 2); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
    g.font = 'bold 18px Arial'; for (let k = 1; k < 10; k++) { const yd = (k <= 5 ? k : 10 - k) * 10; g.fillText(String(yd), 24, ez + k * (h - 2 * ez) / 10 + 6); g.fillText(String(yd), w - 24, ez + k * (h - 2 * ez) / 10 + 6); }
    g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(w / 2, h / 2, 26, 0, 7); g.fill(); g.fillStyle = '#1a1a2a'; g.font = 'bold 36px Arial'; g.fillText('♪', w / 2, h / 2 + 12); });
  add(new THREE.PlaneGeometry(FW, FL), new THREE.MeshLambertMaterial({ map: fieldTex }), cx, .04, cz, 0, stage, -PI / 2);
  for (const sz of [-1, 1]) { const z = cz + sz * (FL / 2 + 1); add(new THREE.CylinderGeometry(.25, .25, 6), M.gold, cx, 3, z); add(new THREE.CylinderGeometry(.2, .2, 12), M.gold, cx, 6, z, 0, stage, 0, PI / 2); for (const dx of [-6, 6]) add(new THREE.CylinderGeometry(.2, .2, 9), M.gold, cx + dx, 10.5, z); }
  // sideline benches + drum major podium
  for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(1.2, .8, FL * .35), M.blue, cx + sx * (FW / 2 + 4), .4, cz); }
  { const px = cx - FW / 2 - 7; add(new THREE.BoxGeometry(4, 3, 4), M.red, px, 1.5, cz); add(new THREE.BoxGeometry(.9, 1.8, .6), M.white, px, 3.9, cz); add(new THREE.CylinderGeometry(.45, .45, 1.4, 10), M.white, px, 5.5, cz); add(new THREE.ConeGeometry(.3, 1.2, 8), M.gold, px, 6.8, cz); add(new THREE.CylinderGeometry(.08, .08, 3), M.gold, px + .8, 4.6, cz, 0, stage, 0, .4); }
  K.taken.push([cx, cz, Math.max(FW, FL) / 2]);
  // ---------- marching band (instanced, animated formations) ----------
  const NB = 64, body = new THREE.InstancedMesh(new THREE.BoxGeometry(.9, 1.7, .6), new THREE.MeshLambertMaterial({ color: 0xc0203a }), NB), hat = new THREE.InstancedMesh(new THREE.CylinderGeometry(.42, .42, .9, 8), new THREE.MeshLambertMaterial({ color: 0xf6f6f6 }), NB),
    plume = new THREE.InstancedMesh(new THREE.ConeGeometry(.22, .8, 6), new THREE.MeshLambertMaterial({ color: 0xffd34d }), NB), horn = new THREE.InstancedMesh(new THREE.ConeGeometry(.45, .9, 10, 1, true), brassMat, NB);
  [body, hat, plume, horn].forEach(m => { m.frustumCulled = false; scene.add(m); });
  const sc = Math.min(1, FW / 74); const block = [], ring = [], note = [];
  for (let k = 0; k < NB; k++) { block.push([((k % 8) - 3.5) * 5 * sc, (Math.floor(k / 8) - 3.5) * 6 * sc]); const a = k / NB * PI * 2; ring.push([Math.cos(a) * 26 * sc, Math.sin(a) * 40 * sc]); }
  for (let k = 0; k < 30; k++) { const r = Math.sqrt(k / 30) * 11, a = k * 2.4; note.push([(-9 + Math.cos(a) * r * 1.3) * sc, (28 + Math.sin(a) * r) * sc]); }
  for (let k = 0; k < 20; k++) note.push([3 * sc, (25 - k * 3.2) * sc]); for (let k = 0; k < 14; k++) note.push([(3 + k * 1.2) * sc, (-38 + k * 2 - Math.sin(k / 13 * PI) * 6) * sc]);
  const forms = [block, note, ring, note], dm = new THREE.Object3D();
  anim.push((dt, t) => { const per = 9, f = Math.floor(t / per) % forms.length, u = Math.min(1, (t % per) / 4), e = u * u * (3 - 2 * u), A0 = forms[f], B0 = forms[(f + 1) % forms.length];
    for (let k = 0; k < NB; k++) { const x = cx + A0[k][0] + (B0[k][0] - A0[k][0]) * e, z = cz + A0[k][1] + (B0[k][1] - A0[k][1]) * e, bob = Math.abs(Math.sin(t * 6 + k * .3)) * .25;
      dm.position.set(x, .9 + bob, z); dm.rotation.set(0, PI / 2, 0); dm.updateMatrix(); body.setMatrixAt(k, dm.matrix); dm.position.y = 2.2 + bob; dm.updateMatrix(); hat.setMatrixAt(k, dm.matrix); dm.position.y = 3 + bob; dm.updateMatrix(); plume.setMatrixAt(k, dm.matrix);
      dm.position.set(x + .7, 1.4 + bob, z); dm.rotation.set(0, 0, -PI / 2); dm.updateMatrix(); horn.setMatrixAt(k, dm.matrix); }
    body.instanceMatrix.needsUpdate = hat.instanceMatrix.needsUpdate = plume.instanceMatrix.needsUpdate = horn.instanceMatrix.needsUpdate = true; });
  // ---------- grandstands around the outside of the track ----------
  const crowdM = A.mat; let nStands = 0;
  const grandstand = (x, z, ry, w, rows = 5, y0 = 0, roof = true) => { const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = ry; stage.add(g); nStands++;
    for (let r = 0; r < rows; r++) { add(new THREE.BoxGeometry(w, 2.2 * (r + 1), 3), M.dark, 0, 1.1 * (r + 1), -r * 3, 0, g); A.plane('crowd', w, 2.1, 0, 2.2 * (r + 1) + .9, -r * 3 + 1.2, 0, g); }
    add(new THREE.BoxGeometry(w, 2.2 * rows + 4, .6), M.blue, 0, (2.2 * rows + 4) / 2, -rows * 3 + 1, 0, g);
    if (roof) { add(new THREE.BoxGeometry(w + 1, .5, rows * 3 + 2), M.steel, 0, 2.2 * rows + 5, -rows * 1.5 + 1, 0, g, -.08); for (const px of [-w / 2, w / 2]) add(new THREE.BoxGeometry(.5, 2.2 * rows + 5, .5), M.steel, px, (2.2 * rows + 5) / 2, -rows * 3 + 1.5, 0, g); }
    if (rnd() < .5) A.plane(rnd() < .5 ? 'goband' : 'brassup', Math.min(10, w * .6), Math.min(10, w * .6) / 4, 0, 2.2 * rows + 2, -rows * 3 + .65, 0, g); };
  const ctr = K.center;
  for (let i = 0; i < N; i += 9) { const out = Math.sign(S[i].x * (P[i].x - ctr[0]) + S[i].z * (P[i].z - ctr[1])) || 1; const off = W / 2 + 13, x = P[i].x + S[i].x * out * off, z = P[i].z + S[i].z * out * off;
    if (!K.free(x, z, 7, 4)) continue; K.taken.push([x, z, 9]); grandstand(x, z, Math.atan2(-S[i].x * out, -S[i].z * out), 19, 5 + (i % 3 === 0 ? 1 : 0)); }
  // east grandstand sitting on top of the players' tunnel (the tunnel runs underneath)
  { const a = P[ALLEY_A], b = P[ALLEY_B], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, sx = -uz, sz = ux, toField = Math.sign(sx * (cx - a.x) + sz * (cz - a.z)) || 1;
    for (let t = .3; t <= .7; t += .1) { const x = a.x + ux * L * t - sx * toField * (ALLEY_HW + 6), z = a.z + uz * L * t - sz * toField * (ALLEY_HW + 6); if (K.clear(x, z) < W / 2 + 22) continue;
      grandstand(x, z, Math.atan2(sx * toField, sz * toField), L * .1 + 1, 6, 9.8, false); }
    LM.eastStand = [Math.round(a.x + ux * L * .5), Math.round(a.z + uz * L * .5)]; }
  // ---------- floodlight towers ----------
  const coneM = new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: .06, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }); let nLights = 0;
  for (const [i, sd] of [[30, 1], [110, 1], [200, 1], [330, 1], [420, 1], [500, 1], [565, 1]]) { const out = Math.sign(S[i].x * (P[i].x - ctr[0]) + S[i].z * (P[i].z - ctr[1])) || 1; const o = W / 2 + 34, x = P[i].x + S[i].x * out * o, z = P[i].z + S[i].z * out * o; if (!K.free(x, z, 3, 6)) continue; K.taken.push([x, z, 3]); nLights++;
    add(new THREE.CylinderGeometry(.6, 1, 42, 8), M.steel, x, 21, z); const ry = Math.atan2(ctr[0] - x, ctr[1] - z); const g = new THREE.Group(); g.position.set(x, 43, z); g.rotation.y = ry; stage.add(g);
    add(new THREE.BoxGeometry(9, 5, 1), M.dark, 0, 0, 0, 0, g); for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) add(new THREE.PlaneGeometry(1.4, 1.2), M.lamp, -3.6 + c * 1.8, -1.6 + r * 1.6, .55, 0, g);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(26, 60, 16, 1, true), coneM); const d = Math.hypot(ctr[0] - x, ctr[1] - z); cone.position.set(x + (ctr[0] - x) / d * 22, 22, z + (ctr[1] - z) / d * 22); cone.lookAt(x, 43, z); cone.rotateX(-PI / 2); scene.add(cone); }
  // ---------- scoreboard ----------
  { const s = K.site(5, -1, W / 2 + 40, 14, 'scoreboard') || K.site(300, 1, W / 2 + 40, 14, 'scoreboard'); if (s) { const g = K.at(s); for (const px of [-10, 10]) add(new THREE.BoxGeometry(1.2, 22, 1.2), M.steel, px, 11, -1, 0, g); add(new THREE.BoxGeometry(30, 12, 1.4), M.dark, 0, 26, -1, 0, g); A.plane('score', 28, 10.5, 0, 26, -.25, 0, g); } }
  // ---------- parking lot with band buses beyond the bulge ----------
  { const s = K.site(300, 1, W / 2 + 34, 22, 'parking'); if (s) { const g = K.at(s); add(new THREE.PlaneGeometry(56, 40), M.asphalt, 0, .03, -6, 0, g, -PI / 2);
      for (let k = 0; k < 4; k++) { const bx = -21 + k * 14; add(new THREE.BoxGeometry(3.2, 3.6, 13), M.bus, bx, 2, -6, 0, g); A.plane('busside', 12, 3, bx + 1.62, 2.4, -6, PI / 2, g); A.plane('busside', 12, 3, bx - 1.62, 2.4, -6, -PI / 2, g); add(new THREE.BoxGeometry(2.8, 1.2, .1), M.glass, bx, 2.8, .55, 0, g);
        for (const [wx, wz] of [[-1.4, -10], [1.4, -10], [-1.4, -2], [1.4, -2]]) add(new THREE.CylinderGeometry(.6, .6, .5, 10), M.dark, bx + wx, .6, wz, 0, g, 0, PI / 2); } } }
  // ---------- sideline banners + pennants ----------
  K.roadside(30, W / 2 + 9.3, 2, (x, z, ry, i) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); for (const px of [-3, 3]) add(new THREE.BoxGeometry(.2, 2.4, .2), M.steel, px, 1.2, 0, 0, g); A.plane(['goband', 'brassup', 'drumline'][i % 3], 6.2, 1.55, 0, 1.6, .12, 0, g); }, .6);
  // camera flashes twinkling in the crowd
  K.motes(70, [K.bbox[0] - 40, K.bbox[1] + 40, K.bbox[2] - 40, K.bbox[3] + 40], 4, 14, 0xffffff, 1.4);
  const baked = K.bake();
  return { stats: { buildings: nStands, lights: nLights, bakedMeshes: baked.length, landmarks: { ...LM, field: [cx, cz, Math.round(FW), Math.round(FL)] } }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); } };
}
