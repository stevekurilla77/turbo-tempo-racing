// Turbo Tempo Racing — Brass City prototype. © 2026 Backline Vintage. Original code/art.
import * as THREE from 'three';
const Q = new URLSearchParams(location.search);
const AUTOPILOT = Q.has('autopilot'), TIMESCALE = +Q.get('speed') || 1, AUTOSTART = Q.has('autostart');
const $ = id => document.getElementById(id);
const LAPS = 3, W = 16, N = 600;
const rand = (a, b) => a + Math.random() * (b - a);
let seed = 7; const srand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7a35c);
scene.fog = new THREE.Fog(0xf2a066, 120, 520);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.5, 1200);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
scene.add(new THREE.HemisphereLight(0xffe2c0, 0x40304a, 1.3));
const sun = new THREE.DirectionalLight(0xfff0d0, 1.8); sun.position.set(-200, 300, 100); scene.add(sun);

// sky dome with gradient
{
  const c = document.createElement('canvas'); c.width = 2; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#2a1a6a'); gr.addColorStop(0.45, '#c8508a'); gr.addColorStop(0.75, '#ffa05a'); gr.addColorStop(1, '#ffd890');
  g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshBasicMaterial({ color: 0xffe9a0, fog: false }));
  sunDisc.position.set(-500, 90, -600); sunDisc.lookAt(0, 0, 0); scene.add(sunDisc);
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshLambertMaterial({ color: 0x5a5560 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; scene.add(ground);

// ---------- track ----------
const ctrl = [[0,0],[0,-160],[30,-230],[110,-250],[190,-220],[230,-150],[200,-80],[140,-50],[130,10],[190,60],[220,140],[170,210],[80,220],[10,180],[-40,120],[-20,60]];
const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
const P = curve.getSpacedPoints(N).slice(0, N);
const T = P.map((p, i) => P[(i + 1) % N].clone().sub(P[(i - 1 + N) % N]).normalize());
const S = T.map(t => new THREE.Vector3(-t.z, 0, t.x)); // side (right) vector
const SEG = curve.getLength() / N;

function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t;
}
const roadTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3b3a42'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},255,${Math.random() * .06})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.fillStyle = '#ffd34d'; g.fillRect(w / 2 - 3, 0, 6, h * .5);
  g.fillStyle = '#eee'; g.fillRect(6, 0, 5, h); g.fillRect(w - 11, 0, 5, h);
}, true);
const curbTex = canvasTex(8, 64, (g) => { g.fillStyle = '#d22'; g.fillRect(0, 0, 8, 32); g.fillStyle = '#fff'; g.fillRect(0, 32, 8, 32); }, true);
const walkTex = canvasTex(64, 64, (g) => { g.fillStyle = '#b9b2a8'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#8f887f'; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64); }, true);

function ribbon(la, lb, y, mat, vLen, startI = 0, endI = N) {
  const pos = [], uv = [], idx = []; let d = 0, k = 0;
  for (let i = startI; i <= endI; i++) {
    const j = i % N, p = P[j], s = S[j];
    pos.push(p.x + s.x * la, y, p.z + s.z * la, p.x + s.x * lb, y, p.z + s.z * lb);
    uv.push(0, d / vLen, 1, d / vLen); d += SEG;
    if (i < endI) idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); k += 2;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); scene.add(m); return m;
}
ribbon(-W / 2, W / 2, 0.02, new THREE.MeshLambertMaterial({ map: roadTex }), 24);
ribbon(-W / 2 - 1.2, -W / 2, 0.06, new THREE.MeshLambertMaterial({ map: curbTex }), 4);
ribbon(W / 2, W / 2 + 1.2, 0.06, new THREE.MeshLambertMaterial({ map: curbTex }), 4);
ribbon(-W / 2 - 8, -W / 2 - 1.2, 0.12, new THREE.MeshLambertMaterial({ map: walkTex }), 4);
ribbon(W / 2 + 1.2, W / 2 + 8, 0.12, new THREE.MeshLambertMaterial({ map: walkTex }), 4);

// piano-key crosswalks
function crosswalk(i0) {
  const white = new THREE.MeshLambertMaterial({ color: 0xf6f3ea }), black = new THREE.MeshLambertMaterial({ color: 0x15151a });
  const grp = new THREE.Group(); const keys = 14, kw = W / keys;
  for (let k = 0; k < keys; k++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(kw * 0.92, 0.04, 6), white); m.position.set(-W / 2 + kw * (k + .5), 0.05, 0); grp.add(m);
    if ([0, 1, 3, 4, 5].includes(k % 7) && k < keys - 1) { const b = new THREE.Mesh(new THREE.BoxGeometry(kw * .6, 0.06, 3.6), black); b.position.set(-W / 2 + kw * (k + 1), 0.08, -1.2); grp.add(b); }
  }
  const p = P[i0]; grp.position.copy(p); grp.rotation.y = Math.atan2(T[i0].x, T[i0].z); scene.add(grp);
}
[110, 260, 420, 540].forEach(crosswalk);
// start/finish
{
  const t = canvasTex(128, 16, (g) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 8, y * 8, 8, 8); } });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, 2), new THREE.MeshLambertMaterial({ map: t }));
  m.rotation.x = -Math.PI / 2; m.position.copy(P[0]).setY(0.07); m.rotation.z = -Math.atan2(T[0].x, T[0].z); scene.add(m);
  // banner arch
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4a640, metalness: .8, roughness: .3 });
  [-1, 1].forEach(sd => { const post = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 10), brass); post.position.copy(P[0]).addScaledVector(S[0], sd * (W / 2 + 2)).setY(5); scene.add(post); });
  const bt = canvasTex(512, 64, (g) => { g.fillStyle = '#c0203a'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#ffd34d'; g.font = 'bold italic 30px Arial Black, Impact'; g.textAlign = 'center'; g.fillText('TURBO TEMPO ♪ BRASS CITY', 256, 46); });
  const ban = new THREE.Mesh(new THREE.BoxGeometry(W + 5, 2.4, .3), [0, 0, 0, 0, 1, 1].map(k => k ? new THREE.MeshBasicMaterial({ map: bt }) : brass));
  ban.position.copy(P[0]).setY(9.5); ban.rotation.y = Math.atan2(T[0].x, T[0].z) + Math.PI; scene.add(ban);
}

// ---------- Brass City buildings: trumpet-bell skyscrapers ----------
const winTex = canvasTex(64, 128, (g) => {
  g.fillStyle = '#4b3f5e'; g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 10) for (let x = 4; x < 64; x += 10) { g.fillStyle = Math.random() < .45 ? '#ffd88a' : '#2a2340'; g.fillRect(x, y, 6, 6); }
}, true);
const brassMat = new THREE.MeshStandardMaterial({ color: 0xe0b04a, metalness: .85, roughness: .28, emissive: 0x402800 });
const silverMat = new THREE.MeshStandardMaterial({ color: 0xcfd6de, metalness: .9, roughness: .25 });
const bellProfile = []; for (let i = 0; i <= 12; i++) { const t = i / 12; bellProfile.push(new THREE.Vector2(1 + Math.pow(t, 3) * 1.9, t * 6)); }
const bellGeo = new THREE.LatheGeometry(bellProfile, 24);
function building(x, z, kind) {
  const g = new THREE.Group(); const h = 25 + srand() * 55, r = 4 + srand() * 3;
  const bodyMat = new THREE.MeshLambertMaterial({ map: winTex.clone() }); bodyMat.map.repeat.set(2, h / 20); bodyMat.map.needsUpdate = true;
  if (kind === 0) { // trumpet tower: tall tube + flared bell top + valves
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 16), bodyMat); body.position.y = h / 2; g.add(body);
    const bell = new THREE.Mesh(bellGeo, brassMat); bell.scale.set(r * .8, 1.3, r * .8); bell.position.y = h - 1; g.add(bell);
    for (let v = 0; v < 3; v++) { const vv = new THREE.Mesh(new THREE.CylinderGeometry(r * .22, r * .22, h * .3, 10), brassMat); vv.position.set((v - 1) * r * .6, h * .55, r * 1.02); g.add(vv); const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * .3, r * .3, 1, 10), brassMat); cap.position.set((v - 1) * r * .6, h * .7 + .5, r * 1.02); g.add(cap); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.12, .5, 8, 24), brassMat); ring.rotation.x = Math.PI / 2; ring.position.y = h * .35; g.add(ring);
  } else { // box tower with brass trim and a sideways bell sign
    const w = r * 1.8; const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), bodyMat); body.position.y = h / 2; g.add(body);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 1.2, w + 1), brassMat); trim.position.y = h; g.add(trim);
    const bell = new THREE.Mesh(bellGeo, brassMat); bell.scale.set(1.3, .8, 1.3); bell.rotation.z = Math.PI / 2; bell.position.set(w / 2 + 3.5, h * .7, 0); g.add(bell);
  }
  g.position.set(x, 0, z); g.rotation.y = srand() * 6; scene.add(g);
}
for (let i = 0; i < N; i += 9) for (const sd of [-1, 1]) {
  const off = W / 2 + 18 + srand() * 12; const p = P[i].clone().addScaledVector(S[i], sd * off);
  let ok = true; for (let j = 0; j < N; j += 3) if (P[j].distanceToSquared(p) < (W / 2 + 15) ** 2) { ok = false; break; }
  if (ok) building(p.x, p.z, srand() < .6 ? 0 : 1);
}
// streetlamps shaped like music notes
for (let i = 5; i < N; i += 30) for (const sd of [-1, 1]) {
  const p = P[i].clone().addScaledVector(S[i], sd * (W / 2 + 3));
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 7), new THREE.MeshLambertMaterial({ color: 0x222 })); pole.position.copy(p).setY(3.5); scene.add(pole);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.8, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })); head.scale.set(1.3, .9, 1); head.position.copy(p).setY(7); scene.add(head);
}

