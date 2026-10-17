// v22 shared scenery kit: seeded random, placement that keeps the road + shortcut clear, sign atlas, baking, simple props.
import * as THREE from 'three';
import { canvasTex, bakeChunks, makeClear, facadeBox, textPlane } from './deco.js';
export { THREE, canvasTex, bakeChunks, facadeBox, textPlane };
export function kit(ctx, seed0 = 7) {
  const { P, S, T, N, W, alleyDist, ALLEY_HW } = ctx;
  let seed = seed0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(rnd() * a.length)];
  const clear = makeClear(P), stage = new THREE.Group(), anim = [], taken = [], LM = {};
  const add = (geo, mat, x, y, z, ry = 0, par = stage, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); par.add(m); return m; };
  const free = (x, z, r, margin = 8.5) => clear(x, z) > W / 2 + margin + r && alleyDist(x, z) > ALLEY_HW + 4 + r && !taken.some(t => Math.hypot(t[0] - x, t[1] - z) < t[2] + r);
  const site = (i, side, off, r, key) => { for (let tries = 0; tries < 12; tries++) { const sd = tries % 2 ? -side : side, o = off + Math.floor(tries / 2) * 6, j = (i + Math.floor(tries / 2) * 4) % N; const x = P[j].x + S[j].x * sd * o, z = P[j].z + S[j].z * sd * o;
      if (free(x, z, r)) { taken.push([x, z, r]); const s = { x, z, ry: Math.atan2(P[j].x - x, P[j].z - z), j }; if (key) LM[key] = [Math.round(x), Math.round(z), j]; return s; } } return null; };
  const at = (s, par = stage) => { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; par.add(g); return g; };
  // roadside loop: calls fn(x, z, ry, i, side) at spots `off` from the centre line that are free
  const roadside = (step, off, r, fn, prob = 1) => { for (let i = 0; i < N; i += step) for (const side of [-1, 1]) { if (rnd() > prob) continue; const o = off + rnd() * 3; const x = P[i].x + S[i].x * side * o, z = P[i].z + S[i].z * side * o; if (!free(x, z, r)) continue; taken.push([x, z, r]); fn(x, z, Math.atan2(-S[i].x * side, -S[i].z * side), i, side); } };
  const scatter = (n, box, r, fn) => { for (let k = 0; k < n; k++) { const x = box[0] + rnd() * (box[1] - box[0]), z = box[2] + rnd() * (box[3] - box[2]); if (!free(x, z, r)) continue; fn(x, z, k); } };
  let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9; P.forEach(p => { bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x); bz0 = Math.min(bz0, p.z); bz1 = Math.max(bz1, p.z); });
  const inside = (x, z) => { let c = false; for (let i = 0, j = N - 1; i < N; j = i++) { const a = P[i], b = P[j]; if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  const bbox = [bx0, bx1, bz0, bz1], center = [(bx0 + bx1) / 2, (bz0 + bz1) / 2];
  // sign atlas: regs = [[key, w, h, draw(g, x, y, w, h)]] packed into rows of a 2048-wide canvas
  const atlas = (regs) => { const R = {}; let x = 0, y = 0, rowH = 0; const place = regs.map(([k, w, h, draw]) => { if (x + w > 2048) { x = 0; y += rowH; rowH = 0; } const r = [k, x, y, w, h, draw]; x += w; rowH = Math.max(rowH, h); return r; }); const H = 1 << Math.ceil(Math.log2(y + rowH));
    const tex = canvasTex(2048, H, g => { for (const [k, px, py, w, h, draw] of place) { R[k] = [px / 2048, 1 - (py + h) / H, (px + w) / 2048, 1 - py / H]; g.save(); g.beginPath(); g.rect(px, py, w, h); g.clip(); draw(g, px, py, w, h); g.restore(); } });
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .05, side: THREE.DoubleSide }); return { R, tex, mat, plane: (k, w, h, x, y, z, ry = 0, par = stage) => add(textPlane(tex, w, h, R[k]), mat, x, y, z, ry, par) }; };
  const textSign = (txt, bg, fg, font = 'bold 64px Arial Black, Impact', border) => (g, x, y, w, h) => { g.fillStyle = bg; g.fillRect(x, y, w, h); if (border) { g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(x + 6, y + 6, w - 12, h - 12); } g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x + w / 2, y + h / 2 + 4); };
  const bake = () => bakeChunks(stage, ctx.scene);
  // instanced swarm of animated points (fireflies, pollen, sparkles)
  const motes = (n, box, y0, y1, col, size = 1.2) => { const pos = new Float32Array(n * 3), ph = []; for (let k = 0; k < n; k++) { pos.set([box[0] + rnd() * (box[1] - box[0]), y0 + rnd() * (y1 - y0), box[2] + rnd() * (box[3] - box[2])], k * 3); ph.push(rnd() * 6.28); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.PointsMaterial({ color: col, size, transparent: true, opacity: .9, depthWrite: false, fog: true }); const pts = new THREE.Points(g, m); ctx.scene.add(pts);
    const base = pos.slice(); anim.push((dt, t) => { for (let k = 0; k < n; k++) { pos[k * 3] = base[k * 3] + Math.sin(t * .5 + ph[k]) * 3; pos[k * 3 + 1] = base[k * 3 + 1] + Math.sin(t * .9 + ph[k] * 2) * 1.5; pos[k * 3 + 2] = base[k * 3 + 2] + Math.cos(t * .4 + ph[k]) * 3; } g.attributes.position.needsUpdate = true; m.opacity = .6 + .3 * Math.sin(t * 3); }); return pts; };
  return { inside, rnd, pick, clear, stage, anim, taken, LM, add, free, site, at, roadside, scatter, bbox, center, atlas, textSign, bake, motes };
}
