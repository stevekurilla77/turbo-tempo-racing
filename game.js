// Turbo Tempo Racing — multi-track prototype (Brass City, Ghost Town Gulch). © 2026 Backline Vintage. Original code/art.
import * as THREE from 'three';
import { buildCar } from './cars.js';
import { buildCity } from './city.js';
import { bakeChunks } from './deco.js';
import { buildGhostTown } from './ghost.js';
import { buildStadium } from './stadium.js';
import { buildWaterPark } from './waterpark.js';
import { buildBayou } from './bayou.js';
import { buildReedForest } from './reed.js';
import { createMusic, THEMES } from './music.js';
import { SURFACES, ALLEY_STYLES, ROLLERS } from './styles.js';
import { TRACKS, CUPS, THEME, trackOf } from './tracks.js';
const Q = new URLSearchParams(location.search);
const TRACK_ID = trackOf(Q.get('track')), TRK = TRACKS[TRACK_ID];
const SOLO = Q.has('solo'), AUTOPILOT = Q.has('autopilot'), TIMESCALE = +Q.get('speed') || 1, AUTOSTART = Q.has('autostart');
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
const LAPS = Math.max(1, Math.min(3, +Q.get('laps') || 3)), W = 28, N = 600; // laps= is test-only
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
scene.background = new THREE.Color(TRK.env.bg);
scene.fog = new THREE.Fog(TRK.env.fog, TRK.env.fogNear, TRK.env.fogFar);
const camera = new THREE.PerspectiveCamera(68, vpSize()[0] / vpSize()[1], 0.5, 1200);
function onResize() { const [w, h] = vpSize(); document.documentElement.style.setProperty('--vvh', h + 'px'); renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); window.scrollTo(0, 0); }
addEventListener('resize', onResize); addEventListener('orientationchange', () => { onResize(); setTimeout(onResize, 300); setTimeout(onResize, 800); });
if (window.visualViewport) visualViewport.addEventListener('resize', onResize);
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
scene.add(new THREE.HemisphereLight(...TRK.env.hemi));
const sun = new THREE.DirectionalLight(...TRK.env.sun); sun.position.set(-200, 300, 100); scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshLambertMaterial({ color: TRK.env.ground }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; scene.add(ground);

// ---------- track ----------
const ctrl = TRK.ctrl;
const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
const P = curve.getSpacedPoints(N).slice(0, N);
const T = P.map((p, i) => P[(i + 1) % N].clone().sub(P[(i - 1 + N) % N]).normalize());
const S = T.map(t => new THREE.Vector3(-t.z, 0, t.x)); // side (right) vector
const SEG = curve.getLength() / N;
// elevation: one hill (the timpani slope) — everything that sits on the road adds E[i]
const [HILL_C, HILL_W, HILL_H] = TRK.hill;
const E = P.map((p, i) => Math.abs(i - HILL_C) < HILL_W ? HILL_H * (.5 + .5 * Math.cos(Math.PI * (i - HILL_C) / HILL_W)) : 0);
// shortcut alley: straight cut from P[ALLEY_A] to P[ALLEY_B] (inside of the S-bend)
const ALLEY_A = TRK.alley.A, ALLEY_B = TRK.alley.B, ALLEY_HW = TRK.alley.HW, MINE = TRK.alley.style === 'mine', ALLEY_TOP = +Q.get('atop') || TRK.alley.top || 1.25, ALLEY_PADV = +Q.get('apadv') || TRK.alley.padV || 1.45, ALLEY_PADN = TRK.alley.padN || 4; // shortcut chord (v15 alley / v20 mine tunnel)

function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t;
}
const DIRT = TRK.surface === 'dirt', XS = SURFACES[TRK.surface];
const roadTex = XS ? XS.road(canvasTex) : DIRT ? canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#9a7048'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 60 : 200},${Math.random() < .5 ? 40 : 150},20,${Math.random() * .12})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
  g.fillStyle = 'rgba(70,45,25,.35)'; for (const x of [.22, .3, .7, .78]) g.fillRect(w * x, 0, 7, h); // wagon-wheel ruts
  g.fillStyle = 'rgba(255,240,200,.5)'; for (let y = 0; y < h; y += 64) g.fillRect(w / 2 - 3, y, 6, 30); }, true) : canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3b3a42'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},255,${Math.random() * .06})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.fillStyle = '#ffd34d'; g.fillRect(w / 2 - 3, 0, 6, h * .5);
  g.fillStyle = '#eee'; g.fillRect(6, 0, 5, h); g.fillRect(w - 11, 0, 5, h);
}, true);
const curbTex = XS ? XS.curb(canvasTex) : DIRT ? canvasTex(8, 64, (g) => { g.fillStyle = '#6a4424'; g.fillRect(0, 0, 8, 64); g.fillStyle = '#e0c890'; g.fillRect(0, 0, 8, 26); g.fillStyle = '#3a2412'; g.fillRect(0, 30, 8, 2); }, true) : canvasTex(8, 64, (g) => { g.fillStyle = '#d22'; g.fillRect(0, 0, 8, 32); g.fillStyle = '#fff'; g.fillRect(0, 32, 8, 32); }, true);
const walkTex = XS ? XS.walk(canvasTex) : DIRT ? canvasTex(64, 64, (g) => { for (let y = 0; y < 64; y += 8) { g.fillStyle = `hsl(28,${35 + Math.random() * 15}%,${30 + Math.random() * 10}%)`; g.fillRect(0, y, 64, 7); g.fillStyle = '#2a1a0a'; g.fillRect(0, y + 7, 64, 1); g.fillRect((y * 7) % 64, y, 1, 7); } }, true) : canvasTex(64, 64, (g) => { g.fillStyle = '#b9b2a8'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#8f887f'; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64); }, true);

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
{ const wallTex = XS ? XS.wall(canvasTex) : canvasTex(64, 32, (g) => { g.fillStyle = '#8a5a44'; g.fillRect(0, 0, 64, 32); g.strokeStyle = '#6a4030'; g.lineWidth = 2; for (let y = 0; y < 32; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); for (let x = (y / 8) % 2 * 8; x < 64; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } } }, true);
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
  const p = P[i0]; grp.position.copy(p).setY(E[i0]); grp.rotation.y = Math.atan2(T[i0].x, T[i0].z); cwStage.add(grp);
}
const cwStage = new THREE.Group(); TRK.crosswalks.forEach(crosswalk);
for (const i0 of TRK.rails) { const grp = new THREE.Group(), tie = new THREE.MeshLambertMaterial({ color: 0x4a3018 }), rail = new THREE.MeshLambertMaterial({ color: 0x8a8f9a }); // old railroad crossing (flat, visual only)
  for (let k = -9; k <= 9; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(W + 6, .06, .9), tie); m.position.set(0, .05, k * 1.1); m.visible = Math.abs(k) < 4; if (m.visible) grp.add(m); }
  for (const z of [-1.4, 1.4]) { const m = new THREE.Mesh(new THREE.BoxGeometry(W + 30, .1, .25), rail); m.position.set(0, .1, z); grp.add(m); }
  for (const sd of [-1, 1]) { const x = sd * (W / 2 + 4); const post = new THREE.Mesh(new THREE.BoxGeometry(.3, 5, .3), new THREE.MeshLambertMaterial({ color: 0xf0e8d8 })); post.position.set(x, 2.5, 3); grp.add(post);
    for (const r of [-.7, .7]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3, .45, .12), new THREE.MeshLambertMaterial({ color: 0xf0e8d8 })); b.position.set(x, 4.3, 3.1); b.rotation.z = r; grp.add(b); } }
  const p = P[i0]; grp.position.copy(p).setY(E[i0]); grp.rotation.y = Math.atan2(T[i0].x, T[i0].z) + Math.PI / 2 * 0; cwStage.add(grp); }
bakeChunks(cwStage, scene);
// start/finish
{
  const t = canvasTex(128, 16, (g) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 8, y * 8, 8, 8); } });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, 2), new THREE.MeshLambertMaterial({ map: t }));
  m.rotation.x = -Math.PI / 2; m.position.copy(P[0]).setY(0.07); m.rotation.z = -Math.atan2(T[0].x, T[0].z); scene.add(m);
  // banner arch
  const brass = XS ? new THREE.MeshLambertMaterial({ color: XS.post }) : DIRT ? new THREE.MeshLambertMaterial({ color: 0x6a4424 }) : new THREE.MeshStandardMaterial({ color: 0xd4a640, metalness: .8, roughness: .3 });
  [-1, 1].forEach(sd => { const post = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 10), brass); post.position.copy(P[0]).addScaledVector(S[0], sd * (W / 2 + 2)).setY(5); scene.add(post); });
  const bt = canvasTex(512, 64, (g) => { g.fillStyle = '#c0203a'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#ffd34d'; g.font = 'bold italic 30px Arial Black, Impact'; g.textAlign = 'center'; g.fillText(TRK.banner, 256, 46); });
  const ban = new THREE.Mesh(new THREE.BoxGeometry(W + 5, 2.4, .3), [0, 0, 0, 0, 1, 1].map(k => k ? new THREE.MeshBasicMaterial({ map: bt }) : brass));
  ban.position.copy(P[0]).setY(9.5); ban.rotation.y = Math.atan2(T[0].x, T[0].z) + Math.PI; scene.add(ban);
}

function alleyUV(x, z) { const a = P[ALLEY_A], b = P[ALLEY_B], abx = b.x - a.x, abz = b.z - a.z, L2 = abx * abx + abz * abz, L = Math.sqrt(L2);
  const t = ((x - a.x) * abx + (z - a.z) * abz) / L2, u = ((x - a.x) * -abz + (z - a.z) * abx) / L; return { t, u, L }; }
function alleyDist(x, z) { const { t, u, L } = alleyUV(x, z); return t < 0 || t > 1 ? 1e9 : Math.abs(u); }
// ---------- v19 scenery (buildings, landmarks, sky) ----------
const brassMat = new THREE.MeshStandardMaterial({ color: 0xe0b04a, metalness: .85, roughness: .28, emissive: 0x402800 });
const silverMat = new THREE.MeshStandardMaterial({ color: 0xcfd6de, metalness: .9, roughness: .25 });
const CITY = ({ city: buildCity, ghost: buildGhostTown, stadium: buildStadium, water: buildWaterPark, bayou: buildBayou, reed: buildReedForest }[TRK.scenery] || buildCity)({ scene, P, S, T, N, W, E, alleyDist, alleyUV, ALLEY_A, ALLEY_B, ALLEY_HW, brassMat });
window.__tt_city = CITY.stats;

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
document.addEventListener('visibilitychange', () => { if (!AC) return; if (document.hidden) { AC.suspend && AC.suspend().catch(() => {}); } else if (race.musicOn) { initAudio(); if (MUSIC) MUSIC.resync(AC.currentTime + .1); } });
setInterval(() => { if (AC && AC.state !== 'running' && !document.hidden && race.musicOn) { AC.resume().catch(() => {}); } }, 1000);
function brass(f, t, dur, vol, out = master, bright = 2600) {
  const o1 = AC.createOscillator(), o2 = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain();
  o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = f; o2.frequency.value = f * 1.004;
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(400, t); fl.frequency.linearRampToValueAtTime(bright, t + .05); fl.frequency.linearRampToValueAtTime(bright * .5, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .03); g.gain.setValueAtTime(vol * .8, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur);
  o1.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out); o1.start(t); o2.start(t); o1.stop(t + dur + .05); o2.stop(t + dur + .05);
}
// v20: honky-tonk saloon piano (two slightly detuned strings, plucky decay)
function piano(f, t, dur, vol, out = master) { window.__tt.pianoNotes = (window.__tt.pianoNotes || 0) + 1;
  const o1 = AC.createOscillator(), o2 = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain();
  o1.type = 'triangle'; o2.type = 'square'; o1.frequency.value = f; o2.frequency.value = f * 1.009;
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(3200, t); fl.frequency.exponentialRampToValueAtTime(900, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(vol * .25, t + dur * .4); g.gain.exponentialRampToValueAtTime(.0005, t + dur * 1.6);
  const g2 = AC.createGain(); g2.gain.value = .35; o2.connect(g2); g2.connect(fl); o1.connect(fl); fl.connect(g); g.connect(out); o1.start(t); o2.start(t); o1.stop(t + dur * 1.7); o2.stop(t + dur * 1.7);
}
let noiseBuf;
function drum(t, kind) {
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * .3, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const g = AC.createGain(); g.connect(musicGain);
  if (kind === 'kick') { const o = AC.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + .15); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(g); o.start(t); o.stop(t + .22); }
  else { const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : 7000;
    const v = kind === 'snare' ? .5 : .12, d = kind === 'snare' ? .14 : .04; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(f); f.connect(g); s.start(t); s.stop(t + d + .02); }
}
// v21: per-course original themes live in music.js (layers follow the band meter; final lap speeds up ~7%)
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const MUSIC_ID = THEMES[Q.get('music')] ? Q.get('music') : THEMES[TRK.music] ? TRK.music : 'brass'; let MUSIC = null, sections = 4;
function schedMusic() {
  if (!AC || !race.musicOn || AC.state !== 'running') return;
  if (!MUSIC) { MUSIC = createMusic(AC, musicGain); MUSIC.setTheme(MUSIC_ID); MUSIC.resync(AC.currentTime + .05); }
  const n = MUSIC.tick(AC.currentTime, sections, race.fastMusic ? 1.07 : 1);
  window.__tt.musicSteps = (window.__tt.musicSteps || 0) + n; window.__tt.musicTheme = MUSIC.theme.name;
}
function sfx(f, dur = .35, vol = .25) { if (AC) window.__tt.sfx = (window.__tt.sfx || 0) + 1; if (AC) brass(f, AC.currentTime, dur, vol, master, 4000); }