// ---------- audio ----------
let AC = null, master, musicGain;
const NOTE = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, B: 493.88 };
function initAudio() {
  if (AC) return; AC = new (window.AudioContext || window.webkitAudioContext)();
  master = AC.createGain(); master.gain.value = .55; master.connect(AC.destination);
  musicGain = AC.createGain(); musicGain.gain.value = .5; musicGain.connect(master);
}
function brass(f, t, dur, vol, out = master, bright = 2600) {
  const o1 = AC.createOscillator(), o2 = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain();
  o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = f; o2.frequency.value = f * 1.004;
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(400, t); fl.frequency.linearRampToValueAtTime(bright, t + .05); fl.frequency.linearRampToValueAtTime(bright * .5, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .03); g.gain.setValueAtTime(vol * .8, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur);
  o1.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out); o1.start(t); o2.start(t); o1.stop(t + dur + .05); o2.stop(t + dur + .05);
}
let noiseBuf;
function drum(t, kind) {
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * .3, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const g = AC.createGain(); g.connect(musicGain);
  if (kind === 'kick') { const o = AC.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + .15); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(g); o.start(t); o.stop(t + .22); }
  else { const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : 7000;
    const v = kind === 'snare' ? .5 : .12, d = kind === 'snare' ? .14 : .04; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(f); f.connect(g); s.start(t); s.stop(t + d + .02); }
}
// march-ish loop in C: C Am F G, 132 bpm, 16th steps
const BPM = 132, STEP = 60 / BPM / 4;
const CHORDS = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];
const LEAD = [72, -1, 74, 76, 79, -1, 76, -1, 74, -1, 72, 74, 76, -1, -1, -1, 72, -1, 69, 72, 76, -1, 74, -1, 72, -1, 69, -1, 72, -1, -1, -1,
  69, -1, 72, 77, 81, -1, 77, -1, 76, -1, 74, 72, 74, -1, -1, -1, 71, -1, 74, 79, 77, -1, 76, -1, 74, -1, 71, -1, 74, 76, 77, 79];
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
let step = 0, nextT = 0, sections = 4;
function schedMusic() {
  if (!AC || !race.musicOn) return;
  while (nextT < AC.currentTime + .15) {
    const bar = Math.floor(step / 16) % 4, s = step % 16, ch = CHORDS[bar];
    if (s % 4 === 0) drum(nextT, 'kick');
    if (s === 4 || s === 12 || (s === 14 && bar === 3)) drum(nextT, 'snare');
    if (s % 2 === 0) drum(nextT, 'hat');
    if (s % 4 === 0 || s % 4 === 3) brass(mf(ch[0] - 12 + (s % 8 === 4 ? 7 : 0)), nextT, STEP * 1.6, .22, musicGain, 900); // tuba bass
    if (sections >= 2 && (s === 2 || s === 6 || s === 10 || s === 14)) ch.forEach(n => brass(mf(n + 12), nextT, STEP * 1.2, .05, musicGain, 1800)); // horn offbeats
    if (sections >= 3) { const n = LEAD[step % 64]; if (n > 0) brass(mf(n), nextT, STEP * 1.8, .09, musicGain, 3200); } // trumpet lead
    if (sections >= 4 && s % 8 === 0 && Math.floor(step / 64) % 2) brass(mf(ch[2] + 24), nextT, STEP * 3, .03, musicGain, 5000); // piccolo sparkle
    nextT += STEP; step++;
  }
}
function sfx(f, dur = .35, vol = .25) { if (AC) brass(f, AC.currentTime, dur, vol, master, 4000); }

