// v22 per-track looks: road surfaces, shortcut styles, rolling hill hazards. Original canvas art.
const R = Math.random;
const speckle = (g, w, h, n, cols, s = 2) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(R() * w, R() * h, s, s); } };
const planks = (g, w, h, hue, sat, lit, step = 8, vertical = false) => { for (let p = 0; p < (vertical ? w : h); p += step) { g.fillStyle = `hsl(${hue},${sat}%,${lit + R() * 8 - 4}%)`; vertical ? g.fillRect(p, 0, step - 1, h) : g.fillRect(0, p, w, step - 1); g.fillStyle = 'rgba(0,0,0,.4)'; vertical ? g.fillRect(p + step - 1, 0, 1, h) : g.fillRect(0, p + step - 1, w, 1); } };
const centerDash = (g, w, h, col, len = 30) => { g.fillStyle = col; for (let y = 0; y < h; y += 64) g.fillRect(w / 2 - 3, y, 6, len); };
export const SURFACES = {
  stadium: { post: 0xf0f0f0,
    road: ct => ct(256, 256, (g, w, h) => { g.fillStyle = '#b8483a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2400, ['rgba(0,0,0,.08)', 'rgba(255,200,180,.08)']); g.fillStyle = 'rgba(255,255,255,.85)'; for (const x of [6, 64, 128, 192, w - 11]) g.fillRect(x, 0, x === 6 || x === w - 11 ? 5 : 3, h); }, true),
    curb: ct => ct(8, 64, g => { g.fillStyle = '#1a3a8a'; g.fillRect(0, 0, 8, 32); g.fillStyle = '#ffd34d'; g.fillRect(0, 32, 8, 32); }, true),
    walk: ct => ct(64, 64, g => { g.fillStyle = '#3a8a3a'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#46a046'; g.fillRect(0, 0, 64, 32); speckle(g, 64, 64, 120, ['rgba(0,0,0,.1)'], 1); }, true),
    ramp: ct => ct(256, 64, g => { for (let x = 0; x < 256; x += 32) { g.fillStyle = (x / 32) % 2 ? '#1a3a8a' : '#ffd34d'; g.fillRect(x, 0, 32, 64); } }),
    wall: ct => ct(64, 32, g => { g.fillStyle = '#9a9aa8'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#1a3a8a'; g.fillRect(0, 22, 64, 6); }, true) },
  pool: { post: 0x40c8e8,
    road: ct => ct(256, 256, (g, w, h) => { g.fillStyle = '#5a8a98'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2200, ['rgba(255,255,255,.06)', 'rgba(0,40,60,.08)']); g.strokeStyle = 'rgba(200,250,255,.18)'; g.lineWidth = 3;
      for (let y = 20; y < h; y += 48) { g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x / 20) * 6); g.stroke(); } centerDash(g, w, h, '#fff27a'); g.fillStyle = '#fff'; g.fillRect(6, 0, 5, h); g.fillRect(w - 11, 0, 5, h); }, true),
    curb: ct => ct(8, 64, g => { g.fillStyle = '#ff6a3a'; g.fillRect(0, 0, 8, 32); g.fillStyle = '#fff'; g.fillRect(0, 32, 8, 32); }, true),
    walk: ct => ct(64, 64, g => { for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { g.fillStyle = (x + y) % 32 ? '#e8f8ff' : '#7ad8f0'; g.fillRect(x, y, 15, 15); } }, true),
    ramp: ct => ct(256, 64, g => { for (let x = 0; x < 256; x += 32) { g.fillStyle = ['#ff5a8a', '#ffd34d', '#40d8ff', '#7aff8a'][(x / 32) % 4]; g.fillRect(x, 0, 32, 64); } }),
    wall: ct => ct(64, 32, g => { g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#40c8e8'; g.fillRect(0, 0, 64, 6); }, true) },
  bayou: { post: 0x4a3a28,
    road: ct => ct(256, 256, (g, w, h) => { g.fillStyle = '#5a4a36'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2600, ['rgba(20,40,10,.18)', 'rgba(140,120,80,.12)', 'rgba(60,90,40,.2)'], 3);
      g.fillStyle = 'rgba(60,100,40,.35)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 6 + R() * 12, 3 + R() * 6, R() * 3, 0, 7); g.fill(); } centerDash(g, w, h, 'rgba(240,220,150,.55)'); }, true),
    curb: ct => ct(8, 64, g => { g.fillStyle = '#4a3420'; g.fillRect(0, 0, 8, 64); g.fillStyle = '#5a8a3a'; g.fillRect(0, 0, 8, 20); g.fillRect(0, 40, 8, 8); }, true),
    walk: ct => ct(64, 64, g => { g.fillStyle = '#3a3a22'; g.fillRect(0, 0, 64, 64); speckle(g, 64, 64, 200, ['#4a6a2a', '#2a2a18', '#5a5a32'], 2); }, true),
    ramp: ct => ct(256, 64, g => planks(g, 256, 64, 30, 30, 30, 16, true)),
    wall: ct => ct(64, 32, g => { g.fillStyle = '#4a3a28'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#4a7a2a'; g.fillRect(0, 0, 64, 8); }, true) },
  forest: { post: 0x8a6a3a,
    road: ct => ct(256, 256, (g, w, h) => { g.fillStyle = '#7a6a48'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2400, ['rgba(60,40,20,.15)', 'rgba(200,180,120,.12)'], 3);
      for (let i = 0; i < 70; i++) { g.fillStyle = ['#c87a2a', '#e0a83a', '#8aa83a', '#a84a2a'][i % 4]; g.save(); g.translate(R() * w, R() * h); g.rotate(R() * 6); g.beginPath(); g.ellipse(0, 0, 5, 2.5, 0, 0, 7); g.fill(); g.restore(); }
      g.fillStyle = 'rgba(255,250,220,.5)'; g.fillRect(6, 0, 4, h); g.fillRect(w - 10, 0, 4, h); }, true),
    curb: ct => ct(8, 64, g => { g.fillStyle = '#8a8a80'; g.fillRect(0, 0, 8, 30); g.fillStyle = '#5a8a3a'; g.fillRect(0, 32, 8, 32); }, true),
    walk: ct => ct(64, 64, g => { g.fillStyle = '#5a9a3a'; g.fillRect(0, 0, 64, 64); speckle(g, 64, 64, 240, ['#4a8a2a', '#6aaa4a'], 2); speckle(g, 64, 64, 10, ['#fff', '#ffe060', '#ff8ad0'], 3); }, true),
    ramp: ct => ct(256, 64, g => planks(g, 256, 64, 35, 40, 38, 16, true)),
    wall: ct => ct(64, 32, g => { g.fillStyle = '#7a7a70'; g.fillRect(0, 0, 64, 32); speckle(g, 64, 32, 60, ['#5a8a3a', '#6a6a60'], 3); }, true) },
};
// ---------- shortcut styles ----------
const sign = (bg, fg, border, font) => (g, txt) => { g.fillStyle = bg; g.fillRect(0, 0, 512, 96); g.strokeStyle = border; g.lineWidth = 7; g.strokeRect(5, 5, 502, 86); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.fillText(txt, 256, 62); };
const along = (o, every, fn) => { const n = Math.max(1, Math.round((o.t1 - o.t0) * o.L / every)); for (let k = 0; k <= n; k++) fn(o.t0 + (o.t1 - o.t0) * k / n, k); };
const box = (o, par, mat, w, h, d, t, u, y, ry = 0) => { const m = new o.THREE.Mesh(new o.THREE.BoxGeometry(w, h, d), mat); const [x, z] = o.at(t, u); m.position.set(x, y, z); m.rotation.y = o.rotY + ry; par.add(m); return m; };
export const ALLEY_STYLES = {
  // Marching Band Stadium: players' tunnel under the east grandstand (concrete, light strips, team banners)
  stadium: { wallH: 9, edge: 0xffd34d, post: 0x1a3a8a, signDraw: sign('#1a3a8a', '#ffd34d', '#fff', 'bold 40px Arial Black, Impact'),
    floor: ct => ct(64, 64, g => { g.fillStyle = '#5a5a66'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#ffd34d'; g.fillRect(30, 0, 4, 32); speckle(g, 64, 64, 80, ['rgba(255,255,255,.08)']); }, true),
    wall: ct => ct(64, 64, g => { g.fillStyle = '#b8b8c4'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#1a3a8a'; g.fillRect(0, 36, 64, 10); g.fillStyle = '#ffd34d'; g.fillRect(0, 46, 64, 3); g.strokeStyle = 'rgba(0,0,0,.15)'; g.strokeRect(0, 0, 64, 64); }, true),
    deco(o) { const { THREE } = o, st = new THREE.Group(), roofM = new THREE.MeshLambertMaterial({ color: 0x6a6a78 }), lit = new THREE.MeshBasicMaterial({ color: 0xf0f8ff }), ban = [0xc0203a, 0x1a3a8a, 0xffd34d].map(c => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
      box(o, st, roofM, o.HW * 2 + 3, .8, (o.t1 - o.t0) * o.L, (o.t0 + o.t1) / 2, 0, 9.3);
      along(o, 8, (t, k) => { box(o, st, lit, 1.2, .12, 3.2, t, 0, 8.85); for (const sd of [-1, 1]) if (k % 2) { const m = box(o, st, ban[k % 3], .05, 3.4, 1.8, t, sd * (o.HW - .02), 5.4); m.position.y = 5.4; } });
      o.bake(st, o.scene); } },
  // Splash Tempo: translucent water-slide tube with a flowing water floor and ring lights
  slide: { wallH: 7, wallOpacity: .45, edge: 0xffffff, post: 0x40c8e8, signDraw: sign('#ff5a8a', '#fff', '#ffd34d', 'bold 40px Arial Black, Impact'),
    floor: ct => ct(64, 64, g => { const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#1a8ad8'); gr.addColorStop(.5, '#5ad8ff'); gr.addColorStop(1, '#1a8ad8'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; for (let y = 4; y < 64; y += 16) { g.beginPath(); for (let x = 0; x <= 64; x += 4) g.lineTo(x, y + Math.sin(x / 6) * 3); g.stroke(); } }, true),
    wall: ct => ct(64, 64, g => { g.fillStyle = '#40c8ff'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, 8, 64, 4); g.fillRect(0, 50, 64, 3); }, true),
    deco(o) { const { THREE } = o, ringM = new THREE.MeshBasicMaterial({ color: 0xffe060 }), st = new THREE.Group(), topM = new THREE.MeshLambertMaterial({ color: 0x40c8ff, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false });
      const len = (o.t1 - o.t0) * o.L, [cx, cz] = o.at((o.t0 + o.t1) / 2, 0); const half = new THREE.Mesh(new THREE.CylinderGeometry(o.HW + .6, o.HW + .6, len, 18, 1, true, -Math.PI / 2, Math.PI), topM);
      half.rotation.set(Math.PI / 2, 0, 0); const grp = new THREE.Group(); grp.add(half); grp.position.set(cx, 6.6, cz); grp.rotation.y = o.rotY; half.scale.set(1, 1, .45); o.scene.add(grp);
      along(o, 10, t => { const r = new THREE.Mesh(new THREE.TorusGeometry(o.HW + .7, .22, 5, 20, Math.PI), ringM); const [x, z] = o.at(t, 0); r.position.set(x, 6.6, z); r.rotation.y = o.rotY + Math.PI / 2; r.scale.set(1, .45, 1); st.add(r); });
      o.bake(st, o.scene); return dt => { const m = o.floorMat; if (m && m.map) m.map.offset.y -= dt * .9; }; } },
  // Bayou: raised plank boardwalk over the swamp, rope rails, lantern posts (open sky)
  boardwalk: { wallH: 1.3, edge: 0xffc860, post: 0x4a3420, signDraw: sign('#3a2a18', '#ffe0a0', '#c8a060', 'bold 38px Georgia, serif'),
    floor: ct => ct(64, 64, g => planks(g, 64, 64, 30, 30, 34, 8)), wall: ct => ct(64, 16, g => planks(g, 64, 16, 28, 28, 28, 8, true), true),
    deco(o) { const { THREE } = o, st = new THREE.Group(), wood = new THREE.MeshLambertMaterial({ color: 0x3a2a18 }), lamp = new THREE.MeshBasicMaterial({ color: 0xffc860 }), moss = new THREE.MeshLambertMaterial({ color: 0x6a8a5a, side: THREE.DoubleSide });
      along(o, 7, (t, k) => { for (const sd of [-1, 1]) { box(o, st, wood, .5, 3.4, .5, t, sd * (o.HW + .6), 1); if (k % 3 === 0) { box(o, st, wood, .35, 6, .35, t, sd * (o.HW + .6), 3); box(o, st, lamp, .7, .9, .7, t, sd * (o.HW + .6), 6.3); } } });
      for (const sd of [-1, 1]) box(o, st, wood, .25, .25, (o.t1 - o.t0) * o.L, (o.t0 + o.t1) / 2, sd * (o.HW + .6), 2.2);
      along(o, 5, t => { for (const sd of [-1, 1]) box(o, st, moss, .05, .9, 1.2, t, sd * (o.HW + 4 + Math.random() * 6), .3); });
      o.bake(st, o.scene); } },
  // Reed Forest: hollow-log tunnel with bark rings and glowing mushrooms
  hollow: { wallH: 8, edge: 0x9aff7a, post: 0x6a4a28, signDraw: sign('#4a6a2a', '#fff6c0', '#c8e07a', 'bold 38px Georgia, serif'),
    floor: ct => ct(64, 64, g => { g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, 64, 64); speckle(g, 64, 64, 200, ['#5a3a1a', '#8a6a3a', '#4a7a2a'], 3); }, true),
    wall: ct => ct(64, 64, g => { g.fillStyle = '#6a4424'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#3a2410'; g.lineWidth = 3; for (let x = 4; x < 64; x += 10) { g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= 64; y += 8) g.lineTo(x + Math.sin(y / 7 + x) * 2, y); g.stroke(); } speckle(g, 64, 64, 40, ['#5a8a3a'], 4); }, true),
    deco(o) { const { THREE } = o, bark = new THREE.MeshLambertMaterial({ color: 0x5a3a1c, side: THREE.DoubleSide }), ring = new THREE.MeshLambertMaterial({ color: 0x8a6a3a }), glow = [0x9aff7a, 0x7affe0, 0xffd06a].map(c => new THREE.MeshBasicMaterial({ color: c })), st = new THREE.Group();
      const len = (o.t1 - o.t0) * o.L, [cx, cz] = o.at((o.t0 + o.t1) / 2, 0); const half = new THREE.Mesh(new THREE.CylinderGeometry(o.HW + 1, o.HW + 1, len, 16, 1, true, -Math.PI / 2, Math.PI), bark);
      half.rotation.set(Math.PI / 2, 0, 0); half.scale.set(1, 1, .6); const grp = new THREE.Group(); grp.add(half); grp.position.set(cx, 7.4, cz); grp.rotation.y = o.rotY; o.scene.add(grp);
      for (const t of [o.t0, o.t1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(o.HW + 1.3, 1, 6, 22, Math.PI), ring); const [x, z] = o.at(t, 0); r.position.set(x, 7.4, z); r.rotation.y = o.rotY + Math.PI / 2; r.scale.set(1, .6, 1); st.add(r); }
      along(o, 6, (t, k) => { for (const sd of [-1, 1]) if ((k + (sd > 0)) % 2) { const cap = new THREE.Mesh(new THREE.SphereGeometry(.6, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), glow[k % 3]); const [x, z] = o.at(t, sd * (o.HW - .3)); cap.position.set(x, 2 + (k % 3), z); st.add(cap); } });
      o.bake(st, o.scene); } },
};
// ---------- rolling hill hazards (built along +Y; caller turns the axis sideways) ----------
export const ROLLERS = {
  bassdrum(THREE, ct, inner) { const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.6, 20), new THREE.MeshLambertMaterial({ map: ct(64, 16, g => { g.fillStyle = '#c0203a'; g.fillRect(0, 0, 64, 16); g.fillStyle = '#fff'; for (let x = 0; x < 64; x += 8) { g.beginPath(); g.moveTo(x, 2); g.lineTo(x + 4, 14); g.lineTo(x + 8, 2); g.stroke(); } }) })); inner.add(shell);
    for (const y of [-.82, .82]) { const h = new THREE.Mesh(new THREE.CircleGeometry(1.45, 20), new THREE.MeshLambertMaterial({ color: 0xf6f0e0, side: THREE.DoubleSide })); h.rotation.x = Math.PI / 2; h.position.y = y; inner.add(h); const r = new THREE.Mesh(new THREE.TorusGeometry(1.5, .1, 5, 20), new THREE.MeshLambertMaterial({ color: 0xffd34d })); r.rotation.x = Math.PI / 2; r.position.y = y; inner.add(r); } },
  beachball(THREE, ct, inner) { inner.add(new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12), new THREE.MeshLambertMaterial({ map: ct(128, 64, g => { ['#ff4a4a', '#fff', '#3a8aff', '#fff', '#ffd34d', '#fff'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 128 / 6, 0, 128 / 6 + 1, 64); }); }) }))); },
  log(THREE, ct, inner) { inner.add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 4, 12), new THREE.MeshLambertMaterial({ map: ct(64, 32, g => { g.fillStyle = '#5a3a1c'; g.fillRect(0, 0, 64, 32); g.strokeStyle = '#3a2410'; for (let x = 0; x < 64; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 2, 32); g.stroke(); } g.fillStyle = '#4a7a2a'; g.fillRect(10, 4, 12, 6); }) })));
    for (const y of [-2, 2]) { const e = new THREE.Mesh(new THREE.CircleGeometry(1.28, 12), new THREE.MeshLambertMaterial({ color: 0xc89a5a, side: THREE.DoubleSide })); e.rotation.x = Math.PI / 2; e.position.y = y; inner.add(e); } },
  acorn(THREE, ct, inner) { const nut = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 10), new THREE.MeshLambertMaterial({ color: 0xb8742a })); nut.scale.set(1, 1.15, 1); inner.add(nut);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x6a4a22 })); cap.position.y = .4; inner.add(cap); const st = new THREE.Mesh(new THREE.CylinderGeometry(.15, .2, .7), new THREE.MeshLambertMaterial({ color: 0x4a3018 })); st.position.y = 1.9; inner.add(st); },
};
