// v19 Brass City scenery: varied towers (ledges, setbacks, rooftop water towers, billboards, awnings, neon), band landmarks
// (metronome clock tower, bell-dome concert hall, Backline Vintage music store, stadium + fireworks, tuba blimp), richer sunset sky.
// Everything static is baked into a handful of chunked meshes (one per material per 220-unit chunk).
import * as THREE from 'three';
import { canvasTex, bakeChunks, makeClear, facadeBox, textPlane } from './deco.js';
import { buildSky } from './sky.js';
const PI = Math.PI;
export function buildCity(ctx) {
  const { scene, P, S, T, N, W, E, alleyDist, ALLEY_HW, brassMat } = ctx;
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(rnd() * a.length)];
  const clear = makeClear(P), stage = new THREE.Group(), anim = [];
  const add = (geo, mat, x, y, z, ry = 0, par = stage, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); par.add(m); return m; };
  // ---------- sky ----------
  const sky = buildSky(scene, { top: 0x1a0d48, mid: 0x8a3a8a, horizon: 0xffa060, low: 0x5a3050, sunDir: [-500, 70, -600], sunCol: 0xffc070, moonDir: [420, 330, 380], stars: 1,
    skyline: { col: '#3a2048', win: '#ffd88a', city: true, height: 150 }, clouds: [[0xffb0c8, 16, 640, 70, 150], [0xffd0a0, 12, 700, 40, 90], [0x9a70c8, 12, 600, 150, 240]] });
  // ---------- materials ----------
  const facade = (wall, draw) => { const lit = []; const base = canvasTex(128, 128, (g) => { g.fillStyle = wall; g.fillRect(0, 0, 128, 128); draw(g, false, lit); }, true);
    const em = canvasTex(128, 128, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128); draw(g, true, lit); }, true);
    return new THREE.MeshLambertMaterial({ map: base, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: .62 }); };
  const winCols = ['#ffd88a', '#ffd88a', '#ffd88a', '#ffe9b0', '#ffc070', '#9fe8ff', '#e8a0d0'];
  const grid = (g, em, lit, cw, ch, ww, wh, frame) => { let k = 0; for (let y = 0; y < 128; y += ch) for (let x = 0; x < 128; x += cw) { const on = lit[k] !== undefined ? lit[k] : (lit[k] = Math.random() < .42 ? pick(winCols) : null); k++;
      if (!em && frame) { g.fillStyle = frame; g.fillRect(x + (cw - ww) / 2 - 1, y + (ch - wh) / 2 - 1, ww + 2, wh + 2); }
      g.fillStyle = on ? on : (em ? '#000' : '#241c34'); if (em && !on) continue; g.fillRect(x + (cw - ww) / 2, y + (ch - wh) / 2, ww, wh); } };
  const FAC = [
    facade('#3b3050', (g, em, lit) => grid(g, em, lit, 16, 16, 10, 11, '#5a4a70')), // glassy grid
    facade('#6a4a3a', (g, em, lit) => { if (!em) { g.fillStyle = '#c9a24a'; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 4, 128); } grid(g, em, lit, 32, 12, 18, 8); }), // art deco w/ gold pilasters
    facade('#7a3b2e', (g, em, lit) => { if (!em) { g.strokeStyle = '#5a2a20'; for (let y = 0; y < 128; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); } } grid(g, em, lit, 21, 21, 10, 13, '#e8dcc8'); }), // brick
    facade('#2f4a5a', (g, em, lit) => grid(g, em, lit, 8, 16, 6, 12)), // narrow strip windows
  ];
  const M = { trim: new THREE.MeshLambertMaterial({ color: 0x2a2238 }), cream: new THREE.MeshLambertMaterial({ color: 0xe8dcc8 }), wood: new THREE.MeshLambertMaterial({ color: 0x7a4a26 }), dark: new THREE.MeshLambertMaterial({ color: 0x1c1626 }),
    red: new THREE.MeshLambertMaterial({ color: 0xc0203a }), white: new THREE.MeshLambertMaterial({ color: 0xf6f0e0 }), steel: new THREE.MeshLambertMaterial({ color: 0x8a8f9a }), brass: brassMat, concrete: new THREE.MeshLambertMaterial({ color: 0xa8a0a8 }),
    neonP: new THREE.MeshBasicMaterial({ color: 0xff4fd8 }), neonC: new THREE.MeshBasicMaterial({ color: 0x40f0ff }), neonY: new THREE.MeshBasicMaterial({ color: 0xffe060 }), lamp: new THREE.MeshBasicMaterial({ color: 0xfff1b0 }), pole: new THREE.MeshLambertMaterial({ color: 0x222 }) };
  const awn = [['#c0203a', '#fff'], ['#1a8a8a', '#fff'], ['#7b3fc4', '#ffd34d']].map(([a, b]) => new THREE.MeshLambertMaterial({ map: canvasTex(32, 8, (g) => { for (let x = 0; x < 32; x += 8) { g.fillStyle = a; g.fillRect(x, 0, 4, 8); g.fillStyle = b; g.fillRect(x + 4, 0, 4, 8); } }, true), side: THREE.DoubleSide }));
  // ---------- sign atlas (2048x1024): billboards, shop signs, clef banners, neon blades, clock face ----------
  const AW = 2048, AH = 1024, R = {};
  const reg = (k, x, y, w, h) => (R[k] = [x / AW, 1 - (y + h) / AH, (x + w) / AW, 1 - y / AH]);
  const clef = (g, x, y, s, col) => { g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(2, 30); g.bezierCurveTo(-14, 18, -8, -2, 4, -4); g.bezierCurveTo(18, -6, 16, 14, 2, 14); g.bezierCurveTo(-8, 14, -8, 2, 0, 0); g.lineTo(6, -34); g.bezierCurveTo(10, -46, -4, -50, -2, -36); g.lineTo(6, 40); g.stroke(); g.beginPath(); g.arc(1, 42, 4, 0, 7); g.fillStyle = col; g.fill(); g.restore(); };
  const note = (g, x, y, s, col) => { g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 3 * s; g.beginPath(); g.ellipse(x, y, 7 * s, 5 * s, -.4, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 6 * s, y); g.lineTo(x + 6 * s, y - 30 * s); g.lineTo(x + 16 * s, y - 22 * s); g.stroke(); };
  const atlas = canvasTex(AW, AH, (g) => {
    const bb = (k, x, y, w, h, bg, fg, l1, l2, deco) => { reg(k, x, y, w, h); g.fillStyle = bg; g.fillRect(x, y, w, h); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(x + 8, y + 8, w - 16, h - 16); g.textAlign = 'center'; g.fillStyle = fg;
      g.font = `900 ${l2 ? h * .26 : h * .36}px Arial Black, Impact, sans-serif`; g.fillText(l1, x + w / 2, y + (l2 ? h * .46 : h * .64), w - 40); if (l2) { g.font = `bold ${h * .15}px Arial, sans-serif`; g.fillText(l2, x + w / 2, y + h * .78, w - 40); } if (deco) deco(x, y, w, h); };
    bb('marching', 0, 0, 512, 256, '#c0203a', '#ffd34d', 'MARCHING BAND', 'TONIGHT · 8 PM · BRASS CITY PARK', (x, y) => { note(g, x + 50, y + 190, 1.4, '#fff'); note(g, x + 460, y + 190, 1.4, '#fff'); });
    bb('jazz', 512, 0, 512, 256, '#1a0a3a', '#40f0ff', 'BRASS CITY', 'JAZZ FEST · ALL WEEKEND', (x, y) => { clef(g, x + 60, y + 128, 1.6, '#ff4fd8'); clef(g, x + 452, y + 128, 1.6, '#ff4fd8'); });
    bb('drumline', 0, 256, 512, 256, '#ffd34d', '#2a0033', 'DRUMLINE', 'FINALS · SATURDAY', (x, y) => { g.fillStyle = '#c0203a'; g.beginPath(); g.ellipse(x + 70, y + 140, 40, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 442, y + 140, 40, 18, 0, 0, 7); g.fill(); });
    // sheet-music mural
    reg('mural', 512, 256, 512, 256); g.fillStyle = '#f3ead2'; g.fillRect(512, 256, 512, 256); g.strokeStyle = '#3a2a1a'; g.lineWidth = 3;
    for (const sy of [300, 400]) { for (let l = 0; l < 5; l++) { g.beginPath(); g.moveTo(530, sy + l * 12); g.lineTo(1006, sy + l * 12); g.stroke(); } clef(g, 552, sy + 26, .9, '#3a2a1a'); for (let k = 0; k < 11; k++) note(g, 610 + k * 36, sy + 6 + ((k * 37) % 5) * 9, .8, '#3a2a1a'); }
    g.fillStyle = '#c0203a'; g.font = 'italic 900 34px Arial Black'; g.textAlign = 'center'; g.fillText('♪ PLAY IT LOUD ♪', 768, 500);
    bb('backline', 0, 512, 512, 128, '#14281e', '#ffd34d', 'BACKLINE VINTAGE', 'VINTAGE INSTRUMENTS · REPAIRS · RECORDS');
    bb('hall', 512, 512, 512, 128, '#2a0a1a', '#ffe9b0', 'CONCERT HALL', 'BRASS CITY PHILHARMONIC');
    bb('reeds', 0, 640, 512, 128, '#1a8a8a', '#fff', 'VALVE OIL & REEDS'); bb('drums', 512, 640, 512, 128, '#c0203a', '#fff', 'DRUM SHOP');
    bb('sheet', 0, 768, 512, 128, '#f3ead2', '#2a0033', 'SHEET MUSIC'); bb('piano', 512, 768, 512, 128, '#111', '#fff', 'PIANO BAR', '♪ LIVE TONIGHT ♪');
    bb('mallet', 0, 896, 512, 128, '#7b3fc4', '#ffd34d', 'MALLET MART'); bb('cafe', 512, 896, 512, 128, '#5a2d1a', '#ffe9b0', 'BELL & BUGLE CAFE');
    bb('tuba', 1024, 256, 512, 256, '#2a5a9a', '#fff', 'TUBA TUESDAY', 'OOM-PAH ALL NIGHT LONG');
    bb('stadium', 1024, 512, 512, 128, '#1a0a3a', '#ffd34d', 'MARCHING BAND STADIUM');
    // clock face
    reg('clock', 1024, 0, 256, 256); g.fillStyle = '#f6f0e0'; g.beginPath(); g.arc(1152, 128, 120, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = '#c9a24a'; g.stroke(); g.fillStyle = '#2a1a0a'; g.font = 'bold 26px Georgia'; g.textAlign = 'center';
    for (let k = 1; k <= 12; k++) { const a = k / 12 * PI * 2; g.fillText(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][k - 1], 1152 + Math.sin(a) * 92, 137 - Math.cos(a) * 92); }
    g.lineWidth = 7; g.beginPath(); g.moveTo(1152, 128); g.lineTo(1152 + 50, 128 - 30); g.moveTo(1152, 128); g.lineTo(1152 - 8, 128 - 82); g.stroke();
    // treble-clef banners
    reg('clefR', 1280, 0, 128, 256); reg('clefB', 1408, 0, 128, 256);
    for (const [x, bg] of [[1280, '#c0203a'], [1408, '#2a5a9a']]) { g.fillStyle = bg; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 128, 0); g.lineTo(x + 128, 230); g.lineTo(x + 64, 256); g.lineTo(x, 230); g.fill(); clef(g, x + 64, 120, 1.9, '#ffd34d'); }
    // neon blade signs
    reg('bladeJ', 1536, 0, 128, 512); reg('bladeB', 1664, 0, 128, 512);
    for (const [x, txt, col] of [[1536, 'JAZZ', '#ff4fd8'], [1664, 'BAND', '#40f0ff']]) { g.fillStyle = '#140a24'; g.fillRect(x, 0, 128, 512); g.strokeStyle = col; g.lineWidth = 8; g.strokeRect(x + 8, 8, 112, 496); g.fillStyle = col; g.font = '900 96px Arial Black'; g.textAlign = 'center'; [...txt].forEach((ch, k) => g.fillText(ch, x + 64, 112 + k * 112)); }
    // music-store display window
    reg('display', 1024, 640, 512, 256); { const x = 1024, y = 640; const gr = g.createLinearGradient(0, y, 0, y + 256); gr.addColorStop(0, '#ffcf80'); gr.addColorStop(1, '#a8601a'); g.fillStyle = gr; g.fillRect(x, y, 512, 256);
      g.fillStyle = '#3a1a08'; g.beginPath(); g.ellipse(x + 90, y + 180, 40, 50, 0, 0, 7); g.fill(); g.fillRect(x + 84, y + 40, 12, 100); // guitar
      g.fillStyle = '#d4a640'; g.fillRect(x + 170, y + 120, 120, 12); g.beginPath(); g.moveTo(x + 290, y + 126); g.lineTo(x + 330, y + 96); g.lineTo(x + 330, y + 156); g.fill(); for (let k = 0; k < 3; k++) g.fillRect(x + 200 + k * 20, y + 98, 9, 24); // trumpet
      g.fillStyle = '#c0203a'; g.fillRect(x + 380, y + 150, 100, 70); g.fillStyle = '#f6f0e0'; g.fillRect(x + 380, y + 145, 100, 10); // drum
      g.strokeStyle = '#3a1a08'; g.lineWidth = 8; g.strokeRect(x + 4, y + 4, 504, 248); g.beginPath(); g.moveTo(x + 256, y); g.lineTo(x + 256, y + 256); g.stroke(); }
    g.font = '900 30px Arial Black'; g.fillStyle = '#ffe9b0'; g.textAlign = 'center'; reg('blimpAd', 1536, 512, 512, 128); g.fillStyle = '#2a0033'; g.fillRect(1536, 512, 512, 128); g.fillStyle = '#ffd34d'; g.font = '900 64px Arial Black'; g.fillText('♪ GO BAND GO ♪', 1792, 600);
  });
  const SIGN = new THREE.MeshBasicMaterial({ map: atlas, side: THREE.DoubleSide, transparent: true, alphaTest: .3 });
  const sign = (k, w, h, x, y, z, ry, par) => add(textPlane(atlas, w, h, R[k]), SIGN, x, y, z, ry, par);
  // ---------- props ----------
  const waterTower = (par, x, y, z) => { for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new THREE.BoxGeometry(.35, 5, .35), M.wood, x + a * 1.8, y + 2.5, z + b * 1.8, 0, par);
    add(new THREE.CylinderGeometry(2.6, 2.6, 4.2, 12), M.wood, x, y + 7.1, z, 0, par); add(new THREE.ConeGeometry(3, 2, 12), M.dark, x, y + 10.2, z, 0, par); for (const yy of [5.6, 8.6]) add(new THREE.CylinderGeometry(2.66, 2.66, .2, 12), M.steel, x, y + yy, z, 0, par); };
  const drumTower = (par, x, y, z) => { for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new THREE.BoxGeometry(.35, 5, .35), M.steel, x + a * 2, y + 2.5, z + b * 2, 0, par);
    add(new THREE.CylinderGeometry(3, 3, 3.6, 16), M.red, x, y + 6.8, z, 0, par); for (const yy of [5, 8.6]) add(new THREE.CylinderGeometry(3.08, 3.08, .4, 16), M.white, x, y + yy, z, 0, par);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; add(new THREE.BoxGeometry(.25, 3, .25), M.brass, x + Math.cos(a) * 3.05, y + 6.8, z + Math.sin(a) * 3.05, 0, par, .0, Math.sin(k) * .2); } };
  const billboard = (par, x, y, z, ry, k) => { for (const a of [-4, 4]) add(new THREE.BoxGeometry(.4, 5, .4), M.steel, x + Math.cos(ry) * a, y + 2.5, z - Math.sin(ry) * a, 0, par);
    add(new THREE.BoxGeometry(11, 5.8, .3), M.dark, x, y + 7.6, z, ry, par); sign(k, 10.6, 5.3, x + Math.sin(ry) * .2, y + 7.6, z + Math.cos(ry) * .2, ry, par); };
  // neon instrument outlines (tubes) — sax and trumpet
  const tube = (pts, r, mat, par) => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 5, false), mat); par.add(m); return m; };
  const saxNeon = (par, s) => { tube([[0, 4, 0], [0, 1.5, 0], [.1, -2.5, 0], [.6, -3.6, 0], [1.6, -3.4, 0], [2.1, -2.2, 0], [2.4, -1, 0]], .18 * s, M.neonY, par); tube([[0, 4, 0], [-.6, 4.8, 0], [-1.4, 4.9, 0]], .16, M.neonY, par);
    const bell = new THREE.Mesh(new THREE.TorusGeometry(.75, .16, 5, 18), M.neonP); bell.position.set(2.5, -.7, 0); bell.rotation.set(PI / 2, 0, .3); par.add(bell); for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.26, 6, 5), M.neonC); d.position.set(.35, 2.6 - k * 1.2, .1); par.add(d); } };
  const trumpetNeon = (par) => { tube([[-4, 0, 0], [2, 0, 0]], .17, M.neonC, par); tube([[-1.5, 0, 0], [-1.6, -1.1, 0], [1, -1.1, 0], [1.2, 0, 0]], .15, M.neonC, par);
    const bell = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 14, 1, true), M.neonP); bell.rotation.z = PI / 2; bell.position.set(2.8, 0, 0); par.add(bell); for (let k = 0; k < 3; k++) { const v = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 1.3, 6), M.neonY); v.position.set(-.8 + k * .7, .7, 0); par.add(v); } };
  // ---------- landmark sites (chosen first so normal buildings leave room) ----------
  const sites = [], taken = [];
  const site = (i, side, off, r) => { for (let tries = 0; tries < 8; tries++) { const sd = tries % 2 ? -side : side, o = off + Math.floor(tries / 2) * 8, j = (i + Math.floor(tries / 2) * 3) % N; const x = P[j].x + S[j].x * sd * o, z = P[j].z + S[j].z * sd * o;
      if (clear(x, z) > W / 2 + r && alleyDist(x, z) > ALLEY_HW + r && !taken.some(t => Math.hypot(t[0] - x, t[1] - z) < t[2] + r)) { taken.push([x, z, r]); const ry = Math.atan2(P[j].x - x, P[j].z - z); return { x, z, ry, j }; } } return null; };
  // Backline Vintage music store on the start straight (close + low so it reads well)
  { const s = site(22, 1, W / 2 + 17, 12); if (s) { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; stage.add(g);
      add(facadeBox(22, 12, 10, 16), FAC[2], 0, 6, 0, 0, g); add(new THREE.BoxGeometry(23, .8, 11), M.cream, 0, 12.4, 0, 0, g); add(new THREE.BoxGeometry(23, .5, 11), M.cream, 0, 6, 0, 0, g);
      sign('display', 9, 4.4, -5.2, 2.6, 5.06, 0, g); sign('display', 9, 4.4, 5.2, 2.6, 5.06, 0, g); sign('backline', 16, 4, 0, 9.2, 5.08, 0, g);
      add(new THREE.BoxGeometry(22, .25, 3.2), awn[0], 0, 5.3, 6.4, 0, g, .35); const tn = new THREE.Group(); tn.position.set(0, 15.5, 2); tn.scale.setScalar(1.3); g.add(tn); trumpetNeon(tn); } }
  // metronome clock tower (pendulum animates)
  { const s = site(560, -1, W / 2 + 26, 14); if (s) { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; stage.add(g);
      const body = add(new THREE.CylinderGeometry(4.5, 10, 62, 4), new THREE.MeshLambertMaterial({ color: 0x5a2d1a }), 0, 31, 0, PI / 4, g); add(new THREE.ConeGeometry(5.4, 7, 4), M.brass, 0, 65.5, 0, PI / 4, g);
      sign('clock', 7, 7, 0, 52, 4.45, 0, g); add(new THREE.BoxGeometry(5, 22, .2), M.cream, 0, 30, 6.1, 0, g, -.105);
      const pend = new THREE.Group(); pend.position.set(s.x + Math.sin(s.ry) * 7.3, 44, s.z + Math.cos(s.ry) * 7.3); pend.rotation.y = s.ry; scene.add(pend);
      const arm = new THREE.Group(); pend.add(arm); const rod = new THREE.Mesh(new THREE.BoxGeometry(.5, 30, .3), M.brass); rod.position.y = -15; arm.add(rod); const wt = new THREE.Mesh(new THREE.CylinderGeometry(1, 2, 3, 4), M.brass); wt.position.y = -22; arm.add(wt);
      anim.push((dt, t) => { arm.rotation.z = Math.sin(t * 2.4) * .38; }); } }
  // concert hall with a bell-shaped brass dome
  { const s = site(440, 1, W / 2 + 34, 22); if (s) { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; stage.add(g);
      add(new THREE.BoxGeometry(34, 14, 26), M.cream, 0, 7, 0, 0, g); add(new THREE.BoxGeometry(36, 1.4, 28), M.brass, 0, 14.4, 0, 0, g); for (let k = 0; k < 8; k++) add(new THREE.CylinderGeometry(.7, .8, 12, 10), M.white, -14 + k * 4, 6, 14, 0, g);
      add(new THREE.BoxGeometry(32, 2.4, 3), M.cream, 0, 13, 14.5, 0, g); sign('hall', 18, 4.5, 0, 17.6, 13.2, 0, g);
      const prof = new THREE.SplineCurve([[14.5, 0], [11, 1.2], [8.6, 4], [7.8, 9], [7.6, 13], [6.6, 17], [4, 19.6], [.05, 20.6]].map(([r, y]) => new THREE.Vector2(r, y))).getPoints(24).map(v => new THREE.Vector2(v.x, v.y + 14.2)); // upside-down bell = dome
      add(new THREE.LatheGeometry(prof, 28), M.brass, 0, 0, 0, 0, g); add(new THREE.SphereGeometry(1.2, 10, 8), M.neonY, 0, 35.6, 0, 0, g); add(new THREE.TorusGeometry(14.4, .45, 6, 32), M.brass, 0, 14.3, 0, 0, g, PI / 2);
      const sn = new THREE.Group(); sn.position.set(-12, 22, 13); sn.scale.setScalar(1.1); g.add(sn); saxNeon(sn, 1); } }
  // stadium (far out) + fireworks
  let fw = null;
  { const s = site(300, -1, W / 2 + 70, 48) || site(120, 1, W / 2 + 70, 48); if (s) { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); stage.add(g);
      const bowl = add(new THREE.CylinderGeometry(42, 36, 16, 40, 1, true), new THREE.MeshLambertMaterial({ color: 0x8a90a0, side: THREE.DoubleSide }), 0, 8, 0, 0, g); add(new THREE.TorusGeometry(42, .8, 6, 40), M.red, 0, 16, 0, 0, g, PI / 2);
      for (let k = 0; k < 4; k++) { const a = k / 4 * PI * 2 + .6; add(new THREE.BoxGeometry(1, 34, 1), M.steel, Math.cos(a) * 44, 17, Math.sin(a) * 44, 0, g); add(new THREE.BoxGeometry(5, 3, 1), M.lamp, Math.cos(a) * 44, 35, Math.sin(a) * 44, -a + PI / 2, g); }
      sign('stadium', 26, 6.5, Math.sin(s.ry) * 43, 21, Math.cos(s.ry) * 43, s.ry, g);
      fw = fireworks(scene, s.x, s.z); } }
  // ---------- regular buildings along the track ----------
  const SHOPS = ['reeds', 'drums', 'sheet', 'piano', 'mallet', 'cafe'], BOARDS = ['marching', 'jazz', 'drumline', 'tuba', 'mural'];
  let nB = 0;
  for (let i = 0; i < N; i += 9) for (const sd of [-1, 1]) {
    const off = W / 2 + 18 + rnd() * 12, x = P[i].x + S[i].x * sd * off, z = P[i].z + S[i].z * sd * off;
    if (clear(x, z) < W / 2 + 15 || alleyDist(x, z) < ALLEY_HW + 13 || taken.some(t => Math.hypot(t[0] - x, t[1] - z) < t[2] + 9)) continue;
    const ry = Math.atan2(P[i].x - x, P[i].z - z), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; stage.add(g); nB++;
    const kind = rnd(), fac = pick(FAC), w = 9 + rnd() * 7, d = 9 + rnd() * 6, h = 22 + rnd() * 52, u0 = Math.floor(rnd() * 8) / 8;
    let roofY = h, topW = w, topD = d;
    if (kind < .22) { // trumpet-bell tower (Brass City signature)
      const r = 4 + rnd() * 2.5; const cyl = new THREE.CylinderGeometry(r, r * 1.1, h, 16); { const uv = cyl.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * r * 6.3 / 16, uv.getY(k) * h / 16); }
      add(cyl, fac, 0, h / 2, 0, 0, g); const prof = []; for (let k = 0; k <= 12; k++) { const t = k / 12; prof.push(new THREE.Vector2(1 + t ** 3 * 1.9, t * 6)); } const bell = add(new THREE.LatheGeometry(prof, 20), M.brass, 0, h - 1, 0, 0, g); bell.scale.set(r * .8, 1.3, r * .8);
      for (let v = 0; v < 3; v++) { add(new THREE.CylinderGeometry(r * .22, r * .22, h * .3, 10), M.brass, (v - 1) * r * .6, h * .55, r * 1.02, 0, g); add(new THREE.CylinderGeometry(r * .3, r * .3, 1, 10), M.brass, (v - 1) * r * .6, h * .7 + .5, r * 1.02, 0, g); }
      add(new THREE.TorusGeometry(r * 1.12, .5, 6, 20), M.brass, 0, h * .35, 0, 0, g, PI / 2); roofY = -1;
    } else {
      const set = h > 46 && rnd() < .7; const h1 = set ? h * .62 : h;
      add(facadeBox(w, h1, d, 16, u0), fac, 0, h1 / 2, 0, 0, g);
      if (set) { topW = w * .7; topD = d * .7; add(facadeBox(topW, h - h1, topD, 16, u0 + .25), fac, 0, h1 + (h - h1) / 2, 0, 0, g); add(new THREE.BoxGeometry(w + .6, .7, d + .6), M.trim, 0, h1, 0, 0, g); }
      for (let y = 12; y < h1 - 3; y += 12 + Math.floor(rnd() * 2) * 4) add(new THREE.BoxGeometry(w + .5, .45, d + .5), rnd() < .5 ? M.trim : M.cream, 0, y, 0, 0, g); // ledges
      add(new THREE.BoxGeometry(topW + .6, 1, topD + .6), fac === FAC[1] ? M.brass : M.trim, 0, h + .5, 0, 0, g); // parapet
      const rp = rnd(); // rooftop
      if (rp < .25) waterTower(g, (rnd() - .5) * topW * .4, h + 1, (rnd() - .5) * topD * .3);
      else if (rp < .45) drumTower(g, (rnd() - .5) * topW * .3, h + 1, (rnd() - .5) * topD * .3);
      else if (rp < .7 && h < 60) billboard(g, 0, h + 1, topD * .2, 0, pick(BOARDS));
      else { add(new THREE.CylinderGeometry(.12, .2, 9, 5), M.steel, topW * .25, h + 5.5, 0, 0, g); add(new THREE.SphereGeometry(.4, 6, 5), M.neonP, topW * .25, h + 10, 0, 0, g); add(new THREE.BoxGeometry(3, 1.6, 2.4), M.steel, -topW * .2, h + 1.8, -topD * .2, 0, g); }
      // street level: awning + shop sign facing the road (+z)
      if (rnd() < .65) { add(new THREE.BoxGeometry(w * .8, .2, 2.8), pick(awn), 0, 4.6, d / 2 + 1.3, 0, g, .32); sign(pick(SHOPS), Math.min(10, w * .75), 2.4, 0, 6.6, d / 2 + .06, 0, g); }
      if (rnd() < .3) { const left = rnd() < .5 ? -1 : 1; add(new THREE.BoxGeometry(.4, 9, 2.4), M.dark, left * (w / 2 + .3), 13, d / 2 - 1.4, 0, g); sign(rnd() < .5 ? 'bladeJ' : 'bladeB', 2.2, 8.8, left * (w / 2 + .52), 13, d / 2 - 1.4, left * PI / 2, g); }
      if (rnd() < .18) sign('mural', w * .9, w * .45, w / 2 + .06, h1 * .55, 0, PI / 2, g); // side mural
      if (rnd() < .14 && h1 > 30) { const sn = new THREE.Group(); sn.position.set(0, h1 * .62, d / 2 + .4); g.add(sn); if (rnd() < .5) saxNeon(sn, 1); else trumpetNeon(sn); }
    }
  }
  // streetlamps with treble-clef banners (static, baked)
  for (let i = 5; i < N; i += 30) for (const sd of [-1, 1]) { const p = P[i], x = p.x + S[i].x * sd * (W / 2 + 3), z = p.z + S[i].z * sd * (W / 2 + 3), y0 = E[i];
    add(new THREE.CylinderGeometry(.18, .18, 7, 6), M.pole, x, y0 + 3.5, z); const hd = add(new THREE.SphereGeometry(.8, 10, 7), M.lamp, x, y0 + 7, z); hd.scale.set(1.3, .9, 1);
    if ((i / 30 | 0) % 2 === 0) { const ry = Math.atan2(T[i].x, T[i].z) + PI / 2; sign(sd > 0 ? 'clefR' : 'clefB', 1.3, 2.6, x - S[i].x * sd * .7, y0 + 5, z - S[i].z * sd * .7, ry); } }
  // tuba blimp circling the city
  const blimp = new THREE.Group(); scene.add(blimp); { const st = new THREE.Group(); const prof = []; for (let k = 0; k <= 20; k++) { const t = k / 20; prof.push(new THREE.Vector2(Math.sin(t * PI) * 7 + .01, -16 + t * 32)); }
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 22), brassMat); body.rotation.z = PI / 2; st.add(body);
    const bp = []; for (let k = 0; k <= 12; k++) { const t = k / 12; bp.push(new THREE.Vector2(2.4 + t ** 3 * 8, t * 9)); } const bell = new THREE.Mesh(new THREE.LatheGeometry(bp, 22), new THREE.MeshStandardMaterial({ color: 0xe0b04a, metalness: .85, roughness: .28, emissive: 0x402800, side: THREE.DoubleSide })); bell.rotation.z = PI / 2; bell.position.x = -13; st.add(bell);
    for (let k = 0; k < 3; k++) { const v = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 5, 10), brassMat); v.position.set(-2 + k * 3, 7.5, 0); st.add(v); }
    const gond = new THREE.Mesh(new THREE.BoxGeometry(8, 2.4, 3), M.dark); gond.position.set(2, -7.6, 0); st.add(gond);
    for (const s of [-1, 1]) { const ad = new THREE.Mesh(textPlane(atlas, 18, 4.5, R.blimpAd), SIGN); ad.position.set(1, 0, s * 7.05); ad.rotation.y = s > 0 ? 0 : PI; st.add(ad); }
    bakeChunks(st, blimp, 1e7); }
  const BL = { a: 0 }; anim.push((dt, t) => { BL.a += dt * .05; blimp.position.set(110 + Math.cos(BL.a) * 260, 120, -20 + Math.sin(BL.a) * 260); blimp.rotation.y = BL.a + PI / 2; });
  const baked = bakeChunks(stage, scene);
  return { stats: { buildings: nB, bakedMeshes: baked.length }, update(dt, t) { sky.update(dt, t); for (const f of anim) f(dt, t); if (fw) fw(dt, t); } };
}
// fireworks: one Points object, bursts re-used
function fireworks(scene, cx, cz) {
  const n = 480, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = new Float32Array(n * 3), life = new Float32Array(n);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); pts.frustumCulled = false; scene.add(pts);
  const C = [[1, .3, .8], [.3, 1, 1], [1, .85, .3], [.5, 1, .4], [1, .5, .2]]; let next = 0, cursor = 0;
  return (dt) => { next -= dt; if (next <= 0) { next = .7 + Math.random() * 1.1; const bx = cx + (Math.random() - .5) * 50, by = 70 + Math.random() * 40, bz = cz + (Math.random() - .5) * 50, c = C[Math.floor(Math.random() * C.length)];
      for (let k = 0; k < 80; k++) { const i = cursor; cursor = (cursor + 1) % n; const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), sp = 14 + Math.random() * 6; pos.set([bx, by, bz], i * 3); vel.set([Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp], i * 3); col.set(c, i * 3); life[i] = 1.6; } }
    for (let i = 0; i < n; i++) { if (life[i] <= 0) { pos[i * 3 + 1] = -500; continue; } life[i] -= dt; const f = Math.max(0, life[i] / 1.6); for (let k = 0; k < 3; k++) pos[i * 3 + k] += vel[i * 3 + k] * dt; vel[i * 3 + 1] -= 6 * dt; vel[i * 3] *= .985; vel[i * 3 + 2] *= .985; col[i * 3] *= .99; col[i * 3 + 1] *= .99; col[i * 3 + 2] *= .99; if (f < .1) col.fill(0, i * 3, i * 3 + 3); }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; };
}