// ---------- cars ----------
const CARS = {
  trombone: { name: 'Trombone Coupe', color: 0xd9353a, top: 60, accel: 22, turn: 1.9, tough: .5, move: 'Slide Dash' },
  tuba: { name: 'Tuba Truck', color: 0x2f6fd8, top: 56, accel: 13, turn: 1.45, tough: .92, move: 'Bass Blast' },
  piccolo: { name: 'Piccolo Racer', color: 0xf2f2f2, top: 66, accel: 21, turn: 1.8, tough: .18, move: 'High Trill' },
  snare: { name: 'Snare Kart', color: 0x38b04a, top: 57.5, accel: 25, turn: 2.6, tough: .3, move: 'Drum Roll' },
  horn: { name: 'French Horn Cruiser', color: 0x8a3fd0, top: 58, accel: 19, turn: 2.2, tough: .5, move: 'Horn Call' },
};
function carMesh(type) {
  const c = CARS[type], g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: c.color, metalness: .4, roughness: .35 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a1a22 }), glass = new THREE.MeshStandardMaterial({ color: 0x223355, metalness: .6, roughness: .1 });
  const sc = type === 'tuba' ? 1.2 : type === 'snare' ? .85 : 1;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2 * sc, .8, 4.4 * (type === 'piccolo' ? 1.15 : 1)), paint); body.position.y = .75; g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2 * sc, .5, 1.2), paint); nose.position.set(0, .6, 2.6); g.add(nose);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7 * sc, .7, 1.8), glass); cab.position.set(0, 1.45, type === 'tuba' ? 1 : -.2); g.add(cab);
  for (const [x, z] of [[-1.15, 1.4], [1.15, 1.4], [-1.15, -1.4], [1.15, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .45, 14), dark); w.rotation.z = Math.PI / 2; w.position.set(x * sc, .5, z); g.add(w); }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(2 * sc, .25, .2), new THREE.MeshBasicMaterial({ color: 0xff3020 })); tail.position.set(0, .9, -2.21); g.add(tail);
  if (type === 'trombone') { // slide tubes over the roof + bell at the back
    for (const x of [-.45, .45]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 4.6, 8), brassMat); t.rotation.x = Math.PI / 2; t.position.set(x, 2, .2); g.add(t); }
    const u = new THREE.Mesh(new THREE.TorusGeometry(.45, .09, 8, 16, Math.PI), brassMat); u.position.set(0, 2, 2.5); u.rotation.x = Math.PI / 2; g.add(u);
    const b = new THREE.Mesh(bellGeo, brassMat); b.scale.set(.18, .14, .18); b.rotation.x = -Math.PI / 2; b.position.set(.45, 2, -1.8); g.add(b);
  } else if (type === 'tuba') { const b = new THREE.Mesh(bellGeo, brassMat); b.scale.set(.3, .25, .3); b.position.set(0, 1.1, -1.2); g.add(b); const coil = new THREE.Mesh(new THREE.TorusGeometry(.7, .2, 8, 20), brassMat); coil.position.set(0, 1.6, -.4); g.add(coil); }
  else if (type === 'piccolo') { const fl = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 5.4, 10), silverMat); fl.rotation.x = Math.PI / 2; fl.position.set(0, 1.3, .4); g.add(fl); for (let k = 0; k < 5; k++) { const key = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .08, 8), silverMat); key.position.set(0, 1.44, -1 + k * .7); g.add(key); } }
  else if (type === 'snare') { const d = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .6, 20), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })); d.position.set(0, 1.5, -1.3); g.add(d); const rim = new THREE.Mesh(new THREE.TorusGeometry(.9, .08, 6, 20), new THREE.MeshLambertMaterial({ color: 0xc02020 })); rim.rotation.x = Math.PI / 2; rim.position.set(0, 1.8, -1.3); g.add(rim); }
  else if (type === 'horn') { const coil = new THREE.Mesh(new THREE.TorusGeometry(.75, .12, 8, 24), brassMat); coil.position.set(0, 1.9, -1.1); g.add(coil); const b = new THREE.Mesh(bellGeo, brassMat); b.scale.set(.18, .14, .18); b.rotation.x = -Math.PI / 2; b.position.set(.7, 1.9, -1.7); g.add(b); }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .35 })); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.5 * sc, 2.6, 1); shadow.position.y = .03; g.add(shadow);
  scene.add(g); return g;
}
const DRIVERS = { trombone: 'You', tuba: 'Reese', piccolo: 'Jordan', snare: 'Kai', horn: 'Sky' };
const cars = [];
function makeCar(type, isPlayer, slot) {
  const c = { type, ...CARS[type], isPlayer, mesh: carMesh(type), idx: 0, lap: 0, maxIdx: 0, v: 0, h: 0, x: 0, z: 0, lat: 0, steer: 0,
    boost: 0, dash: 0, meter: 0, hitT: 9, finished: false, finishTime: 0, lane: (slot % 2 ? 1 : -1) * rand(2, 5), aiSkill: rand(.97, 1.03), aiMoveT: rand(4, 9) };
  c.driver = DRIVERS[type]; cars.push(c); return c;
}
const player = makeCar('trombone', true, 0);
['tuba', 'piccolo', 'snare', 'horn'].forEach((t, i) => makeCar(t, false, i + 1));
function gridUp() {
  // player starts at back-middle; rivals ahead in a 2-wide grid
  const order = [cars[1], cars[2], cars[3], cars[4], player];
  order.forEach((c, k) => {
    const i = (N - 6 - k * 5) % N, side = k === 4 ? 0 : (k % 2 ? 3.5 : -3.5);
    c.idx = i; c.x = P[i].x + S[i].x * side; c.z = P[i].z + S[i].z * side; c.h = Math.atan2(T[i].x, T[i].z);
    c.v = 0; c.lap = -1; c.maxIdx = N; c.boost = c.dash = c.meter = 0; c.finished = false; c.hitT = 9; c.lat = side;
  });
}

