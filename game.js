// Turbo Tempo Racing — Brass City prototype. © 2026 Backline Vintage. Original code/art.
import * as THREE from 'three';
const Q = new URLSearchParams(location.search);
const AUTOPILOT = Q.has('autopilot'), TIMESCALE = +Q.get('speed') || 1, AUTOSTART = Q.has('autostart');
const $ = id => document.getElementById(id);
// ================= STEERING TUNING (player only) =================
// "sensitive" = default (v5 experiment). "smooth" = v4 feel; use ?steer=smooth to compare.
const STEER_PRESETS = {
  sensitive: { easeIn: 5.0,  recenter: 7.0, reverse: 8.0, turnMul: 1.4, highSpeedCut: .18, alignFree: .5, alignSteer: .12, edgePush: .7 },
  // smooth preset (v4 values):
  smooth:    { easeIn: 2.2,  recenter: 4.5, reverse: 5.0, turnMul: 1.0, highSpeedCut: .35, alignFree: .9, alignSteer: .25, edgePush: 1.2 },
};
// easeIn/recenter/reverse: steer change per second (1/easeIn = seconds to full lock)
// turnMul: max turn rate multiplier; highSpeedCut: fraction of turn rate lost at top speed
// alignFree/alignSteer: road-assist strength when not steering / while steering; edgePush: nudge back from the curb
const STEER = STEER_PRESETS[new URLSearchParams(location.search).get('steer') === 'smooth' ? 'smooth' : 'sensitive'];
// =================================================================
const LAPS = 3, W = 28, N = 600;
const rand = (a, b) => a + Math.random() * (b - a);
let seed = 7; const srand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
function vpSize() { const v = window.visualViewport; return [Math.round(v ? v.width : innerWidth), Math.round(v ? v.height : innerHeight)]; }
renderer.setSize(...vpSize());
document.documentElement.style.setProperty('--vvh', vpSize()[1] + 'px');
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7a35c);
scene.fog = new THREE.Fog(0xf2a066, 120, 520);
const camera = new THREE.PerspectiveCamera(68, vpSize()[0] / vpSize()[1], 0.5, 1200);
function onResize() { const [w, h] = vpSize(); document.documentElement.style.setProperty('--vvh', h + 'px'); renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); window.scrollTo(0, 0); }
addEventListener('resize', onResize); addEventListener('orientationchange', () => { onResize(); setTimeout(onResize, 300); setTimeout(onResize, 800); });
if (window.visualViewport) visualViewport.addEventListener('resize', onResize);
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
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
// elevation: one hill (the timpani slope) — everything that sits on the road adds E[i]
const HILL_C = 415, HILL_W = 52, HILL_H = 7;
const E = P.map((p, i) => Math.abs(i - HILL_C) < HILL_W ? HILL_H * (.5 + .5 * Math.cos(Math.PI * (i - HILL_C) / HILL_W)) : 0);
// shortcut alley: straight cut from P[ALLEY_A] to P[ALLEY_B] (inside of the S-bend)
const ALLEY_A = 265, ALLEY_B = 340, ALLEY_HW = 3.6;

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
    pos.push(p.x + s.x * la, y + E[j], p.z + s.z * la, p.x + s.x * lb, y + E[j], p.z + s.z * lb);
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
// retaining walls under the raised hill section
{ const wallTex = canvasTex(64, 32, (g) => { g.fillStyle = '#8a5a44'; g.fillRect(0, 0, 64, 32); g.strokeStyle = '#6a4030'; g.lineWidth = 2; for (let y = 0; y < 32; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); for (let x = (y / 8) % 2 * 8; x < 64; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } } }, true);
  for (const lat of [-W / 2 - 8, W / 2 + 8]) { const pos = [], uv = [], idx = []; let k = 0;
    for (let i = HILL_C - HILL_W; i <= HILL_C + HILL_W; i++) { const p = P[i], sd = S[i]; pos.push(p.x + sd.x * lat, -0.1, p.z + sd.z * lat, p.x + sd.x * lat, E[i] + .12, p.z + sd.z * lat); uv.push(i * SEG / 8, 0, i * SEG / 8, Math.max(.1, E[i] / 4));
      if (i < HILL_C + HILL_W) idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); k += 2; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: wallTex, side: THREE.DoubleSide }))); } }

// piano-key crosswalks
function crosswalk(i0) {
  const white = new THREE.MeshLambertMaterial({ color: 0xf6f3ea }), black = new THREE.MeshLambertMaterial({ color: 0x15151a });
  const grp = new THREE.Group(); const keys = 24, kw = W / keys;
  for (let k = 0; k < keys; k++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(kw * 0.92, 0.04, 6), white); m.position.set(-W / 2 + kw * (k + .5), 0.05, 0); grp.add(m);
    if ([0, 1, 3, 4, 5].includes(k % 7) && k < keys - 1) { const b = new THREE.Mesh(new THREE.BoxGeometry(kw * .6, 0.06, 3.6), black); b.position.set(-W / 2 + kw * (k + 1), 0.08, -1.2); grp.add(b); }
  }
  const p = P[i0]; grp.position.copy(p).setY(E[i0]); grp.rotation.y = Math.atan2(T[i0].x, T[i0].z); scene.add(grp);
}
[110, 230, 490, 560].forEach(crosswalk);
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

function alleyUV(x, z) { const a = P[ALLEY_A], b = P[ALLEY_B], abx = b.x - a.x, abz = b.z - a.z, L2 = abx * abx + abz * abz, L = Math.sqrt(L2);
  const t = ((x - a.x) * abx + (z - a.z) * abz) / L2, u = ((x - a.x) * -abz + (z - a.z) * abx) / L; return { t, u, L }; }
function alleyDist(x, z) { const { t, u, L } = alleyUV(x, z); return t < 0 || t > 1 ? 1e9 : Math.abs(u); }
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
  if (alleyDist(p.x, p.z) < ALLEY_HW + 13) ok = false;
  if (ok) building(p.x, p.z, srand() < .6 ? 0 : 1);
}
// streetlamps shaped like music notes
for (let i = 5; i < N; i += 30) for (const sd of [-1, 1]) {
  const p = P[i].clone().addScaledVector(S[i], sd * (W / 2 + 3));
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 7), new THREE.MeshLambertMaterial({ color: 0x222 })); pole.position.copy(p).setY(3.5 + E[i]); scene.add(pole);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.8, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })); head.scale.set(1.3, .9, 1); head.position.copy(p).setY(7 + E[i]); scene.add(head);
}

// ---------- audio ----------
let AC = null, master, musicGain;
const NOTE = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, B: 493.88 };
// iOS-robust audio unlock: must run synchronously inside a user gesture
let silentEl = null;
function silentWavUrl() { const n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' })); }
function initAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (_) {} // iOS 17+: ignore silent switch
  if (!silentEl) { try { silentEl = document.createElement('audio'); silentEl.src = silentWavUrl(); silentEl.loop = true; silentEl.setAttribute('playsinline', ''); silentEl.setAttribute('x-webkit-airplay', 'deny'); silentEl.preload = 'auto'; document.body.appendChild(silentEl); } catch (_) {} }
  if (silentEl && silentEl.paused) { const pr = silentEl.play(); if (pr && pr.catch) pr.catch(() => {}); } // older iOS: media playback flips the session out of "ambient"
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = .55; master.connect(AC.destination);
    musicGain = AC.createGain(); musicGain.gain.value = .5; musicGain.connect(master);
  }
  if (AC.state !== 'running') { const pr = AC.resume(); if (pr && pr.catch) pr.catch(() => {}); }
  try { const sb = AC.createBufferSource(); sb.buffer = AC.createBuffer(1, 1, 22050); sb.connect(AC.destination); sb.start(0); } catch (_) {}
}
for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click', 'keydown']) document.addEventListener(ev, () => { if (!AC || AC.state !== 'running' || (silentEl && silentEl.paused)) initAudio(); }, { capture: true, passive: true });
document.addEventListener('visibilitychange', () => { if (!AC) return; if (document.hidden) { AC.suspend && AC.suspend().catch(() => {}); } else if (race.musicOn) { initAudio(); nextT = AC.currentTime + .1; } });
setInterval(() => { if (AC && AC.state !== 'running' && !document.hidden && race.musicOn) { AC.resume().catch(() => {}); } }, 1000);
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
  if (AC.state !== 'running') return;
  if (nextT < AC.currentTime - .2) nextT = AC.currentTime + .05; // resumed after a pause: don't burst
  while (nextT < AC.currentTime + .15) { window.__tt.musicSteps = (window.__tt.musicSteps || 0) + 1;
    const bar = Math.floor(step / 16) % 4, s = step % 16, ch = CHORDS[bar];
    if (s % 4 === 0) drum(nextT, 'kick');
    if (s === 4 || s === 12 || (s === 14 && bar === 3)) drum(nextT, 'snare');
    if (s % 2 === 0) drum(nextT, 'hat');
    if (s % 4 === 0 || s % 4 === 3) brass(mf(ch[0] - 12 + (s % 8 === 4 ? 7 : 0)), nextT, STEP * 1.6, .22, musicGain, 900); // tuba bass
    if (sections >= 2 && (s === 2 || s === 6 || s === 10 || s === 14)) ch.forEach(n => brass(mf(n + 12), nextT, STEP * 1.2, .05, musicGain, 1800)); // horn offbeats
    if (sections >= 3) { const n = LEAD[step % 64]; if (n > 0) brass(mf(n), nextT, STEP * 1.8, .09, musicGain, 3200); } // trumpet lead
    if (sections >= 4 && s % 4 === 0) brass(mf(ch[(s / 4) % 3] + 24), nextT, STEP * 1.5, .025, musicGain, 5000); // piccolo arpeggio
    if (sections >= 5) { const n = LEAD[step % 64]; if (n > 0) brass(mf(n - 4), nextT, STEP * 1.8, .05, musicGain, 2400); if (s === 15 && bar === 3) for (let r = 0; r < 4; r++) drum(nextT + r * STEP / 4, 'snare'); } // full band: harmony + snare fills
    nextT += STEP; step++;
  }
}
function sfx(f, dur = .35, vol = .25) { if (AC) window.__tt.sfx = (window.__tt.sfx || 0) + 1; if (AC) brass(f, AC.currentTime, dur, vol, master, 4000); }

