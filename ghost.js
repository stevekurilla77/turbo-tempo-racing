// v20 Ghost Town Gulch scenery: false-front wooden storefronts + boardwalks, creaky saloon, wanted posters (a tuba!),
// rusty bandstand, old water tower, windmill, tumbleweeds, cacti, rock mesa the mine tunnel cuts through, desert dusk sky.
// Original art. Static parts are baked into chunked meshes (few draw calls); animated parts stay separate.
import * as THREE from 'three';
import { canvasTex, bakeChunks, makeClear, facadeBox, textPlane } from './deco.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildGhostTown(ctx) {
  const { scene, P, S, T, N, W, E, alleyDist, alleyUV, ALLEY_A, ALLEY_B, ALLEY_HW, brassMat } = ctx;
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(rnd() * a.length)];
  const clear = makeClear(P), stage = new THREE.Group(), anim = [];
  const add = (geo, mat, x, y, z, ry = 0, par = stage, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); par.add(m); return m; };
  // ---------- sky: desert dusk sliding into night ----------
  const sky = buildSky(scene, { top: 0x0c0a2c, mid: 0x4a2a6a, horizon: 0xff8048, low: 0x5a2a3a, sunDir: [-520, 22, -560], sunCol: 0xff6a30, sunSize: 1.3, moonDir: [380, 300, 420], stars: 1.6,
    skyline: { col: '#3a1e34', mesa: true, height: 120 }, clouds: [[0xff9a70, 10, 660, 50, 110], [0x8a5aa0, 8, 620, 120, 200]] });
  // ---------- materials ----------
  const plank = (h, s, l) => canvasTex(64, 64, (g) => { for (let x = 0; x < 64; x += 8) { g.fillStyle = `hsl(${h + rnd() * 6},${s}%,${l + rnd() * 8 - 4}%)`; g.fillRect(x, 0, 8, 64); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x + 7, 0, 1, 64);
    if (rnd() < .3) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 2, rnd() * 60, 3, 3); } } }, true);
  const WALLS = [plank(8, 45, 34), plank(185, 22, 40), plank(40, 50, 44), plank(28, 20, 38), plank(30, 30, 28), plank(350, 25, 40)].map(t => new THREE.MeshLambertMaterial({ map: t }));
  const M = { wood: new THREE.MeshLambertMaterial({ color: 0x6a4424 }), dark: new THREE.MeshLambertMaterial({ color: 0x2a1a10 }), roof: new THREE.MeshLambertMaterial({ color: 0x4a3a32 }),
    rust: new THREE.MeshLambertMaterial({ color: 0x9a4a22 }), rust2: new THREE.MeshLambertMaterial({ color: 0x6a3a2a }), cream: new THREE.MeshLambertMaterial({ color: 0xe8d8b0 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffc860 }), glass: new THREE.MeshBasicMaterial({ color: 0x2a2030 }), cactus: new THREE.MeshLambertMaterial({ color: 0x4a7a3a }),
    rock: new THREE.MeshLambertMaterial({ color: 0x9a5a3a, flatShading: true }), rock2: new THREE.MeshLambertMaterial({ color: 0x7a4430, flatShading: true }), steel: new THREE.MeshLambertMaterial({ color: 0x6a6a70 }), brass: brassMat };
  // ---------- sign atlas ----------
  const AW = 2048, AH = 1024, R = {};
  const reg = (k, x, y, w, h) => (R[k] = [x / AW, 1 - (y + h) / AH, (x + w) / AW, 1 - y / AH]);
  const tuba = (g, cx, cy, s, mask) => { g.save(); g.translate(cx, cy); g.scale(s, s); g.strokeStyle = '#3a2410'; g.lineWidth = 4; g.fillStyle = '#d9a83a';
    g.beginPath(); g.ellipse(0, 20, 34, 44, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#f3e3b0'; g.beginPath(); g.ellipse(0, 20, 18, 28, 0, 0, 7); g.fill(); g.stroke(); // coiled body
    g.fillStyle = '#d9a83a'; g.beginPath(); g.moveTo(-14, -18); g.lineTo(-30, -70); g.quadraticCurveTo(0, -84, 30, -70); g.lineTo(14, -18); g.closePath(); g.fill(); g.stroke(); // bell
    g.fillStyle = '#5a3a14'; g.beginPath(); g.ellipse(0, -72, 30, 8, 0, 0, 7); g.fill();
    g.fillStyle = '#c0c4c8'; for (let k = 0; k < 3; k++) { g.fillRect(16 + k * 9, -4, 7, 26); g.strokeRect(16 + k * 9, -4, 7, 26); }
    g.strokeStyle = '#d9a83a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-30, 30); g.quadraticCurveTo(-56, 30, -54, 4); g.stroke(); // mouthpiece pipe
    if (mask) { g.fillStyle = '#111'; g.fillRect(-36, 4, 72, 14); g.fillStyle = '#fff'; g.beginPath(); g.arc(-12, 11, 5, 0, 7); g.arc(12, 11, 5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(-11, 12, 2.4, 0, 7); g.arc(13, 12, 2.4, 0, 7); g.fill(); }
    g.restore(); };
  const atlas = canvasTex(AW, AH, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, AW, AH);
    const signs = [['GENERAL STORE', '#e8d8a8', '#5a2a14'], ['SHERIFF', '#2a1a10', '#ffd060'], ['BARBER', '#f0e8d8', '#a01a20'], ['BANK', '#1a3a2a', '#f0d890'], ['HOTEL', '#5a1a1a', '#f0e0b0'],
      ['BLACKSMITH', '#2a2a2a', '#e8a050'], ['ASSAY OFFICE', '#e0c890', '#3a2010'], ['MUSIC HALL', '#3a1a4a', '#ffd34d'], ['TUBA REPAIR', '#e8d8a8', '#7a3a10'], ['BUGLES & BANJOS', '#1a2a4a', '#ffe0a0'],
      ['POST OFFICE', '#d8d0b8', '#2a3a5a'], ['BACKLINE VINTAGE', '#2a1608', '#ffc83a'], ['DRY GOODS', '#c8b088', '#3a2010'], ['LIVE PIANO TONIGHT', '#2a1608', '#ff9a50'], ['STAGECOACH', '#6a2a1a', '#f0e0b0'], ['CANDY & SODA', '#f0d8e0', '#a02a5a']];
    signs.forEach(([txt, bg, fg], k) => { const x = (k % 4) * 512, y = Math.floor(k / 4) * 128; reg('s' + k, x, y, 512, 128); g.fillStyle = bg; g.fillRect(x, y, 512, 128);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = y; yy < y + 128; yy += 21) g.fillRect(x, yy, 512, 2); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(x + 10, y + 10, 492, 108);
      g.fillStyle = fg; g.textAlign = 'center'; g.font = `bold ${txt.length > 13 ? 50 : 64}px Georgia, serif`; g.fillText(txt, x + 256, y + 86);
      if (txt === 'BACKLINE VINTAGE') { g.font = 'bold 20px Georgia, serif'; g.fillText('TRADING POST • EST. 1882', x + 256, y + 112); } });
    // wanted posters (256x320)
    const poster = (k, x, y, title, sub, draw) => { reg(k, x, y, 256, 320); g.fillStyle = '#e8d6a8'; g.fillRect(x, y, 256, 320); g.fillStyle = 'rgba(120,80,30,.25)'; for (let i = 0; i < 40; i++) g.fillRect(x + rnd() * 250, y + rnd() * 314, 6, 6);
      g.strokeStyle = '#4a2a10'; g.lineWidth = 4; g.strokeRect(x + 8, y + 8, 240, 304); g.fillStyle = '#3a200c'; g.textAlign = 'center'; g.font = 'bold 54px Georgia, serif'; g.fillText('WANTED', x + 128, y + 62);
      draw(x + 128, y + 170); g.font = 'bold 22px Georgia, serif'; g.fillText(title, x + 128, y + 270); g.font = 'italic 17px Georgia, serif'; g.fillText(sub, x + 128, y + 296); };
    poster('wanted', 0, 512, 'THE TUBA KID', 'for playing TOO LOUD • $500', (cx, cy) => tuba(g, cx, cy, 1.05, true));
    poster('wanted2', 256, 512, 'SLIDE McGEE', 'trombone • last seen in the mine', (cx, cy) => { g.strokeStyle = '#c9982a'; g.lineWidth = 7; g.beginPath(); g.moveTo(cx - 80, cy - 20); g.lineTo(cx + 60, cy - 20); g.moveTo(cx - 80, cy + 10); g.lineTo(cx + 70, cy + 10); g.stroke(); g.beginPath(); g.arc(cx + 60, cy - 5, 15, -PI / 2, PI / 2); g.stroke();
      g.fillStyle = '#d9a83a'; g.beginPath(); g.moveTo(cx - 80, cy - 26); g.lineTo(cx - 110, cy - 50); g.lineTo(cx - 110, cy + 10); g.closePath(); g.fill(); });
    poster('wanted3', 512, 512, 'DRUMSTICK DAN', 'keeps perfect time • $300', (cx, cy) => { g.fillStyle = '#c0203a'; g.fillRect(cx - 50, cy - 30, 100, 60); g.fillStyle = '#f3ead2'; g.beginPath(); g.ellipse(cx, cy - 30, 50, 12, 0, 0, 7); g.fill(); g.strokeStyle = '#d9a83a'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(cx - 50 + k * 20, cy - 26); g.lineTo(cx - 40 + k * 20, cy + 28); g.stroke(); }
      g.strokeStyle = '#8a5a30'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 30, cy - 80); g.lineTo(cx - 6, cy - 38); g.moveTo(cx + 34, cy - 80); g.lineTo(cx + 8, cy - 40); g.stroke(); });
    // water tower lettering, bandstand banner, saloon sign
    reg('tower', 768, 512, 512, 128); g.fillStyle = '#6a4424'; g.fillRect(768, 512, 512, 128); g.fillStyle = '#f0e0b0'; g.font = 'bold 56px Georgia, serif'; g.textAlign = 'center'; g.fillText('GHOST TOWN GULCH', 1024, 596);
    reg('band', 768, 640, 512, 128); g.fillStyle = '#7a2a1a'; g.fillRect(768, 640, 512, 128); g.fillStyle = '#ffe0a0'; g.font = 'bold 46px Georgia, serif'; g.fillText('TOWN BAND ♪ SUNDAYS', 1024, 716);
    reg('saloon', 1280, 512, 768, 192); g.fillStyle = '#2a1608'; g.fillRect(1280, 512, 768, 192); g.strokeStyle = '#ffc83a'; g.lineWidth = 8; g.strokeRect(1294, 526, 740, 164);
    g.fillStyle = '#ffc83a'; g.font = 'bold 116px Georgia, serif'; g.fillText('SALOON', 1664, 640); g.fillStyle = '#f6f3ea'; for (let k = 0; k < 14; k++) g.fillRect(1320 + k * 50, 660, 44, 22); g.fillStyle = '#111'; for (let k = 0; k < 13; k++) if (k % 7 !== 2 && k % 7 !== 6) g.fillRect(1352 + k * 50, 660, 22, 13);
    reg('mine', 1280, 704, 512, 128); g.fillStyle = '#4a2c14'; g.fillRect(1280, 704, 512, 128); g.fillStyle = '#ffe08a'; g.font = 'bold 50px Georgia, serif'; g.fillText('OLD GOLD MINE', 1536, 786);
    reg('lit', 1800, 720, 64, 64); g.fillStyle = '#ffc860'; g.fillRect(1800, 720, 64, 64); g.fillStyle = '#ff9a40'; g.fillRect(1800, 750, 64, 4); g.fillRect(1830, 720, 4, 64);
  });
  const signM = new THREE.MeshBasicMaterial({ map: atlas });
  const sign = (k, w, h, x, y, z, ry, par = stage) => add(textPlane(atlas, w, h, R[k]), signM, x, y, z, ry, par);
  // ---------- placement helpers ----------
  const taken = [];
  const free = (x, z, r) => clear(x, z) > W / 2 + 8.5 + r && alleyDist(x, z) > ALLEY_HW + 4 + r && !taken.some(t => Math.hypot(t[0] - x, t[1] - z) < t[2] + r);
  const site = (i, side, off, r) => { for (let tries = 0; tries < 10; tries++) { const sd = tries % 2 ? -side : side, o = off + Math.floor(tries / 2) * 6, j = (i + Math.floor(tries / 2) * 4) % N; const x = P[j].x + S[j].x * sd * o, z = P[j].z + S[j].z * sd * o;
      if (free(x, z, r)) { taken.push([x, z, r]); return { x, z, ry: Math.atan2(P[j].x - x, P[j].z - z), j }; } } return null; };
  const LM = {}; const at = (s, k) => { if (k) LM[k] = [Math.round(s.x), Math.round(s.z), s.j]; const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; stage.add(g); return g; };
  // false-front storefront: local +z faces the road
  let nB = 0; const SIGNS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15];
  const store = (g, w, d, h, wall, sk) => { nB++;
    add(facadeBox(w, h, d, 6), wall, 0, h / 2, -d / 2, 0, g); add(new THREE.BoxGeometry(w + .4, .5, d + .4), M.roof, 0, h + .1, -d / 2, 0, g, rnd() * .06 - .03);
    const fh = h + 2.6 + rnd() * 2; add(facadeBox(w + .6, fh, .5, 6), wall, 0, fh / 2, .2, 0, g); add(new THREE.BoxGeometry(w + 1.2, .4, .8), M.dark, 0, fh, .25, 0, g); // tall false front + cap
    sign(sk, Math.min(w - .5, 9), Math.min(w - .5, 9) / 4, 0, h + .9, .47, 0, g);
    add(new THREE.BoxGeometry(w + .6, .25, 4), M.roof, 0, h * .62, 2.3, 0, g, .18); for (const px of [-w / 2, w / 2]) add(new THREE.BoxGeometry(.3, h * .62, .3), M.wood, px, h * .31, 4.1, 0, g); // porch
    add(new THREE.BoxGeometry(w + .6, .4, 4.6), M.wood, 0, .2, 2.4, 0, g); // boardwalk
    add(new THREE.BoxGeometry(1.6, 2.8, .1), M.dark, 0, 1.8, .47, 0, g); // door
    for (const wx of [-w / 2 + 1.8, w / 2 - 1.8]) add(new THREE.PlaneGeometry(1.6, 1.6), rnd() < .45 ? M.glow : M.glass, wx, 2.4, .47, 0, g);
    if (h > 7) for (const wx of [-w / 4, w / 4]) add(new THREE.PlaneGeometry(1.4, 1.5), rnd() < .3 ? M.glow : M.glass, wx, h * .8, .47, 0, g);
    if (rnd() < .35) sign('wanted' + pick(['', '', '2', '3']), 1.3, 1.6, w / 2 - .9, 2.6, .5, 0, g); // posters on the wall
    if (rnd() < .5) add(new THREE.CylinderGeometry(.6, .6, 1.3, 10), M.wood, -w / 2 + .5, .85, 3.8, 0, g); };
  // ---------- landmarks ----------
  // the creaky saloon: two storeys, balcony, swinging doors, piano-key sign
  { const s = site(28, 1, W / 2 + 18, 13); if (s) { const g = at(s, 'saloon'); nB++; const w = 20, d = 16, h = 11;
    add(facadeBox(w, h, d, 6), WALLS[0], 0, h / 2, -d / 2, 0, g); add(facadeBox(w + .6, h + 4, .5, 6), WALLS[0], 0, (h + 4) / 2, .2, 0, g);
    sign('saloon', 14, 3.5, 0, h + 1.3, .47, 0, g); add(new THREE.BoxGeometry(w + 1, .4, 5), M.wood, 0, 5.4, 2.6, 0, g); // balcony floor
    for (let x = -w / 2; x <= w / 2 + .01; x += 2) add(new THREE.BoxGeometry(.18, 1.3, .18), M.cream, x, 6.2, 5, 0, g); add(new THREE.BoxGeometry(w + 1, .2, .2), M.cream, 0, 6.9, 5, 0, g);
    for (const px of [-w / 2, -w / 6, w / 6, w / 2]) add(new THREE.BoxGeometry(.4, 5.4, .4), M.wood, px, 2.7, 5, 0, g);
    add(new THREE.BoxGeometry(w + 1, .4, 5.4), M.wood, 0, .2, 2.7, 0, g);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(1.1, 1.6, .15), M.cream, sx * .6, 1.9, .55, 0, g, 0, 0); // batwing doors
    add(new THREE.PlaneGeometry(2.6, 3), M.glow, 0, 1.8, .46, 0, g);
    for (const wx of [-7, -4, 4, 7]) add(new THREE.PlaneGeometry(2, 2), M.glow, wx, 2.6, .47, 0, g);
    for (const wx of [-6, 0, 6]) add(new THREE.PlaneGeometry(1.8, 2.2), wx ? M.glow : M.glass, wx, 8.4, .47, 0, g);
    sign('s13', 7, 1.75, 0, 4.4, .5, 0, g); sign('wanted', 1.6, 2, 8.6, 2.6, .5, 0, g); sign('wanted2', 1.6, 2, -8.6, 2.6, .5, 0, g);
    // upright piano on the porch (the creaky saloon piano)
    add(new THREE.BoxGeometry(3, 2.4, 1.2), M.dark, -6, 1.6, 3, 0, g); add(new THREE.BoxGeometry(2.8, .15, .6), M.cream, -6, 1.5, 3.8, 0, g); add(new THREE.BoxGeometry(1.4, .9, .9), M.wood, -6, .85, 4.8, 0, g);
    for (const hx of [-12.5, 12.5]) { add(new THREE.BoxGeometry(.3, 1.4, .3), M.wood, hx, .7, 6.5, 0, g); } add(new THREE.BoxGeometry(25, .25, .25), M.wood, 0, 1.3, 6.5, 0, g); } } // hitching rail
  // Backline Vintage trading post (Steve's brand)
  { const s = site(70, -1, W / 2 + 14, 9); if (s) { const g = at(s); store(g, 14, 12, 8, WALLS[4], 's11'); add(new THREE.CylinderGeometry(.7, .9, 1.4, 12), M.brass, 5.5, 1.1, 3.4, 0, g); } }
  // wanted-poster notice board by the start
  { const s = site(48, 1, W / 2 + 11, 4); if (s) { const g = at(s, 'wanted'); for (const px of [-2.4, 2.4]) add(new THREE.BoxGeometry(.35, 5, .35), M.wood, px, 2.5, 0, 0, g);
    add(new THREE.BoxGeometry(5.4, 3.4, .25), M.wood, 0, 3, -.05, 0, g); add(new THREE.BoxGeometry(6, .3, .8), M.roof, 0, 4.85, 0, 0, g, .2);
    sign('wanted', 2, 2.5, -1.2, 3.1, .1, 0, g); sign('wanted3', 1.6, 2, 1.4, 3, .1, 0, g); } }
  // rusty bandstand: octagon deck, thin posts, rusty conical roof, a tuba + bass drum left on stage
  const bandSite = site(585, -1, W / 2 + 20, 10);
  if (bandSite) { const g = at(bandSite, 'bandstand'); add(new THREE.CylinderGeometry(7, 7.3, 1.2, 8), M.wood, 0, .6, -4, PI / 8, g); add(new THREE.CylinderGeometry(7.6, 7.6, .25, 8), M.cream, 0, 1.25, -4, PI / 8, g);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; add(new THREE.CylinderGeometry(.18, .18, 6), M.cream, Math.cos(a) * 6.6, 4.2, -4 + Math.sin(a) * 6.6, 0, g); if (k !== 2) add(new THREE.BoxGeometry(5, .15, .15), M.cream, Math.cos(a + PI / 8) * 6.2, 2.2, -4 + Math.sin(a + PI / 8) * 6.2, -a - PI / 8 + PI / 2, g); }
    add(new THREE.ConeGeometry(8.4, 3.4, 8, 1, true), M.rust, 0, 8.9, -4, PI / 8, g); add(new THREE.SphereGeometry(.5, 8, 6), M.rust2, 0, 10.8, -4, 0, g);
    sign('band', 6, 1.5, 0, 6.6, 2.7, 0, g);
    const tb = new THREE.Group(); tb.position.set(-2, 2.6, -4); g.add(tb); add(new THREE.TorusGeometry(.9, .3, 8, 16), M.brass, 0, 0, 0, 0, tb); add(new THREE.CylinderGeometry(1.1, .3, 1.8, 14, 1, true), M.brass, 0, 1.6, 0, 0, tb);
    add(new THREE.CylinderGeometry(1.3, 1.3, 1.1, 16), M.rust, 2.4, 2.1, -4, 0, g, PI / 2); add(new THREE.CircleGeometry(1.25, 16), M.cream, 2.4, 2.1, -3.4, 0, g); }
  // old wooden water tower
  { const s = site(118, -1, W / 2 + 22, 7); if (s) { const g = at(s, 'tower'); for (const [px, pz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) add(new THREE.BoxGeometry(.5, 14, .5), M.wood, px, 7, pz, 0, g, pz * .015, -px * .015);
    for (const y of [4, 9]) { add(new THREE.BoxGeometry(6.4, .25, .25), M.wood, 0, y, 3, 0, g, 0, .6); add(new THREE.BoxGeometry(6.4, .25, .25), M.wood, 0, y, -3, 0, g, 0, -.6); }
    add(new THREE.CylinderGeometry(4.6, 4.6, 6, 16), WALLS[3], 0, 17, 0, 0, g); for (const y of [15, 17, 19]) add(new THREE.TorusGeometry(4.65, .1, 4, 20), M.steel, 0, y, 0, 0, g, PI / 2);
    add(new THREE.ConeGeometry(5.2, 3, 16), M.roof, 0, 21.5, 0, 0, g); sign('tower', 7, 1.75, 0, 17.6, 4.66, 0, g);
    add(new THREE.CylinderGeometry(.2, .2, 9), M.steel, 2, 9, 3.8, 0, g, .5); } }
  // windmill: lattice tower + spinning blade wheel + tail vane
  let wheel = null;
  { const s = site(470, 1, W / 2 + 24, 8); if (s) { const g = at(s, 'windmill'); for (const [px, pz] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) add(new THREE.BoxGeometry(.3, 16.4, .3), M.steel, px * .55, 8, pz * .55, 0, g, pz * .03, -px * .03);
    for (let y = 2; y < 16; y += 3.5) { const r = 2.4 - y * .065; add(new THREE.BoxGeometry(r * 2, .15, .15), M.steel, 0, y, r, 0, g); add(new THREE.BoxGeometry(r * 2, .15, .15), M.steel, 0, y, -r, 0, g); add(new THREE.BoxGeometry(.15, .15, r * 2), M.steel, r, y, 0, 0, g); add(new THREE.BoxGeometry(.15, .15, r * 2), M.steel, -r, y, 0, 0, g); }
    add(new THREE.BoxGeometry(1, 1, 3), M.rust2, 0, 16.6, -.3, 0, g); add(new THREE.BoxGeometry(.1, 2.6, 4), M.rust, 0, 17.2, -3.6, 0, g);
    wheel = new THREE.Group(); const wp = new THREE.Vector3(0, 16.6, 1.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.ry); wheel.position.set(s.x + wp.x, wp.y, s.z + wp.z); wheel.rotation.y = s.ry; scene.add(wheel);
    const blade = new THREE.MeshLambertMaterial({ color: 0xb8b0a0, side: THREE.DoubleSide }), bg = [];
    for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2, gm = new THREE.PlaneGeometry(.9, 3.2); gm.rotateY(.5); gm.translate(0, 2.4, 0); gm.rotateZ(a); bg.push(gm); }
    const merged = mergeGeos(bg); wheel.add(new THREE.Mesh(merged, blade)); wheel.add(new THREE.Mesh(new THREE.TorusGeometry(4, .12, 4, 24), M.rust)); wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .6, 10).rotateX(PI / 2), M.rust2));
    anim.push((dt) => { wheel.children[0].rotation.z += dt * 1.6; wheel.children[1].rotation.z += dt * 1.6; }); } }
  // ---------- the rock mesa the mine tunnel cuts through ----------
  { const a = P[ALLEY_A], b = P[ALLEY_B], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, sx = -uz, sz = ux;
    const geo = new THREE.DodecahedronGeometry(1, 0);
    for (let t = .08; t <= .92; t += .035) for (const side of [-1, 1]) for (let ring = 0; ring < 4; ring++) {
      const u = side * (ALLEY_HW + 4 + ring * 7 + rnd() * 3), x = a.x + ux * L * t + sx * u, z = a.z + uz * L * t + sz * u, r = 5 + rnd() * 3;
      if (clear(x, z) < W / 2 + 9 + r * .8) continue; const hgt = 10 + (3 - ring) * 3 + rnd() * 5;
      const m = add(geo, ring % 2 ? M.rock2 : M.rock, x, hgt * .45, z, rnd() * 3); m.scale.set(r, hgt * .55, r * 1.1); taken.push([x, z, r]); }
    // cap over the tunnel roof (keeps the inside clear: everything sits above y=9.6)
    for (let t = .12; t <= .88; t += .05) { const [x, z] = [a.x + ux * L * t, a.z + uz * L * t]; if (clear(x, z) < W / 2 + 18) continue;
      const m = add(geo, M.rock, x, 14 + rnd() * 3, z, rnd() * 3); m.scale.set(ALLEY_HW + 4, 4.2, 6); }
    // tracks of an old ore cart line leaving the mine + a parked cart
    { const t = .5, x = a.x + ux * L * t + sx * (ALLEY_HW - 2), z = a.z + uz * L * t + sz * (ALLEY_HW - 2); } }
  // ---------- wooden storefronts all around town ----------
  const wallCycle = [1, 2, 3, 5, 0, 4];
  for (let i = 0; i < N; i += 7) {
    const town = i > 560 || i < 110 || (i > 400 && i < 470); if (!town && rnd() < .55) continue;
    for (const side of [-1, 1]) { if (!town && rnd() < .5) continue; const w = 9 + Math.floor(rnd() * 5), d = 10 + rnd() * 4, h = 6 + rnd() * 4, off = W / 2 + 9.6 + rnd() * 1.5 + d / 2;
      const x = P[i].x + S[i].x * side * off, z = P[i].z + S[i].z * side * off, r = Math.max(w, d) * .6; if (!free(x, z, r - 3)) continue;
      taken.push([x, z, r]); const fx = P[i].x + S[i].x * side * (off - d / 2), fz = P[i].z + S[i].z * side * (off - d / 2);
      const g = new THREE.Group(); g.position.set(fx, E[i], fz); g.rotation.y = Math.atan2(-S[i].x * side, -S[i].z * side); stage.add(g);
      store(g, w, d, h, WALLS[wallCycle[nB % 6]], 's' + SIGNS[nB % SIGNS.length]); } }
  // ---------- cacti, rocks, fences, wagon wheels, distant buttes ----------
  const saguaro = (x, z, s) => { add(new THREE.CylinderGeometry(.55 * s, .65 * s, 7 * s, 8), M.cactus, x, 3.5 * s, z);
    for (const sd of [-1, 1]) if (rnd() < .8) { const hy = (2.5 + rnd() * 2) * s; add(new THREE.CylinderGeometry(.38 * s, .38 * s, 1.6 * s, 7), M.cactus, x + sd * .9 * s, hy, z, 0, stage, 0, PI / 2); add(new THREE.CylinderGeometry(.38 * s, .38 * s, 2.4 * s, 7), M.cactus, x + sd * 1.6 * s, hy + 1.1 * s, z); } };
  const rockG = new THREE.DodecahedronGeometry(1, 0);
  for (let k = 0; k < 160; k++) { const x = -160 + rnd() * 600, z = -360 + rnd() * 700; if (!free(x, z, 2)) continue; if (rnd() < .55) saguaro(x, z, .8 + rnd() * .7); else { const m = add(rockG, rnd() < .5 ? M.rock : M.rock2, x, .5, z, rnd() * 3); m.scale.set(1 + rnd() * 2.5, .8 + rnd() * 1.5, 1 + rnd() * 2.5); } }
  for (let k = 0; k < 22; k++) { const a = k / 22 * PI * 2 + rnd() * .2, R2 = 360 + rnd() * 150, x = 130 + Math.cos(a) * R2, z = -15 + Math.sin(a) * R2, hh = 30 + rnd() * 50, rr = 25 + rnd() * 45;
    add(new THREE.CylinderGeometry(rr * .8, rr, hh, 7), rnd() < .5 ? M.rock : M.rock2, x, hh / 2, z, rnd() * 3); }
  // fence lines with broken rails
  for (let i = 0; i < N; i += 3) for (const side of [-1, 1]) { if (((i / 3) | 0) % 12 > 5 || (side > 0) !== (i % 2 === 0)) continue; const o = W / 2 + 9.2, x = P[i].x + S[i].x * side * o, z = P[i].z + S[i].z * side * o;
    if (!free(x, z, .3) || taken.some(t => Math.hypot(t[0] - x, t[1] - z) < t[2] + 2)) continue; add(new THREE.BoxGeometry(.3, 1.8, .3), M.wood, x, E[i] + .9, z);
    if (rnd() < .8) add(new THREE.BoxGeometry(.15, .25, 6.6), M.wood, x, E[i] + 1.3, z, Math.atan2(T[i].x, T[i].z), stage, rnd() * .2 - .1); }
  // lantern posts along the main street (warm glow at dusk)
  for (let i = 0; i < N; i += 24) { const side = (i / 24) % 2 ? 1 : -1, o = W / 2 + 8.6, x = P[i].x + S[i].x * side * o, z = P[i].z + S[i].z * side * o; if (alleyDist(x, z) < ALLEY_HW + 3) continue;
    add(new THREE.BoxGeometry(.3, 5, .3), M.wood, x, E[i] + 2.5, z); add(new THREE.BoxGeometry(.6, .8, .6), M.glow, x, E[i] + 5.2, z); }
  const baked = bakeChunks(stage, scene);
  // ---------- animated: tumbleweeds + friendly ghost wisps near the saloon ----------
  const twM = new THREE.MeshLambertMaterial({ color: 0xa8804a, wireframe: true }), twG = new THREE.IcosahedronGeometry(1.3, 1), tws = [];
  for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(twG, twM); m.position.set(-120 + rnd() * 500, 1.3, -300 + rnd() * 600); m.userData = { v: 5 + rnd() * 5, ph: rnd() * 6 }; scene.add(m); tws.push(m); }
  anim.push((dt, t) => { for (const m of tws) { const d = m.userData; m.position.x += d.v * dt; m.position.z += Math.sin(t * .5 + d.ph) * dt * 2; m.position.y = 1.3 + Math.abs(Math.sin(t * 2.6 + d.ph)) * 1.6;
    m.rotation.z -= d.v * dt / 1.3; m.rotation.x += dt * .5; if (m.position.x > 420) { m.position.x = -140; m.position.z = -300 + Math.random() * 600; } } });
  const wisps = [];
  { const s = taken[0]; if (s) { const gm = new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: .55, depthWrite: false }), eye = new THREE.MeshBasicMaterial({ color: 0x1a1a2a });
    for (let k = 0; k < 3; k++) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, PI * 2, 0, PI * .6), gm); g.add(body);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(.95, 1.6, 12, 1, true), gm); tail.rotation.x = PI; tail.position.y = -.9; g.add(tail);
      for (const ex of [-.32, .32]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.14, 6, 4), eye); e.position.set(ex, .25, .85); g.add(e); }
      g.userData = { x: s[0] + (k - 1) * 6, z: s[1], y: 14 + k * 1.5, ph: k * 2.1 }; scene.add(g); wisps.push(g); }
    anim.push((dt, t) => { for (const g of wisps) { const d = g.userData; g.position.set(d.x + Math.sin(t * .6 + d.ph) * 4, d.y + Math.sin(t * 1.4 + d.ph) * 1.2, d.z + Math.cos(t * .6 + d.ph) * 4); g.rotation.y = t * .6 + d.ph + PI / 2; } }); } }
  return { stats: { buildings: nB, bakedMeshes: baked.length, landmarks: LM }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); } };
}
function mergeGeos(gs) { let n = 0; const ng = gs.map(g => (g.index ? g.toNonIndexed() : g)); for (const g of ng) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of ng) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += c; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return m; }
