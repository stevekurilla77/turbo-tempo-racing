import { geo } from './trackgeo.mjs'; import { TRACKS } from './tracks.js';
const [id, lo = 110, hi = 220] = process.argv.slice(2); const g = geo(TRACKS[id]), P = g.P, N = 600, SEG = g.seg;
const T = i => { const a = P[(i + 1) % N], b = P[(i - 1 + N) % N]; const dx = a.x - b.x, dz = a.z - b.z, l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
const out = [];
for (let A = 0; A < N; A += 5) for (let B = A + 50; B < Math.min(N - 10, A + 230); B += 5) {
  const a = P[A], b = P[B], L = Math.hypot(b.x - a.x, b.z - a.z), saved = (B - A) * SEG - L; if (saved < +lo || saved > +hi) continue;
  const d = [(b.x - a.x) / L, (b.z - a.z) / L], tA = T(A), tB = T(B), angA = Math.acos(Math.min(1, d[0] * tA[0] + d[1] * tA[1])) * 57.3, angB = Math.acos(Math.min(1, d[0] * tB[0] + d[1] * tB[1])) * 57.3;
  if (angA > +(process.env.ANG || 40) || angB > +(process.env.ANG || 40)) continue;
  let cl = 1e9; for (let k = 0; k <= 40; k++) { const t = .18 + .64 * k / 40, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t; for (let j = 0; j < N; j++) { if (Math.abs(j - A) < 30 || Math.abs(j - B) < 30) continue; cl = Math.min(cl, Math.hypot(P[j].x - x, P[j].z - z)); } }
  if (cl < 28) continue; out.push([A, B, Math.round(saved), Math.round(L), Math.round(cl), Math.round(angA), Math.round(angB)]); }
out.sort((x, y) => y[4] - x[4]); console.log(id, out.length, JSON.stringify(out.slice(0, 15)));
