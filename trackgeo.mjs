// v26 track geometry checker: length, self-clearance, tightest curve, shortcut chord vs road distance, feature spacing.
// node trackgeo.mjs [id ...]
import { CatmullRomCurve3, Vector3 } from './vendor/three.core.js';
import { TRACKS } from './tracks.js';
const N = 600, W = 28;
export function geo(T) {
  const curve = new CatmullRomCurve3(T.ctrl.map(([x, z]) => new Vector3(x, 0, z)), true, 'centripetal'), P = curve.getSpacedPoints(N).slice(0, N), L = curve.getLength(), SEG = L / N;
  let minClear = 1e9, at = null; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = Math.min(j - i, N - j + i); if (d * SEG < 90) continue; const q = P[i].distanceTo(P[j]); if (q < minClear) { minClear = q; at = [i, j]; } }
  let minR = 1e9, atR = 0; for (let i = 0; i < N; i++) { const a = P[(i - 4 + N) % N], b = P[i], c = P[(i + 4) % N]; const ab = a.distanceTo(b), bc = b.distanceTo(c), ca = c.distanceTo(a); const s = (ab + bc + ca) / 2, ar = Math.sqrt(Math.max(1e-9, s * (s - ab) * (s - bc) * (s - ca))); const R = ab * bc * ca / (4 * ar); if (R < minR) { minR = R; atR = i; } }
  const { A, B, HW } = T.alley, chord = P[A].distanceTo(P[B]), road = (B - A) * SEG;
  // chord clearance from the rest of the road
  let chClear = 1e9; for (let k = 0; k <= 50; k++) { const t = .15 + .7 * k / 50, x = P[A].x + (P[B].x - P[A].x) * t, z = P[A].z + (P[B].z - P[A].z) * t; for (let j = 0; j < N; j++) { const dj = Math.min(Math.abs(j - A), Math.abs(j - B)); if (j > A && j < B) {} const q = Math.hypot(P[j].x - x, P[j].z - z); if (j > A + 8 && j < B - 8 || j < A - 8 || j > B + 8) chClear = Math.min(chClear, q); } }
  const feats = [['ramp', T.ramp, 6], ...T.warps.map(i => ['warp', i, 4]), ...T.pads.map(([i]) => ['pad', i, 2]), ...(T.gates || []).map(i => ['gate', i, 1]), ['hillC', T.hill[0], 0], ...T.stands.map(([i]) => ['stand', i, 1])];
  const clash = []; for (let a = 0; a < feats.length; a++) for (let b = a + 1; b < feats.length; b++) { const [na, ia, la] = feats[a], [nb, ib] = feats[b]; if (na === 'stand' && nb === 'stand') continue; const d = Math.min(Math.abs(ia - ib), N - Math.abs(ia - ib)); if (d < 14 && !(na === 'hillC' || nb === 'hillC')) clash.push(`${na}@${ia}~${nb}@${ib}`); }
  const inAlley = feats.filter(([n, i]) => n !== 'hillC' && n !== 'stand' && i > T.alley.A - 4 && i < T.alley.B + 4).map(([n, i]) => n + '@' + i);
  const hillAlley = T.hill[0] + T.hill[1] > T.alley.A && T.hill[0] - T.hill[1] < T.alley.B;
  return { len: Math.round(L), seg: +SEG.toFixed(2), minClear: Math.round(minClear), clearAt: at, minR: Math.round(minR), atR, chord: Math.round(chord), road: Math.round(road), saved: Math.round(road - chord), chordClear: Math.round(chClear), clash, inAlley, hillAlley, P };
}
if (process.argv[1].endsWith('trackgeo.mjs')) for (const id of (process.argv.length > 2 ? process.argv.slice(2) : Object.keys(TRACKS))) { const g = geo(TRACKS[id]); delete g.P; console.log(id.padEnd(8), JSON.stringify(g)); }