// ---------- Trombone Super Racer (player car): low-slung brass supercar built from primitives ----------
const carEnv = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#3a1a6a'); gr.addColorStop(.3, '#c08a3a'); gr.addColorStop(.46, '#fff4d0'); gr.addColorStop(.54, '#6a5030'); gr.addColorStop(1, '#141018');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128); g.fillStyle = 'rgba(255,240,200,.9)'; for (let x = 8; x < 256; x += 22) g.fillRect(x, 38 + (x % 3) * 4, 8, 22); // bright "windows" for sparkle
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
const tbBrass = new THREE.MeshStandardMaterial({ color: 0xf2c24a, metalness: 1, roughness: .2, envMap: carEnv, envMapIntensity: 1.1, emissive: 0x2a1a00 });
const tbBrassDS = tbBrass.clone(); tbBrassDS.side = THREE.DoubleSide;
const tbChrome = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, metalness: 1, roughness: .12, envMap: carEnv, envMapIntensity: 1.4 });
const tbRubber = new THREE.MeshLambertMaterial({ color: 0x15151a });
const tbTread = new THREE.MeshLambertMaterial({ color: 0x26262e });
const tbGlass = new THREE.MeshStandardMaterial({ color: 0x1a2a50, metalness: .8, roughness: .05, envMap: carEnv, transparent: true, opacity: .78 });
const tbRed = new THREE.MeshStandardMaterial({ color: 0xb01828, metalness: .5, roughness: .3, envMap: carEnv });
const tbTyreGeo = new THREE.CylinderGeometry(.56, .56, .52, 20), tbSideGeo = new THREE.TorusGeometry(.48, .09, 6, 20);
const tbSpokeGeo = new THREE.BoxGeometry(.06, .7, .1), tbRimGeo = new THREE.CylinderGeometry(.42, .42, .05, 20), tbHubGeo = new THREE.CylinderGeometry(.13, .13, .08, 12);
function tromboneMesh() {
  const g = new THREE.Group(), U = { wheels: [], front: [], slide: null, glow: null, hubs: [] };
  // wedge body: side profile (z forward, y up) extruded across the width
  const s = new THREE.Shape(); [[-2.25, .32], [-2.3, .92], [-1.55, 1.02], [-.9, 1.08], [.9, .92], [1.9, .66], [2.45, .48], [2.5, .32]].forEach(([z, y], i) => i ? s.lineTo(z, y) : s.moveTo(z, y));
  const bg = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: true, bevelThickness: .12, bevelSize: .1, bevelSegments: 2, curveSegments: 4 });
  bg.rotateY(-Math.PI / 2); bg.translate(.95, 0, 0); const body = new THREE.Mesh(bg, tbBrass); g.add(body);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.32, .04, 3.4), tbRed); stripe.position.set(0, 1.0, .35); stripe.rotation.x = .14; g.add(stripe); // racing stripe
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.25, .22, 3.9), tbRubber); skirt.position.set(0, .3, .1); g.add(skirt);
  // cockpit canopy + gender-neutral helmeted driver
  const can = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), tbGlass); can.scale.set(.72, .5, 1.25); can.position.set(0, 1.0, -.35); g.add(can);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .3 })); helm.position.set(0, 1.25, -.45); g.add(helm);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(.42, .12, .1), new THREE.MeshBasicMaterial({ color: 0xffb020 })); visor.position.set(0, 1.28, -.2); g.add(visor);
  // the slide: two long tubes along the shoulders joined by a U-bend that pokes out the front (extends on boost)
  const slide = new THREE.Group(); g.add(slide); U.slide = slide;
  for (const x of [-.82, .82]) {
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 2.6, 10), tbBrass); outer.rotation.x = Math.PI / 2; outer.position.set(x, 1.12, -.4); g.add(outer); // fixed sleeve
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.15, .04, 6, 12), tbChrome); ring.position.set(x, 1.12, .9); g.add(ring);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 2.2, 10), tbChrome); inner.rotation.x = Math.PI / 2; inner.position.set(x, 1.12, 1.4); slide.add(inner);
  }
  const ub = new THREE.Mesh(new THREE.TorusGeometry(.82, .1, 8, 20, Math.PI), tbBrass); ub.rotation.x = Math.PI / 2; ub.position.set(0, 1.12, 2.5); slide.add(ub);
  const bump = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), tbChrome); bump.position.set(0, 1.12, 3.32); slide.add(bump); // slide bumper knob
  // mouthpiece hood ornament
  const mp = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.05, 0], [.05, .35], [.09, .45], [.17, .55], [.16, .6], [.08, .58]].map(([a, b]) => new THREE.Vector2(a, b)), 14), tbChrome);
  mp.rotation.x = Math.PI / 2; mp.position.set(0, .9, 1.3); g.add(mp);
  // bell section: tuning-slide loop on the rear deck + big flared bell as the exhaust
  const tl = new THREE.Mesh(new THREE.TorusGeometry(.45, .08, 6, 16, Math.PI), tbBrass); tl.rotation.z = Math.PI / 2; tl.rotation.y = Math.PI / 2; tl.position.set(0, 1.1, -1.6); g.add(tl);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .7, 10), tbBrass); neck.rotation.x = Math.PI / 2; neck.position.set(0, .7, -2.2); g.add(neck);
  const bell = new THREE.Mesh(bellGeo, tbBrassDS); bell.scale.set(.22, .18, .22); bell.rotation.x = -Math.PI / 2; bell.position.set(0, .7, -2.35); g.add(bell);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(.5, 16), new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: .35, side: THREE.DoubleSide })); glow.position.set(0, .7, -3.1); g.add(glow); U.glow = glow;
  // rear wing + tail lights
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, .08, .55), tbBrass); wing.position.set(0, 1.62, -2.0); wing.rotation.x = -.12; g.add(wing);
  for (const x of [-1.2, 1.2]) { const fin = new THREE.Mesh(new THREE.BoxGeometry(.06, .4, .7), tbRed); fin.position.set(x, 1.55, -2.0); g.add(fin); }
  for (const x of [-.55, .55]) { const st = new THREE.Mesh(new THREE.BoxGeometry(.08, .62, .14), tbChrome); st.position.set(x, 1.3, -2.0); g.add(st); }
  for (const x of [-.75, .75]) { const tl2 = new THREE.Mesh(new THREE.BoxGeometry(.5, .14, .05), new THREE.MeshBasicMaterial({ color: 0xff2a20 })); tl2.position.set(x, .78, -2.4); g.add(tl2); }
  for (const x of [-.7, .7]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(.45, .1, .05), new THREE.MeshBasicMaterial({ color: 0xfff6d0 })); hl.position.set(x, .52, 2.62); g.add(hl); }
  // chunky sport tyres with chrome 6-spoke rims and glowing gold hubs
  const hubMat = new THREE.MeshBasicMaterial({ color: 0xffd040 });
  for (const [x, z] of [[-1.2, 1.5], [1.2, 1.5], [-1.2, -1.45], [1.2, -1.45]]) {
    const steer = new THREE.Group(); steer.position.set(x, .56, z); g.add(steer); const spin = new THREE.Group(); steer.add(spin);
    const ty = new THREE.Mesh(tbTyreGeo, tbRubber); ty.rotation.z = Math.PI / 2; spin.add(ty);
    const o = Math.sign(x) * .27;
    const sw = new THREE.Mesh(tbSideGeo, tbTread); sw.rotation.y = Math.PI / 2; sw.position.x = o; spin.add(sw);
    const rim = new THREE.Mesh(tbRimGeo, tbChrome); rim.rotation.z = Math.PI / 2; rim.position.x = o; spin.add(rim);
    for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(tbSpokeGeo, tbBrass); sp.rotation.x = k * Math.PI / 3; sp.position.x = o + Math.sign(x) * .03; spin.add(sp); }
    const hub = new THREE.Mesh(tbHubGeo, hubMat); hub.rotation.z = Math.PI / 2; hub.position.x = o + Math.sign(x) * .06; spin.add(hub);
    U.wheels.push(spin); if (z > 0) U.front.push(steer);
  }
  g.userData.tb = U; return g;
}
window.__tt = Object.assign(window.__tt || {}, { tromboneMesh });
// ---------- cars ----------
const CARS = {
  trombone: { name: 'Trombone Super Racer', color: 0xf0c050, top: 43, accel: 17, turn: 1.9, tough: .5, move: 'Slide Dash' },
  tuba: { name: 'Tuba Truck', color: 0x2f6fd8, top: 40, accel: 10, turn: 1.45, tough: .92, move: 'Bass Blast' },
  piccolo: { name: 'Piccolo Racer', color: 0xf2f2f2, top: 47.5, accel: 16, turn: 1.8, tough: .18, move: 'High Trill' },
  snare: { name: 'Snare Kart', color: 0x38b04a, top: 41.4, accel: 19, turn: 2.6, tough: .3, move: 'Drum Roll' },
  horn: { name: 'French Horn Cruiser', color: 0x8a3fd0, top: 41.8, accel: 14.5, turn: 2.2, tough: .5, move: 'Horn Call' },
};
function carMesh(type) {
  if (type === 'trombone') { const g = tromboneMesh(); const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .35 })); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.6, 2.8, 1); shadow.position.y = .03; scene.add(shadow); g.userData.shadow = shadow; scene.add(g); return g; }
  const c = CARS[type], g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: c.color, metalness: .4, roughness: .35 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a1a22 }), glass = new THREE.MeshStandardMaterial({ color: 0x223355, metalness: .6, roughness: .1 });
  const sc = type === 'tuba' ? 1.2 : type === 'snare' ? .85 : 1;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2 * sc, .8, 4.4 * (type === 'piccolo' ? 1.15 : 1)), paint); body.position.y = .75; g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2 * sc, .5, 1.2), paint); nose.position.set(0, .6, 2.6); g.add(nose);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7 * sc, .7, 1.8), glass); cab.position.set(0, 1.45, type === 'tuba' ? 1 : -.2); g.add(cab);
  for (const [x, z] of [[-1.15, 1.4], [1.15, 1.4], [-1.15, -1.4], [1.15, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .45, 14), dark); w.rotation.z = Math.PI / 2; w.position.set(x * sc, .5, z); g.add(w); }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(2 * sc, .25, .2), new THREE.MeshBasicMaterial({ color: 0xff3020 })); tail.position.set(0, .9, -2.21); g.add(tail);
  if (type === 'tuba') { const b = new THREE.Mesh(bellGeo, brassMat); b.scale.set(.3, .25, .3); b.position.set(0, 1.1, -1.2); g.add(b); const coil = new THREE.Mesh(new THREE.TorusGeometry(.7, .2, 8, 20), brassMat); coil.position.set(0, 1.6, -.4); g.add(coil); }
  else if (type === 'piccolo') { const fl = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 5.4, 10), silverMat); fl.rotation.x = Math.PI / 2; fl.position.set(0, 1.3, .4); g.add(fl); for (let k = 0; k < 5; k++) { const key = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .08, 8), silverMat); key.position.set(0, 1.44, -1 + k * .7); g.add(key); } }
  else if (type === 'snare') { const d = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .6, 20), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })); d.position.set(0, 1.5, -1.3); g.add(d); const rim = new THREE.Mesh(new THREE.TorusGeometry(.9, .08, 6, 20), new THREE.MeshLambertMaterial({ color: 0xc02020 })); rim.rotation.x = Math.PI / 2; rim.position.set(0, 1.8, -1.3); g.add(rim); }
  else if (type === 'horn') { const coil = new THREE.Mesh(new THREE.TorusGeometry(.75, .12, 8, 24), brassMat); coil.position.set(0, 1.9, -1.1); g.add(coil); const b = new THREE.Mesh(bellGeo, brassMat); b.scale.set(.18, .14, .18); b.rotation.x = -Math.PI / 2; b.position.set(.7, 1.9, -1.7); g.add(b); }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .35 })); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.5 * sc, 2.6, 1); shadow.position.y = .03; scene.add(shadow); g.userData.shadow = shadow;
  scene.add(g); return g;
}
const DRIVERS = { trombone: 'You', tuba: 'Reese', piccolo: 'Jordan', snare: 'Kai', horn: 'Sky' };
const AGGR = { tuba: .8, snare: .6, horn: .45, piccolo: .3 };
const cars = [];
function makeCar(type, isPlayer, slot) {
  const c = { type, ...CARS[type], isPlayer, mesh: carMesh(type), slot, lane: 0, aiSkill: rand(.97, 1.03), aggr: AGGR[type] || 0, phase: rand(0, 6) };
  c.mesh.rotation.order = 'YXZ'; c.driver = DRIVERS[type]; cars.push(c); return c;
}
const player = makeCar('trombone', true, 0);
['tuba', 'piccolo', 'snare', 'horn'].forEach((t, i) => makeCar(t, false, i + 1));
function gridUp() {
  const order = [cars[1], cars[2], cars[3], cars[4], player];
  order.forEach((c, k) => {
    const i = (N - 6 - k * 5) % N, side = k === 4 ? 0 : (k % 2 ? 6 : -6);
    Object.assign(c, { idx: i, x: P[i].x + S[i].x * side, z: P[i].z + S[i].z * side, h: Math.atan2(T[i].x, T[i].z), v: 0, lap: -1, maxIdx: N,
      boost: 0, dash: 0, meter: 0, finished: false, finishTime: 0, hitT: 9, lat: side, steer: 0,
      y: 0, vy: 0, air: false, onRamp: false, trick: -1, drift: 0, driftT: 0, tier: 0, px: 0, pz: 0, grip: 0, moveCD: rand(6, 10),
      blockT: 0, bumpT: 0, alley: false, useAlley: false, wallT: 9 });
    c.vh = c.h;
  });
}
// racing line: hug the inside of corners (lateral offset per track sample), smoothed
const RL = (() => { const raw = P.map((p, i) => { const a = T[(i - 10 + N) % N], b = T[(i + 10) % N]; const d = angDiff(Math.atan2(b.x, b.z), Math.atan2(a.x, a.z)); return Math.max(-1, Math.min(1, -d * 3)) * (W / 2 - 2.2); });
  const out = []; for (let i = 0; i < N; i++) { let s = 0; for (let o = -14; o <= 14; o++) s += raw[(i + o + N) % N]; out.push(s / 29); } return out; })();