// ---------- note gates ----------
const MELODY = 'CDECEFGGAGFEDC'.split('');
const noteTex = {}; const NOTE_COL = { C: '#e53935', D: '#fb8c00', E: '#fdd835', F: '#43a047', G: '#1e88e5', A: '#5e35b1', B: '#d81b60' };
for (const n of 'CDEFGAB') noteTex[n] = canvasTex(128, 128, (g) => {
  g.fillStyle = NOTE_COL[n]; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(4, 4, 120, 120);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.font = 'bold 60px serif'; g.fillText('♪', 8, 54);
  g.fillStyle = '#fff'; g.font = 'bold 84px Arial Black, Impact'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(n, 72, 72); g.fillText(n, 72, 72);
});
const GATE_IDX = [40, 95, 150, 205, 265, 330, 390, 450, 510, 565];
const gates = GATE_IDX.map(i => {
  const g = new THREE.Group(); const panels = [];
  for (let k = 0; k < 3; k++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: noteTex.C, transparent: true, opacity: .92, side: THREE.DoubleSide }));
    m.position.set((k - 1) * (W / 3), 4.2, 0); g.add(m); panels.push(m);
  }
  for (const x of [-W / 2 - .5, W / 2 + .5]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 7.5), brassMat); post.position.set(x, 3.75, 0); g.add(post); }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, W + 1), brassMat); bar.rotation.z = Math.PI / 2; bar.position.y = 7.5; g.add(bar);
  g.position.copy(P[i]); g.rotation.y = Math.atan2(T[i].x, T[i].z) + Math.PI; scene.add(g);
  return { i, g, panels, notes: ['C', 'D', 'E'], used: false };
});
function setGate(gate, target) {
  const others = 'CDEFGAB'.split('').filter(n => n !== target).sort(() => Math.random() - .5);
  const slot = Math.floor(Math.random() * 3); gate.notes = [0, 1, 2].map(k => k === slot ? target : others.pop());
  gate.panels.forEach((p, k) => { p.material.map = noteTex[gate.notes[k]]; p.material.opacity = .92; p.scale.setScalar(1); p.material.needsUpdate = true; });
  gate.used = false;
}
const panelLat = k => (k - 1) * (W / 3);