// ---------- cars (models live in cars.js) ----------
// stats: top speed, accel, turn (handling), tough (mass/knock resistance). Every car trades something off.
const CARS = {
  trombone: { name: 'Trombone Super Racer', fam: 'Brass', top: 43, accel: 17, turn: 1.95, tough: .5, move: 'Slide Dash', kind: 'boost', pro: 'Balanced all-rounder', con: 'No standout strength' },
  trumpet: { name: 'Trumpet Rocket', fam: 'Brass', top: 46.5, accel: 15, turn: 1.65, tough: .35, move: 'Fanfare', kind: 'boost', pro: 'Huge top speed', con: 'Wide turns, light' },
  sax: { name: 'Saxophone Groove GT', fam: 'Woodwind', top: 42, accel: 16.5, turn: 2.4, tough: .42, move: 'Smooth Groove', kind: 'grip', pro: 'Silky handling', con: 'Lower top speed' },
  tuba: { name: 'Sousaphone Tank', fam: 'Brass', top: 40, accel: 10.5, turn: 1.5, tough: .95, move: 'Bass Blast', kind: 'blast', pro: 'Toughest: shoves everyone', con: 'Slow start, heavy steering' },
  clarinet: { name: 'Clarinet Dart', fam: 'Woodwind', top: 47.5, accel: 16, turn: 1.8, tough: .18, move: 'Clarinet Trill', kind: 'boost', pro: 'Fastest car', con: 'Fragile: bumps hurt' },
  snare: { name: 'Snare Kart', fam: 'Percussion', top: 41, accel: 19.5, turn: 2.6, tough: .3, move: 'Drum Roll', kind: 'grip', pro: 'Best launch + handling', con: 'Low top speed, light' },
  horn: { name: 'French Horn Cruiser', fam: 'Brass', top: 42.5, accel: 14.5, turn: 2.15, tough: .65, move: 'Horn Call', kind: 'horn', pro: 'Sturdy and nimble', con: 'So-so acceleration' },
  xylo: { name: 'Xylophone Speedster', fam: 'Percussion', top: 44.5, accel: 13, turn: 1.8, tough: .72, move: 'Mallet Roll', kind: 'grip', pro: 'Fast and solid', con: 'Slow launch' },
};
const ROSTER = Object.keys(CARS);
const STAT_RANGE = { top: [39, 48], accel: [9, 20], turn: [1.4, 2.7], tough: [.1, 1] };
const statPct = (t, k) => { const [a, b] = STAT_RANGE[k]; return Math.max(.08, Math.min(1, (CARS[t][k] - a) / (b - a))); };
const DRIVERS = { trombone: 'Remy', trumpet: 'Alex', sax: 'Quinn', tuba: 'Reese', clarinet: 'Jordan', snare: 'Kai', horn: 'Sky', xylo: 'Rory' };
const AGGR = { tuba: .8, snare: .6, horn: .45, clarinet: .3, trumpet: .4, sax: .35, xylo: .55, trombone: .4 };
const meshCache = {}, shadowGeo = new THREE.CircleGeometry(1, 16);
function meshFor(type) {
  if (!meshCache[type]) { const { g, shadow } = buildCar(type); g.rotation.order = 'YXZ';
    const sh = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(shadow[0], shadow[1], 1); sh.position.y = .03; scene.add(sh);
    g.userData.shadow = sh; meshCache[type] = g; }
  return meshCache[type];
}
const cars = [];
function makeCar(isPlayer, slot) { const c = { isPlayer, slot, lane: 0, aiSkill: rand(.97, 1.03), phase: rand(0, 6) }; cars.push(c); return c; }
function assignCar(c, type) {
  Object.assign(c, CARS[type], { type }); c.mesh = meshFor(type); scene.add(c.mesh); c.mesh.visible = true; c.mesh.userData.shadow.visible = true;
  c.driver = c.isPlayer ? 'You' : DRIVERS[type]; c.aggr = AGGR[type] || .4;
}
const player = makeCar(true, 0); for (let i = 1; i <= 4; i++) makeCar(false, i);
let playerType = 'trombone'; try { const s = localStorage.getItem('tt_car'); if (CARS[s]) playerType = s; } catch (_) {}
if (CARS[Q.get('car')]) playerType = Q.get('car');
// ---------- v22 cup mode: 3 races in a row, points per place, standings between races, trophy ceremony ----------
const CUP_POINTS = [10, 8, 6, 4, 2];
const cupSave = c => { try { if (c) sessionStorage.setItem('tt_cup', JSON.stringify(c)); else sessionStorage.removeItem('tt_cup'); } catch (_) {} };
let CUP = null; try { const c = JSON.parse(sessionStorage.getItem('tt_cup') || 'null'), def = c && CUPS.find(x => x.id === c.id);
  if (def && !c.fin && Q.get('cup') === c.id && def.tracks[c.i] && def.tracks[c.i][0] === TRACK_ID && CARS[c.car] && c.ai.every(t => CARS[t])) { CUP = c; CUP.def = def; playerType = c.car; } } catch (_) {}
function setLineup(type) { // player gets `type`; AI racers get 4 of the other cars
  playerType = type; try { localStorage.setItem('tt_car', type); } catch (_) {}
  for (const k in meshCache) { meshCache[k].visible = false; meshCache[k].userData.shadow.visible = false; }
  const others = CUP && CUP.car === type ? CUP.ai.slice() : ROSTER.filter(t => t !== type).sort(() => Math.random() - .5).slice(0, 4);
  assignCar(player, type); others.forEach((t, i) => assignCar(cars[i + 1], t));
}
setLineup(playerType);
function gridUp() {
  const order = [cars[1], cars[2], cars[3], cars[4], player];
  order.forEach((c, k) => {
    const i = (N - 6 - k * 5) % N, side = k === 4 ? 0 : (k % 2 ? 6 : -6);
    Object.assign(c, { idx: i, x: P[i].x + S[i].x * side, z: P[i].z + S[i].z * side, h: Math.atan2(T[i].x, T[i].z), v: 0, lap: -1, maxIdx: N,
      boost: 0, dash: 0, meter: 0, finished: false, finishTime: 0, hitT: 9, lat: side, steer: 0,
      y: 0, vy: 0, air: false, onRamp: false, trick: -1, drift: 0, driftT: 0, tier: 0, px: 0, pz: 0, grip: 0, moveCD: rand(6, 10),
      blockT: 0, bumpT: 0, alley: false, useAlley: false, wallT: 9, warpT: 0, warp: false, onWarp: null });
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
const RAMP_I = TRK.ramp, RAMP_LEN = 6, RAMP_H = 2.3;
{ const keysTex = XS ? XS.ramp(canvasTex) : DIRT ? canvasTex(256, 64, (g) => { for (let x = 0; x < 256; x += 16) { g.fillStyle = `hsl(28,40%,${32 + Math.random() * 12}%)`; g.fillRect(x, 0, 15, 64); g.fillStyle = '#2a1a0a'; g.fillRect(x + 15, 0, 1, 64); g.fillRect(x + 6, 8, 2, 2); g.fillRect(x + 6, 54, 2, 2); } }) : canvasTex(256, 64, (g) => { const kw = 256 / 14; for (let k = 0; k < 14; k++) { g.fillStyle = '#f6f3ea'; g.fillRect(k * kw + 1, 0, kw - 2, 64); } g.fillStyle = '#15151a'; for (let k = 0; k < 13; k++) if ([0, 1, 3, 4, 5].includes(k % 7)) g.fillRect((k + 1) * kw - kw * .3, 0, kw * .6, 38); });
  const pos = [], uv = [], idx = []; let k = 0;
  for (let n = 0; n <= RAMP_LEN; n++) { const i = RAMP_I + n, p = P[i], s = S[i], y = E[i] + .05 + RAMP_H * n / RAMP_LEN; pos.push(p.x - s.x * W / 2, y, p.z - s.z * W / 2, p.x + s.x * W / 2, y, p.z + s.z * W / 2); uv.push(0, n / RAMP_LEN, 1, n / RAMP_LEN); if (n < RAMP_LEN) idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); k += 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ map: keysTex, side: THREE.DoubleSide }); scene.add(new THREE.Mesh(g, mat));
  // ramp sides + lip in brass
  const e = P[RAMP_I + RAMP_LEN], sE = S[RAMP_I + RAMP_LEN];
  for (const sd of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(.5, RAMP_H, .5), brassMat); post.position.set(e.x + sE.x * sd * (W / 2 + .3), RAMP_H / 2, e.z + sE.z * sd * (W / 2 + .3)); scene.add(post); }
  const lip = new THREE.Mesh(new THREE.BoxGeometry(W + 1, .25, .4), brassMat); lip.position.set(e.x, RAMP_H + .1, e.z); lip.rotation.y = Math.atan2(T[RAMP_I + RAMP_LEN].x, T[RAMP_I + RAMP_LEN].z); scene.add(lip);
}
// ---------- v17 warp ramps: neon wedges in the middle of the road; launch + big speed boost on landing ----------
const WARP_LEN = 4, WARP_H = 1.5, WARP_HW = 9.5, NOWARP = Q.has('nowarp');
const WARPS = TRK.warps.map(i => ({ i, len: WARP_LEN }));
{ const wTex = canvasTex(128, 128, (g) => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#2a0050'); gr.addColorStop(1, '#00304a'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#ff4fd8'; g.lineWidth = 12; g.lineCap = 'round'; for (const y of [28, 68, 108]) { g.beginPath(); g.moveTo(10, y + 18); g.lineTo(64, y - 18); g.lineTo(118, y + 18); g.stroke(); }
    g.strokeStyle = '#6ff'; g.lineWidth = 6; g.strokeRect(3, -10, 122, 148); });
  const chevM = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(256, 64, (g) => { g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#2a0050'; g.lineWidth = 22; const ch = () => { g.beginPath(); g.moveTo(14, 56); g.lineTo(128, 10); g.lineTo(242, 56); g.stroke(); }; ch(); g.strokeStyle = '#ff4fd8'; g.lineWidth = 12; ch(); }) });
  const surf = new THREE.MeshBasicMaterial({ map: wTex, side: THREE.DoubleSide }), sideM = new THREE.MeshBasicMaterial({ color: 0x33ffff }), pyl = new THREE.MeshBasicMaterial({ color: 0xff4fd8 });
  for (const w of WARPS) { const pos = [], uv = [], idx = []; let k = 0;
    for (let n = 0; n <= w.len; n++) { const i = (w.i + n) % N, p = P[i], sd = S[i], y = E[i] + .06 + WARP_H * n / w.len; pos.push(p.x - sd.x * WARP_HW, y, p.z - sd.z * WARP_HW, p.x + sd.x * WARP_HW, y, p.z + sd.z * WARP_HW); uv.push(0, n / w.len, 1, n / w.len); if (n < w.len) idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); k += 2; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); scene.add(new THREE.Mesh(g, surf));
    const e = (w.i + w.len) % N, pe = P[e], se = S[e], rot = Math.atan2(T[e].x, T[e].z);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(WARP_HW * 2 + .6, .3, .5), sideM); lip.position.set(pe.x, E[e] + WARP_H + .1, pe.z); lip.rotation.y = rot; scene.add(lip);
    for (const sd of [-1, 1]) { const q = P[w.i], sq = S[w.i]; // tall neon pylons with a bright cap: visible from far away
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 6, 8), pyl); post.position.set(pe.x + se.x * sd * (WARP_HW + .7), E[e] + 3, pe.z + se.z * sd * (WARP_HW + .7)); scene.add(post);
      const cap = new THREE.Mesh(new THREE.OctahedronGeometry(.9), sideM); cap.position.set(post.position.x, post.position.y + 3.6, post.position.z); scene.add(cap); w.caps = (w.caps || []).concat(cap);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(.25, WARP_H, (w.len) * SEG), sideM); wall.position.set(q.x + (pe.x - q.x) / 2 + sq.x * sd * WARP_HW, E[w.i] + WARP_H / 2, q.z + (pe.z - q.z) / 2 + sq.z * sd * WARP_HW); wall.rotation.y = rot; wall.scale.y = .5; wall.position.y -= WARP_H / 4; scene.add(wall); }
    // approach chevrons painted on the road
    for (let n = 1; n <= 3; n++) { const i = (w.i - n * 6 + N) % N; const m = new THREE.Mesh(new THREE.PlaneGeometry(WARP_HW * 1.6, 4), chevM); m.rotation.set(-Math.PI / 2, 0, Math.atan2(T[i].x, T[i].z) + Math.PI); m.position.set(P[i].x, E[i] + .08, P[i].z); scene.add(m); } } }