// ---------- particles (drift sparks, dust) ----------
const PMAX = 260, pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), pVel = new Float32Array(PMAX * 3), pLife = new Float32Array(PMAX);
const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .3, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
let pNext = 0;
function emit(x, y, z, vx, vy, vz, col, life = .35) { const i = pNext; pNext = (pNext + 1) % PMAX; pPos.set([x, y, z], i * 3); pVel.set([vx, vy, vz], i * 3); pCol.set([col.r, col.g, col.b], i * 3); pLife[i] = life; }
function stepParticles(dt) { for (let i = 0; i < PMAX; i++) { if (pLife[i] <= 0) { pPos[i * 3 + 1] = -99; continue; } pLife[i] -= dt; for (let k = 0; k < 3; k++) pPos[i * 3 + k] += pVel[i * 3 + k] * dt; pVel[i * 3 + 1] -= 12 * dt; const f = Math.max(0, pLife[i] / .35); pCol[i * 3] *= .985; pCol[i * 3 + 1] *= .985; pCol[i * 3 + 2] *= .985; if (f <= 0) pPos[i * 3 + 1] = -99; }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true; }
const SPARK = [new THREE.Color(1, 1, .85), new THREE.Color(.25, .6, 1), new THREE.Color(1, .55, .1)];

// ---------- shockwave rings (instrument moves) ----------
const rings = [];
function ring(x, y, z, color, maxR = 10) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .18, 6, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = Math.PI / 2; m.position.set(x, y + .8, z); scene.add(m); rings.push({ m, t: 0, maxR }); }
function stepRings(dt) { for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt / .55; const s = 1 + r.t * r.maxR; r.m.scale.set(s, s, 1); r.m.material.opacity = .8 * (1 - r.t); if (r.t >= 1) { scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); rings.splice(i, 1); } } }

// ---------- jumps: piano-key ramp + drum-head bounce pads ----------
const RAMP_I = 150, RAMP_LEN = 6, RAMP_H = 2.3;
{ const keysTex = canvasTex(256, 64, (g) => { const kw = 256 / 14; for (let k = 0; k < 14; k++) { g.fillStyle = '#f6f3ea'; g.fillRect(k * kw + 1, 0, kw - 2, 64); } g.fillStyle = '#15151a'; for (let k = 0; k < 13; k++) if ([0, 1, 3, 4, 5].includes(k % 7)) g.fillRect((k + 1) * kw - kw * .3, 0, kw * .6, 38); });
  const pos = [], uv = [], idx = []; let k = 0;
  for (let n = 0; n <= RAMP_LEN; n++) { const i = RAMP_I + n, p = P[i], s = S[i], y = E[i] + .05 + RAMP_H * n / RAMP_LEN; pos.push(p.x - s.x * W / 2, y, p.z - s.z * W / 2, p.x + s.x * W / 2, y, p.z + s.z * W / 2); uv.push(0, n / RAMP_LEN, 1, n / RAMP_LEN); if (n < RAMP_LEN) idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); k += 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ map: keysTex, side: THREE.DoubleSide }); scene.add(new THREE.Mesh(g, mat));
  // ramp sides + lip in brass
  const e = P[RAMP_I + RAMP_LEN], sE = S[RAMP_I + RAMP_LEN];
  for (const sd of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(.5, RAMP_H, .5), brassMat); post.position.set(e.x + sE.x * sd * (W / 2 + .3), RAMP_H / 2, e.z + sE.z * sd * (W / 2 + .3)); scene.add(post); }
  const lip = new THREE.Mesh(new THREE.BoxGeometry(W + 1, .25, .4), brassMat); lip.position.set(e.x, RAMP_H + .1, e.z); lip.rotation.y = Math.atan2(T[RAMP_I + RAMP_LEN].x, T[RAMP_I + RAMP_LEN].z); scene.add(lip);
}
const PADS = [[35, 4], [520, -4]].map(([i, l]) => {
  const p = P[i].clone().addScaledVector(S[i], l); p.y = E[i];
  const g = new THREE.Group(); const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, .45, 28), new THREE.MeshStandardMaterial({ color: 0xc0203a, metalness: .3, roughness: .4 })); shell.position.y = .22; g.add(shell);
  const head = new THREE.Mesh(new THREE.CircleGeometry(2.5, 28), new THREE.MeshLambertMaterial({ color: 0xfdf6e3 })); head.rotation.x = -Math.PI / 2; head.position.y = .46; g.add(head);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.6, .12, 6, 28), brassMat); rim.rotation.x = Math.PI / 2; rim.position.y = .47; g.add(rim);
  g.position.copy(p); scene.add(g); return { x: p.x, z: p.z, g, squash: 0 };
});