// ---------- music stands (hazards) ----------
const stands = [];
const STAND_AT = [[70, -4], [125, 4.5], [180, 0], [235, -5], [300, 3], [360, -2], [420, 5], [480, -4.5], [530, 2], [560, -5]];
for (const [i, l] of STAND_AT) {
  const g = new THREE.Group(); const blk = new THREE.MeshStandardMaterial({ color: 0x202024, metalness: .7, roughness: .4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 2.4), blk); pole.position.y = 1.2; g.add(pole);
  for (let a = 0; a < 3; a++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.1), blk); leg.position.set(Math.sin(a * 2.1) * .35, .25, Math.cos(a * 2.1) * .35); leg.rotation.set(Math.cos(a * 2.1) * .7, 0, -Math.sin(a * 2.1) * .7); g.add(leg); }
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, .08), blk); desk.position.set(0, 2.6, 0); desk.rotation.x = -.35; g.add(desk);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .95), new THREE.MeshBasicMaterial({ map: canvasTex(64, 40, (c) => { c.fillStyle = '#fffbe8'; c.fillRect(0, 0, 64, 40); c.strokeStyle = '#333'; for (let y = 6; y < 40; y += 6) { c.beginPath(); c.moveTo(2, y); c.lineTo(62, y); c.stroke(); } c.fillStyle = '#000'; for (let x = 8; x < 60; x += 9) { c.beginPath(); c.arc(x, 8 + Math.random() * 26, 2.5, 0, 7); c.fill(); } }) }));
  sheet.position.set(0, 2.63, -.06); sheet.rotation.x = -.35; sheet.rotation.y = Math.PI; g.add(sheet);
  const pos = P[i].clone().addScaledVector(S[i], l); g.position.copy(pos); g.rotation.y = Math.atan2(T[i].x, T[i].z); scene.add(g);
  stands.push({ g, x: pos.x, z: pos.z, home: pos.clone(), down: 0, vx: 0, vz: 0, spin: 0 });
}

// ---------- race state ----------
const race = { state: 'menu', t: 0, countdown: 0, gateNext: 0, mel: 0, style: 0, hits: 0, gatesHit: 0, gatesTotal: 0, dashes: 0, musicOn: false, results: null, place: 5 };
window.__tt = { race, player, cars, gates, stands, errors: [] };
function resetGates() { race.mel = 0; gates.forEach(g => setGate(g, MELODY[0])); race.gateNext = 0; }
function startRace() {
  initAudio(); if (AC.state === 'suspended') AC.resume();
  gridUp(); resetGates(); stands.forEach(restoreStand);
  Object.assign(race, { state: 'count', t: 0, countdown: 3.999, style: 0, hits: 0, gatesHit: 0, gatesTotal: 0, dashes: 0, results: null, musicOn: true });
  step = 0; nextT = AC.currentTime + .1; $('overlay').style.display = 'none';
}
function restoreStand(s) { s.down = 0; s.x = s.home.x; s.z = s.home.z; s.g.position.copy(s.home); s.g.rotation.x = s.g.rotation.z = 0; }
$('go').onclick = startRace;

