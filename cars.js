// Turbo Tempo Racing — instrument car models. © 2026 Backline Vintage. Original procedural art.
// Every car is built from primitives; static parts are merged per material ("baked") so each car is only a
// handful of draw calls. Materials and wheel templates are shared. Forward = +z, ground = y 0.
import * as THREE from 'three';
const PI = Math.PI;
// ---------- shared environment + materials ----------
export const carEnv = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#3a1a6a'); gr.addColorStop(.3, '#c08a3a'); gr.addColorStop(.46, '#fff4d0'); gr.addColorStop(.54, '#6a5030'); gr.addColorStop(1, '#141018');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128); g.fillStyle = 'rgba(255,240,200,.9)'; for (let x = 8; x < 256; x += 22) g.fillRect(x, 38 + (x % 3) * 4, 8, 22);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
const std = (color, metalness, roughness, o = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, envMap: carEnv, envMapIntensity: 1.1, ...o });
const M = {
  brass: std(0xf2c24a, 1, .2, { emissive: 0x2a1a00 }), chrome: std(0xf2f4f8, 1, .12, { envMapIntensity: 1.4 }), silver: std(0xd6dce4, 1, .2),
  rubber: new THREE.MeshLambertMaterial({ color: 0x15151a }), tread: new THREE.MeshLambertMaterial({ color: 0x2a2a32 }),
  glass: std(0x9ab8e8, .6, .05, { transparent: true, opacity: .28, depthWrite: false }), black: std(0x101014, .4, .12), pearl: std(0xfff6e8, .1, .3),
  wood: std(0x8e4a20, .1, .35), stick: std(0xe6c48a, 0, .5), tail: new THREE.MeshBasicMaterial({ color: 0xff2a20 }), head: new THREE.MeshBasicMaterial({ color: 0xfff6d0 }),
};
M.brassDS = M.brass.clone(); M.brassDS.side = THREE.DoubleSide; M.blackDS = M.black.clone(); M.blackDS.side = THREE.DoubleSide; M.silverDS = M.silver.clone(); M.silverDS.side = THREE.DoubleSide;
const mc = {}; const paint = c => mc['p' + c] || (mc['p' + c] = std(c, .55, .25, { envMapIntensity: .9 }));
const basic = c => mc['b' + c] || (mc['b' + c] = new THREE.MeshBasicMaterial({ color: c }));
const glowMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false });
// ---------- geometry helpers (cached) ----------
const gc = {}; const G = (k, f) => gc[k] || (gc[k] = f());
const cyl = (a, b, h, s = 14) => G(`c${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
const box = (x, y, z) => G(`b${x},${y},${z}`, () => new THREE.BoxGeometry(x, y, z));
const sph = (r, w = 14, h = 10) => G(`s${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h));
const dome = () => G('dome', () => new THREE.SphereGeometry(1, 16, 10, 0, PI * 2, 0, PI / 2));
const tor = (R, r, a = PI * 2, rs = 8, ts = 20) => G(`t${R},${r},${a},${rs},${ts}`, () => new THREE.TorusGeometry(R, r, rs, ts, a));
const circ = r => G('o' + r, () => new THREE.CircleGeometry(r, 18));
const bellG = G('bell', () => { const p = []; for (let i = 0; i <= 12; i++) { const t = i / 12; p.push(new THREE.Vector2(1 + Math.pow(t, 3) * 1.9, t * 6)); } return new THREE.LatheGeometry(p, 22); });
const mouthG = G('mouth', () => new THREE.LatheGeometry([[0, 0], [.05, 0], [.05, .35], [.09, .45], [.17, .55], [.16, .6], [.08, .58]].map(([a, b]) => new THREE.Vector2(a, b)), 14));
const tube = (pts, r, seg = 24) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, 8);
function P(par, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); par.add(m); return m; }
const alongZ = (par, r1, r2, len, mat, x, y, z, s = 12) => P(par, cyl(r1, r2, len, s), mat, x, y, z, PI / 2); // radius r1 at +z end
const alongX = (par, r, len, mat, x, y, z, s = 12) => P(par, cyl(r, r, len, s), mat, x, y, z, 0, 0, PI / 2);
// merge every mesh of a static group into one mesh per material
function bake(st) {
  st.updateMatrixWorld(true); const buckets = new Map();
  st.traverse(o => { if (!o.isMesh) return; let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!buckets.has(o.material)) buckets.set(o.material, []); buckets.get(o.material).push(g); });
  const out = new THREE.Group();
  for (const [mat, gs] of buckets) { let n = 0; for (const g of gs) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
    for (const g of gs) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += c; g.dispose(); }
    const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.computeBoundingSphere();
    out.add(new THREE.Mesh(m, mat)); }
  return out;
}
// ---------- drivers: cartoon kids/teens in open-face helmets with goggles; faces, hair, varied skin tones ----------
export const LOOKS = {
  trombone: { girl: 1, skin: 0xc68a5e, hair: 0x5a3018, style: 'ponytail', tie: 0xff4fb0 },
  trumpet: { girl: 0, skin: 0x6b4128, hair: 0x15100c, style: 'short' },
  sax: { girl: 1, skin: 0xf6d2b8, hair: 0xf0c860, style: 'long' },
  tuba: { girl: 0, skin: 0xf1c6a6, hair: 0xc8501e, style: 'curly' },
  clarinet: { girl: 1, skin: 0xe8b88e, hair: 0x101018, style: 'pigtails', tie: 0x40e0ff },
  snare: { girl: 0, skin: 0xd09a6e, hair: 0x4a2a14, style: 'short' },
  horn: { girl: 1, skin: 0x8a5634, hair: 0x1c120c, style: 'puffs', tie: 0xffd040 },
  xylo: { girl: 0, skin: 0xb07850, hair: 0x2a6cff, style: 'spiky' },
};
let curLook = LOOKS.trombone, curBeams = new THREE.Group();
const matte = c => mc['m' + c] || (mc['m' + c] = std(c, 0, .65, { envMapIntensity: .3 }));
const ds = m => m.userData.ds || (m.userData.ds = Object.assign(m.clone(), { side: THREE.DoubleSide }));
const shellG = (a, b, c, d) => G(`sh${a},${b},${c},${d}`, () => new THREE.SphereGeometry(.26, 18, 12, a, b, c, d));
function driver(st, x, y, z, helm, visor) {
  const L = curLook, d = new THREE.Group(); d.position.set(x, y + .06, z); d.scale.setScalar(1.45); st.add(d);
  const skin = matte(L.skin), hair = matte(L.hair), dark = basic(0x1a1010), white = basic(0xffffff);
  P(d, cyl(.17, .24, .4, 12), helm, 0, -.36, -.04); P(d, cyl(.08, .08, .12, 10), skin, 0, -.17, 0); // suit + neck
  P(d, sph(.21, 18, 14), skin, 0, 0, .035);                                                   // head
  const H = ds(helm), front = PI / 2, gap = 1.1;                                            // open-face helmet: full cap + back/side shell
  P(d, shellG(0, PI * 2, 0, PI * .3), H, 0, 0, 0); P(d, shellG(front + gap, PI * 2 - 2 * gap, PI * .3, PI * .27), H, 0, 0, 0);
  P(d, tor(.255, .02, PI * 2, 6, 24), visor, 0, .12, 0, PI / 2 + .25);                    // goggle strap
  for (const s of [-1, 1]) { P(d, cyl(.06, .06, .05, 14), visor, s * .075, .19, .19, PI / 2 - .5); P(d, tor(.06, .012, PI * 2, 6, 14), M.chrome, s * .075, .19, .2, -.5); }
  // fringe under the helmet rim
  P(d, G('fr', () => new THREE.SphereGeometry(.212, 16, 6, front - .9, 1.8, PI * .27, PI * .1)), hair, 0, 0, .01);
  // face
  for (const s of [-1, 1]) { P(d, sph(.034, 10, 8), dark, s * .074, .02, .218); P(d, sph(.012, 6, 4), white, s * .074 + .012, .035, .246);
    if (L.girl) { P(d, box(.045, .012, .01), dark, s * .097, .06, .215, 0, 0, s * -.5); P(d, circ(.032), basic(0xff8aa0), s * .12, -.045, .2, 0, s * .55); } }
  P(d, tor(.055, .013, PI, 6, 10), basic(0x7a1a2a), 0, -.07, .225, 0, 0, PI);                 // smile
  // hair styles (visible below / out the back of the helmet)
  const back = (px, py, pz, r) => P(d, sph(r, 10, 8), hair, px, py, pz);
  if (L.style === 'ponytail') { back(0, .13, -.33, .1); back(0, .1, -.45, .09); back(0, .05, -.56, .08); back(0, -.02, -.65, .065); P(d, tor(.08, .025, PI * 2, 6, 12), basic(L.tie), 0, .13, -.35); }
  else if (L.style === 'long') { P(d, box(.4, .5, .08), hair, 0, -.08, -.43, 1.0); P(d, sph(.2, 12, 8), hair, 0, -.08, -.16, 0, 0, 0, 1, .7, 1); for (const s of [-1, 1]) P(d, box(.07, .34, .12), hair, s * .21, -.14, -.02); }
  else if (L.style === 'pigtails') { for (const s of [-1, 1]) { back(s * .3, .0, -.12, .085); back(s * .4, -.04, -.17, .075); back(s * .48, -.1, -.22, .065); P(d, tor(.07, .022, PI * 2, 6, 12), basic(L.tie), s * .28, .02, -.12, 0, PI / 2); } }
  else if (L.style === 'puffs') { for (const s of [-1, 1]) back(s * .22, .12, -.16, .12); back(0, -.12, -.22, .12); P(d, tor(.1, .02, PI * 2, 6, 12), basic(L.tie), 0, -.06, -.2, .3); }
  else if (L.style === 'curly') { for (let k = 0; k < 7; k++) { const a = PI * (.15 + k * .7 / 6); back(Math.cos(a) * .24, -.13, -Math.sin(a) * .23, .065); } }
  else if (L.style === 'spiky') { for (let k = -2; k <= 2; k++) P(d, cyl(0, .04, .14, 6), hair, k * .06, .1, .24, PI / 2 - .6, 0, k * -.15); for (const s of [-1, 1]) P(d, box(.05, .12, .12), hair, s * .2, -.06, -.04); }
  else { for (const s of [-1, 1]) P(d, box(.05, .1, .14), hair, s * .2, -.06, -.04); P(d, box(.32, .1, .08), hair, 0, -.14, -.22); } // short
}
// headlights: bright lamp + additive halo + soft beam on the road ahead
const haloM = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const beamM = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: .13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const beamG = G('beam', () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-.25, 0, 0, .25, 0, 0, 1.1, 0, 5, -.25, 0, 0, 1.1, 0, 5, -1.1, 0, 5], 3)); g.computeVertexNormals(); return g; });
function headlights(st, x, y, z, w = .42, h = .1) {
  for (const s of [-1, 1]) { P(st, box(w, h, .05), M.head, s * x, y, z); P(st, circ(.26), haloM, s * x, y, z + .05, 0, 0, 0, w / .3, h / .1 * .7, 1); P(curBeams, beamG, beamM, s * x, .06, z + .1); }
}
// side-profile wedge body, extruded across the width
function chassis(st, prof, w, mat, bev = .12) { const s = new THREE.Shape(); prof.forEach(([z, y], i) => i ? s.lineTo(z, y) : s.moveTo(z, y));
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * .8, bevelSegments: 2, curveSegments: 4 }); g.rotateY(-PI / 2); g.translate(w / 2, 0, 0); st.add(new THREE.Mesh(g, mat)); }
function canopy(st, z, y, sx = .72, sy = .5, sz = 1.2) { P(st, dome(), M.glass, 0, y, z, 0, 0, 0, sx, sy, sz); }
// a bell; dir 'back' (-z), 'fwd' (+z) or tilt angle for up. returns mouth center
function bell(st, mat, x, y, z, s, sl, rx) { P(st, bellG, mat, x, y, z, rx, 0, 0, s, sl, s); const L = 6 * sl; return [x, y + Math.cos(rx) * L, z + Math.sin(rx) * L]; }
function glowDisc(g, U, color, r, [x, y, z], rx = 0) { const m = P(g, circ(r), glowMat(color), x, y, z, rx); U.glows.push(m); return m; }
// wheels: template baked once per car and cloned (shared geometry) onto 4 spin groups
function wheels(g, U, o) {
  const { r, w, x, zf, zr } = o, tpl = new THREE.Group(), ox = w / 2 + .01;
  P(tpl, cyl(r, r, w, 22), M.rubber, 0, 0, 0, 0, 0, PI / 2);
  P(tpl, tor(r - .07, .08, PI * 2, 6, 22), M.rubber, w / 2 - .02, 0, 0, 0, PI / 2);
  if (o.rim === 'drum') { // snare-drum wheel: white head, chrome hoop and tension lugs
    P(tpl, cyl(r * .82, r * .82, .05, 22), M.pearl, ox, 0, 0, 0, 0, PI / 2); P(tpl, tor(r * .82, .045, PI * 2, 6, 22), M.chrome, ox + .03, 0, 0, 0, PI / 2);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; P(tpl, box(.08, .1, .1), M.chrome, ox + .02, Math.cos(a) * r * .9, Math.sin(a) * r * .9, a); }
    P(tpl, cyl(.1, .1, .07, 12), o.hub, ox + .04, 0, 0, 0, 0, PI / 2);
  } else {
    P(tpl, cyl(r * .76, r * .76, .05, 22), o.rimMat || M.chrome, ox, 0, 0, 0, 0, PI / 2);
    if (o.lip) P(tpl, tor(r * .76, .035, PI * 2, 6, 22), o.lip, ox + .02, 0, 0, 0, PI / 2);
    const n = o.spokes || 6, L = r * .68, sw = o.spokeW || .07;
    for (let k = 0; k < n; k++) { const a = k * 2 * PI / n; P(tpl, box(.05, L, sw), o.spokeMat || M.brass, ox + .03, Math.cos(a) * L / 2, Math.sin(a) * L / 2, a); }
    P(tpl, cyl(r * .22, r * .22, .08, 14), o.hub, ox + .06, 0, 0, 0, 0, PI / 2);
  }
  const baked = bake(tpl); U.r = r;
  for (const [sx, z] of [[-1, zf], [1, zf], [-1, zr], [1, zr]]) {
    const steer = new THREE.Group(); steer.position.set(sx * x, r, z); g.add(steer); const spin = new THREE.Group(); steer.add(spin);
    const side = baked.clone(); side.rotation.y = sx < 0 ? PI : 0; spin.add(side); U.wheels.push(spin); if (z > 0) U.front.push(steer);
  }
}
const lights = (st, zt, yt, xt, zh, yh, xh) => { for (const s of [-1, 1]) { P(st, box(.45, .13, .05), M.tail, s * xt, yt, zt); } headlights(st, xh, yh, zh); };
function finish(g, st, U, shadow) { g.add(bake(st)); if (curBeams.children.length) { U.beam = bake(curBeams); g.add(U.beam); } curBeams = new THREE.Group(); g.userData.anim = U; return { g, shadow }; }
const newU = () => ({ wheels: [], front: [], glows: [], r: .55, tick: null });