// ---------- hazards ----------
const blk = new THREE.MeshStandardMaterial({ color: 0x202024, metalness: .7, roughness: .4 });
const sheetTex = canvasTex(64, 40, (c) => { c.fillStyle = '#fffbe8'; c.fillRect(0, 0, 64, 40); c.strokeStyle = '#333'; for (let y = 6; y < 40; y += 6) { c.beginPath(); c.moveTo(2, y); c.lineTo(62, y); c.stroke(); } c.fillStyle = '#000'; for (let x = 8; x < 60; x += 9) { c.beginPath(); c.arc(x, 8 + Math.random() * 26, 2.5, 0, 7); c.fill(); } });
const stands = [];
function addStand(x, y, z, rotY) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 2.4), blk); pole.position.y = 1.2; g.add(pole);
  for (let a = 0; a < 3; a++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.1), blk); leg.position.set(Math.sin(a * 2.1) * .35, .25, Math.cos(a * 2.1) * .35); leg.rotation.set(Math.cos(a * 2.1) * .7, 0, -Math.sin(a * 2.1) * .7); g.add(leg); }
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, .08), blk); desk.position.set(0, 2.6, 0); desk.rotation.x = -.35; g.add(desk);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .95), new THREE.MeshBasicMaterial({ map: sheetTex })); sheet.position.set(0, 2.63, -.06); sheet.rotation.x = -.35; sheet.rotation.y = Math.PI; g.add(sheet);
  const home = new THREE.Vector3(x, y, z); g.position.copy(home); g.rotation.y = rotY; scene.add(g);
  stands.push({ g, x, z, y, home, rotY, down: 0, vx: 0, vz: 0, spin: 0 });
}
for (const [i, l] of [[100, -7], [195, 6], [300, -5], [480, 7], [575, -5]]) { const p = P[i].clone().addScaledVector(S[i], l); addStand(p.x, E[i], p.z, Math.atan2(T[i].x, T[i].z)); }
function restoreStand(s) { s.down = 0; s.x = s.home.x; s.z = s.home.z; s.g.position.copy(s.home); s.g.rotation.set(0, s.rotY, 0); }

// shortcut alley: cobblestones, brick walls, a neon sign, two stands inside
const ALLEY = (() => {
  const a = P[ALLEY_A], b = P[ALLEY_B], dir = new THREE.Vector3(b.x - a.x, 0, b.z - a.z), L = dir.length(); dir.normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  // t range where the alley is off the main road+sidewalk
  let t0 = 0, t1 = 1; for (let t = 0; t < .5; t += .002) { const x = a.x + dir.x * L * t, z = a.z + dir.z * L * t; let md = 1e9; for (let j = ALLEY_A - 30; j < ALLEY_A + 30; j++) { const q = P[(j + N) % N]; md = Math.min(md, Math.hypot(q.x - x, q.z - z)); } if (md > W / 2 + 4) { t0 = t; break; } }
  for (let t = 1; t > .5; t -= .002) { const x = a.x + dir.x * L * t, z = a.z + dir.z * L * t; let md = 1e9; for (let j = ALLEY_B - 30; j < ALLEY_B + 30; j++) { const q = P[(j + N) % N]; md = Math.min(md, Math.hypot(q.x - x, q.z - z)); } if (md > W / 2 + 4) { t1 = t; break; } }
  const cobble = canvasTex(64, 64, (g) => { g.fillStyle = '#5a4f4a'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 10) for (let x = (y / 10) % 2 * 6; x < 64; x += 12) { g.fillStyle = `hsl(20,8%,${30 + Math.random() * 14}%)`; g.beginPath(); g.ellipse(x + 5, y + 5, 5, 4, 0, 0, 7); g.fill(); } }, true);
  const len = (t1 - t0 + .06) * L, mid = (t0 + t1) / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ALLEY_HW * 2 + 1, len), new THREE.MeshLambertMaterial({ map: cobble })); cobble.repeat.set(1.2, len / 7);
  floor.rotation.x = -Math.PI / 2; floor.rotation.z = Math.atan2(dir.x, dir.z); floor.position.set(a.x + dir.x * L * mid, .1, a.z + dir.z * L * mid); scene.add(floor);
  const brick = canvasTex(64, 64, (g) => { g.fillStyle = '#7a3b2e'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#4a2018'; g.lineWidth = 2; for (let y = 0; y < 64; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); for (let x = (y / 8) % 2 * 8; x < 64; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } } }, true);
  brick.repeat.set((t1 - t0) * L / 8, 1.5);
  for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1, 9, (t1 - t0) * L), new THREE.MeshLambertMaterial({ map: brick })); w.position.set(a.x + dir.x * L * mid + side.x * sd * (ALLEY_HW + .5), 4.5, a.z + dir.z * L * mid + side.z * sd * (ALLEY_HW + .5)); w.rotation.y = Math.atan2(dir.x, dir.z); scene.add(w); }
  // hanging string lights
  for (let t = t0 + .08; t < t1; t += .12) { const bulb = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 6), new THREE.MeshBasicMaterial({ color: [0xffd34d, 0x7ff, 0xff6a9a][Math.floor(t * 30) % 3] })); bulb.position.set(a.x + dir.x * L * t, 6.5, a.z + dir.z * L * t); scene.add(bulb); }
  // neon sign at the mouth
  const st = canvasTex(256, 64, (g) => { g.fillStyle = '#1a0a2a'; g.fillRect(0, 0, 256, 64); g.strokeStyle = '#ff4fb0'; g.lineWidth = 4; g.strokeRect(4, 4, 248, 56); g.fillStyle = '#7ff'; g.font = 'bold 30px Arial Black, Impact'; g.textAlign = 'center'; g.fillText('BACKBEAT ALLEY ➜', 128, 43); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({ map: st, side: THREE.DoubleSide }));
  sign.position.set(a.x + dir.x * L * t0 + side.x * 0, 7.8, a.z + dir.z * L * t0); sign.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI; scene.add(sign);
  for (const [t, u] of [[.42, 1.6], [.66, -1.6]]) { const x = a.x + dir.x * L * t + side.x * u, z = a.z + dir.z * L * t + side.z * u; addStand(x, 0, z, Math.atan2(dir.x, dir.z)); }
  return { a, b, dir, side, L, t0, t1 };
})();

// rolling timpani on the hill: roll downhill toward cars climbing it
const TIMP_TOP = HILL_C + 8, TIMP_BOT = HILL_C - HILL_W + 4;
const copper = new THREE.MeshStandardMaterial({ color: 0xb8653a, metalness: .8, roughness: .3 });
const timps = [0, 1].map(k => {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), copper); inner.add(bowl);
  const head = new THREE.Mesh(new THREE.CircleGeometry(1.6, 20), new THREE.MeshLambertMaterial({ color: 0xf3ead2, side: THREE.DoubleSide })); head.rotation.x = -Math.PI / 2; inner.add(head);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.62, .1, 6, 24), silverMat); rim.rotation.x = Math.PI / 2; inner.add(rim);
  inner.rotation.z = Math.PI / 2; scene.add(g);
  return { g, inner, s: TIMP_TOP - k * 30, lat: k ? 5 : -5, wait: k * 1.5, x: 0, z: 0, y: 0 };
});
function stepTimps(dt) {
  for (const t of timps) {
    if (t.wait > 0) { t.wait -= dt; t.g.visible = false; t.x = t.z = 1e6; continue; }
    t.g.visible = true; t.s -= dt * 10 / SEG; // ~10 u/s downhill (toward the climbing cars)
    if (t.s < TIMP_BOT) { t.s = TIMP_TOP; t.lat = [-9, -4.5, 0, 4.5, 9][Math.floor(Math.random() * 5)]; t.wait = rand(.5, 2); }
    const i = Math.floor(t.s), p = P[i], sd = S[i]; t.x = p.x + sd.x * t.lat; t.z = p.z + sd.z * t.lat; t.y = E[i] + 1.6;
    t.g.position.set(t.x, t.y, t.z); t.g.rotation.y = Math.atan2(T[i].x, T[i].z) + Math.PI / 2; t.inner.rotation.x -= dt * 6;
  }
}
// giant metronome swing gate: brass gantry with a swinging arm + weight across the road
const METRO_I = 70, METRO_PIV = 22, METRO_L = 20.5, METRO_MAX = .95, METRO_PERIOD = 2.4;
const metro = (() => {
  const i = METRO_I, p = P[i], g = new THREE.Group(); g.position.copy(p); g.rotation.y = Math.atan2(T[i].x, T[i].z); scene.add(g);
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a2d1a, roughness: .6 });
  for (const sd of [-1, 1]) { const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 3.2, METRO_PIV + 1, 4), wood); tower.rotation.y = Math.PI / 4; tower.position.set(sd * (W / 2 + 3.5), (METRO_PIV + 1) / 2, 0); g.add(tower);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6), new THREE.MeshBasicMaterial({ map: canvasTex(32, 128, (c) => { c.fillStyle = '#f2e3b0'; c.fillRect(0, 0, 32, 128); c.fillStyle = '#5a2d1a'; for (let y = 8; y < 128; y += 10) c.fillRect(6, y, 20, 2); }) })); face.position.set(sd * (W / 2 + 3.5), 6, -2.3); face.rotation.y = Math.PI; g.add(face); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 9, 1, 1.2), brassMat); beam.position.y = METRO_PIV + .3; g.add(beam);
  const arm = new THREE.Group(); arm.position.y = METRO_PIV; g.add(arm);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, METRO_L), silverMat); rod.position.y = -METRO_L / 2; arm.add(rod);
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.6, 2.2, 4), brassMat); weight.rotation.y = Math.PI / 4; weight.position.y = -METRO_L + 1.2; arm.add(weight);
  return { g, arm, ang: 0, lastSide: 0 };
})();
function metroBob() { const a = metro.ang, i = METRO_I; const lat = Math.sin(a) * (METRO_L - 1.2), y = METRO_PIV - Math.cos(a) * (METRO_L - 1.2);
  return { x: P[i].x + S[i].x * lat, z: P[i].z + S[i].z * lat, y, lat }; }