// ---------- input ----------
const keys = {}; const touch = { l: 0, r: 0, brake: 0, dash: 0 };
addEventListener('keydown', e => { keys[e.code] = 1; if (e.code === 'Space') { touch.dashPress = 1; e.preventDefault(); } if (race.state === 'menu' && (e.code === 'Enter')) startRace(); });
addEventListener('keyup', e => { keys[e.code] = 0; });
function holdBtn(id, k) { const el = $(id);
  const on = e => { e.preventDefault(); touch[k] = 1; el.classList.add('on'); if (k === 'dash') touch.dashPress = 1; initAudio(); };
  const off = e => { e.preventDefault(); touch[k] = 0; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off); }
holdBtn('bl', 'l'); holdBtn('br', 'r'); holdBtn('bbrake', 'brake'); holdBtn('bdash', 'dash');
// tilt-free: also allow dragging anywhere on left half to steer is skipped to keep buttons clear.

// ---------- simulation ----------
const tmp = new THREE.Vector3();
function nearestIdx(c) {
  let best = c.idx, bd = 1e9;
  for (let o = -15; o <= 30; o++) { const j = (c.idx + o + N) % N, dx = P[j].x - c.x, dz = P[j].z - c.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = j; } }
  return best;
}
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function aiSteer(c, look, lane) {
  const j = (c.idx + look) % N, tx = P[j].x + S[j].x * lane, tz = P[j].z + S[j].z * lane;
  return Math.max(-1, Math.min(1, -angDiff(Math.atan2(tx - c.x, tz - c.z), c.h) * 2.5));
}
function progress(c) { return c.lap * N + c.idx + (c.finished ? 1e6 - c.finishTime : 0); }

