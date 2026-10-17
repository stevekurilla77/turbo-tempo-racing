// Shared scenery helpers (v19+): canvas textures, chunked static baking (few draw calls, still frustum-culled), clearance checks.
import * as THREE from 'three';
export function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t;
}
// Bake every mesh under `root` into one mesh per (material, chunk). Chunks keep frustum culling useful.
export function bakeChunks(root, scene, chunk = 220) {
  root.updateMatrixWorld(true); const buckets = new Map();
  root.traverse(o => { if (!o.isMesh) return; let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const wp = new THREE.Vector3(); o.getWorldPosition(wp); const key = o.material.uuid + '|' + Math.floor(wp.x / chunk) + ',' + Math.floor(wp.z / chunk);
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, gs: [] }); buckets.get(key).gs.push(g); });
  const out = [];
  for (const { mat, gs } of buckets.values()) { let n = 0; for (const g of gs) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
    for (const g of gs) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array.subarray(0, c * 2), o * 2); o += c; g.dispose(); }
    const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.computeBoundingSphere();
    const mesh = new THREE.Mesh(m, mat); mesh.matrixAutoUpdate = false; scene.add(mesh); out.push(mesh); }
  root.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  return out;
}
// distance (squared) from x,z to the nearest track sample
export function makeClear(P) {
  const G = 40, grid = new Map(); P.forEach((p, i) => { const k = Math.floor(p.x / G) + ',' + Math.floor(p.z / G); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(p); });
  return (x, z) => { let best = 1e12; const gx = Math.floor(x / G), gz = Math.floor(z / G);
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const L = grid.get((gx + a) + ',' + (gz + b)); if (L) for (const p of L) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) best = d; } }
    return Math.sqrt(best); };
}
// box with UVs scaled to world size so a repeating facade texture keeps a constant window size (tile = world units per texture)
export function facadeBox(w, h, d, tile, u0 = 0, v0 = 0) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [0, 0], [0, 0], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k, [a, b] = dims[f]; uv.setXY(i, a ? u0 + uv.getX(i) * a / tile : .01, b ? v0 + uv.getY(i) * b / tile : .01); }
  return g;
}
export function textPlane(tex, w, h, region) { // region [u0,v0,u1,v1] in an atlas
  const g = new THREE.PlaneGeometry(w, h); if (region) { const uv = g.attributes.uv, [u0, v0, u1, v1] = region; for (let i = 0; i < 4; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0)); }
  return g;
}