// ---------- race state ----------
const race = { state: 'menu', t: 0, countdown: 0, style: 0, band: .35, results: null, place: 5, musicOn: false, lastPlace: 5,
  stats: { drifts: 0, driftBoosts: [0, 0, 0], jumps: 0, tricks: 0, passes: 0, crashes: 0, dashes: 0, alley: 0, blasts: 0, aiMoves: 0, bumps: 0, metroHits: 0, timpHits: 0 } };
window.__tt = Object.assign(window.__tt || {}, { race, player, cars, stands, timps, P, T, RL, errors: [] });
window.__tt.sim = (dt) => sim(dt);
Object.defineProperty(window.__tt, 'acState', { get: () => AC ? AC.state : 'none' });
function startRace() {
  if (!(AUTOSTART && navigator.userActivation && !navigator.userActivation.isActive)) initAudio(); // autostart (tests) has no gesture
  gridUp(); stands.forEach(restoreStand);
  for (const k in race.stats) race.stats[k] = Array.isArray(race.stats[k]) ? [0, 0, 0] : 0;
  Object.assign(race, { state: 'count', t: 0, countdown: 3.999, style: 0, band: .35, results: null, musicOn: true, lastPlace: 5 });
  cars.forEach(c => { if (!c.isPlayer) c.useAlley = Math.random() < .3; }); player.useAlley = AUTOPILOT;
  step = 0; nextT = AC ? AC.currentTime + .1 : 0; $('overlay').style.display = 'none';
}

// ---------- touch detection (on-screen buttons + keyboard steering) ----------
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
function lockLandscape() { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (_) {} }
// rotate-device overlay: decided only by the browser's screen orientation , debounced; while racing it needs >1 s of real portrait
let portraitSince = 0;
function isPortrait() { if (window.__tt.portraitOverride != null) return window.__tt.portraitOverride; if (screen.orientation && screen.orientation.type) return screen.orientation.type.startsWith('portrait'); return window.matchMedia ? matchMedia('(orientation: portrait)').matches : innerHeight > innerWidth; }
setInterval(() => { const small = Math.min(screen.width || innerWidth, screen.height || innerHeight) <= 820 || IS_TOUCH; const p = small && isPortrait(); const now = performance.now();
  if (!p) { portraitSince = 0; $('rot').style.display = 'none'; return; } if (!portraitSince) portraitSince = now;
  const need = race.state === 'race' || race.state === 'count' ? 1000 : 250; $('rot').style.display = now - portraitSince > need ? 'flex' : 'none'; }, 150);
$('go').addEventListener('pointerup', e => { e.preventDefault(); lockLandscape(); startRace(); });
$('go').addEventListener('click', e => { lockLandscape(); if (race.state === 'menu') startRace(); });
const band = d => { race.band = Math.max(0, Math.min(1, race.band + d)); };

// ---------- input ----------
const keys = {}; const touch = { l: 0, r: 0, brake: 0, dash: 0, gas: 0, drift: 0 }; window.__tt.touch = touch;
addEventListener('keydown', e => { keys[e.code] = 1; if (e.code === 'Space') { touch.dashPress = 1; e.preventDefault(); } if (race.state === 'menu' && (e.code === 'Enter')) startRace(); });
addEventListener('keyup', e => { keys[e.code] = 0; });
function holdBtn(id, k) { const el = $(id), ids = new Set();
  const upd = () => { touch[k] = ids.size ? 1 : 0; el.classList.toggle('on', ids.size > 0); };
  el.addEventListener('pointerdown', e => { e.preventDefault(); ids.add(e.pointerId); try { el.setPointerCapture(e.pointerId); } catch (_) {} if (k === 'dash') touch.dashPress = 1; initAudio(); upd(); });
  const off = e => { ids.delete(e.pointerId); upd(); };
  el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
  el.addEventListener('contextmenu', e => e.preventDefault()); }
holdBtn('bl', 'l'); holdBtn('br', 'r'); holdBtn('bbrake', 'brake'); holdBtn('bdash', 'dash'); holdBtn('bgas', 'gas'); holdBtn('bdrift', 'drift');
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; });

// ---------- simulation ----------
const tmp = new THREE.Vector3();
function nearestIdx(c) {
  let best = c.idx, bd = 1e9;
  for (let o = -15; o <= 30; o++) { const j = (c.idx + o + N) % N, dx = P[j].x - c.x, dz = P[j].z - c.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = j; } }
  return best;
}
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
function steerTo(c, tx, tz) { return Math.max(-1, Math.min(1, -angDiff(Math.atan2(tx - c.x, tz - c.z), c.h) * 2.5)); }
function trackPt(i, lane) { i = ((i % N) + N) % N; return [P[i].x + S[i].x * lane, P[i].z + S[i].z * lane]; }
function progress(c) { return c.finished ? 1e7 - c.finishTime : c.lap * N + c.idx; }
function gap(a, b) { let d = (progress(b) - progress(a)); return d * SEG; } // + if b is ahead of a (units)
function rubber(c) { const d = (progress(player) - progress(c)) / N; return 1 + Math.max(-.04, Math.min(.04, d * .08)); }
function nearPlayer(c, r) { return Math.hypot(c.x - player.x, c.z - player.z) < r; }