const warpAt = c => { if (c.alley || NOWARP || window.__tt.nowarp || Math.abs(c.lat) > WARP_HW) return null; for (const w of WARPS) if ((c.idx - w.i + N) % N < w.len) return w; return null; };
const PADS = TRK.pads.map(([i, l]) => {
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
for (const [i, l] of TRK.stands) { const p = P[i].clone().addScaledVector(S[i], l); addStand(p.x, E[i], p.z, Math.atan2(T[i].x, T[i].z)); }
function restoreStand(s) { s.down = 0; s.x = s.home.x; s.z = s.home.z; s.g.position.copy(s.home); s.g.rotation.set(0, s.rotY, 0); }

// shortcut alley (v15): wide cobbled lane with boost pads, neon arches + road arrows at both mouths, no obstacles
const ALLEY = (() => {
  const a = P[ALLEY_A], b = P[ALLEY_B], dir = new THREE.Vector3(b.x - a.x, 0, b.z - a.z), L = dir.length(); dir.normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x), rotY = Math.atan2(dir.x, dir.z);
  const at = (t, u) => [a.x + dir.x * L * t + side.x * u, a.z + dir.z * L * t + side.z * u];
  const roadD = (x, z, i0) => { let md = 1e9; for (let j = i0 - 40; j < i0 + 40; j++) { const q = P[(j + N) % N]; md = Math.min(md, Math.hypot(q.x - x, q.z - z)); } return md; };
  // first t (from each end) where lateral offset u is `clear` units from the road centre line
  const clearT = (u, clear, fromEnd) => { if (!fromEnd) { for (let t = 0; t < .5; t += .002) if (roadD(...at(t, u), ALLEY_A) > clear) return t; return .5; }
    for (let t = 1; t > .5; t -= .002) if (roadD(...at(t, u), ALLEY_B) > clear) return t; return .5; };
  const H = ALLEY_HW + .5, CURB = W / 2 + 1.3, WALK = W / 2 + 8.6;
  const f0 = [clearT(-H, CURB, 0), clearT(H, CURB, 0)], f1 = [clearT(-H, CURB, 1), clearT(H, CURB, 1)]; // floor follows the curb line
  const w0 = [clearT(-H, WALK, 0), clearT(H, WALK, 0)], w1 = [clearT(-H, WALK, 1), clearT(H, WALK, 1)]; // walls start past the sidewalk
  const t0 = Math.max(...w0), t1 = Math.min(...w1);
  const AS = ALLEY_STYLES[TRK.alley.style];
  const cobble = AS ? AS.floor(canvasTex) : MINE ? canvasTex(64, 64, (g) => { g.fillStyle = '#6a4a30'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 40 : 160},${Math.random() < .5 ? 30 : 110},20,.25)`; g.fillRect(Math.random() * 64, Math.random() * 64, 3, 2); } g.fillStyle = '#3a2814'; for (let y = 0; y < 64; y += 16) g.fillRect(4, y, 56, 4); g.fillStyle = '#9aa0a8'; g.fillRect(14, 0, 3, 64); g.fillRect(47, 0, 3, 64); }, true) : canvasTex(64, 64, (g) => { g.fillStyle = '#5a4f4a'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 10) for (let x = (y / 10) % 2 * 6; x < 64; x += 12) { g.fillStyle = `hsl(20,8%,${30 + Math.random() * 14}%)`; g.beginPath(); g.ellipse(x + 5, y + 5, 5, 4, 0, 0, 7); g.fill(); } }, true);
  { const pos = [], uv = [], C = [[f0[0], -H], [f0[1], H], [f1[0], -H], [f1[1], H]];
    for (const [t, u] of C) { const [x, z] = at(t, u); pos.push(x, .14, z); uv.push(u / 7, t * L / 7); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex([0, 2, 1, 1, 2, 3]); g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) g.setIndex([0, 1, 2, 1, 3, 2]), g.computeVertexNormals();
    var floorMat = new THREE.MeshLambertMaterial({ map: cobble }); scene.add(new THREE.Mesh(g, floorMat)); }
  // glowing edge lines so the lane reads from far away
  for (const sd of [-1, 1]) { const k = sd < 0 ? 0 : 1, ta = f0[k], tb = f1[k], len = (tb - ta) * L, [x, z] = at((ta + tb) / 2, sd * (ALLEY_HW - .2));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.35, len), new THREE.MeshBasicMaterial({ color: AS ? AS.edge : 0x66ffff })); m.rotation.set(-Math.PI / 2, 0, rotY); m.position.set(x, .16, z); scene.add(m); }
  const brick = AS ? AS.wall(canvasTex) : MINE ? canvasTex(64, 64, (g) => { g.fillStyle = '#7a5a44'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 40; i++) { g.fillStyle = `hsl(${20 + Math.random() * 12},${25 + Math.random() * 15}%,${26 + Math.random() * 18}%)`; g.beginPath(); g.ellipse(Math.random() * 64, Math.random() * 64, 4 + Math.random() * 9, 3 + Math.random() * 6, Math.random() * 3, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,210,90,.6)'; for (let i = 0; i < 5; i++) g.fillRect(Math.random() * 60, Math.random() * 60, 2, 2); }, true) : canvasTex(64, 64, (g) => { g.fillStyle = '#7a3b2e'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#4a2018'; g.lineWidth = 2; for (let y = 0; y < 64; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); for (let x = (y / 8) % 2 * 8; x < 64; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } } }, true);
  for (const sd of [-1, 1]) { const k = sd < 0 ? 0 : 1, ta = w0[k], tb = w1[k], len = (tb - ta) * L, tex = brick.clone(); tex.repeat.set(len / 8, 1.5); tex.needsUpdate = true;
    const WH = AS ? AS.wallH : 9, w = new THREE.Mesh(new THREE.BoxGeometry(1, WH, len), new THREE.MeshLambertMaterial(AS && AS.wallOpacity ? { map: tex, transparent: true, opacity: AS.wallOpacity, depthWrite: false } : { map: tex })); if (AS) tex.repeat.set(len / 8, WH / 6); const [x, z] = at((ta + tb) / 2, sd * (ALLEY_HW + .5)); w.position.set(x, WH / 2, z); w.rotation.y = rotY; scene.add(w); }
  let alleyAnim = null;
  if (AS) alleyAnim = AS.deco({ THREE, scene, at, t0, t1, L, rotY, HW: ALLEY_HW, canvasTex, bake: bakeChunks, floorMat }) || null;
  else if (MINE) { // timber frames, plank roof, hanging lanterns
    const timber = new THREE.MeshLambertMaterial({ color: 0x5a3a1e }), lamp = new THREE.MeshBasicMaterial({ color: 0xffc860 }), stage = new THREE.Group();
    const roofTex = canvasTex(64, 64, (g) => { for (let x = 0; x < 64; x += 8) { g.fillStyle = `hsl(26,35%,${18 + Math.random() * 8}%)`; g.fillRect(x, 0, 7, 64); } }, true); roofTex.repeat.set(2, (t1 - t0) * L / 8);
    { const len = (t1 - t0) * L, [x, z] = at((t0 + t1) / 2, 0); const roof = new THREE.Mesh(new THREE.BoxGeometry(ALLEY_HW * 2 + 3, .6, len), new THREE.MeshLambertMaterial({ map: roofTex })); roof.position.set(x, 9.2, z); roof.rotation.y = rotY; scene.add(roof); }
    for (let t = t0, n = 0; t <= t1 + 1e-6; t += (t1 - t0) / Math.max(1, Math.round((t1 - t0) * L / 9)), n++) {
      for (const sd of [-1, 1]) { const [x, z] = at(t, sd * (ALLEY_HW - .1)); const post = new THREE.Mesh(new THREE.BoxGeometry(.8, 9, .8), timber); post.position.set(x, 4.5, z); post.rotation.y = rotY; stage.add(post); }
      { const [x, z] = at(t, 0); const beam = new THREE.Mesh(new THREE.BoxGeometry(ALLEY_HW * 2 + .6, .9, .9), timber); beam.position.set(x, 8.5, z); beam.rotation.y = rotY; stage.add(beam);
        if (n % 2 === 1) { const l = new THREE.Mesh(new THREE.BoxGeometry(.6, .9, .6), lamp); l.position.set(x, 7.4, z); stage.add(l); } } }
    bakeChunks(stage, scene);
  } else
  // string lights
  for (let t = t0 + .05, n = 0; t < t1; t += .08, n++) { const bulb = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), new THREE.MeshBasicMaterial({ color: [0xffd34d, 0x7ff, 0xff6a9a][n % 3] })); const [x, z] = at(t, 0); bulb.position.set(x, 7.2, z); scene.add(bulb); }
  // boost pads: full-width glowing chevrons (can't miss them)
  const padTex = canvasTex(128, 128, (g) => { g.fillStyle = '#102a40'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#3ff'; g.lineWidth = 14; g.lineCap = 'round'; for (const y of [30, 70, 110]) { g.beginPath(); g.moveTo(12, y); g.lineTo(64, y - 30); g.lineTo(116, y); g.stroke(); } });
  const pads = [];
  for (let k = 0; k < ALLEY_PADN; k++) { const t = t0 + .04 + (t1 - t0 - .16) * k / Math.max(1, ALLEY_PADN - 1), [x, z] = at(t, 0);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ALLEY_HW * 2 - 1, 7), new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: .95 })); m.rotation.set(-Math.PI / 2, 0, rotY + Math.PI); m.position.set(x, .18, z); scene.add(m); pads.push({ t, m }); }
  // neon arches at both mouths
  const signTex = (txt) => canvasTex(512, 96, AS ? (g) => AS.signDraw(g, txt) : MINE ? (g) => { g.fillStyle = '#6a4424'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#4a2c14'; for (let y = 0; y < 96; y += 24) g.fillRect(0, y, 512, 3); g.strokeStyle = '#2a1608'; g.lineWidth = 8; g.strokeRect(4, 4, 504, 88); g.fillStyle = '#ffe08a'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.fillText(txt, 256, 62); } : (g) => { g.fillStyle = '#1a0a2a'; g.fillRect(0, 0, 512, 96); g.strokeStyle = '#ff4fb0'; g.lineWidth = 6; g.strokeRect(5, 5, 502, 86); g.fillStyle = '#7ff'; g.font = 'bold 40px Arial Black, Impact'; g.textAlign = 'center'; g.fillText(txt, 256, 62); });
  const neonPost = AS ? new THREE.MeshLambertMaterial({ color: AS.post }) : MINE ? new THREE.MeshLambertMaterial({ color: 0x4a2c14 }) : new THREE.MeshBasicMaterial({ color: 0xff4fb0 });
  for (const [t, txt, flip] of [[t0, TRK.alley.sign, 0], [t1, TRK.alley.exit, 1]]) {
    for (const sd of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 12.5, 8), neonPost); const [x, z] = at(t, sd * (ALLEY_HW + .4)); post.position.set(x, 6.25, z); scene.add(post); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(ALLEY_HW * 2 + 2, 3.2), new THREE.MeshBasicMaterial({ map: signTex(txt), side: THREE.DoubleSide })); const [x, z] = at(flip ? t + 1.2 : t - 1.2, 0); sign.position.set(x, 11.4, z); sign.rotation.y = rotY + Math.PI; scene.add(sign); }
  // approach markers on the main road: big painted arrows bending toward the mouth + a roadside sign
  const sideSign = Math.sign(dir.dot(S[ALLEY_A])) || 1;
  const arrowTex = canvasTex(128, 128, (g) => { g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(64, 6); g.lineTo(118, 62); g.lineTo(86, 62); g.lineTo(86, 122); g.lineTo(42, 122); g.lineTo(42, 62); g.lineTo(10, 62); g.closePath(); g.fill(); });
  const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, depthWrite: false });
  for (let k = 0; k < 5; k++) { const i = ALLEY_A - 42 + k * 8, lat = sideSign * (2 + k * 1.7); const m = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 7), arrowMat);
    m.rotation.set(-Math.PI / 2, 0, Math.atan2(T[i].x, T[i].z) + Math.PI - sideSign * k * .12); m.position.set(P[i].x + S[i].x * lat, .09, P[i].z + S[i].z * lat); scene.add(m); }
  { const i = ALLEY_A - 30, x = P[i].x + S[i].x * sideSign * (W / 2 + 3), z = P[i].z + S[i].z * sideSign * (W / 2 + 3);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 6), new THREE.MeshLambertMaterial({ color: 0x333 })); pole.position.set(x, 3, z); scene.add(pole);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 2), new THREE.MeshBasicMaterial({ map: signTex(sideSign > 0 ? TRK.alley.ahead + ' ➜' : '⬅ ' + TRK.alley.ahead), side: THREE.DoubleSide })); sg.position.set(x, 6.4, z); sg.rotation.y = Math.atan2(T[i].x, T[i].z) + Math.PI; scene.add(sg); }
  return { a, b, dir, side, L, t0, t1, f0: Math.min(...f0), f1: Math.max(...f1), pads, anim: alleyAnim };
})();
window.__tt_alley = ALLEY;

// rolling timpani on the hill: roll downhill toward cars climbing it
const TIMP_TOP = HILL_C + 8, TIMP_BOT = HILL_C - HILL_W + 4;
const copper = new THREE.MeshStandardMaterial({ color: 0xb8653a, metalness: .8, roughness: .3 });
const timps = [0, 1].map(k => {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  if (ROLLERS[TRK.rollers]) { ROLLERS[TRK.rollers](THREE, canvasTex, inner); inner.rotation.z = Math.PI / 2; scene.add(g); return { g, inner, s: TIMP_TOP - k * 30, lat: k ? 5 : -5, wait: k * 1.5, x: 0, z: 0, y: 0 }; }
  if (TRK.rollers === 'barrel') { // v20: runaway water barrels (wood + iron hoops)
    const staves = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 2.6, 14), new THREE.MeshLambertMaterial({ map: canvasTex(64, 32, (c) => { for (let x = 0; x < 64; x += 8) { c.fillStyle = `hsl(28,45%,${30 + (x * 13) % 14}%)`; c.fillRect(x, 0, 7, 32); c.fillStyle = '#2a1608'; c.fillRect(x + 7, 0, 1, 32); } }) }));
    inner.add(staves); for (const y of [-.9, .9]) { const h = new THREE.Mesh(new THREE.TorusGeometry(1.5, .1, 6, 20), new THREE.MeshLambertMaterial({ color: 0x3a3a40 })); h.rotation.x = Math.PI / 2; h.position.y = y; inner.add(h); }
    for (const y of [-1.3, 1.3]) { const lid = new THREE.Mesh(new THREE.CircleGeometry(1.45, 14), new THREE.MeshLambertMaterial({ color: 0x8a5a30, side: THREE.DoubleSide })); lid.rotation.x = Math.PI / 2; lid.position.y = y; inner.add(lid); }
    inner.rotation.z = Math.PI / 2; scene.add(g);
    return { g, inner, s: TIMP_TOP - k * 30, lat: k ? 5 : -5, wait: k * 1.5, x: 0, z: 0, y: 0 };
  }
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
const HAS_METRO = TRK.metro != null, METRO_I = HAS_METRO ? TRK.metro : 0, METRO_PIV = 22, METRO_L = 20.5, METRO_MAX = .95, METRO_PERIOD = 2.4;
const metro = (() => {
  const i = METRO_I, p = P[i], g = new THREE.Group(); g.position.copy(p); g.rotation.y = Math.atan2(T[i].x, T[i].z); scene.add(g);
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a2d1a, roughness: .6 });
  for (const sd of [-1, 1]) { const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 3.2, METRO_PIV + 1, 4), wood); tower.rotation.y = Math.PI / 4; tower.position.set(sd * (W / 2 + 3.5), (METRO_PIV + 1) / 2, 0); g.add(tower);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6), new THREE.MeshBasicMaterial({ map: canvasTex(32, 128, (c) => { c.fillStyle = '#f2e3b0'; c.fillRect(0, 0, 32, 128); c.fillStyle = '#5a2d1a'; for (let y = 8; y < 128; y += 10) c.fillRect(6, y, 20, 2); }) })); face.position.set(sd * (W / 2 + 3.5), 6, -2.3); face.rotation.y = Math.PI; g.add(face); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 9, 1, 1.2), brassMat); beam.position.y = METRO_PIV + .3; g.add(beam);
  const arm = new THREE.Group(); arm.position.y = METRO_PIV; g.add(arm);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, METRO_L), silverMat); rod.position.y = -METRO_L / 2; arm.add(rod);
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.6, 2.2, 4), brassMat); weight.rotation.y = Math.PI / 4; weight.position.y = -METRO_L + 1.2; arm.add(weight);
  if (!HAS_METRO) g.visible = false;
  return { g, arm, ang: 0, lastSide: 0 };
})();
function metroBob() { if (!HAS_METRO) return { x: 1e6, z: 1e6, y: -100, lat: 0 }; const a = metro.ang, i = METRO_I; const lat = Math.sin(a) * (METRO_L - 1.2), y = METRO_PIV - Math.cos(a) * (METRO_L - 1.2);
  return { x: P[i].x + S[i].x * lat, z: P[i].z + S[i].z * lat, y, lat }; }

// ---------- race state ----------
const race = { state: 'menu', t: 0, countdown: 0, style: 0, band: .35, results: null, place: 5, musicOn: false, lastPlace: 5,
  stats: { drifts: 0, driftBoosts: [0, 0, 0], jumps: 0, tricks: 0, passes: 0, crashes: 0, dashes: 0, alley: 0, blasts: 0, aiMoves: 0, bumps: 0, metroHits: 0, timpHits: 0, warps: 0 } };
window.__tt = Object.assign(window.__tt || {}, { scene, race, player, cars, stands, timps, P, T, RL, errors: [] });
window.__tt.sim = (dt) => sim(dt);
Object.defineProperty(window.__tt, 'acState', { get: () => AC ? AC.state : 'none' });
function startRace() {
  if (!(AUTOSTART && navigator.userActivation && !navigator.userActivation.isActive)) initAudio(); // autostart (tests) has no gesture
  setLineup(playerType); gridUp(); stands.forEach(restoreStand); $('garage').style.display = 'none'; $('hud').style.display = '';
  for (const k in race.stats) race.stats[k] = Array.isArray(race.stats[k]) ? [0, 0, 0] : 0;
  Object.assign(race, { state: 'count', t: 0, countdown: 3.999, style: 0, band: .35, results: null, musicOn: true, lastPlace: 5, lapTimes: [], lapStart: 0 }); hideResults(); $('overlay').style.display = 'none';
  cars.forEach(c => { if (!c.isPlayer) c.useAlley = Math.random() < .35; }); player.useAlley = AUTOPILOT && Q.get('alley') !== '0';
  if (CUP) setTimeout(() => toast(`${CUP.def.icon} ${CUP.def.name} · race ${CUP.i + 1} of ${CUP.def.tracks.length}`), 400);
  race.fastMusic = false; if (MUSIC) { MUSIC.setTheme(MUSIC_ID); MUSIC.resync(AC.currentTime + .1); } $('overlay').style.display = 'none';
}

// ---------- touch detection (on-screen buttons + keyboard steering) ----------
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
const TOUCH_UI = Q.has('kbdui') ? false : IS_TOUCH || Q.has('touchui'); document.body.classList.add(TOUCH_UI ? 'touchui' : 'kbdui'); window.__tt.touchUI = TOUCH_UI;
function lockLandscape() { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (_) {} }
// rotate-device overlay: decided only by the browser's screen orientation , debounced; while racing it needs >1 s of real portrait
let portraitSince = 0;
function isPortrait() { if (window.__tt.portraitOverride != null) return window.__tt.portraitOverride; if (screen.orientation && screen.orientation.type) return screen.orientation.type.startsWith('portrait'); return window.matchMedia ? matchMedia('(orientation: portrait)').matches : innerHeight > innerWidth; }
setInterval(() => { const small = Math.min(screen.width || innerWidth, screen.height || innerHeight) <= 820 || IS_TOUCH; const p = small && isPortrait(); const now = performance.now();
  if (!p) { portraitSince = 0; $('rot').style.display = 'none'; return; } if (!portraitSince) portraitSince = now;
  const need = race.state === 'race' || race.state === 'count' ? 1000 : 250; $('rot').style.display = now - portraitSince > need ? 'flex' : 'none'; }, 150);
$('go').addEventListener('pointerup', e => { e.preventDefault(); lockLandscape(); if (race.state === 'menu') openGarage(); });
$('go').addEventListener('click', e => { lockLandscape(); if (race.state === 'menu') openGarage(); });
const band = d => { race.band = Math.max(0, Math.min(1, race.band + d)); };

// ---------- input ----------
const keys = {}; const touch = { l: 0, r: 0, brake: 0, dash: 0, gas: 0, drift: 0 }; window.__tt.touch = touch;
addEventListener('keydown', e => { keys[e.code] = 1; if (e.code === 'Space') { touch.dashPress = 1; e.preventDefault(); } if (race.state === 'done' && cupUp()) { if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') { e.preventDefault(); cupPrimary(); } else if (e.code === 'Escape' || e.code === 'KeyM') cupMenu(); return; }
  if (race.state === 'done' && resultsUp()) { if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); resAction('again'); } else if (e.code === 'KeyC') resAction('change'); else if (e.code === 'Escape' || e.code === 'KeyM') resAction('menu'); return; }
  if (race.state === 'menu' && (e.code === 'Enter')) openGarage();
  else if (race.state === 'tsel') { if (e.code === 'ArrowLeft' || e.code === 'KeyA') pickTrack(-1); else if (e.code === 'ArrowRight' || e.code === 'KeyD') pickTrack(1); else if (e.code === 'ArrowUp' || e.code === 'KeyW') pickCup(-1); else if (e.code === 'ArrowDown' || e.code === 'KeyS') pickCup(1);
    else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); raceFromTrackSelect(); } else if (e.code === 'KeyC') startCup(FLAT[tIdx].ci); else if (e.code === 'Escape') { $('tsel').style.display = 'none'; openGarage(); } }
  else if (race.state === 'garage') { if (e.code === 'ArrowLeft' || e.code === 'KeyA') pickGarage(-1); else if (e.code === 'ArrowRight' || e.code === 'KeyD') pickGarage(1); else if (e.code === 'Enter' || e.code === 'Space') raceFromGarage(); else if (e.code === 'Escape') { race.state = 'menu'; $('garage').style.display = 'none'; $('overlay').style.display = 'flex'; } } });
addEventListener('keyup', e => { keys[e.code] = 0; });
function holdBtn(id, k) { const el = $(id), ids = new Set();
  const upd = () => { touch[k] = ids.size ? 1 : 0; el.classList.toggle('on', ids.size > 0); };
  el.addEventListener('pointerdown', e => { e.preventDefault(); ids.add(e.pointerId); try { el.setPointerCapture(e.pointerId); } catch (_) {} if (k === 'dash') touch.dashPress = 1; initAudio(); upd(); });
  const off = e => { ids.delete(e.pointerId); upd(); };
  el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
  el.addEventListener('contextmenu', e => e.preventDefault()); }
holdBtn('bl', 'l'); holdBtn('br', 'r'); holdBtn('bbrake', 'brake'); holdBtn('bdash', 'dash'); holdBtn('bgas', 'gas'); holdBtn('bdrift', 'drift');
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; });

// ---------- car select (garage): 3D turntable preview + stats ----------
const garageScene = new THREE.Scene(); garageScene.background = new THREE.Color(0x1c0b3a); garageScene.fog = new THREE.Fog(0x1c0b3a, 18, 45);
garageScene.add(new THREE.HemisphereLight(0xffe6c8, 0x3a2050, 1.4));
{ const k = new THREE.DirectionalLight(0xfff0d8, 2.2); k.position.set(5, 9, 7); garageScene.add(k); const r = new THREE.DirectionalLight(0xff60c0, 1.2); r.position.set(-6, 3, -6); garageScene.add(r); }
{ const fl = new THREE.Mesh(new THREE.CircleGeometry(30, 40), new THREE.MeshLambertMaterial({ color: 0x2a1450 })); fl.rotation.x = -Math.PI / 2; garageScene.add(fl);
  const tt = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, .2, 40), new THREE.MeshStandardMaterial({ color: 0x3a2a5a, metalness: .6, roughness: .35 })); tt.position.y = .1; garageScene.add(tt);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, .06, 6, 48), new THREE.MeshBasicMaterial({ color: 0xff4fb0 })); ring.rotation.x = Math.PI / 2; ring.position.y = .2; garageScene.add(ring);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .45, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(1.7, 3, 1); sh.position.y = .21; garageScene.add(sh); }
const gCam = new THREE.PerspectiveCamera(38, 1, .1, 200);
let gIdx = 0, gAng = -.6, gMesh = null, gT = 0;
const STAT_LABEL = { top: 'SPEED', accel: 'ACCEL', turn: 'HANDLING', tough: 'TOUGH' };
function showGarageCar() {
  if (gMesh && gMesh.parent === garageScene) gMesh.visible = false;
  const t = ROSTER[gIdx], c = CARS[t]; gMesh = meshFor(t); garageScene.add(gMesh); gMesh.visible = true; gMesh.position.set(0, .2, 0); gMesh.rotation.set(0, gAng, 0);
  $('gname').textContent = c.name; $('gfam').textContent = c.fam + ' · driver: ' + DRIVERS[t] + ' · special: ' + c.move;
  $('gstats').innerHTML = Object.keys(STAT_LABEL).map(k => `<div class="gs"><span>${STAT_LABEL[k]}</span><div class="gb"><i style="width:${Math.round(statPct(t, k) * 100)}%"></i></div></div>`).join('');
  $('gtag').innerHTML = `<span class="pro">▲ ${c.pro}</span><span class="con">▼ ${c.con}</span>`;
  $('gdots').innerHTML = ROSTER.map((_, i) => `<b class="${i === gIdx ? 'on' : ''}"></b>`).join('');
}
function openGarage() {
  if (race.state === 'count' || race.state === 'race') return;
  race.state = 'garage'; race.musicOn = true; initAudio(); $('overlay').style.display = 'none'; $('hud').style.display = 'none'; $('garage').style.display = 'block';
  gIdx = Math.max(0, ROSTER.indexOf(playerType)); showGarageCar();
}
function pickGarage(d) { if (race.state !== 'garage') return; gIdx = (gIdx + d + ROSTER.length) % ROSTER.length; showGarageCar(); sfx(d > 0 ? 659 : 587, .12, .12); }
function raceFromGarage() { if (race.state !== 'garage') return; $('garage').style.display = 'none'; playerType = ROSTER[gIdx]; openTrackSelect(); }
// ---------- v20: track / cup select ----------
const FLAT = CUPS.flatMap((c, ci) => c.tracks.map(([id, name], k) => ({ id, name, ci, k, cup: c, built: !!TRACKS[id] })));
let tIdx = Math.max(0, FLAT.findIndex(t => t.id === TRACK_ID));
function trackArt(cv, t) { const dpr = Math.min(2, devicePixelRatio || 1), g = cv.getContext('2d'), w = cv.width = Math.max(120, cv.clientWidth * dpr | 0), h = cv.height = Math.max(80, cv.clientHeight * dpr | 0), th = THEME[t.id] || ['#888', '#222', ''];
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, th[1]); gr.addColorStop(1, th[0]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,.25)'; const u = h / 150; for (let x = 0; x < w; x += 22 * u) { const bh = (14 + (((x / u | 0) * 37) % 40)) * u; g.fillRect(x, h - bh, 18 * u, bh); }
  if (t.built) { const c = TRACKS[t.id].ctrl, cr = new THREE.CatmullRomCurve3(c.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal').getSpacedPoints(160);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of cr) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
    const sc = Math.min((w - 40 * u) / (x1 - x0), (h - 30 * u) / (z1 - z0)), ox = (w - (x1 - x0) * sc) / 2, oz = (h - (z1 - z0) * sc) / 2;
    const path = () => { g.beginPath(); cr.forEach((p, i) => { const X = ox + (p.x - x0) * sc, Y = oz + (p.z - z0) * sc; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); };
    path(); g.strokeStyle = '#0008'; g.lineWidth = 10 * u; g.stroke(); path(); g.strokeStyle = '#fff'; g.lineWidth = 5 * u; g.stroke(); path(); g.strokeStyle = '#ffd34d'; g.lineWidth = 2 * u; g.setLineDash([6 * u, 6 * u]); g.stroke(); g.setLineDash([]);
    const s0 = cr[0]; g.fillStyle = '#e33'; g.beginPath(); g.arc(ox + (s0.x - x0) * sc, oz + (s0.z - z0) * sc, 6 * u, 0, 7); g.fill(); }
  else { g.fillStyle = '#fff9'; g.font = `bold ${54 * u | 0}px Arial Black, Impact`; g.textAlign = 'center'; g.fillText('?', w / 2, h / 2 + 20 * u); } }
function buildTrackSelect() { const cups = $('tcups'); if (cups.childElementCount) return;
  CUPS.forEach((c, ci) => { const b = document.createElement('button'); b.className = 'tcup'; b.style.setProperty('--c', c.color); b.textContent = c.icon + ' ' + c.name;
    b.addEventListener('click', () => { if (ghostClick()) return; if (FLAT[tIdx].ci !== ci) { const f = FLAT.findIndex(t => t.ci === ci && t.built); tIdx = f >= 0 ? f : ci * 3; } renderTrackSelect(); sfx(587, .1, .1); }); cups.appendChild(b); }); }
function renderTrackSelect() { const cur = FLAT[tIdx]; [...$('tcups').children].forEach((b, i) => b.classList.toggle('on', i === cur.ci));
  const box = $('tcards'); box.innerHTML = '';
  FLAT.filter(t => t.ci === cur.ci).forEach(t => { const d = document.createElement('div'); d.className = 'tcard' + (t === cur ? ' on' : '') + (t.built ? '' : ' locked'); d.dataset.track = t.id;
    const cv = document.createElement('canvas'); d.appendChild(cv);
    d.insertAdjacentHTML('beforeend', `<div><div class="tn">${t.name}</div><div class="tb">${t.built ? (THEME[t.id] || [])[2] : 'Under construction'}</div></div><div class="tnum">${t.cup.name.split(' ')[0].toUpperCase()} ${t.k + 1}</div>` + (t.built ? '' : '<div class="tlock">🔒 COMING SOON</div>'));
    d.addEventListener('click', () => { if (ghostClick()) return; if (FLAT[tIdx] === t && t.built) return raceFromTrackSelect(); tIdx = FLAT.indexOf(t); renderTrackSelect(); sfx(t.built ? 659 : 330, .1, .1); }); box.appendChild(d); });
  box.querySelectorAll('.tcard').forEach(d => trackArt(d.querySelector('canvas'), FLAT.find(t => t.id === d.dataset.track)));
  const b = $('trace'); b.disabled = !cur.built; b.textContent = cur.built ? 'SINGLE RACE' : 'COMING SOON';
  const cb = $('tcupgo'), ok = cupReady(cur.ci); cb.disabled = !ok; cb.innerHTML = ok ? `🏆 ${cur.cup.name.toUpperCase()}<small>3 races · points</small>` : `🏆 CUP<small>coming soon</small>`; cb.style.setProperty('--c', cur.cup.color); }
let tselT = 0; const ghostClick = () => performance.now() - tselT < 450; // swallow the click that follows the garage RACE! tap
function openTrackSelect() { race.state = 'tsel'; tselT = performance.now(); buildTrackSelect(); $('hud').style.display = 'none'; $('tsel').style.display = 'flex'; renderTrackSelect(); }
function pickTrack(d) { if (race.state !== 'tsel') return; tIdx = (tIdx + d + FLAT.length) % FLAT.length; renderTrackSelect(); sfx(d > 0 ? 659 : 587, .1, .1); }
function pickCup(d) { if (race.state !== 'tsel') return; const ci = (FLAT[tIdx].ci + d + CUPS.length) % CUPS.length; tIdx = ci * 3 + FLAT[tIdx].k; renderTrackSelect(); sfx(523, .1, .1); }
function raceFromTrackSelect() { if (race.state !== 'tsel') return; const t = FLAT[tIdx]; if (!t.built) { sfx(220, .2, .12); return; }
  if (t.id === TRACK_ID) { $('tsel').style.display = 'none'; $('hud').style.display = ''; startRace(); return; }
  const q = new URLSearchParams(location.search); q.set('track', t.id); q.set('car', playerType); q.set('autostart', ''); $('trace').textContent = 'LOADING…'; race.state = 'loading';
  location.search = q.toString().replace(/=(&|$)/g, '$1'); }
$('trace').addEventListener('click', () => { if (!ghostClick()) raceFromTrackSelect(); });
$('tcupgo').addEventListener('click', () => { if (!ghostClick()) startCup(FLAT[tIdx].ci); });
function cupReady(ci) { return CUPS[ci].tracks.every(([id]) => TRACKS[id]); }
function cupGo(c) { const q = new URLSearchParams(location.search); q.set('track', c.def.tracks[c.i][0]); q.set('car', c.car); q.set('cup', c.id); q.set('autostart', ''); race.state = 'loading';
  const save = { ...c }; delete save.def; cupSave(save); location.search = q.toString().replace(/=(&|$)/g, '$1'); }
function startCup(ci) { if (race.state !== 'tsel' && race.state !== 'done') return; if (!cupReady(ci)) { sfx(220, .2, .12); return; } const def = CUPS[ci];
  const ai = ROSTER.filter(t => t !== playerType).sort(() => Math.random() - .5).slice(0, 4), pts = {}; [playerType, ...ai].forEach(t => pts[t] = 0);
  $('tcupgo').textContent = 'LOADING…'; cupGo({ id: def.id, i: 0, car: playerType, ai, pts, hist: [], def }); }
function cupAward(order, place) { if (CUP.awarded === CUP.i) return; CUP.last = {}; order.forEach((c, k) => { CUP.pts[c.type] = (CUP.pts[c.type] || 0) + CUP_POINTS[k]; CUP.last[c.type] = CUP_POINTS[k]; });
  CUP.hist.push({ track: TRACK_ID, place, order: order.map(c => c.type) }); CUP.awarded = CUP.i; const save = { ...CUP }; delete save.def; cupSave(save); }
const cupName = t => t === CUP.car ? 'You' : DRIVERS[t], cupRank = () => Object.keys(CUP.pts).sort((a, b) => CUP.pts[b] - CUP.pts[a] || (CUP.last[b] || 0) - (CUP.last[a] || 0));
let cupT = 0; // one tap fires pointerup + click: ignore the second, and any tap right after a screen change
function cupUp() { return $('cupst').style.display === 'flex' && race.state === 'done' && performance.now() - cupT > 400; }
function cupTable(rank, showLast) { return '<table>' + rank.map((t, k) => `<tr class="${t === CUP.car ? 'me' : ''}"><td class="rk">${k + 1}</td><td class="nm">${cupName(t)}<small>${CARS[t].name}</small></td>${showLast ? `<td class="pl">+${CUP.last[t] || 0}</td>` : ''}<td class="pt">${CUP.pts[t]}<small>PTS</small></td></tr>`).join('') + '</table>'; }
function showCupStandings() { if (race.state !== 'done') return; $('finishfx').style.display = 'none'; $('hud').style.display = 'none';
  const el = $('cupst'), place = race.results.place, gained = CUP_POINTS[place - 1], last = CUP.i >= CUP.def.tracks.length - 1; el.className = 'stand';
  $('ctitle').textContent = `${CUP.def.icon} ${CUP.def.name.toUpperCase()} · RACE ${CUP.i + 1} OF ${CUP.def.tracks.length}`;
  $('csub').innerHTML = `${place === 1 ? 'You won' : 'You finished ' + ORD(place)} at <b>${TRK.name}</b>! <span class="gain">+${gained} points</span>`;
  $('ctrophy').style.display = 'none'; $('ctable').innerHTML = cupTable(cupRank(), true);
  $('cnext').textContent = last ? 'TROPHY CEREMONY 🏆' : `NEXT RACE ➜ ${CUP.def.tracks[CUP.i + 1][1]}`; $('cmenu').textContent = 'MENU'; $('cextra').style.display = 'none';
  el.style.display = 'flex'; cupT = performance.now(); resultJingle(Math.min(place, 4)); window.__tt.cupShown = (window.__tt.cupShown || 0) + 1; setTimeout(() => { try { $('cnext').focus({ preventScroll: true }); } catch (_) {} }, 50); }
function showCupTrophy() { const el = $('cupst'), rank = cupRank(), R = rank.indexOf(CUP.car) + 1; el.className = 'trophy p' + Math.min(R, 4);
  $('ctitle').textContent = R === 1 ? 'YOU WON THE CUP!' : `${ORD(R)} PLACE IN THE CUP!`;
  $('csub').innerHTML = R === 1 ? `${CUP.def.icon} ${CUP.def.name} champion! The whole band is cheering for you!` : R <= 3 ? `On the ${CUP.def.name} podium with ${CUP.pts[CUP.car]} points. Great driving all the way!` : `${CUP.pts[CUP.car]} points across three great races. The band loved every lap!`;
  drawTrophy($('ctrophy'), R, CUP.def); $('ctrophy').style.display = ''; $('ctable').innerHTML = cupTable(rank, false);
  $('cnext').textContent = 'NEW CUP 🏆'; $('cextra').style.display = ''; $('cmenu').textContent = 'MENU';
  cupT = performance.now(); CUP.fin = true; const save = { ...CUP }; delete save.def; cupSave(save); cupFanfare(R); if (R <= 3) startConfetti('cconf'); window.__tt.trophyShown = (window.__tt.trophyShown || 0) + 1; }
function cupPrimary() { if (!cupUp()) return; cupT = performance.now(); sfx(660, .1, .12); if ($('cupst').className === 'stand') { if (CUP.i >= CUP.def.tracks.length - 1) showCupTrophy(); else { CUP.i++; cupGo(CUP); } }
  else { const ci = CUPS.indexOf(CUP.def); race.state = 'tsel'; startCup(ci); } }
function cupMenu() { if (!cupUp()) return; cupSave(null); CUP = null; $('cupst').style.display = 'none'; confettiOn = false; race.state = 'menu'; race.results = null; $('hud').style.display = ''; $('overlay').style.display = 'flex'; }
function cupTrackSelect() { if (!cupUp()) return; cupSave(null); CUP = null; $('cupst').style.display = 'none'; confettiOn = false; race.results = null; openTrackSelect(); }
for (const [id, f] of [['cnext', () => cupPrimary()], ['cmenu', () => cupMenu()], ['cextra', () => cupTrackSelect()]]) { const b = $(id); b.addEventListener('pointerup', e => { e.preventDefault(); f(); }); b.addEventListener('click', f); }
function drawTrophy(cv, R, def) { const dpr = Math.min(2, devicePixelRatio || 1), w = cv.width = 220 * dpr, h = cv.height = 220 * dpr, g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, 220, 220);
  const met = [null, ['#fff6b0', '#ffc83a', '#a06a08'], ['#ffffff', '#c8d0dc', '#6a7686'], ['#ffe0c0', '#d08a48', '#7a4a1a'], ['#e8d8ff', '#a070e0', '#4a2a8a']][Math.min(R, 4)];
  const gr = g.createLinearGradient(50, 0, 170, 0); gr.addColorStop(0, met[0]); gr.addColorStop(.45, met[1]); gr.addColorStop(1, met[2]);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(110, 95, 92, 0, 7); g.fill();
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.strokeStyle = 'rgba(255,240,180,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(110 + Math.cos(a) * 70, 95 + Math.sin(a) * 70); g.lineTo(110 + Math.cos(a) * 100, 95 + Math.sin(a) * 100); g.stroke(); }
  g.lineWidth = 3; g.strokeStyle = '#3a2000';
  if (R <= 3) { // cup with handles shaped like trumpet bells, on a two-step base
    g.lineWidth = 9; g.strokeStyle = met[1]; g.beginPath(); g.arc(58, 62, 20, Math.PI * .5, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(162, 62, 20, -Math.PI * .5, Math.PI * .5); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#3a2000';
    g.fillStyle = gr; g.beginPath(); g.moveTo(52, 30); g.lineTo(168, 30); g.bezierCurveTo(168, 98, 140, 122, 110, 124); g.bezierCurveTo(80, 122, 52, 98, 52, 30); g.closePath(); g.fill(); g.stroke();
    g.fillRect(100, 124, 20, 26); g.strokeRect(100, 124, 20, 26); g.beginPath(); g.ellipse(110, 30, 58, 8, 0, 0, 7); g.fillStyle = met[0]; g.fill(); g.stroke();
    g.fillStyle = '#5a2a8a'; g.fillRect(70, 150, 80, 16); g.strokeRect(70, 150, 80, 16); g.fillStyle = '#3a1a6a'; g.fillRect(58, 166, 104, 22); g.strokeRect(58, 166, 104, 22);
    g.fillStyle = '#ffd34d'; g.font = 'bold 13px Arial Black, Impact'; g.textAlign = 'center'; g.fillText(def.name.toUpperCase(), 110, 182);
    g.fillStyle = '#fff'; g.font = 'bold 40px Arial Black, Impact'; g.fillText(['', '1', '2', '3'][R], 110, 88); g.font = '22px serif'; g.fillText('♪', 80, 64); g.fillText('♫', 140, 64); }
  else { // band ribbon rosette for 4th / 5th
    g.fillStyle = '#7a3fc4'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(110, 110); g.lineTo(110 + sx * 34, 200); g.lineTo(110 + sx * 16, 188); g.lineTo(110 + sx * 4, 204); g.closePath(); g.fill(); g.stroke(); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.fillStyle = k % 2 ? met[1] : met[0]; g.beginPath(); g.ellipse(110 + Math.cos(a) * 40, 90 + Math.sin(a) * 40, 18, 11, a, 0, 7); g.fill(); }
    g.fillStyle = gr; g.beginPath(); g.arc(110, 90, 38, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 34px Arial Black, Impact'; g.textAlign = 'center'; g.fillText(ORD(R), 110, 102); g.font = 'bold 11px Arial Black'; g.fillText('BAND STAR', 110, 120); } }
function cupFanfare(R) { if (!AC) return; const t = AC.currentTime + .05, s = .14; const notes = R === 1 ? [[60, 0, .12], [60, 1, .12], [60, 2, .12], [64, 3, .3], [62, 5, .12], [64, 6, .12], [67, 7, .9], [72, 7, .9], [76, 7, .9]] : [[67, 0, .14], [72, 1, .14], [76, 2, .14], [79, 3, .6], [72, 3, .6]];
  notes.forEach(([m, k, d]) => brass(mf(m), t + k * s, d, .15, master, 5000)); for (let k = 0; k < 12; k++) drum(t + 1 + k * .06, 'snare'); }
window.__tt.cup = { get state() { return CUP; }, start: startCup, next: cupPrimary, menu: cupMenu, up: cupUp, trophy: () => showCupTrophy() };
$('tback').addEventListener('click', () => { if (race.state !== 'tsel') return; $('tsel').style.display = 'none'; openGarage(); });
window.__tt.tsel = { open: openTrackSelect, pick: pickTrack, cup: pickCup, race: raceFromTrackSelect, get idx() { return tIdx; }, get cur() { return FLAT[tIdx]; }, FLAT };
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, function unlock() { initAudio(); removeEventListener(ev, unlock); }, { once: false }));
{ const mt = $('mtrack'); if (mt) mt.textContent = TRK.name; }
function renderGarage(dt) {
  gT += dt; if (window.__tt.gzoom) gAng = 0; else gAng += dt * .55; if (gMesh) { gMesh.rotation.y = gAng; const U = gMesh.userData.anim, fake = { v: 7, steer: Math.sin(gT * .8) * .6, dash: 0, boost: 0 };
    for (const w of U.wheels) w.rotation.x += 7 * dt / U.r * (w.userData.k || 1); for (const f of U.front) f.rotation.y = fake.steer * .4; if (U.tick) U.tick(fake, dt, 0, gT); for (const gl of U.glows) gl.material.opacity = .35 + Math.sin(gT * 3) * .1; }
  const [w, h] = vpSize(), asp = w / h, half = Math.tan(19 * Math.PI / 180);
  const wide = asp > 1.15, d = wide ? 11 * Math.max(1, 1.9 / asp) : Math.max(11, 3.8 / (half * asp));
  gCam.aspect = asp; gCam.updateProjectionMatrix(); gCam.position.set(0, d * .36, d);
  const off = wide ? d * half * asp * .3 : 0; gCam.lookAt(off, wide ? .7 : -d * .12, 0);
  { const z = window.__tt.gzoom; if (z) { gCam.position.set(...z[0]); gCam.lookAt(...z[1]); } } // screenshot hook
  renderer.render(garageScene, gCam);
}
$('gprev').addEventListener('pointerup', e => { e.preventDefault(); e.stopPropagation(); pickGarage(-1); });
$('gnext').addEventListener('pointerup', e => { e.preventDefault(); e.stopPropagation(); pickGarage(1); });
$('grace').addEventListener('pointerup', e => { e.preventDefault(); e.stopPropagation(); raceFromGarage(); });
$('grace').addEventListener('click', () => raceFromGarage());
{ let sx = null, sy = 0; const gEl = $('garage');
  gEl.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; });
  gEl.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) pickGarage(dx < 0 ? 1 : -1); }); }
window.__tt.lineup = () => { // screenshot hook: all 8 cars side by side on the start straight
  window.__tt.freeze = true; const i = 20, p = P[i], s = S[i], t = T[i], h = Math.atan2(t.x, t.z);
  ROSTER.forEach((ty, k) => { const m = meshFor(ty); scene.add(m); m.visible = true; const l = (k - 3.5) * 3.3, back = (k % 2) * 1.5;
    m.position.set(p.x + s.x * l - t.x * back, E[i], p.z + s.z * l - t.z * back); m.rotation.set(0, h + Math.PI, 0); m.userData.shadow.visible = false; });
  window.__tt.camFixed = [[p.x - t.x * 13 + s.x * 3, E[i] + 4.2, p.z - t.z * 13 + s.z * 3], [p.x - t.x * 0 + s.x * .5, E[i] + .6, p.z]]; };
window.__tt.aiSteer = () => aiControl(player, 1 / 60).steer; window.__tt.renderer = renderer; window.__tt.CARS = CARS;
window.__tt.garage = { open: openGarage, pick: pickGarage, race: raceFromGarage, get idx() { return gIdx; } };
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
  if (!NOWARP) for (const w of WARPS) { const d = (w.i - c.idx + N) % N; if (d < 30 && d > 0) lane = Math.max(-WARP_HW + 3.5, Math.min(WARP_HW - 3.5, lane)); } // line up on warp ramps
  lane = Math.max(-W / 2 + 1.4, Math.min(W / 2 - 1.4, lane));
  let [tx, tz] = trackPt(c.idx + look, lane);
  // shortcut alley
  if (c.useAlley || c.alley) { const au = alleyUV(c.x, c.z), d = (c.idx - ALLEY_A + N) % N; // merge onto the alley line, then follow it
    if (c.alley || ((d < 40 || d > N - 30) && au.t > -.35 && au.t < ALLEY.t0 && Math.abs(au.u) < 30)) { const tt = Math.min(1.08, Math.max(.04, au.t + .16)); tx = ALLEY.a.x + ALLEY.dir.x * ALLEY.L * tt; tz = ALLEY.a.z + ALLEY.dir.z * ALLEY.L * tt; } }
  out.steer = steerTo(c, tx, tz);
  if (c.isPlayer) { // autopilot also drifts the sharp corners and does tricks (test driver)
    const curv = Math.abs(RL[(c.idx + 6) % N]) / (W / 2 - 2.2);
    c.aDriftCD = (c.aDriftCD || 0) - dt;
    if (Q.has('nodrift')) out.drift = 0; else { out.drift = (c.drift ? (curv > .4 || c.driftT < .9) && Math.abs(c.lat) < W / 2 - 1 : curv > .7 && c.aDriftCD <= 0) && c.v > c.top * .55 && !c.alley && !(c.useAlley && (c.idx - ALLEY_A + N) % N < 40 + ALLEY_B - ALLEY_A || c.useAlley && (ALLEY_A - c.idx + N) % N < 45) ? 1 : 0; if (c.drift && !out.drift) c.aDriftCD = 1.5; }
    out.trick = c.air && c.trick < 0 ? 1 : 0;
  }
  return out;
}
function aiMoves(c, dt) {
  c.moveCD -= dt; if (c.moveCD > 0 || race.state !== 'race' || c.finished) return;
  const near = cars.filter(o => o !== c && Math.hypot(o.x - c.x, o.z - c.z) < 11);
  const fwdCars = cars.filter(o => o !== c && (() => { const dx = o.x - c.x, dz = o.z - c.z, f = dx * Math.sin(c.h) + dz * Math.cos(c.h), s = Math.abs(-dx * Math.cos(c.h) + dz * Math.sin(c.h)); return f > 2 && f < 18 && s < 4; })());
  let used = false;
  if (c.kind === 'blast' && near.length) { // Bass Blast: shockwave pushes everyone nearby
    ring(c.x, c.y + E[c.idx], c.z, 0x4aa3ff, 10); used = true; race.stats.blasts++;
    for (const o of near) { const dx = o.x - c.x, dz = o.z - c.z, d = Math.max(1, Math.hypot(dx, dz)), f = 16 * (1 - o.tough * .6); o.px += dx / d * f; o.pz += dz / d * f; o.v *= .88 + .1 * o.tough; if (o.isPlayer) { o.hitT = 0; band(-.08); } }
    if (nearPlayer(c, 40)) { toast(c.driver + ': ' + c.move + '!'); if (AC) brass(55, AC.currentTime, .6, .3, master, 600); }
  } else if (c.kind === 'boost' && (fwdCars.length || Math.random() < .3)) { c.boost = 1.3; used = true; ring(c.x, c.y + E[c.idx], c.z, 0xffffff, 3); if (nearPlayer(c, 40)) { toast(c.driver + ': ' + c.move + '!'); if (AC) for (let k = 0; k < 8; k++) brass(k % 2 ? 1760 : 1568, AC.currentTime + k * .05, .06, .05, master, 6000); } }
  else if (c.kind === 'grip' && Math.abs(RL[(c.idx + 10) % N]) > 3) { c.grip = 2; c.boost = Math.max(c.boost, .8); used = true; if (nearPlayer(c, 40)) { toast(c.driver + ': ' + c.move + '!'); if (AC) for (let k = 0; k < 10; k++) drum(AC.currentTime + k * .04, 'snare'); } }
  else if (c.kind === 'horn' && fwdCars.length) { // Horn Call: clears the lane ahead
    used = true; ring(c.x + Math.sin(c.h) * 6, c.y + E[c.idx], c.z + Math.cos(c.h) * 6, 0xc070ff, 6);
    for (const o of fwdCars) { const sideR = -(o.x - c.x) * Math.cos(c.h) + (o.z - c.z) * Math.sin(c.h), sx = -Math.cos(c.h), sz = Math.sin(c.h), f = (sideR >= 0 ? 1 : -1) * 12 * (1 - o.tough * .6); o.px += sx * f; o.pz += sz * f; o.v *= .92; if (o.isPlayer) { o.hitT = 0; band(-.05); } }
    if (nearPlayer(c, 40)) { toast(c.driver + ': ' + c.move + '!'); if (AC) brass(174.6, AC.currentTime, .7, .22, master, 1500); }
  }
  if (used) { c.moveCD = rand(9, 15); race.stats.aiMoves++; } else c.moveCD = .5;
}

function stepCar(c, dt) {
  if (SOLO && !c.isPlayer) { c.x = c.z = 1e5; return; } // test-only time trial (?solo)
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
    if (TOUCH_UI && racing) { if (c.air && c.trick < 0) trickIn = 1; else if (!c.air && c.meter >= 1) tryDash(c); } // touch: flips + special fire automatically
  } else {
    const o = aiControl(c, dt); steer = o.steer; driftIn = o.drift; trickIn = o.trick;
    if (c.isPlayer && c.meter >= 1 && racing && !c.air) tryDash(c);
    if (!c.isPlayer) aiMoves(c, dt);
  }
  if (!racing) { if (!c.finished || race.state !== 'done' && race.state !== 'race') steer = 0; else steer = Math.max(-.6, Math.min(.6, steer)); driftIn = 0; trickIn = 0; if (!c.finished) gas = 0; else gas = .3; } // v20: finished cars keep following the road (no rolling off into storefronts)
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
  const au = alleyUV(c.x, c.z), apron = Math.abs(au.u) < ALLEY_HW + 1.5 && au.t > -.02 && au.t < 1.02; // alley mouths count as road
  const off = !c.alley && !apron && Math.abs(c.lat) > W / 2 + .5;
  let top = c.top * (c.isPlayer ? 1 : c.aiSkill * rubber(c));
  if (off && c.dash <= 0) top *= .55;
  if (c.alley) top *= ALLEY_TOP; // turbo lane (per-track tuned so shortcuts save ~2-4 s/lap)
  if (c.warpT > 0) top *= 1.4; // warp boost after a warp-ramp landing
  if (c.boost > 0) top *= 1.28;
  if (c.dash > 0) top *= 1.42;
  if (c.finished) top *= .5;
  if (!c.air) {
    if (c.drift) c.v -= (c.v > top ? (c.v - top) * 1.5 : 0) * dt + c.v * .05 * dt; // drifting: brake doesn't slow much
    else if (brake) c.v -= 45 * dt;
    else if (gas === 0 && c.isPlayer) c.v -= (6 + c.v * .12) * dt;
    else if (c.v < top) c.v += c.accel * gas * dt * (c.boost > 0 || c.dash > 0 || c.warpT > 0 ? 2.2 : 1) * (1 - .4 * c.v / top);
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
  c.boost -= dt; c.dash -= dt; if (c.warpT > 0) c.warpT -= dt; c.hitT += dt; c.grip -= dt; c.wallT += dt;

  // --- track position / alley ---
  const prev = c.idx;
  Object.assign(au, alleyUV(c.x, c.z));
  const inAlleyZone = au.t > ALLEY.t0 - .01 && au.t < ALLEY.t1 + .01 && Math.abs(au.u) < ALLEY_HW + .4;
  if (!c.alley && inAlleyZone && au.t < ALLEY.t0 + .1) { c.alley = true; }
  if (c.alley) {
    if (au.t > ALLEY.t1 + .01 || au.t < ALLEY.t0 - .02) { c.alley = false; if (au.t > ALLEY.t1) { c.idx = ALLEY_B - 6; c.idx = nearestIdx(c); if (c.isPlayer) { race.stats.alley++; band(.1); race.style += 80; toast('shortcut!'); } } }
    else {
      c.idx = Math.round(ALLEY_A + (ALLEY_B - ALLEY_A) * Math.max(0, Math.min(1, au.t)));
      for (const pd of ALLEY.pads) if (Math.abs(au.t - pd.t) * ALLEY.L < 3.5 && !c.air) { if (c.boost < 1.1 && c.isPlayer) { sfx(988, .15, .15); } c.boost = Math.max(c.boost, 2.2); c.v = Math.max(c.v, c.top * ALLEY_PADV); }
      if (Math.abs(au.u) > ALLEY_HW - .9) { const push = au.u - Math.sign(au.u) * (ALLEY_HW - .9); c.x -= ALLEY.side.x * push; c.z -= ALLEY.side.z * push; c.v *= 1 - (1 - c.tough) * .06; c.h += angDiff(Math.atan2(ALLEY.dir.x, ALLEY.dir.z), c.h) * .2; c.vh = c.h; if (c.isPlayer) wallHit(c); }
      c.lat = 0;
    }
  }
  if (!c.alley) {
    c.idx = nearestIdx(c);
    c.lat = (c.x - P[c.idx].x) * S[c.idx].x + (c.z - P[c.idx].z) * S[c.idx].z;
    const LIM = W / 2 + 6.5;
    if (Math.abs(c.lat) > LIM && !inAlleyZone && !(Math.abs(au.u) < ALLEY_HW + 1.5 && au.t > -.02 && au.t < 1.02)) { const push = c.lat - Math.sign(c.lat) * LIM; c.x -= S[c.idx].x * push; c.z -= S[c.idx].z * push; c.v *= 1 - (1 - c.tough) * .08; c.h += angDiff(Math.atan2(T[c.idx].x, T[c.idx].z), c.h) * .15; c.vh = c.h; if (c.drift) { c.drift = 0; c.tier = 0; c.driftLock = true; } if (c.isPlayer) wallHit(c); }
  }
  if (prev > N * .85 && c.idx < N * .15) { if (c.maxIdx > N * .5) { c.lap++; c.maxIdx = c.idx; onLap(c); } }
  else if (!(prev < N * .15 && c.idx > N * .85)) c.maxIdx = Math.max(c.maxIdx, c.idx);

  // --- vertical: ramp, pads, air, landing ---
  if (!c.air) {
    const onR = !c.alley && c.idx >= RAMP_I && c.idx < RAMP_I + RAMP_LEN && Math.abs(c.lat) < W / 2;
    const wr = onR ? null : warpAt(c);
    if (onR) { c.y = RAMP_H * (c.idx - RAMP_I + .5) / RAMP_LEN; c.onRamp = true; c.onWarp = null; }
    else if (wr) { c.y = WARP_H * (((c.idx - wr.i + N) % N) + .5) / wr.len; c.onRamp = true; c.onWarp = wr; }
    else if (c.onRamp && c.onWarp) { const w = c.onWarp, d = (c.idx - w.i + N) % N; c.onRamp = false; c.onWarp = null;
      if (d >= w.len && d < w.len + 5 && c.v > 8) { launch(c, 7 + c.v * .06); c.warp = true; c.warpV0 = c.v; window.__tt.warpHits = window.__tt.warpHits || { player: 0, ai: 0 }; window.__tt.warpHits[c.isPlayer ? 'player' : 'ai']++; if (c.isPlayer) { race.stats.warps++; if (AC) for (let k = 0; k < 4; k++) brass(mf(67 + k * 4), AC.currentTime + k * .04, .12, .1); } } else c.y = 0; }
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
  if (c.warp) { c.warp = false; c.warpT = 2.6; c.v = Math.max(c.v + 10, c.top * 1.45); ring(c.x, E[c.idx], c.z, 0xff4fd8, 6);
    if (c.isPlayer) { toast('WARP BOOST!'); race.style += 60; band(.08); if (AC) for (let k = 0; k < 5; k++) brass(mf(72 + [0, 4, 7, 12, 16][k]), AC.currentTime + k * .05, .15, .12, master, 5000); } }
  if (c.isPlayer) {
    if (c.trick >= 0) { race.stats.tricks++; race.style += 150; band(.2); c.meter = Math.min(1, c.meter + .35); c.boost = Math.max(c.boost, .9); toast('flip trick!'); sfx(880, .3, .2); }
    else { race.style += 40; band(.08); }
    if (AC) drum(AC.currentTime, 'kick');
  } else if (Math.random() < .5) c.boost = Math.max(c.boost, .5);
  c.trick = -1;
}
function wallHit(c) { if (c.wallT > 1) { band(-.05); } c.wallT = 0; c.hitT = 0; }
function crash(c, msg, bandLoss) { if (c.hitT > .6) { race.style -= 50; race.stats.crashes++; c.meter = Math.max(0, c.meter - .25); band(-bandLoss); toast(msg); if (AC) brass(110, AC.currentTime, .3, .25, master, 900); } c.hitT = 0; if (c.drift) c.driftLock = true; c.drift = 0; c.tier = 0; }
function tryDash(c) { if (c.meter >= 1 && c.dash <= 0) { c.meter = 0; c.dash = 1.6; c.v += 7; race.stats.dashes++; race.style += 50; band(.06); toast(c.move.toLowerCase()); if (AC) { const t = AC.currentTime; for (let k = 0; k < 6; k++) brass(mf(55 + k * 3), t + k * .05, .18, .12); } } }
function onLap(c) {
  if (c.isPlayer) { if (c.lap === 0) race.lapStart = race.t; else { race.lapTimes.push(race.t - race.lapStart); race.lapStart = race.t; } }
  if (c.lap === 0) return;
  if (!c.isPlayer) c.useAlley = Math.random() < .35;
  if (c.lap >= LAPS && !c.finished) { c.finished = true; c.finishTime = race.t; if (c.isPlayer) finishRace(); }
  else if (c.isPlayer) { if (c.lap === LAPS - 1) finalLap(); else { toast('lap ' + (c.lap + 1)); sfx(523, .25); } stands.forEach(restoreStand); }
}
// v17: big arcade FINAL LAP banner (~2 s, upper screen so the road stays visible) + fanfare + flashing lap box
let finalT = null;
function finalLap() {
  const el = $('finallap'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); el.style.display = 'block';
  $('lap').classList.add('flashlap'); clearTimeout(finalT); finalT = setTimeout(() => { el.style.display = 'none'; el.classList.remove('go'); setTimeout(() => $('lap').classList.remove('flashlap'), 2000); }, 2100);
  window.__tt.finalLapShown = (window.__tt.finalLapShown || 0) + 1; race.fastMusic = true;
  if (AC) { const t = AC.currentTime + .02, s = .11; // da-da-da-DAAA fanfare in C + snare roll
    [[67, 0, .1], [67, 1, .1], [67, 2, .1], [72, 3, .5], [76, 3, .5], [79, 3, .5], [74, 5.5, .12], [76, 6.5, .12], [79, 7.5, .6], [84, 7.5, .6]].forEach(([m, k, d]) => brass(mf(m), t + k * s, d, .16, master, 5200));
    for (let k = 0; k < 12; k++) drum(t + k * .045, 'snare'); drum(t + 3 * s, 'kick'); drum(t + 7.5 * s, 'kick'); }
}
window.__tt.finalLap = finalLap;
let flashT = 0, toastT = 0;
function flash(t) { $('msg').textContent = t; flashT = .8; } // center: countdown only
function toast(t) { const el = $('toast'); el.textContent = t; el.style.display = 'block'; toastT = .8; }
// ---------- v18 finish: checkered flag + FINISH! banner + crowd, camera swing, then the result screen ----------
const fmtT = t => { if (!(t > 0)) return '--'; const m = Math.floor(t / 60), sec = t - m * 60; return m + ':' + (sec < 10 ? '0' : '') + sec.toFixed(2); };
const ORD = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
let resTimer = null, finishAt = 0, confettiOn = false;
function crowdCheer() { if (!AC) return; const t = AC.currentTime;
  if (!noiseBuf) drum(t, 'hat'); // makes the shared noise buffer
  for (let k = 0; k < 6; k++) { const src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600 + k * 260; f.Q.value = 1.2; const g = AC.createGain();
    const t0 = t + k * .05; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.09, t0 + .35); for (let q = 1; q < 8; q++) g.gain.linearRampToValueAtTime(.05 + Math.random() * .06, t0 + .35 + q * .25); g.gain.linearRampToValueAtTime(0, t0 + 2.8);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0 + 2.9); }
  for (const [d, a, b] of [[.15, 1900, 2700], [.7, 2200, 1500], [1.1, 1800, 2900], [1.25, 2900, 1700]]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(a, t + d); o.frequency.exponentialRampToValueAtTime(b, t + d + .28);
    g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.07, t + d + .03); g.gain.linearRampToValueAtTime(0, t + d + .3); o.connect(g); g.connect(master); o.start(t + d); o.stop(t + d + .35); }
  for (let k = 0; k < 14; k++) drum(t + .2 + k * .11 + Math.random() * .05, 'snare'); }
function resultJingle(place) { if (!AC) return; const t = AC.currentTime + .05, s = .13;
  const notes = place === 1 ? [[60, 0, .1], [64, 1, .1], [67, 2, .1], [72, 3, .35], [67, 5, .1], [72, 6, .9], [76, 6, .9], [79, 6, .9]]
    : place <= 3 ? [[67, 0, .12], [72, 1, .12], [76, 2, .5], [79, 2, .5]] : [[72, 0, .1], [74, 1, .1], [76, 2, .1], [79, 3, .45]];
  notes.forEach(([m, k, d]) => brass(mf(m), t + k * s, d, .15, master, 5000)); if (place === 1) for (let k = 0; k < 10; k++) drum(t + .75 + k * .05, 'snare'); }
function finishRace() {
  if (race.results) return; // once per race
  race.state = 'done'; finishAt = race.t; const order = [...cars].sort((a, b) => progress(b) - progress(a)); const place = order.indexOf(player) + 1;
  const bonus = [1000, 700, 500, 300, 150][place - 1]; const style = Math.round(race.style), st = race.stats;
  const laps = race.lapTimes.slice(), best = laps.length ? Math.min(...laps) : 0;
  race.results = { place, style, bonus, total: style + bonus, time: player.finishTime, best, laps, order: order.map(c => c.driver + ' — ' + c.name) };
  window.__tt.finishShown = (window.__tt.finishShown || 0) + 1;
  const fx = $('finishfx'); fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go'); fx.style.display = 'block'; crowdCheer();
  if (CUP) cupAward(order, place);
  clearTimeout(resTimer); resTimer = setTimeout(() => CUP ? showCupStandings() : showResults(order, place, bonus, style, st), window.__tt.resultDelay != null ? window.__tt.resultDelay : 2800);
}
function showResults(order, place, bonus, style, st) {
  if (race.state !== 'done') return;
  $('finishfx').style.display = 'none'; $('hud').style.display = 'none';
  const r = race.results, el = $('results'), win = place === 1, pod = place <= 3;
  el.className = win ? 'win' : pod ? 'podium' : 'place';
  $('rtitle').textContent = win ? 'YOU WON!' : pod ? 'PODIUM!' : ORD(place) + ' PLACE!';
  $('rsub').textContent = win ? `Champion of ${TRK.name}! 🎺` : pod ? `${ORD(place)} place. So close to gold, great driving!` : ['Nice race! The band loved that run.', 'Great run! Keep that rhythm going.', 'Nice driving! The crowd is cheering for you.'][Math.floor(Math.random() * 3)];
  $('rtrophy').style.display = win ? '' : 'none'; $('rmedal').style.display = pod && !win ? '' : 'none'; $('rmedal').textContent = place; $('rmedal').className = place === 3 ? 'b3' : '';
  $('rstats').innerHTML = [['PLACE', ORD(place)], ['TIME', fmtT(r.time)], ['BEST LAP', fmtT(r.best)], ['STYLE', style], ['BAND SCORE', style + bonus]].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  $('rorder').innerHTML = order.map((c, i) => `<span class="${c.isPlayer ? 'me' : ''}">${i + 1}. ${c.driver}</span>`).join('');
  el.style.display = 'flex'; resultJingle(place); window.__tt.resultsShown = (window.__tt.resultsShown || 0) + 1;
  if (win) startConfetti(); else confettiOn = false;
  setTimeout(() => { const b = $('ragain'); if (b && el.style.display !== 'none') try { b.focus({ preventScroll: true }); } catch (_) {} }, 50);
}
function hideResults() { $('results').style.display = 'none'; $('finishfx').style.display = 'none'; confettiOn = false; clearTimeout(resTimer); }
function resultsUp() { return $('results').style.display === 'flex'; }
function resAction(k) { if (race.state !== 'done' || !resultsUp()) return; hideResults(); sfx(660, .1, .12);
  if (k === 'again') { $('hud').style.display = ''; startRace(); }
  else if (k === 'change') openGarage();
  else { race.state = 'menu'; race.results = null; $('hud').style.display = ''; $('overlay').style.display = 'flex'; } }
for (const [id, k] of [['ragain', 'again'], ['rchange', 'change'], ['rmenu', 'menu']]) { const b = $(id); b.addEventListener('pointerup', e => { e.preventDefault(); resAction(k); }); b.addEventListener('click', () => resAction(k)); }
window.__tt.resAction = resAction;
function startConfetti(id = 'confetti') { const cv = $(id), g = cv.getContext('2d'); confettiOn = true; const W0 = cv.width = innerWidth, H0 = cv.height = innerHeight;
  const cols = ['#ffd34d', '#ff4fd8', '#40e8ff', '#4cd964', '#ff7a2a', '#fff'], P2 = Array.from({ length: 140 }, () => ({ x: Math.random() * W0, y: -Math.random() * H0, vy: 60 + Math.random() * 120, vx: -30 + Math.random() * 60, r: Math.random() * 6, s: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)] }));
  let last = performance.now(); const step = (now) => { if (!confettiOn) { g.clearRect(0, 0, W0, H0); return; } const dt = Math.min(.05, (now - last) / 1000); last = now; g.clearRect(0, 0, W0, H0);
    for (const q of P2) { q.y += q.vy * dt; q.x += q.vx * dt + Math.sin(now / 300 + q.r) * .6; q.r += dt * 6; if (q.y > H0 + 10) { q.y = -10; q.x = Math.random() * W0; } g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.fillStyle = q.c; g.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); g.restore(); }
    requestAnimationFrame(step); }; requestAnimationFrame(step); }
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
  if (HAS_METRO) { const sd = Math.sign(metro.ang); if (sd !== metro.lastSide) { metro.lastSide = sd; if (AC && race.musicOn && Math.hypot(P[METRO_I].x - player.x, P[METRO_I].z - player.z) < 90) drum(AC.currentTime, 'hat'); } }
  if (race.state === 'count' || race.state === 'race' || race.state === 'done') { cars.forEach(c => stepCar(c, dt)); collide(); stepTimps(dt); }
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
    if (window.__tt.freeze) continue;
    c.mesh.position.set(c.x, gy + c.y, c.z); c.mesh.rotation.y = c.h;
    let pitch = c.alley ? 0 : -Math.atan(slope);
    if (c.onRamp) pitch -= c.onWarp ? Math.atan(WARP_H / (WARP_LEN * SEG)) : Math.atan(RAMP_H / (RAMP_LEN * SEG));
    if (c.air) pitch += -Math.atan(c.vy / Math.max(10, c.v)) * .5 + (c.trick >= 0 ? c.trick * Math.PI * 2 : 0);
    c.mesh.rotation.x = pitch; c.mesh.rotation.z = c.drift ? -c.drift * .12 : -c.steer * .06 * Math.min(1, c.v / 40);
    const U = c.mesh.userData.anim; if (U && !window.__tt.freeze) { // wheel spin, front-wheel steer, per-instrument animation, bell glow on boost
      const sp = c.v * camDt / U.r; for (const w of U.wheels) w.rotation.x += sp * (w.userData.k || 1); for (const f of U.front) f.rotation.y = c.steer * .4;
      const pow = c.dash > 0 || c.warpT > 0 ? 1 : c.boost > 0 ? .75 : 0; if (U.tick) U.tick(c, camDt, pow, race.t + c.phase); if (U.beam) U.beam.visible = !c.air;
      for (const gl of U.glows) { gl.material.opacity = .3 + pow * .65; gl.scale.setScalar(1 + pow * .25); } }
    const sh = c.mesh.userData.shadow; sh.position.set(c.x, gy + .05 + (c.onRamp ? c.y : 0), c.z); sh.rotation.z = -c.h; sh.material.opacity = .35 / (1 + c.y * .25);
  }
  const f = tmp.set(Math.sin(player.vh * .5 + player.h * .5), 0, Math.cos(player.vh * .5 + player.h * .5));
  const py = (player.alley ? 0 : E[player.idx]) + player.y * .7;
  const want = new THREE.Vector3(player.x, py, player.z).addScaledVector(f, -11.5); want.y += 5;
  const look = new THREE.Vector3(player.x, py + 1.6, player.z).addScaledVector(f, 7);
  if (race.state === 'done' && race.results) { const a = Math.min(2.6, (race.t - finishAt) * 1.1) + player.h, R = 9 - Math.min(2, (race.t - finishAt)); // swing around to the front of the car
    want.set(player.x - Math.sin(a) * R, py + 3.2, player.z - Math.cos(a) * R); look.set(player.x, py + 1.4, player.z); }
  if (!camInit) { camPos.copy(want); camLook.copy(look); camInit = true; }
  const k = 1 - Math.exp(-camDt * (race.state === 'done' ? 4 : 9)); camPos.lerp(want, k); camLook.lerp(look, Math.min(1, k * 1.8)); camera.position.copy(camPos); camera.lookAt(camLook);
  { const f = window.__tt.camFixed; if (f) { camera.position.set(...f[0]); camera.lookAt(...f[1]); } }
  { const o = window.__tt.camOverride; if (o) { camera.position.set(player.x + o[0], player.mesh.position.y + o[1], player.z + o[2]); camera.lookAt(player.x, player.mesh.position.y + .9, player.z); } } // test/screenshot hook only
  camera.fov = 66 + Math.min(14, player.v * .12) + (player.dash > 0 ? 6 : 0) + (player.boost > 0 ? 3 : 0); camera.updateProjectionMatrix();
}
// ---------- minimap (v15): track outline + live car dots ----------
const MAPCOL = { trombone: '#ffc83a', trumpet: '#ff7a2a', sax: '#ff5ad0', tuba: '#3a8bff', clarinet: '#40e8ff', snare: '#ff3048', horn: '#b67bff', xylo: '#4cd964' };
const MM = (() => { const cv = $('mmap'), ctx = cv.getContext('2d'); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const p of P) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  return { cv, ctx, x0, x1, z0, z1, px: 0, bg: null }; })();
function drawMinimap() {
  const { cv, ctx } = MM, css = cv.clientWidth; if (!css) return; const dpr = Math.min(2, devicePixelRatio || 1), sz = Math.round(css * dpr);
  const pad = sz * .1, sc = (sz - 2 * pad) / Math.max(MM.x1 - MM.x0, MM.z1 - MM.z0), ox = (sz - (MM.x1 - MM.x0) * sc) / 2, oz = (sz - (MM.z1 - MM.z0) * sc) / 2;
  const X = x => ox + (x - MM.x0) * sc, Z = z => oz + (z - MM.z0) * sc; // top-down, not mirrored (x right, z down)
  if (cv.width !== sz || !MM.bg) { cv.width = cv.height = sz; MM.bg = document.createElement('canvas'); MM.bg.width = MM.bg.height = sz; const g = MM.bg.getContext('2d');
    g.lineJoin = g.lineCap = 'round'; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(X(p.x), Z(p.z)) : g.moveTo(X(p.x), Z(p.z))); g.closePath();
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = sz * .075; g.stroke(); g.strokeStyle = '#d8d4e0'; g.lineWidth = sz * .045; g.stroke();
    // shortcut alley (cyan dashed)
    g.setLineDash([sz * .03, sz * .02]); g.strokeStyle = '#4ff'; g.lineWidth = sz * .03; g.beginPath(); g.moveTo(X(ALLEY.a.x), Z(ALLEY.a.z)); g.lineTo(X(ALLEY.b.x), Z(ALLEY.b.z)); g.stroke(); g.setLineDash([]);
    // warp ramps: small magenta chevrons pointing along the track
    for (const w of WARPS) { const i = w.i, ang = Math.atan2(T[i].z, T[i].x), r = sz * .04; g.save(); g.translate(X(P[i].x), Z(P[i].z)); g.rotate(ang); g.beginPath(); g.moveTo(r, 0); g.lineTo(-r * .7, r * .8); g.lineTo(-r * .2, 0); g.lineTo(-r * .7, -r * .8); g.closePath(); g.fillStyle = '#ff4fd8'; g.fill(); g.lineWidth = sz * .008; g.strokeStyle = '#fff'; g.stroke(); g.restore(); }
    // start/finish tick
    const s0 = S[0]; g.strokeStyle = '#fff'; g.lineWidth = sz * .018; g.beginPath(); g.moveTo(X(P[0].x - s0.x * 22), Z(P[0].z - s0.z * 22)); g.lineTo(X(P[0].x + s0.x * 22), Z(P[0].z + s0.z * 22)); g.stroke(); }
  ctx.clearRect(0, 0, sz, sz); ctx.drawImage(MM.bg, 0, 0);
  for (const c of cars) { if (c.isPlayer || !c.mesh || !c.mesh.visible) continue; ctx.beginPath(); ctx.arc(X(c.x), Z(c.z), sz * .042, 0, 7); ctx.fillStyle = MAPCOL[c.type] || '#fff'; ctx.fill(); ctx.lineWidth = sz * .012; ctx.strokeStyle = '#000'; ctx.stroke(); }
  // player: pulsing ring + arrow pointing along heading, in the player's car colour
  const pc = MAPCOL[player.type] || '#fff', x = X(player.x), z = Z(player.z), pu = .5 + .5 * Math.sin(performance.now() / 180);
  ctx.beginPath(); ctx.arc(x, z, sz * (.07 + .03 * pu), 0, 7); ctx.strokeStyle = pc; ctx.globalAlpha = .9 - .5 * pu; ctx.lineWidth = sz * .02; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(x, z); ctx.rotate(Math.atan2(Math.cos(player.h), Math.sin(player.h))); const r = sz * .075; // screen angle of heading (dx=sin h, dz=cos h)
  ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * .7, r * .62); ctx.lineTo(-r * .35, 0); ctx.lineTo(-r * .7, -r * .62); ctx.closePath(); ctx.fillStyle = pc; ctx.fill(); ctx.lineWidth = sz * .016; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
}
window.__tt.minimap = drawMinimap; window.__tt.WARPS = WARPS;
function hud() {
  const order = [...cars].sort((a, b) => progress(b) - progress(a)); race.place = order.indexOf(player) + 1;
  if (race.state === 'race') { if (race.place < race.lastPlace) { race.stats.passes++; race.style += 75; band(.1); } race.lastPlace = race.place; }
  sections = race.state === 'menu' || race.state === 'garage' || race.state === 'tsel' ? 4 : 1 + Math.min(4, Math.floor(race.band * 5));
  if (race.state !== 'garage' && race.state !== 'menu' && race.state !== 'tsel') drawMinimap();
  $('place').textContent = ['1st', '2nd', '3rd', '4th', '5th'][race.place - 1];
  $('lap').firstChild.textContent = `LAP ${Math.min(LAPS, Math.max(1, player.lap + 1))}/${LAPS}`;
  $('style').textContent = 'STYLE ' + Math.round(race.style);
  $('mph').textContent = Math.round(player.v * 1.6) + ' MPH';
  $('meterfill').style.width = (player.meter * 100) + '%';
  $('bandfill').style.width = (race.band * 100) + '%'; $('bandfill').style.background = race.band > .8 ? 'linear-gradient(90deg,#ffd34d,#fff)' : 'linear-gradient(90deg,#7b3fc4,#4aa3ff)';
  $('bdash').classList.toggle('ready', player.meter >= 1 || player.air);
  $('bdash').innerHTML = player.air ? 'FLIP' : player.move.toUpperCase().replace(' ', '<br>');
  $('bdrift').classList.toggle('t1', player.tier === 1); $('bdrift').classList.toggle('t2', player.tier === 2);
}
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(.1, (now - last) / 1000) * TIMESCALE; last = now; acc += dt;
  try {
    while (acc > 1 / 60) { sim(1 / 60); acc -= 1 / 60; }
    camDt = dt; CITY.update(dt, performance.now() / 1000); if (ALLEY.anim) ALLEY.anim(dt); schedMusic(); if (race.state === 'garage') { hud(); renderGarage(dt); } else { syncMeshes(); hud(); }
    if (flashT > 0) { flashT -= dt / TIMESCALE; if (flashT <= 0) $('msg').textContent = ''; }
    if (toastT > 0) { toastT -= dt / TIMESCALE; if (toastT <= 0) $('toast').style.display = 'none'; }
    if (race.state !== 'garage') renderer.render(scene, camera);
  } catch (e) { window.__tt.errors.push(String(e)); console.error(e); }
}
gridUp(); syncMeshes();
requestAnimationFrame(frame);
if (AUTOSTART) setTimeout(startRace, 300);