function stepCar(c, dt) {
  let steer = 0, brake = 0, gas = 1;
  if (race.state !== 'race' || c.finished) { gas = race.state === 'race' || c.finished ? .3 : 0; }
  if (c.isPlayer && !AUTOPILOT && !c.finished) {
    steer = (keys.ArrowRight || keys.KeyD || touch.r ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || touch.l ? 1 : 0);
    brake = keys.ArrowDown || keys.KeyS || touch.brake ? 1 : 0;
    if (touch.dashPress) { touch.dashPress = 0; tryDash(c); }
  } else {
    // AI / autopilot: aim at the melody panel if a gate is ahead
    let lane = c.lane;
    const g = gates.find(g => { const d = (g.i - c.idx + N) % N; return d > 0 && d < 45; });
    if (g && c.isPlayer) { const k = g.notes.indexOf(c.isPlayer ? MELODY[race.mel % MELODY.length] : g.notes[1]); if (k >= 0) lane = panelLat(k); }
    for (const s of stands) { if (s.down) continue; const dx = s.x - c.x, dz = s.z - c.z; const fwd = dx * Math.sin(c.h) + dz * Math.cos(c.h); if (fwd > 0 && fwd < 30) { const side = -dx * Math.cos(c.h) + dz * Math.sin(c.h); if (Math.abs(side) < 2.6) lane = c.lat + (side > 0 ? -3.4 : 3.4); } }
    lane = Math.max(-W / 2 + 1.5, Math.min(W / 2 - 1.5, lane));
    steer = aiSteer(c, Math.round(8 + c.v * .12), lane);
    if (!c.isPlayer) { c.aiMoveT -= dt; if (c.aiMoveT < 0 && race.state === 'race') { c.aiMoveT = rand(4, 8); c.boost = Math.max(c.boost, 1.2); } }
    else if (c.meter >= 1 && race.state === 'race') tryDash(c);
  }
  if (race.state !== 'race' && !c.finished) { steer = 0; }
  c.steer += (steer - c.steer) * Math.min(1, dt * 10);
  // top speed
  const lat = c.lat, off = Math.abs(lat) > W / 2 + .5;
  let top = c.top * (c.isPlayer ? 1 : c.aiSkill * rubber(c));
  if (off && c.dash <= 0) top *= .55;
  if (c.boost > 0) top *= 1.28;
  if (c.dash > 0) top *= 1.42;
  if (c.finished) top *= .5;
  if (brake) c.v -= 45 * dt; else if (c.v < top) c.v += c.accel * gas * dt * (c.boost > 0 || c.dash > 0 ? 2.2 : 1) * (1 - .4 * c.v / top);
  else c.v -= (c.v - top) * Math.min(1, dt * 1.5);
  c.v = Math.max(0, c.v);
  const turn = c.turn * (c.dash > 0 ? 1.35 : 1) * Math.min(1, c.v / 15) * (1 - .25 * Math.min(1, c.v / 70));
  c.h -= c.steer * turn * dt; // forward = (sin h, cos h); positive steer = right turn = decreasing h
  c.x += Math.sin(c.h) * c.v * dt; c.z += Math.cos(c.h) * c.v * dt;
  c.boost -= dt; c.dash -= dt; c.hitT += dt;
  // track position
  const prev = c.idx; c.idx = nearestIdx(c);
  c.lat = (c.x - P[c.idx].x) * S[c.idx].x + (c.z - P[c.idx].z) * S[c.idx].z;
  const LIM = W / 2 + 6.5; if (Math.abs(c.lat) > LIM) { const push = c.lat - Math.sign(c.lat) * LIM; c.x -= S[c.idx].x * push; c.z -= S[c.idx].z * push; c.v *= 1 - (1 - c.tough) * .08; c.h += angDiff(Math.atan2(T[c.idx].x, T[c.idx].z), c.h) * .15; if (c.isPlayer) hit(c, false); }
  if (prev > N * .85 && c.idx < N * .15) { if (c.maxIdx > N * .5) { c.lap++; c.maxIdx = c.idx; onLap(c); } }
  else if (prev < N * .15 && c.idx > N * .85) { /* went backwards over the line */ }
  else c.maxIdx = Math.max(c.maxIdx, c.idx);
  // gates
  if (c.isPlayer && race.state === 'race') {
    const g = gates[race.gateNext]; const d = (c.idx - g.i + N) % N;
    if (d >= 0 && d < 20 && !g.used) passGate(c, g);
  }
  // meter: clean driving fills slide dash
  if (c.isPlayer && race.state === 'race' && !c.finished) {
    if (!off && c.hitT > 1.2 && c.v > c.top * .6) { c.meter = Math.min(1, c.meter + dt * .075); race.style += dt * 4; }
  }
  // stands
  for (const s of stands) {
    if (s.down) continue; const dx = s.x - c.x, dz = s.z - c.z;
    if (dx * dx + dz * dz < 2.2 * 2.2) { s.down = 1; s.vx = Math.sin(c.h) * c.v * .6 + rand(-3, 3); s.vz = Math.cos(c.h) * c.v * .6 + rand(-3, 3); s.spin = rand(-8, 8); c.v *= .45 + .5 * c.tough; if (c.isPlayer) { hit(c, true); sfx(110, .3, .3); } }
  }
}
function rubber(c) { // mild catch-up so the race stays close
  const d = (progress(player) - progress(c)) / N; return 1 + Math.max(-.07, Math.min(.06, d * .12));
}
function hit(c, stand) { if (c.hitT > .6) { if (stand) { race.style -= 40; race.hits++; c.meter = Math.max(0, c.meter - .25); flash('BONK!'); } } c.hitT = 0; }
function tryDash(c) { if (c.meter >= 1 && c.dash <= 0) { c.meter = 0; c.dash = 1.6; c.v += 10; race.dashes++; race.style += 50; flash('SLIDE DASH!'); if (AC) { const t = AC.currentTime; for (let k = 0; k < 6; k++) brass(mf(55 + k * 3), t + k * .05, .18, .12); } } }
function passGate(c, g) {
  g.used = true; race.gatesTotal++;
  const k = [0, 1, 2].reduce((b, k) => Math.abs(c.lat - panelLat(k)) < Math.abs(c.lat - panelLat(b)) ? k : b, 0);
  const want = MELODY[race.mel % MELODY.length], got = g.notes[k];
  if (got === want && Math.abs(c.lat - panelLat(k)) < W / 6 + .5) {
    race.gatesHit++; race.style += 100; c.boost = 1.6; c.v += 8; c.meter = Math.min(1, c.meter + .2); race.mel++;
    g.panels[k].scale.setScalar(1.4); sfx(NOTE[got] * 2, .5, .35); flash(got + '! ON MELODY');
  } else { g.panels.forEach(p => p.material.opacity = .3); sfx(NOTE[got] * .5, .25, .18); }
  race.gateNext = (race.gateNext + 1) % gates.length;
  setGate(gates[race.gateNext], MELODY[race.mel % MELODY.length]);
  // reset previously passed gate (to keep it visible) after it's behind
  setTimeout(() => { if (gates.indexOf(g) !== race.gateNext) setGate(g, MELODY[(race.mel + 7) % MELODY.length]); }, 1500);
}
function onLap(c) {
  if (c.lap === 0) return;
  if (c.lap >= LAPS && !c.finished) { c.finished = true; c.finishTime = race.t; if (c.isPlayer) finishRace(); }
  else if (c.isPlayer) { flash(c.lap === LAPS - 1 ? 'FINAL LAP!' : 'LAP ' + (c.lap + 1)); stands.forEach(restoreStand); sfx(523, .25); }
}
let flashT = 0; function flash(t) { $('msg').textContent = t; flashT = 1.2; }
function finishRace() {
  race.state = 'done'; const order = [...cars].sort((a, b) => progress(b) - progress(a)); const place = order.indexOf(player) + 1;
  const bonus = [1000, 700, 500, 300, 150][place - 1]; const style = Math.round(race.style);
  race.results = { place, style, bonus, total: style + bonus, order: order.map(c => c.driver + ' — ' + c.name) };
  flash(place === 1 ? '1ST PLACE!' : 'FINISH!');
  setTimeout(() => {
    const ov = $('overlay'); ov.style.display = 'flex';
    ov.innerHTML = `<h1>${['1ST', '2ND', '3RD', '4TH', '5TH'][place - 1]} PLACE</h1><table>
      <tr><td>Place bonus</td><td>${bonus}</td></tr><tr><td>Style (gates ${race.gatesHit}/${race.gatesTotal}, dashes ${race.dashes}, bonks ${race.hits})</td><td>${style}</td></tr>
      <tr><td><b>BAND SCORE</b></td><td><b>${style + bonus}</b></td></tr></table>
      <table>${order.map((c, i) => `<tr><td>${i + 1}.</td><td>${c.driver}</td><td>${c.name}</td></tr>`).join('')}</table>
      <button id="again">RACE AGAIN</button>`;
    $('again').onclick = startRace;
  }, 1800);
}
function collide() {
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
    const a = cars[i], b = cars[j], dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz, R = 2.6;
    if (d2 < R * R && d2 > 1e-6) {
      const d = Math.sqrt(d2), o = (R - d) / 2, nx = dx / d, nz = dz / d;
      const wa = 1 - a.tough * .8 + .1, wb = 1 - b.tough * .8 + .1, ws = wa + wb;
      a.x -= nx * o * 2 * wa / ws; a.z -= nz * o * 2 * wa / ws; b.x += nx * o * 2 * wb / ws; b.z += nz * o * 2 * wb / ws;
      a.v *= 1 - .03 * (1 - a.tough); b.v *= 1 - .03 * (1 - b.tough);
      if (a.isPlayer || b.isPlayer) player.hitT = 0;
    }
  }
}
function sim(dt) {
  if (race.state === 'count') {
    const before = Math.ceil(race.countdown); race.countdown -= dt; const after = Math.ceil(race.countdown);
    if (after !== before) { if (after > 0) { flash(String(after)); sfx(392, .2); } else { flash('GO!'); sfx(784, .5, .35); race.state = 'race'; } }
  }
  if (race.state === 'race' || race.state === 'done') race.t += dt;
  if (race.state !== 'menu') { cars.forEach(c => stepCar(c, dt)); collide(); }
  for (const s of stands) if (s.down) { s.x += s.vx * dt; s.z += s.vz * dt; s.vx *= .97; s.vz *= .97; s.g.position.set(s.x, 0, s.z); s.g.rotation.x = Math.min(1.5, s.g.rotation.x + dt * 6); s.g.rotation.y += s.spin * dt; s.spin *= .96; }
}