function aiControl(c, dt) {
  // returns { steer, drift, trick, gas }
  const out = { steer: 0, drift: 0, trick: 0, gas: 1 };
  const look = Math.round(7 + c.v * .14);
  let lane = RL[(c.idx + look) % N] * .85 + Math.sin(race.t * .4 + c.phase) * 2.8 + (c.isPlayer ? 0 : (c.slot - 2.5) * .9);
  if (!c.isPlayer && race.state === 'race') {
    const g = gap(c, player); // >0: player ahead of me
    // block: player close behind me -> move into their lane
    if (c.blockT > 0) { c.blockT -= dt; lane = player.lat; }
    else if (g < 0 && g > -14 && Math.abs(player.lat - c.lat) < 5 && Math.random() < c.aggr * dt * .8) c.blockT = rand(1, 2);
    // bump: side by side -> lean into the player
    if (c.bumpT > 0) { c.bumpT -= dt; lane = player.lat + Math.sign(c.lat - player.lat) * 1.2; }
    else if (Math.abs(g) < 4 && Math.abs(player.lat - c.lat) < 5 && Math.random() < c.aggr * dt * .9) { c.bumpT = .6; }
  }
  // avoid stands + timpani ahead
  const obs = stands.filter(s => !s.down).concat(timps.filter(t => t.g.visible));
  for (const s of obs) { const dx = s.x - c.x, dz = s.z - c.z, fwd = dx * Math.sin(c.h) + dz * Math.cos(c.h); if (fwd > 0 && fwd < 28) { const sideR = -dx * Math.cos(c.h) + dz * Math.sin(c.h); if (Math.abs(sideR) < 2.8) lane = c.lat + (sideR > 0 ? -3.6 : 3.6); } }
  lane = Math.max(-W / 2 + 1.4, Math.min(W / 2 - 1.4, lane));
  let [tx, tz] = trackPt(c.idx + look, lane);
  // shortcut alley
  if (c.useAlley && !c.alley) { const d = (ALLEY_A - c.idx + N) % N; if (d < 26 && d > 2) { const t = ALLEY.t0 + .06; tx = ALLEY.a.x + ALLEY.dir.x * ALLEY.L * t; tz = ALLEY.a.z + ALLEY.dir.z * ALLEY.L * t; } }
  if (c.alley) { const { t } = alleyUV(c.x, c.z), tt = Math.min(1.05, t + .14); tx = ALLEY.a.x + ALLEY.dir.x * ALLEY.L * tt; tz = ALLEY.a.z + ALLEY.dir.z * ALLEY.L * tt; }
  out.steer = steerTo(c, tx, tz);
  if (c.isPlayer) { // autopilot also drifts the sharp corners and does tricks (test driver)
    const curv = Math.abs(RL[(c.idx + 6) % N]) / (W / 2 - 2.2);
    c.aDriftCD = (c.aDriftCD || 0) - dt;
    if (Q.has('nodrift')) out.drift = 0; else { out.drift = (c.drift ? (curv > .4 || c.driftT < .9) && Math.abs(c.lat) < W / 2 - 1 : curv > .7 && c.aDriftCD <= 0) && c.v > c.top * .55 && !c.alley ? 1 : 0; if (c.drift && !out.drift) c.aDriftCD = 1.5; }
    out.trick = c.air && c.trick < 0 ? 1 : 0;
  }
  return out;
}
function aiMoves(c, dt) {
  c.moveCD -= dt; if (c.moveCD > 0 || race.state !== 'race' || c.finished) return;
  const near = cars.filter(o => o !== c && Math.hypot(o.x - c.x, o.z - c.z) < 11);
  const fwdCars = cars.filter(o => o !== c && (() => { const dx = o.x - c.x, dz = o.z - c.z, f = dx * Math.sin(c.h) + dz * Math.cos(c.h), s = Math.abs(-dx * Math.cos(c.h) + dz * Math.sin(c.h)); return f > 2 && f < 18 && s < 4; })());
  let used = false;
  if (c.type === 'tuba' && near.length) { // Bass Blast: shockwave pushes everyone nearby
    ring(c.x, c.y + E[c.idx], c.z, 0x4aa3ff, 10); used = true; race.stats.blasts++;
    for (const o of near) { const dx = o.x - c.x, dz = o.z - c.z, d = Math.max(1, Math.hypot(dx, dz)), f = 16 * (1 - o.tough * .6); o.px += dx / d * f; o.pz += dz / d * f; o.v *= .88 + .1 * o.tough; if (o.isPlayer) { o.hitT = 0; band(-.08); } }
    if (nearPlayer(c, 40)) { toast('Reese: Bass Blast!'); if (AC) brass(55, AC.currentTime, .6, .3, master, 600); }
  } else if (c.type === 'piccolo' && (fwdCars.length || Math.random() < .3)) { c.boost = 1.3; used = true; ring(c.x, c.y + E[c.idx], c.z, 0xffffff, 3); if (nearPlayer(c, 40)) { toast('Jordan: High Trill!'); if (AC) for (let k = 0; k < 8; k++) brass(k % 2 ? 1760 : 1568, AC.currentTime + k * .05, .06, .05, master, 6000); } }
  else if (c.type === 'snare' && Math.abs(RL[(c.idx + 10) % N]) > 3) { c.grip = 2; c.boost = Math.max(c.boost, .8); used = true; if (nearPlayer(c, 40)) { toast('Kai: Drum Roll!'); if (AC) for (let k = 0; k < 10; k++) drum(AC.currentTime + k * .04, 'snare'); } }
  else if (c.type === 'horn' && fwdCars.length) { // Horn Call: clears the lane ahead
    used = true; ring(c.x + Math.sin(c.h) * 6, c.y + E[c.idx], c.z + Math.cos(c.h) * 6, 0xc070ff, 6);
    for (const o of fwdCars) { const sideR = -(o.x - c.x) * Math.cos(c.h) + (o.z - c.z) * Math.sin(c.h), sx = -Math.cos(c.h), sz = Math.sin(c.h), f = (sideR >= 0 ? 1 : -1) * 12 * (1 - o.tough * .6); o.px += sx * f; o.pz += sz * f; o.v *= .92; if (o.isPlayer) { o.hitT = 0; band(-.05); } }
    if (nearPlayer(c, 40)) { toast('Sky: Horn Call!'); if (AC) brass(174.6, AC.currentTime, .7, .22, master, 1500); }
  }
  if (used) { c.moveCD = rand(9, 15); race.stats.aiMoves++; } else c.moveCD = .5;
}

