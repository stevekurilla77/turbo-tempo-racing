import { geo } from './trackgeo.mjs'; import { TRACKS } from './tracks.js';
for (const id of process.argv.slice(2)) { const Tk = TRACKS[id], g = geo(Tk), P = g.P, N = 600, { A, B } = Tk.alley;
const T = i => { const a = P[(i + 1) % N], b = P[(i - 1 + N) % N]; const dx = a.x - b.x, dz = a.z - b.z, l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
const a = P[A], b = P[B], L = Math.hypot(b.x - a.x, b.z - a.z), d = [(b.x - a.x) / L, (b.z - a.z) / L], tA = T(A), tB = T(B);
let cl = 1e9; for (let k = 0; k <= 40; k++) { const t = .18 + .64 * k / 40, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t; for (let j = 0; j < N; j++) { if (Math.abs(j - A) < 30 || Math.abs(j - B) < 30) continue; cl = Math.min(cl, Math.hypot(P[j].x - x, P[j].z - z)); } }
console.log(id, A, B, 'saved', Math.round((B - A) * g.seg - L), 'L', Math.round(L), 'clear', Math.round(cl), 'angA', Math.round(Math.acos(d[0] * tA[0] + d[1] * tA[1]) * 57.3), 'angB', Math.round(Math.acos(d[0] * tB[0] + d[1] * tB[1]) * 57.3)); }
