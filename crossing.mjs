import { geo } from './trackgeo.mjs'; import { TRACKS } from './tracks.js';
const g = geo(TRACKS[process.argv[2]]), P = g.P, N = 600; let best = [];
for (let i = 0; i < N; i++) for (let j = i + 60; j < N; j++) { if (N - j + i < 60) continue; const d = Math.hypot(P[i].x - P[j].x, P[i].z - P[j].z); if (d < 4) best.push([i, j, +d.toFixed(1)]); }
const T = i => { const a = P[(i + 1) % N], b = P[(i - 1 + N) % N]; const l = Math.hypot(a.x - b.x, a.z - b.z); return [(a.x - b.x) / l, (a.z - b.z) / l]; };
best.sort((a, b) => a[2] - b[2]); const [i, j] = best[0] || []; if (i != null) { const a = T(i), b = T(j); console.log('cross', best[0], 'angle', Math.round(Math.acos(Math.abs(a[0] * b[0] + a[1] * b[1])) * 57.3), 'at', Math.round(P[i].x), Math.round(P[i].z)); } else console.log('no crossing');
console.log(JSON.stringify({ len: g.len, minR: g.minR, atR: g.atR }));