function stepCar(c, dt) {
  let steer = 0, brake = 0, gas = 1, driftIn = 0, trickIn = 0;
  const racing = race.state === 'race' && !c.finished;
  if (c.isPlayer && !AUTOPILOT && !c.finished) {
    steer = (keys.ArrowRight || keys.KeyD || touch.r ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || touch.l ? 1 : 0);
    brake = keys.ArrowDown || keys.KeyS || touch.brake ? 1 : 0;
    gas = racing && (keys.ArrowUp || keys.KeyW || touch.gas) ? 1 : 0;
    driftIn = touch.drift || keys.ShiftLeft || keys.ShiftRight || keys.KeyX ? 1 : 0;
    // auto-drift: light brake while steering hard at speed
    if (brake && Math.abs(steer) > .25 && c.v > c.top * .6) { driftIn = 1; }
    if (touch.dashPress) { touch.dashPress = 0; if (c.air) trickIn = 1; else tryDash(c); }
  } else {
    const o = aiControl(c, dt); steer = o.steer; driftIn = o.drift; trickIn = o.trick;
    if (c.isPlayer && c.meter >= 1 && racing && !c.air) tryDash(c);
    if (!c.isPlayer) aiMoves(c, dt);
  }
  if (!racing) { steer = 0; driftIn = 0; if (!c.finished) gas = 0; else gas = .3; }
  // steering smoothing
  if (c.isPlayer && !AUTOPILOT) {
    const rate = steer === 0 ? STEER.recenter : (Math.sign(steer) !== Math.sign(c.steer) && c.steer !== 0 ? STEER.reverse : STEER.easeIn);
    const d = steer - c.steer; c.steer += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
  } else c.steer += (steer - c.steer) * Math.min(1, dt * 10);

  // --- drift state machine ---
  if (!driftIn) c.driftLock = false;
  if (!c.drift && driftIn && !c.driftLock && !c.air && Math.abs(c.steer) > .3 && c.v > c.top * .5) { c.drift = Math.sign(c.steer); c.driftT = 0; c.tier = 0; if (c.isPlayer) race.stats.drifts++; }
  if (c.drift && (!driftIn || c.v < c.top * .35 || c.air)) { // release
    if (c.tier > 0 && !c.air) { c.boost = Math.max(c.boost, c.tier === 2 ? 1.5 : .8); c.v += c.tier === 2 ? 6 : 3;
      if (c.isPlayer) { race.stats.driftBoosts[c.tier]++; race.style += c.tier === 2 ? 150 : 60; band(c.tier === 2 ? .14 : .07); c.meter = Math.min(1, c.meter + (c.tier === 2 ? .2 : .1)); toast(c.tier === 2 ? 'orange boost!' : 'blue boost'); sfx(c.tier === 2 ? 784 : 523, .3, .2); } }
    c.drift = 0; c.tier = 0;
  }
  if (c.drift) { c.driftT += dt * (.6 + .6 * Math.max(0, c.steer * c.drift)); const nt = c.driftT > 1.6 ? 2 : c.driftT > .7 ? 1 : 0; if (nt > c.tier && c.isPlayer) sfx(nt === 2 ? 660 : 440, .12, .1); c.tier = nt; }

  // --- speed ---
  const off = !c.alley && Math.abs(c.lat) > W / 2 + .5;
  let top = c.top * (c.isPlayer ? 1 : c.aiSkill * rubber(c));
  if (off && c.dash <= 0) top *= .55;
  if (c.alley) top *= .9;
  if (c.boost > 0) top *= 1.28;
  if (c.dash > 0) top *= 1.42;
  if (c.finished) top *= .5;
  if (!c.air) {
    if (c.drift) c.v -= (c.v > top ? (c.v - top) * 1.5 : 0) * dt + c.v * .05 * dt; // drifting: brake doesn't slow much
    else if (brake) c.v -= 45 * dt;
    else if (gas === 0 && c.isPlayer) c.v -= (6 + c.v * .12) * dt;
    else if (c.v < top) c.v += c.accel * gas * dt * (c.boost > 0 || c.dash > 0 ? 2.2 : 1) * (1 - .4 * c.v / top);
    else c.v -= (c.v - top) * Math.min(1, dt * 1.5);
  }
  c.v = Math.max(0, c.v);
  // --- turning ---
  const hi = c.isPlayer ? STEER.highSpeedCut : .25;
  let turn = c.turn * (c.isPlayer && !AUTOPILOT ? STEER.turnMul : 1) * (c.dash > 0 ? 1.3 : 1) * (c.grip > 0 ? 1.4 : 1) * Math.min(1, c.v / 15) * (1 - hi * Math.min(1, c.v / 70));
  if (c.air) turn *= .3;
  if (c.drift) c.h -= c.drift * c.turn * (.45 + .45 * c.steer * c.drift) * dt; // drift: tighter arc, steer adjusts the angle
  else c.h -= c.steer * turn * dt;
  if (c.isPlayer && !AUTOPILOT && racing && !c.drift && !c.alley && !c.air) { // light road assist
    const th = Math.atan2(T[c.idx].x, T[c.idx].z), edge = Math.max(0, Math.abs(c.lat) - (W / 2 - 3)) / 4;
    c.h += angDiff(th, c.h) * Math.min(1, (steer === 0 ? STEER.alignFree : STEER.alignSteer) * dt);
    if (edge > 0 && Math.sign(steer) !== Math.sign(c.lat) && c.v > 5 && !nearAlleyMouth(c)) c.h += Math.sign(c.lat) * Math.min(.6, edge) * STEER.edgePush * dt;
  }
  // velocity heading lags the car's nose while drifting (the slide)
  c.vh += angDiff(c.h, c.vh) * Math.min(1, dt * (c.drift ? 2.6 : c.air ? 0 : 12));
  c.x += Math.sin(c.vh) * c.v * dt + c.px * dt; c.z += Math.cos(c.vh) * c.v * dt + c.pz * dt;
  const pd = Math.exp(-dt * 4); c.px *= pd; c.pz *= pd;
  c.boost -= dt; c.dash -= dt; c.hitT += dt; c.grip -= dt; c.wallT += dt;

  // --- track position / alley ---
  const prev = c.idx;
  const au = alleyUV(c.x, c.z);
  const inAlleyZone = au.t > ALLEY.t0 - .01 && au.t < ALLEY.t1 + .01 && Math.abs(au.u) < ALLEY_HW + .4;
  if (!c.alley && inAlleyZone && au.t < ALLEY.t0 + .1) { c.alley = true; }
  if (c.alley) {
    if (au.t > ALLEY.t1 + .01 || au.t < ALLEY.t0 - .02) { c.alley = false; if (au.t > ALLEY.t1) { c.idx = ALLEY_B - 6; c.idx = nearestIdx(c); if (c.isPlayer) { race.stats.alley++; band(.1); race.style += 80; toast('shortcut!'); } } }
    else {
      c.idx = Math.round(ALLEY_A + (ALLEY_B - ALLEY_A) * Math.max(0, Math.min(1, au.t)));
      if (Math.abs(au.u) > ALLEY_HW - .9) { const push = au.u - Math.sign(au.u) * (ALLEY_HW - .9); c.x -= ALLEY.side.x * push; c.z -= ALLEY.side.z * push; c.v *= 1 - (1 - c.tough) * .06; c.h += angDiff(Math.atan2(ALLEY.dir.x, ALLEY.dir.z), c.h) * .2; c.vh = c.h; if (c.isPlayer) wallHit(c); }
      c.lat = 0;
    }
  }
  if (!c.alley) {
    c.idx = nearestIdx(c);
    c.lat = (c.x - P[c.idx].x) * S[c.idx].x + (c.z - P[c.idx].z) * S[c.idx].z;
    const LIM = W / 2 + 6.5;
    if (Math.abs(c.lat) > LIM && !inAlleyZone) { const push = c.lat - Math.sign(c.lat) * LIM; c.x -= S[c.idx].x * push; c.z -= S[c.idx].z * push; c.v *= 1 - (1 - c.tough) * .08; c.h += angDiff(Math.atan2(T[c.idx].x, T[c.idx].z), c.h) * .15; c.vh = c.h; if (c.drift) { c.drift = 0; c.tier = 0; c.driftLock = true; } if (c.isPlayer) wallHit(c); }
  }
  if (prev > N * .85 && c.idx < N * .15) { if (c.maxIdx > N * .5) { c.lap++; c.maxIdx = c.idx; onLap(c); } }
  else if (!(prev < N * .15 && c.idx > N * .85)) c.maxIdx = Math.max(c.maxIdx, c.idx);

  // --- vertical: ramp, pads, air, landing ---
  if (!c.air) {
    const onR = !c.alley && c.idx >= RAMP_I && c.idx < RAMP_I + RAMP_LEN && Math.abs(c.lat) < W / 2;
    if (onR) { c.y = RAMP_H * (c.idx - RAMP_I + .5) / RAMP_LEN; c.onRamp = true; }
    else if (c.onRamp) { c.onRamp = false; if (c.idx >= RAMP_I + RAMP_LEN && c.idx < RAMP_I + RAMP_LEN + 4 && c.v > 8) launch(c, 4 + c.v * .2); else c.y = 0; }
    else c.y = 0;
    for (const pd of PADS) if (Math.hypot(pd.x - c.x, pd.z - c.z) < 2.6 && !c.air) { launch(c, 12 + c.v * .04); pd.squash = 1; if (nearPlayer(c, 30) && AC) { drum(AC.currentTime, 'kick'); drum(AC.currentTime + .02, 'kick'); } }
  } else {
    c.vy -= 30 * dt; c.y += c.vy * dt;
    if (c.trick >= 0) c.trick = Math.min(1, c.trick + dt / .6);
    if (trickIn && c.trick < 0) { c.trick = 0; }
    if (c.y <= 0 && c.vy < 0) land(c);
  }
  // --- slide dash meter + band meter from clean driving ---
  if (c.isPlayer && racing) {
    if (!off && c.hitT > 1.2 && c.v > c.top * .6) { c.meter = Math.min(1, c.meter + dt * .06); race.style += dt * 4; band(dt * .02); }
    band(-dt * .012);
  }
  // --- hazards ---
  for (const s of stands) {
    if (s.down) continue; const dx = s.x - c.x, dz = s.z - c.z;
    if (dx * dx + dz * dz < 2.2 * 2.2 && c.y < 2.5) { s.down = 1; s.vx = Math.sin(c.vh) * c.v * .6 + rand(-3, 3); s.vz = Math.cos(c.vh) * c.v * .6 + rand(-3, 3); s.spin = rand(-8, 8); c.v *= .45 + .5 * c.tough; if (c.isPlayer) crash(c, 'bonk', .2); }
  }
  for (const t of timps) { if (!t.g.visible) continue; if (Math.hypot(t.x - c.x, t.z - c.z) < 2.6 && c.y < 2) { c.v *= .35 + .4 * c.tough; const sx = S[c.idx].x, sz = S[c.idx].z, sg = c.lat >= t.lat ? 1 : -1; c.px += sx * sg * 8; c.pz += sz * sg * 8; t.wait = rand(1, 2); t.s = TIMP_TOP; t.g.visible = false; if (c.isPlayer) { race.stats.timpHits++; crash(c, 'timpani!', .3); if (AC) { drum(AC.currentTime, 'kick'); brass(98, AC.currentTime, .4, .2, master, 500); } } } }
  { const b = metroBob(); if (Math.hypot(b.x - c.x, b.z - c.z) < 2.3 && b.y - c.y < 3.2) { if (c.hitT > .8) { c.v *= .4 + .3 * c.tough; const sg = Math.sign(c.lat - b.lat) || 1; c.px += S[METRO_I].x * sg * 10; c.pz += S[METRO_I].z * sg * 10; if (c.isPlayer) { race.stats.metroHits++; crash(c, 'tick-tock bonk', .3); } c.hitT = 0; } } }
}
function nearAlleyMouth(c) { const { t, u } = alleyUV(c.x, c.z); return t > ALLEY.t0 - .12 && t < ALLEY.t0 + .02 && Math.abs(u) < ALLEY_HW + 6; }
function launch(c, vy) { c.air = true; c.vy = vy; c.onRamp = false; c.trick = -1; if (c.drift) { c.drift = 0; c.tier = 0; } if (c.isPlayer) { race.stats.jumps++; } }
function land(c) {
  c.air = false; c.y = 0; c.vy = 0; c.vh = c.h;
  if (c.isPlayer) {
    if (c.trick >= 0) { race.stats.tricks++; race.style += 150; band(.2); c.meter = Math.min(1, c.meter + .35); c.boost = Math.max(c.boost, .9); toast('flip trick!'); sfx(880, .3, .2); }
    else { race.style += 40; band(.08); }
    if (AC) drum(AC.currentTime, 'kick');
  } else if (Math.random() < .5) c.boost = Math.max(c.boost, .5);
  c.trick = -1;
}
function wallHit(c) { if (c.wallT > 1) { band(-.05); } c.wallT = 0; c.hitT = 0; }
function crash(c, msg, bandLoss) { if (c.hitT > .6) { race.style -= 50; race.stats.crashes++; c.meter = Math.max(0, c.meter - .25); band(-bandLoss); toast(msg); if (AC) brass(110, AC.currentTime, .3, .25, master, 900); } c.hitT = 0; if (c.drift) c.driftLock = true; c.drift = 0; c.tier = 0; }
function tryDash(c) { if (c.meter >= 1 && c.dash <= 0) { c.meter = 0; c.dash = 1.6; c.v += 7; race.stats.dashes++; race.style += 50; band(.06); toast('slide dash'); if (AC) { const t = AC.currentTime; for (let k = 0; k < 6; k++) brass(mf(55 + k * 3), t + k * .05, .18, .12); } } }
function onLap(c) {
  if (c.lap === 0) return;
  if (!c.isPlayer) c.useAlley = Math.random() < .3;
  if (c.lap >= LAPS && !c.finished) { c.finished = true; c.finishTime = race.t; if (c.isPlayer) finishRace(); }
  else if (c.isPlayer) { toast(c.lap === LAPS - 1 ? 'final lap' : 'lap ' + (c.lap + 1)); stands.forEach(restoreStand); sfx(523, .25); }
}
let flashT = 0, toastT = 0;
function flash(t) { $('msg').textContent = t; flashT = .8; } // center: countdown only
function toast(t) { const el = $('toast'); el.textContent = t; el.style.display = 'block'; toastT = .8; }
function finishRace() {
  race.state = 'done'; const order = [...cars].sort((a, b) => progress(b) - progress(a)); const place = order.indexOf(player) + 1;
  const bonus = [1000, 700, 500, 300, 150][place - 1]; const style = Math.round(race.style), st = race.stats;
  race.results = { place, style, bonus, total: style + bonus, order: order.map(c => c.driver + ' — ' + c.name) };
  toast('finish!');
  setTimeout(() => {
    const ov = $('overlay'); ov.style.display = 'flex';
    ov.innerHTML = `<h1>${['1ST', '2ND', '3RD', '4TH', '5TH'][place - 1]} PLACE</h1><table>
      <tr><td>Place bonus</td><td>${bonus}</td></tr>
      <tr><td>Style · drift boosts ${st.driftBoosts[1] + st.driftBoosts[2]} · jumps ${st.jumps} · tricks ${st.tricks} · passes ${st.passes} · crashes ${st.crashes}</td><td>${style}</td></tr>
      <tr><td><b>BAND SCORE</b></td><td><b>${style + bonus}</b></td></tr></table>
      <table>${order.map((c, i) => `<tr><td>${i + 1}.</td><td>${c.driver}</td><td>${c.name}</td></tr>`).join('')}</table>
      <button id="again">RACE AGAIN</button>`;
    $('again').addEventListener('pointerup', e => { e.preventDefault(); startRace(); }); $('again').onclick = () => { if (race.state === 'done') startRace(); };
  }, 1800);
}
function collide() {
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
    const a = cars[i], b = cars[j]; if (Math.abs(a.y - b.y) > 2) continue;
    const dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz, R = 2.6;
    if (d2 < R * R && d2 > 1e-6) {
      const d = Math.sqrt(d2), o = (R - d) / 2, nx = dx / d, nz = dz / d;
      const wa = 1 - a.tough * .8 + .1, wb = 1 - b.tough * .8 + .1, ws = wa + wb;
      a.x -= nx * o * 2 * wa / ws; a.z -= nz * o * 2 * wa / ws; b.x += nx * o * 2 * wb / ws; b.z += nz * o * 2 * wb / ws;
      a.px -= nx * 4 * wa; a.pz -= nz * 4 * wa; b.px += nx * 4 * wb; b.pz += nz * 4 * wb; // shove
      a.v *= 1 - .03 * (1 - a.tough); b.v *= 1 - .03 * (1 - b.tough);
      if (a.isPlayer || b.isPlayer) { if (player.hitT > .8) { race.stats.bumps++; if (AC) drum(AC.currentTime, 'snare'); } player.hitT = 0; }
    }
  }
}
function sim(dt) {
  if (race.state === 'count') {
    const before = Math.ceil(race.countdown); race.countdown -= dt; const after = Math.ceil(race.countdown);
    if (after !== before) { if (after > 0) { flash(String(after)); sfx(392, .2); } else { flash('GO!'); sfx(784, .5, .35); race.state = 'race'; } }
  }
  if (race.state === 'race' || race.state === 'done') race.t += dt;
  // metronome swing (always), tick when crossing center
  metro.ang = METRO_MAX * Math.sin(2 * Math.PI * race.t / METRO_PERIOD + .6); metro.arm.rotation.z = metro.ang;
  { const sd = Math.sign(metro.ang); if (sd !== metro.lastSide) { metro.lastSide = sd; if (AC && race.musicOn && Math.hypot(P[METRO_I].x - player.x, P[METRO_I].z - player.z) < 90) drum(AC.currentTime, 'hat'); } }
  if (race.state !== 'menu') { cars.forEach(c => stepCar(c, dt)); collide(); stepTimps(dt); }
  for (const s of stands) if (s.down) { s.x += s.vx * dt; s.z += s.vz * dt; s.vx *= .97; s.vz *= .97; s.g.position.set(s.x, s.y, s.z); s.g.rotation.x = Math.min(1.5, s.g.rotation.x + dt * 6); s.g.rotation.y += s.spin * dt; s.spin *= .96; }
  for (const pd of PADS) { pd.squash = Math.max(0, pd.squash - dt * 4); pd.g.scale.y = 1 - pd.squash * .5; }
  // drift sparks (player + AI near camera)
  for (const c of cars) if (c.drift && !c.air) {
    const col = SPARK[c.tier], bx = -Math.sin(c.h) * 2, bz = -Math.cos(c.h) * 2, rx = Math.cos(c.h), rz = -Math.sin(c.h), gy = E[c.idx] + .3;
    for (const sd of [-1, 1]) if (Math.random() < (c.isPlayer ? .9 : .4)) emit(c.x + bx + rx * sd * 1.1, gy, c.z + bz + rz * sd * 1.1, rand(-3, 3) - Math.sin(c.vh) * 4, rand(2, 5), rand(-3, 3) - Math.cos(c.vh) * 4, col, rand(.2, .4));
  }
  stepParticles(dt); stepRings(dt);
}