// ================= the cars =================
const BUILD = {
  trombone() { // Trombone Super Racer: gold wedge, slide side tubes + U-bend that extends on boost, bell exhaust
    const g = new THREE.Group(), st = new THREE.Group(), U = newU();
    chassis(st, [[-2.25, .32], [-2.3, .92], [-1.55, 1.02], [-.9, 1.08], [.9, .92], [1.9, .66], [2.45, .48], [2.5, .32]], 1.9, M.brass);
    P(st, box(.32, .04, 3.4), paint(0xb01828), 0, 1.0, .35, .14); P(st, box(2.25, .22, 3.9), M.rubber, 0, .3, .1);
    canopy(st, -.35, 1.0, .72, .5, 1.25); driver(st, 0, 1.25, -.45, M.pearl, basic(0xffb020));
    for (const x of [-.82, .82]) { alongZ(st, .13, .13, 2.6, M.brass, x, 1.12, -.4, 10); P(st, tor(.15, .04, PI * 2, 6, 12), M.chrome, x, 1.12, .9); }
    const slide = new THREE.Group(); g.add(slide); const ss = new THREE.Group();
    for (const x of [-.82, .82]) alongZ(ss, .09, .09, 2.2, M.chrome, x, 1.12, 1.4, 10);
    P(ss, tor(.82, .1, PI), M.brass, 0, 1.12, 2.5, PI / 2); P(ss, sph(.14), M.chrome, 0, 1.12, 3.32); slide.add(bake(ss));
    P(st, mouthG, M.chrome, 0, .9, 1.3, PI / 2);
    P(st, tor(.45, .08, PI, 6, 16), M.brass, 0, 1.1, -1.6, 0, PI / 2, PI / 2); alongZ(st, .2, .2, .7, M.brass, 0, .7, -2.2, 10);
    glowDisc(g, U, 0xff8a20, .5, bell(st, M.brassDS, 0, .7, -2.35, .22, .18, -PI / 2).map((v, i) => i === 2 ? v + .25 : v));
    P(st, box(2.4, .08, .55), M.brass, 0, 1.62, -2.0, -.12); for (const x of [-1.2, 1.2]) P(st, box(.06, .4, .7), paint(0xb01828), x, 1.55, -2.0);
    for (const x of [-.55, .55]) P(st, box(.08, .62, .14), M.chrome, x, 1.3, -2.0);
    lights(st, -2.4, .78, .75, 2.62, .52, .7);
    wheels(g, U, { r: .56, w: .52, x: 1.2, zf: 1.5, zr: -1.45, spokes: 6, hub: basic(0xffd040) });
    U.tick = (c, dt, pow) => { slide.position.z += (pow * .8 - slide.position.z) * Math.min(1, dt * 10); };
    return finish(g, st, U, [1.6, 2.8]);
  },
  trumpet() { // Trumpet Rocket: candy-red wedge, 3 valve pistons as engine stacks, leadpipe, bell exhaust
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), red = paint(0xc8182e);
    chassis(st, [[-2.3, .32], [-2.35, .88], [-1.4, .98], [-.4, 1.0], [.9, .86], [2.0, .6], [2.55, .42], [2.6, .32]], 1.9, red);
    P(st, box(2.2, .22, 4.0), M.rubber, 0, .3, 0); P(st, box(.16, .03, 3.2), M.brass, -.35, .99, .6, .12); P(st, box(.16, .03, 3.2), M.brass, .35, .99, .6, .12);
    canopy(st, .55, .98, .7, .48, 1.15); driver(st, 0, 1.2, .45, M.pearl, basic(0x40e0ff));
    const pist = [];
    [-.75, -1.15, -1.55].forEach((z, k) => { P(st, cyl(.17, .17, .78, 14), M.brass, 0, 1.36, z); P(st, cyl(.2, .2, .08, 14), M.chrome, 0, 1.77, z); P(st, cyl(.2, .2, .08, 14), M.chrome, 0, .98, z);
      const p = new THREE.Group(); p.position.set(0, 0, z); g.add(p); P(p, cyl(.04, .04, .3, 8), M.chrome, 0, 1.92, 0); P(p, cyl(.13, .13, .07, 14), M.pearl, 0, 2.07, 0); pist.push(p); });
    alongZ(st, .07, .07, 1.0, M.brass, .22, 1.2, -1.15); alongZ(st, .07, .07, 1.0, M.brass, -.22, 1.48, -1.15);
    st.add(new THREE.Mesh(tube([[.55, .72, 2.45], [.85, .98, 1.6], [.86, 1.02, 0], [.6, 1.15, -.5], [.17, 1.22, -.75]], .07), M.brass));
    st.add(new THREE.Mesh(tube([[-.17, 1.22, -1.35], [-.7, 1.1, -1.0], [-.86, 1.02, 0], [-.86, 1.0, 1.2]], .08), M.brass)); P(st, sph(.11), M.chrome, -.86, 1.0, 1.25);
    P(st, mouthG, M.chrome, .55, .72, 2.4, PI / 2, 0, 0, .9, .9, .9);
    st.add(new THREE.Mesh(tube([[0, 1.0, -1.55], [0, .9, -1.85], [0, .86, -2.1]], .17, 8), M.brass));
    glowDisc(g, U, 0xff5020, .45, bell(st, M.brassDS, 0, .86, -2.1, .2, .17, -PI / 2).map((v, i) => i === 2 ? v + .2 : v));
    P(st, box(2.3, .08, .5), M.brass, 0, 1.62, -2.05, -.1); for (const x of [-1.15, 1.15]) P(st, box(.06, .36, .62), red, x, 1.55, -2.05); for (const x of [-.5, .5]) P(st, box(.08, .5, .12), M.chrome, x, 1.35, -2.05);
    lights(st, -2.45, .74, .72, 2.68, .5, .68);
    wheels(g, U, { r: .55, w: .5, x: 1.18, zf: 1.55, zr: -1.5, spokes: 5, spokeW: .12, spokeMat: M.chrome, rimMat: M.brass, hub: basic(0xff3048) });
    U.tick = (c, dt, pow, t) => { const k = Math.min(1, c.v / 30) + pow; pist.forEach((p, i) => { p.position.y = -Math.max(0, Math.sin(t * (6 + k * 10) + i * 2.1)) * .14 * Math.min(1, k + .2); }); };
    return finish(g, st, U, [1.55, 2.8]);
  },
  sax() { // Saxophone Groove GT: purple body, curved brass sax with pearl key pads along the right shoulder, upturned bell
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), pur = paint(0x5b2a9e);
    chassis(st, [[-2.3, .32], [-2.3, .8], [-1.3, .92], [-.5, 1.02], [.8, .86], [1.9, .62], [2.5, .44], [2.55, .32]], 1.85, pur);
    P(st, box(2.15, .22, 3.95), M.rubber, 0, .3, 0);
    canopy(st, -.2, .98, .68, .48, 1.2); driver(st, -.05, 1.2, -.3, paint(0xffffff), basic(0xff40c0));
    st.add(new THREE.Mesh(tube([[0, 1.0, 2.25], [.25, 1.28, 1.8], [.6, 1.25, 1.25], [.82, 1.12, .6]], .07, 16), M.brass));
    st.add(new THREE.Mesh(tube([[.82, 1.12, .6], [.84, 1.08, -.4], [.84, 1.0, -1.4], [.84, .78, -2.0], [.84, .7, -2.3], [.84, .82, -2.55], [.84, 1.02, -2.6]], .15, 30), M.brass));
    P(st, cyl(.06, .14, .45, 12), M.black, 0, .95, 2.42, PI / 2 + .3); P(st, tor(.1, .03, PI * 2, 6, 12), M.silver, 0, .99, 2.3, .3); // mouthpiece + ligature
    glowDisc(g, U, 0xff60e0, .42, bell(st, M.brassDS, .84, 1.0, -2.6, .17, .12, -.35), -PI / 2 - .35);
    [.35, 0, -.35, -.7, -1.05, -1.4, -1.7].forEach(z => { const y = z > -1.4 ? 1.27 : 1.2; P(st, cyl(.12, .12, .04, 14), M.brass, .84, y - .02, z); P(st, cyl(.09, .09, .05, 14), M.pearl, .84, y + .01, z); });
    alongZ(st, .025, .025, 2.3, M.chrome, .62, 1.12, -.7, 6); [.2, -.5, -1.2].forEach(z => P(st, box(.24, .03, .04), M.chrome, .73, 1.18, z));
    alongZ(st, .1, .1, 1.7, M.chrome, -1.04, .5, 0, 12); P(st, cyl(.13, .1, .2, 12), M.black, -1.04, .5, .92, PI / 2);
    P(st, box(2.2, .07, .45), pur, 0, 1.5, -2.05, -.12); for (const x of [-1.1, 1.1]) P(st, box(.06, .4, .6), M.brass, x, 1.42, -2.05); P(st, box(.08, .5, .12), M.chrome, -.4, 1.2, -2.05);
    lights(st, -2.4, .7, .72, 2.6, .5, .68);
    wheels(g, U, { r: .55, w: .5, x: 1.18, zf: 1.5, zr: -1.5, spokes: 10, spokeW: .04, spokeMat: M.chrome, rimMat: M.brass, hub: basic(0xff40c0) });
    return finish(g, st, U, [1.55, 2.8]);
  },
  tuba() { // Sousaphone Tank: tall blue truck, giant forward-facing bell, wraparound tubing around the driver
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), blu = paint(0x2a5cc8);
    chassis(st, [[-2.35, .55], [-2.4, 1.2], [-1.4, 1.28], [1.3, 1.24], [2.2, 1.02], [2.55, .72], [2.55, .55]], 2.1, blu);
    P(st, box(2.3, .3, 4.3), M.rubber, 0, .55, 0);
    for (const x of [-.8, .8]) P(st, cyl(.06, .06, .7, 8), M.chrome, x, .9, 2.75); alongX(st, .07, 1.8, M.chrome, 0, 1.2, 2.75); alongX(st, .07, 1.8, M.chrome, 0, .7, 2.78);
    P(st, box(1.7, .5, .06), M.glass, 0, 1.6, .95, -.35); driver(st, 0, 1.82, .3, paint(0xff8a20), basic(0x40e0ff)); P(st, box(.9, .25, .7), M.black, 0, 1.38, .1);
    P(st, tor(1.02, .17, PI * 2, 8, 28), M.brass, 0, 1.5, .1, PI / 2 - .2);
    st.add(new THREE.Mesh(tube([[0, 1.32, -.98], [0, 1.95, -1.3], [0, 2.62, -1.65]], .2, 12), M.brass));
    glowDisc(g, U, 0x40e0ff, .62, bell(st, M.brassDS, 0, 2.62, -1.65, .27, .2, PI / 2).map((v, i) => i === 2 ? v - .25 : v));
    [-.25, -.5, -.75].forEach(z => { P(st, cyl(.11, .11, .55, 12), M.brass, .95, 1.6, z); P(st, cyl(.08, .08, .06, 12), M.pearl, .95, 1.92, z); });
    for (const x of [-.85, .85]) { P(st, cyl(.11, .11, 1.1, 12), M.chrome, x, 1.75, -2.1); P(st, cyl(.13, .13, .14, 12), M.black, x, 2.33, -2.1); }
    lights(st, -2.52, 1.0, .8, 2.66, .9, .78);
    wheels(g, U, { r: .72, w: .62, x: 1.3, zf: 1.6, zr: -1.55, spokes: 6, spokeW: .14, rimMat: M.chrome, hub: basic(0x40e0ff), lip: M.brass });
    return finish(g, st, U, [1.8, 3.0]);
  },
  clarinet() { // Clarinet Dart: gloss-black needle with silver rings + ring keys, mouthpiece nose, open wheels
    const g = new THREE.Group(), st = new THREE.Group(), U = newU();
    alongZ(st, .45, .45, 3.2, M.black, 0, .8, -.2, 18); alongZ(st, .22, .45, 1.0, M.black, 0, .8, 1.9, 18);
    alongZ(st, .1, .22, .5, M.black, 0, .8, 2.65, 14); P(st, tor(.2, .035, PI * 2, 6, 16), M.silver, 0, .8, 2.5); P(st, box(.16, .02, .45), paint(0xe8d8a0), 0, .62, 2.62, .12);
    for (const z of [1.4, .4, -.95, -1.8]) P(st, tor(.46, .04, PI * 2, 6, 20), M.silver, 0, .8, z);
    const cb = new THREE.LatheGeometry([[.45, 0], [.47, .25], [.55, .45], [.72, .68]].map(([a, b]) => new THREE.Vector2(a, b)), 18);
    P(st, cb, M.blackDS, 0, .8, -1.8, -PI / 2); P(st, tor(.72, .04, PI * 2, 6, 22), M.silver, 0, .8, -2.48);
    glowDisc(g, U, 0x9ff4ff, .55, [0, .8, -2.3]);
    for (const z of [1.15, .9, .65, -1.15, -1.4]) { P(st, tor(.085, .025, PI * 2, 6, 12), M.silver, 0, 1.25, z, PI / 2); P(st, cyl(.05, .05, .02, 8), basic(0x050505), 0, 1.25, z); }
    alongZ(st, .03, .03, 1.2, M.silver, .3, 1.18, .8, 6); alongZ(st, .03, .03, 1.0, M.silver, -.3, 1.18, -1.3, 6); for (const z of [.4, 1.2]) P(st, box(.14, .03, .1), M.silver, .3, 1.21, z);
    P(st, tor(.36, .05, PI * 2, 6, 16), M.silver, 0, 1.22, -.3, PI / 2); P(st, box(.6, .25, .04), M.glass, 0, 1.33, .15, -.5); driver(st, 0, 1.38, -.35, M.silver, basic(0x3080ff));
    for (const s of [-1, 1]) { P(st, box(.45, .4, 1.6), M.black, s * .62, .6, -.4); P(st, box(.47, .06, 1.62), M.silver, s * .62, .82, -.4);
      for (const z of [1.5, -1.4]) { alongX(st, .035, .9, M.silver, s * .85, .62, z, 6); alongX(st, .035, .9, M.silver, s * .85, .82, z - .1, 6); } }
    P(st, box(2.9, .06, .45), M.silver, 0, .3, 2.35); for (const s of [-1, 1]) P(st, box(.05, .3, .55), M.black, s * 1.45, .4, 2.35); alongZ(st, .04, .04, .5, M.silver, 0, .5, 2.3, 6);
    P(st, box(2.2, .08, .5), M.black, 0, 1.7, -1.9, -.1); for (const s of [-1, 1]) { P(st, box(.05, .45, .65), M.silver, s * 1.1, 1.6, -1.9); P(st, box(.07, .6, .1), M.silver, s * .35, 1.35, -1.9); }
    for (const s of [-1, 1]) { P(st, box(.3, .1, .05), M.tail, s * .5, .6, -1.25); } headlights(st, .3, .62, 2.6, .25, .08);
    wheels(g, U, { r: .52, w: .42, x: 1.35, zf: 1.5, zr: -1.4, spokes: 10, spokeW: .035, spokeMat: M.silver, rimMat: M.black, lip: M.silver, hub: basic(0x9ff4ff) });
    return finish(g, st, U, [1.6, 2.9]);
  },
  snare() { // Snare Kart: kart frame, red snare drum engine with chrome lugs, tom nose, drumhead wheels, tapping sticks
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), red = paint(0xd02030);
    P(st, box(2.0, .16, 3.9), M.black, 0, .35, 0); for (const s of [-1, 1]) alongZ(st, .06, .06, 2.0, M.chrome, s * 1.0, .5, 0, 8);
    chassis(st, [[.6, .36], [.6, .72], [1.6, .7], [2.3, .5], [2.4, .36]], 1.3, red, .1);
    alongZ(st, .34, .34, .42, red, 0, 1.0, 1.65, 18); P(st, cyl(.33, .33, .03, 18), M.pearl, 0, 1.0, 1.87, PI / 2); P(st, tor(.35, .035, PI * 2, 6, 18), M.chrome, 0, 1.0, 1.87);
    P(st, box(.9, .45, .3), M.black, 0, .75, -.45); driver(st, 0, 1.15, -.1, red, basic(0xffffff)); P(st, tor(.18, .03, PI * 2, 6, 14), M.chrome, 0, 1.0, .45, -.6);
    P(st, tor(.5, .05, PI, 6, 14), M.chrome, 0, .95, -.65);
    P(st, cyl(.8, .8, .5, 24), red, 0, .85, -1.3); P(st, cyl(.79, .79, .03, 24), M.pearl, 0, 1.115, -1.3);
    for (const y of [1.1, .6]) P(st, tor(.81, .05, PI * 2, 6, 24), M.chrome, 0, y, -1.3, PI / 2);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; P(st, box(.09, .22, .1), M.chrome, Math.cos(a) * .84, .85, -1.3 + Math.sin(a) * .84, 0, -a); }
    P(st, box(.06, .14, .2), M.chrome, .86, .85, -1.3);
    alongX(st, .06, 2.1, M.chrome, 0, .45, -2.1, 8); alongX(st, .06, 1.9, M.chrome, 0, .45, 2.5, 8);
    for (const s of [-1, 1]) P(st, box(.3, .12, .05), M.tail, s * .55, .55, -2.0); headlights(st, .38, .5, 2.42, .3, .1);
    const sticks = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .32, 1.32, -.55); g.add(p); const ps = new THREE.Group();
      P(ps, cyl(.025, .04, 1.0, 8), M.stick, 0, 0, -.5, PI / 2 + .1); P(ps, sph(.055, 8, 6), M.stick, 0, -.05, -1.0); p.add(bake(ps)); return p; });
    wheels(g, U, { r: .46, w: .46, x: 1.18, zf: 1.45, zr: -1.4, rim: 'drum', hub: basic(0xff3040) });
    U.tick = (c, dt, pow, t) => { const k = Math.min(1, c.v / 25) + pow; sticks.forEach((p, i) => { p.rotation.x = .25 - Math.abs(Math.sin(t * (4 + 12 * k) + i * PI / 2)) * .3 * Math.min(1, k + .3); }); };
    return finish(g, st, U, [1.5, 2.6]);
  },
  horn() { // French Horn Cruiser: violet cruiser, spinning coiled tubing on the rear deck, rotary valves, flared bell
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), vio = paint(0x6a30b8);
    chassis(st, [[-2.3, .32], [-2.3, .85], [-1.6, .98], [-.6, 1.05], [.6, .95], [1.7, .7], [2.45, .48], [2.5, .32]], 1.95, vio);
    P(st, box(2.2, .22, 3.95), M.rubber, 0, .3, 0); P(st, box(2.08, .05, .1), M.brass, 0, .7, 2.2); P(st, box(.05, .05, 4.2), M.brass, 1.05, .62, 0); P(st, box(.05, .05, 4.2), M.brass, -1.05, .62, 0);
    canopy(st, .45, 1.0, .72, .5, 1.15); driver(st, 0, 1.24, .35, M.pearl, basic(0xffc030));
    const coilY = new THREE.Group(); coilY.position.set(0, 1.78, -1.25); coilY.rotation.y = .75; g.add(coilY); const coil = new THREE.Group(); coilY.add(coil); const cs = new THREE.Group();
    for (const R of [.72, .56, .4]) P(cs, tor(R, .07, PI * 2, 8, 28), M.brass, 0, 0, 0, 0, PI / 2);
    for (const a of [0, PI / 2]) P(cs, cyl(.035, .035, 1.44, 6), M.brass, 0, 0, 0, a);
    P(cs, cyl(.13, .13, .3, 12), M.chrome, 0, 0, 0, 0, 0, PI / 2); coil.add(bake(cs));
    for (const z of [-.95, -1.25, -1.55]) { P(st, cyl(.1, .1, .22, 12), M.chrome, -.32, 1.3, z, 0, 0, PI / 2); P(st, box(.04, .04, .22), M.pearl, -.45, 1.38, z + .08); }
    st.add(new THREE.Mesh(tube([[.1, 1.45, -1.45], [.45, 1.26, -1.62], [.62, 1.18, -1.8]], .1, 10), M.brass));
    glowDisc(g, U, 0xc080ff, .52, bell(st, M.brassDS, .62, 1.18, -1.8, .22, .16, -PI / 2).map((v, i) => i === 2 ? v + .2 : v));
    st.add(new THREE.Mesh(tube([[-.55, .9, 1.95], [-.78, 1.04, .9], [-.75, 1.18, -.3], [-.1, 1.5, -1.05]], .06, 20), M.brass)); P(st, mouthG, M.chrome, -.55, .88, 1.95, PI / 2, 0, 0, .9, .9, .9);
    P(st, box(1.6, .05, .35), vio, 0, 1.12, -2.2, -.3);
    lights(st, -2.4, .74, .75, 2.6, .5, .7);
    wheels(g, U, { r: .55, w: .5, x: 1.18, zf: 1.5, zr: -1.5, spokes: 5, spokeW: .2, spokeMat: M.chrome, rimMat: M.brass, hub: basic(0xb070ff) });
    U.tick = (c, dt, pow) => { coil.rotation.x += dt * (c.v * .08 + pow * 6); };
    return finish(g, st, U, [1.55, 2.8]);
  },
  xylo() { // Xylophone Speedster: rosewood body, rainbow bars on hood + deck, silver resonator side pods, mallet antennas
    const g = new THREE.Group(), st = new THREE.Group(), U = newU();
    chassis(st, [[-2.3, .32], [-2.3, .82], [-1.2, .92], [-.3, 1.0], [.9, .82], [1.9, .6], [2.5, .44], [2.55, .32]], 1.9, M.wood);
    P(st, box(2.2, .22, 3.95), M.rubber, 0, .3, 0);
    const RB = [0xff3b3b, 0xff9a2a, 0xffe03a, 0x3ad06a, 0x3a8cff, 0xa050ff, 0xff50b0, 0x40e0d0].map(c => std(c, .2, .25, { emissive: c, emissiveIntensity: .18 }));
    for (let k = 0; k < 6; k++) { const z = 1.95 - k * .2, y = .6 + (1.9 - z) * .22 + .17; P(st, box(1.0 + k * .12, .07, .15), RB[k], 0, y, z, .22); }
    for (const x of [-.4, .4]) P(st, box(.04, .04, 1.2), M.chrome, x, .78, 1.5, .22);
    for (let k = 0; k < 4; k++) { const z = -1.25 - k * .2; P(st, box(1.5 - k * .1, .07, .15), RB[(k + 4) % 8], 0, 1.06 - k * .03, z); }
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const h = .75 - k * .08; P(st, cyl(.09, .09, h, 12), M.silver, s * 1.06, .95 - h / 2, -.7 + k * .35); P(st, cyl(.1, .1, .03, 12), M.chrome, s * 1.06, .96, -.7 + k * .35); }
    canopy(st, -.35, .98, .68, .48, 1.15); driver(st, 0, 1.2, -.45, paint(0x3ad06a), basic(0xffd040));
    const mallets = [-1, 1].map((s, i) => { const p = new THREE.Group(); p.position.set(s * .75, 1.0, -2.1); g.add(p); const ms = new THREE.Group();
      P(ms, cyl(.03, .03, 1.3, 6), M.stick, 0, .65, 0); P(ms, sph(.15, 10, 8), paint(i ? 0xff50b0 : 0x40e0d0), 0, 1.35, 0); p.add(bake(ms)); p.rotation.x = -.35; return p; });
    lights(st, -2.4, .7, .75, 2.6, .5, .7);
    const hub = new THREE.MeshBasicMaterial({ color: 0xff4040 });
    wheels(g, U, { r: .55, w: .5, x: 1.18, zf: 1.5, zr: -1.5, spokes: 6, spokeMat: M.wood, rimMat: M.chrome, hub });
    U.tick = (c, dt, pow, t) => { hub.color.setHSL((t * .25) % 1, 1, .55); mallets.forEach((m, i) => { m.rotation.x = -.35 - Math.min(.4, c.v * .006) + Math.sin(t * 9 + i) * .06; m.rotation.z = Math.sin(t * 7 + i * 2) * .07; }); };
    return finish(g, st, U, [1.55, 2.8]);
  },
};
export function buildCar(type) { curLook = LOOKS[type] || LOOKS.trombone; return BUILD[type](); }
export const CAR_TYPES = Object.keys(BUILD);