// ---------- render loop ----------
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let camInit = false;
let camDt = 1 / 60;
function syncMeshes() {
  for (const c of cars) { c.mesh.position.set(c.x, 0, c.z); c.mesh.rotation.y = c.h; c.mesh.rotation.z = -c.steer * .06 * Math.min(1, c.v / 40); }
  const f = tmp.set(Math.sin(player.h), 0, Math.cos(player.h));
  const want = new THREE.Vector3(player.x, 0, player.z).addScaledVector(f, -10.5).setY(4.4);
  const look = new THREE.Vector3(player.x, 1.6, player.z).addScaledVector(f, 7);
  if (!camInit) { camPos.copy(want); camLook.copy(look); camInit = true; }
  const k = 1 - Math.exp(-camDt * 9); camPos.lerp(want, k); camLook.lerp(look, Math.min(1, k * 1.8)); camera.position.copy(camPos); camera.lookAt(camLook);
  camera.fov = 66 + Math.min(14, player.v * .12) + (player.dash > 0 ? 6 : 0); camera.updateProjectionMatrix();
}
function hud() {
  const order = [...cars].sort((a, b) => progress(b) - progress(a)); race.place = order.indexOf(player) + 1;
  sections = race.state === 'race' ? Math.max(1, 5 - race.place) : 4;
  $('place').textContent = ['1st', '2nd', '3rd', '4th', '5th'][race.place - 1];
  $('lap').firstChild.textContent = `LAP ${Math.min(LAPS, Math.max(1, player.lap + 1))}/${LAPS}`;
  $('style').textContent = 'STYLE ' + Math.round(race.style);
  const want = MELODY[race.mel % MELODY.length]; $('nn').textContent = want; $('nn').style.color = NOTE_COL[want];
  $('melody').innerHTML = MELODY.map((n, i) => i === race.mel % MELODY.length ? `<u style="color:#ff0">${n}</u>` : n).join(' ');
  $('speed').textContent = Math.round(player.v * 1.6) + ' MPH';
  $('meterfill').style.width = (player.meter * 100) + '%'; $('meter').style.borderColor = player.meter >= 1 ? '#fff' : '#ffd34d';
  $('bdash').style.background = player.meter >= 1 ? 'rgba(255,200,40,.6)' : '';
}
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(.1, (now - last) / 1000) * TIMESCALE; last = now; acc += dt;
  try {
    while (acc > 1 / 60) { sim(1 / 60); acc -= 1 / 60; }
    camDt = dt; schedMusic(); syncMeshes(); hud();
    if (flashT > 0) { flashT -= dt / TIMESCALE; if (flashT <= 0) $('msg').textContent = ''; }
    renderer.render(scene, camera);
  } catch (e) { window.__tt.errors.push(String(e)); console.error(e); }
}
gridUp(); resetGates(); syncMeshes();
requestAnimationFrame(frame);
if (AUTOSTART) setTimeout(startRace, 300);