// ---------- render loop ----------
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let camInit = false, camDt = 1 / 60;
function syncMeshes() {
  for (const c of cars) {
    const gy = E[c.idx] * (c.alley ? 0 : 1), slope = (E[(c.idx + 2) % N] - E[(c.idx - 2 + N) % N]) / (4 * SEG);
    c.mesh.position.set(c.x, gy + c.y, c.z); c.mesh.rotation.y = c.h;
    let pitch = c.alley ? 0 : -Math.atan(slope);
    if (c.onRamp) pitch -= Math.atan(RAMP_H / (RAMP_LEN * SEG));
    if (c.air) pitch += -Math.atan(c.vy / Math.max(10, c.v)) * .5 + (c.trick >= 0 ? c.trick * Math.PI * 2 : 0);
    c.mesh.rotation.x = pitch; c.mesh.rotation.z = c.drift ? -c.drift * .12 : -c.steer * .06 * Math.min(1, c.v / 40);
    const tb = c.mesh.userData.tb; if (tb) { // wheel spin, front-wheel steer, slide extension + bell glow on boost
      const sp = c.v * camDt / .56; for (const w of tb.wheels) w.rotation.x += sp; for (const f of tb.front) f.rotation.y = c.steer * .4;
      const pow = c.dash > 0 ? 1 : c.boost > 0 ? .75 : 0; tb.slide.position.z += (pow * .8 - tb.slide.position.z) * Math.min(1, camDt * 10);
      tb.glow.material.opacity = .3 + pow * .65; tb.glow.scale.setScalar(1 + pow * .25); }
    const sh = c.mesh.userData.shadow; sh.position.set(c.x, gy + .05 + (c.onRamp ? c.y : 0), c.z); sh.rotation.z = -c.h; sh.material.opacity = .35 / (1 + c.y * .25);
  }
  const f = tmp.set(Math.sin(player.vh * .5 + player.h * .5), 0, Math.cos(player.vh * .5 + player.h * .5));
  const py = (player.alley ? 0 : E[player.idx]) + player.y * .7;
  const want = new THREE.Vector3(player.x, py, player.z).addScaledVector(f, -11.5); want.y += 5;
  const look = new THREE.Vector3(player.x, py + 1.6, player.z).addScaledVector(f, 7);
  if (!camInit) { camPos.copy(want); camLook.copy(look); camInit = true; }
  const k = 1 - Math.exp(-camDt * 9); camPos.lerp(want, k); camLook.lerp(look, Math.min(1, k * 1.8)); camera.position.copy(camPos); camera.lookAt(camLook);
  { const o = window.__tt.camOverride; if (o) { camera.position.set(player.x + o[0], player.mesh.position.y + o[1], player.z + o[2]); camera.lookAt(player.x, player.mesh.position.y + .9, player.z); } } // test/screenshot hook only
  camera.fov = 66 + Math.min(14, player.v * .12) + (player.dash > 0 ? 6 : 0) + (player.boost > 0 ? 3 : 0); camera.updateProjectionMatrix();
}
function hud() {
  const order = [...cars].sort((a, b) => progress(b) - progress(a)); race.place = order.indexOf(player) + 1;
  if (race.state === 'race') { if (race.place < race.lastPlace) { race.stats.passes++; race.style += 75; band(.1); } race.lastPlace = race.place; }
  sections = race.state === 'menu' ? 4 : 1 + Math.min(4, Math.floor(race.band * 5));
  $('place').textContent = ['1st', '2nd', '3rd', '4th', '5th'][race.place - 1];
  $('lap').firstChild.textContent = `LAP ${Math.min(LAPS, Math.max(1, player.lap + 1))}/${LAPS}`;
  $('style').textContent = 'STYLE ' + Math.round(race.style);
  $('mph').textContent = Math.round(player.v * 1.6) + ' MPH';
  $('meterfill').style.width = (player.meter * 100) + '%';
  $('bandfill').style.width = (race.band * 100) + '%'; $('bandfill').style.background = race.band > .8 ? 'linear-gradient(90deg,#ffd34d,#fff)' : 'linear-gradient(90deg,#7b3fc4,#4aa3ff)';
  $('bdash').classList.toggle('ready', player.meter >= 1 || player.air);
  $('bdash').innerHTML = player.air ? 'FLIP' : 'SLIDE<br>DASH';
  $('bdrift').classList.toggle('t1', player.tier === 1); $('bdrift').classList.toggle('t2', player.tier === 2);
}
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(.1, (now - last) / 1000) * TIMESCALE; last = now; acc += dt;
  try {
    while (acc > 1 / 60) { sim(1 / 60); acc -= 1 / 60; }
    camDt = dt; schedMusic(); syncMeshes(); hud();
    if (flashT > 0) { flashT -= dt / TIMESCALE; if (flashT <= 0) $('msg').textContent = ''; }
    if (toastT > 0) { toastT -= dt / TIMESCALE; if (toastT <= 0) $('toast').style.display = 'none'; }
    renderer.render(scene, camera);
  } catch (e) { window.__tt.errors.push(String(e)); console.error(e); }
}
gridUp(); syncMeshes();
requestAnimationFrame(frame);
if (AUTOSTART) setTimeout(startRace, 300);
