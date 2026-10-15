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
  for (const s of [-1, 1]) { P(d, cyl(.055, .05, .36, 8), helm, s * .19, -.31, .16, 2.08); P(d, sph(.055, 8, 6), skin, s * .18, -.4, .32); // arms + hands
    P(d, cyl(.075, .07, .38, 8), helm, s * .2, -.6, .15, PI / 2); P(d, cyl(.065, .06, .3, 8), helm, s * .21, -.74, .33); P(d, box(.11, .08, .2), M.black, s * .21, -.9, .38); } // legs + shoes
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
  else if (L.style === 'long') { P(d, sph(.2, 12, 10), hair, 0, -.1, -.36, 1.0, 0, 0, 1, 1.5, .5); P(d, sph(.14, 10, 8), hair, 0, -.22, -.52, 1.1, 0, 0, 1, 1.4, .5); P(d, sph(.2, 12, 8), hair, 0, -.08, -.16, 0, 0, 0, 1, .7, 1); for (const s of [-1, 1]) P(d, box(.07, .34, .12), hair, s * .21, -.14, -.02); }
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
// a bell; dir 'back' (-z), 'fwd' (+z) or tilt angle for up. returns mouth center
function bell(st, mat, x, y, z, s, sl, rx) { P(st, bellG, mat, x, y, z, rx, 0, 0, s, sl, s); const L = 6 * sl; return [x, y + Math.cos(rx) * L, z + Math.sin(rx) * L]; }
function glowDisc(g, U, color, r, [x, y, z], rx = 0) { const m = P(g, circ(r), glowMat(color), x, y, z, rx); U.glows.push(m); return m; }
// wheels: template baked once per car and cloned (shared geometry) onto 4 spin groups
function wheelTpl(o) {
  const { r, w } = o, tpl = new THREE.Group(), ox = w / 2 + .01;
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
  return bake(tpl);
}
function wheels(g, U, o) {
  const { r, w, x, zf, zr } = o, baked = wheelTpl(o); U.r = r;
  const front = o.rf ? wheelTpl({ ...o, r: o.rf, w: o.wf || w }) : baked, rF = o.rf || r, xF = o.xf || x;
  for (const [sx, z] of [[-1, zf], [1, zf], [-1, zr], [1, zr]]) { const f = z === zf, rr = f ? rF : r;
    const steer = new THREE.Group(); steer.position.set(sx * (f ? xF : x), rr, z); g.add(steer); const spin = new THREE.Group(); spin.userData.k = r / rr; steer.add(spin);
    const side = (f ? front : baked).clone(); side.rotation.y = sx < 0 ? PI : 0; spin.add(side); U.wheels.push(spin); if (f) U.front.push(steer);
  }
}
function finish(g, st, U, shadow) { g.add(bake(st)); if (curBeams.children.length) { U.beam = bake(curBeams); g.add(U.beam); } curBeams = new THREE.Group(); g.userData.anim = U; return { g, shadow }; }
const newU = () => ({ wheels: [], front: [], glows: [], r: .55, tick: null });

// ================= the cars: the instrument IS the vehicle =================
// helpers: straight rod between two points, round lamp (headlight) mounted on the instrument, axle with struts, flared bell
function rod(par, a, b, r, mat, s = 8) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const m = new THREE.Mesh(cyl(r, r, L, s), mat); m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); par.add(m); return m; }
function lamp(par, x, y, z, r = .11) { P(par, cyl(r + .03, r + .03, .08, 16), M.chrome, x, y, z, PI / 2); P(par, circ(r), M.head, x, y, z + .045); P(par, circ(r * 2.3), haloM, x, y, z + .06); P(curBeams, beamG, beamM, x, .06, z + .1); }
function axle(st, z, y, x, attach) { alongX(st, .05, 2 * x, M.chrome, 0, y, z, 8); for (const a of attach) rod(st, [a[0], y, z], a, .045, M.chrome); }
const flare = (rb, rm, L, p = 4) => G(`fl${rb},${rm},${L},${p}`, () => { const v = []; for (let i = 0; i <= 16; i++) { const t = i / 16; v.push(new THREE.Vector2(rb + (rm - rb) * Math.pow(t, p), t * L)); } return new THREE.LatheGeometry(v, 26); });
const bellBack = (st, mat, x, y, z, rb, rm, L, p) => { P(st, flare(rb, rm, L, p), mat, x, y, z, -PI / 2); P(st, tor(rm, .035, PI * 2, 6, 26), M.brass, x, y, z - L); return [x, y, z - L + .12]; };
const TB = (pts, r, mat, st, seg = 32) => st.add(new THREE.Mesh(tube(pts, r, seg), mat));
const BUILD = {
  trombone() { // a whole trombone lying flat: slide = nose, bell faces back, driver astride the tuning slide
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), Y = .95;
    for (const x of [-.25, .25]) { alongZ(st, .065, .065, 2.3, M.chrome, x, Y, .95, 10); P(st, tor(.085, .03, PI * 2, 6, 12), M.brass, x, Y, -.2); }
    rod(st, [-.25, Y, .05], [.25, Y, .05], .04, M.brass); P(st, sph(.05), M.brass, 0, Y, .05);                       // inner-slide brace
    const slide = new THREE.Group(); g.add(slide); const ss = new THREE.Group();
    for (const x of [-.25, .25]) { alongZ(ss, .088, .088, 2.15, M.brass, x, Y, 2.05, 12); P(ss, tor(.1, .025, PI * 2, 6, 12), M.brass, x, Y, 1.0); }
    P(ss, tor(.25, .088, PI, 8, 18), M.brass, 0, Y, 3.12, PI / 2); P(ss, sph(.1), M.black, 0, Y, 3.45);              // slide crook + rubber stopper
    rod(ss, [-.25, Y, 2.65], [.25, Y, 2.65], .04, M.brass); rod(ss, [-.48, Y, 2.95], [.48, Y, 2.95], .035, M.chrome);
    lamp(ss, -.48, Y, 2.96, .1); lamp(ss, .48, Y, 2.96, .1); slide.add(bake(ss));
    P(st, mouthG, M.chrome, -.25, Y, -.22, -PI / 2, 0, 0, 1.1, 1.1, 1.1);                                              // mouthpiece faces the driver
    TB([[.25, Y, -.22], [.25, Y + .02, -.7], [.12, Y + .05, -1.2], [0, Y + .06, -1.6]], .085, M.brass, st);           // bell section
    TB([[.18, Y, -.75], [.2, Y - .2, -.82], [.2, Y - .32, -1.0], [.2, Y - .2, -1.2], [.1, Y + .03, -1.28]], .07, M.brass, st); // tuning slide hairpin
    rod(st, [-.25, Y, -.12], [.25, Y, -.12], .035, M.brass);                                                           // bell brace / slide lock
    glowDisc(g, U, 0xff8a20, .62, bellBack(st, M.brassDS, 0, Y + .06, -1.6, .085, .82, 1.35, 4));
    wheels(g, U, { r: .5, w: .45, x: 1.08, zf: 1.75, zr: -2.0, spokes: 6, hub: basic(0xffd040) });
    axle(st, 1.75, .5, 1.08, [[-.25, Y, 1.75], [.25, Y, 1.75]]); axle(st, -2.0, .5, 1.08, [[-.15, Y - .1, -2.0], [.15, Y - .1, -2.0]]);
    driver(st, 0, 1.85, -1.0, M.pearl, basic(0xffb020));
    U.tick = (c, dt, pow) => { slide.position.z += (pow * .7 - slide.position.z) * Math.min(1, dt * 10); };
    return finish(g, st, U, [1.4, 3.2]);
  },
  trumpet() { // a whole trumpet: 3 upright valves, mouthpiece forward, bell back, driver behind the valves
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), pist = [];
    [.55, .25, -.05].forEach(z => { P(st, cyl(.15, .15, .75, 16), M.brass, 0, 1.05, z); P(st, cyl(.17, .17, .07, 16), M.chrome, 0, 1.46, z); P(st, cyl(.16, .16, .1, 16), M.chrome, 0, .64, z);
      const p = new THREE.Group(); p.position.set(0, 0, z); g.add(p); P(p, cyl(.035, .035, .22, 8), M.chrome, 0, 1.58, 0); P(p, cyl(.11, .11, .06, 16), M.pearl, 0, 1.7, 0); pist.push(p); });
    P(st, mouthG, M.chrome, -.24, .8, 2.3, PI / 2, 0, 0, 1.1, 1.1, 1.1);
    TB([[-.24, .8, 2.3], [-.24, .8, 1.0], [-.24, .79, -.6], [-.24, .8, -1.12], [-.24, .93, -1.32], [-.22, 1.04, -1.12], [-.12, 1.02, -.4], [0, .95, -.08]], .06, M.brass, st, 48); // leadpipe + main tuning slide
    TB([[0, 1.0, .62], [.04, 1.0, 1.35], [.12, 1.12, 1.72], [.22, 1.25, 1.4], [.24, 1.27, .4], [.24, 1.27, -.7], [.13, 1.27, -1.25], [0, 1.27, -1.5]], .075, M.brass, st, 48);        // front bow + bell pipe
    TB([[.12, .9, .52], [.38, .9, .52], [.46, .9, .4], [.38, .9, .28], [.12, .9, .28]], .045, M.brass, st, 16);        // 1st valve slide
    TB([[-.12, .98, -.05], [-.42, .98, -.05], [-.55, .98, -.22], [-.42, .98, -.4], [-.12, .98, -.32]], .045, M.brass, st, 16); P(st, tor(.06, .015, PI * 2, 6, 10), M.brass, -.55, .98, -.22, PI / 2);
    rod(st, [0, 1.25, .25], [.24, 1.27, .25], .025, M.brass); P(st, tor(.05, .015, PI * 2, 6, 10), M.brass, .1, 1.3, .55, PI / 2); // brace + finger hook
    glowDisc(g, U, 0xff5020, .55, bellBack(st, M.brassDS, 0, 1.27, -1.5, .075, .74, 1.5, 4));
    lamp(st, -.06, 1.12, 1.8, .09); lamp(st, .32, 1.12, 1.62, .09);
    wheels(g, U, { r: .5, w: .45, x: 1.08, zf: 1.4, zr: -1.95, spokes: 5, spokeW: .12, spokeMat: M.chrome, rimMat: M.brass, hub: basic(0xff3048) });
    axle(st, 1.4, .5, 1.08, [[-.24, .8, 1.4], [.04, 1.0, 1.4]]); axle(st, -1.95, .5, 1.08, [[-.1, 1.2, -1.95], [.1, 1.2, -1.95]]);
    driver(st, 0, 2.0, -.75, M.pearl, basic(0x40e0ff));
    U.tick = (c, dt, pow, t) => { const k = Math.min(1, c.v / 30) + pow; pist.forEach((p, i) => { p.position.y = -Math.max(0, Math.sin(t * (6 + k * 10) + i * 2.1)) * .12 * Math.min(1, k + .2); }); };
    return finish(g, st, U, [1.4, 3.0]);
  },
  sax() { // a whole alto sax on its side: neck + mouthpiece forward, conical body, U bow, bell flaring up at the back
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), Y = .95, rz = z => .13 + .2 * (1.6 - z) / 3.2;
    alongZ(st, .13, .33, 3.2, M.brass, 0, Y, 0, 22);
    TB([[0, Y + .02, 1.55], [0, Y + .06, 1.95], [0, Y + .2, 2.25], [0, Y + .26, 2.5]], .07, M.brass, st, 20);
    P(st, cyl(.06, .12, .45, 14), M.black, 0, Y + .27, 2.72, PI / 2); P(st, tor(.11, .03, PI * 2, 6, 12), M.silver, 0, Y + .27, 2.62);
    rod(st, [0, Y + .1, 1.85], [.0, Y + .2, 2.1], .02, M.chrome); P(st, cyl(.06, .06, .03, 10), M.brass, 0, Y + .25, 2.1);   // octave key
    TB([[0, Y, -1.55], [0, Y - .02, -1.95], [0, Y + .32, -2.28], [0, Y + .78, -2.05], [0, Y + .92, -1.65]], .32, M.brass, st, 24); // bow
    P(st, tor(.33, .03, PI * 2, 6, 20), M.brass, 0, Y, -1.58); P(st, tor(.33, .03, PI * 2, 6, 20), M.brass, 0, Y + .9, -1.66, PI / 2 - .5);
    P(st, flare(.32, .74, .85, 3), M.brassDS, 0, Y + .9, -1.66, .5); P(st, tor(.74, .04, PI * 2, 6, 26), M.brass, 0, Y + .9 + .746, -1.66 + .407, PI / 2 + .5);
    glowDisc(g, U, 0xff60e0, .58, [0, Y + 1.58, -1.32], -PI / 2 + .5);
    [1.25, .95, .65, .3, -.05, -.4, -.75, -1.05, -1.35].forEach((z, i) => { const r = rz(z), a = .55; P(st, cyl(.11 + i * .008, .11 + i * .008, .06, 14), M.brass, Math.sin(a) * (r + .02), Y + Math.cos(a) * (r + .02), z, 0, 0, -a); });
    [1.05, .8, .55, -.25, -.5, -.75].forEach(z => { const r = rz(z); P(st, cyl(.02, .02, .07, 6), M.chrome, -.06, Y + r + .02, z); P(st, cyl(.06, .06, .04, 12), M.pearl, -.06, Y + r + .06, z); });
    rod(st, [.17, Y + .2, 1.35], [.3, Y + .26, -1.45], .022, M.chrome); rod(st, [.2, Y + .12, 1.0], [.32, Y + .16, -1.2], .018, M.chrome);
    P(st, tor(.22, .02, PI, 6, 12), M.chrome, .3, Y - .1, -1.6, 0, PI / 2);                                             // key guard
    lamp(st, -.22, Y, 1.66, .09); lamp(st, .22, Y, 1.66, .09); rod(st, [-.22, Y, 1.62], [.22, Y, 1.62], .025, M.chrome);
    wheels(g, U, { r: .5, w: .45, x: 1.05, zf: 1.4, zr: -1.75, spokes: 10, spokeW: .04, spokeMat: M.chrome, rimMat: M.brass, hub: basic(0xff40c0) });
    axle(st, 1.4, .5, 1.05, [[-.08, Y - .1, 1.4], [.08, Y - .1, 1.4]]); axle(st, -1.75, .5, 1.05, [[-.15, Y - .25, -1.85], [.15, Y - .25, -1.85]]);
    driver(st, 0, 1.9, .2, M.pearl, basic(0xff40c0));
    return finish(g, st, U, [1.4, 3.0]);
  },
  tuba() { // sousaphone: big brass coil standing like a ring around the driver, giant bell facing forward overhead
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), CY = 1.35, CZ = -.2;
    P(st, tor(1.0, .19, PI * 2, 10, 36), M.brass, 0, CY, CZ, 0, PI / 2); P(st, tor(.82, .1, PI * 2, 8, 32), M.brass, .24, CY, CZ, 0, PI / 2);
    for (const a of [.6, 2.4]) rod(st, [0, CY + Math.sin(a) * 1.0, CZ + Math.cos(a) * 1.0], [.24, CY + Math.sin(a) * .82, CZ + Math.cos(a) * .82], .05, M.brass);
    TB([[0, CY + .95, CZ - .3], [0, CY + 1.2, CZ - .1], [0, CY + 1.2, CZ + .3]], .2, M.brass, st, 14);                  // bell neck
    P(st, flare(.2, .82, 1.35, 3.2), M.brassDS, 0, CY + 1.2, CZ + .3, PI / 2); P(st, tor(.82, .04, PI * 2, 6, 30), M.brass, 0, CY + 1.2, CZ + 1.65);
    [.3, .1, -.1].forEach(z => { P(st, cyl(.09, .09, .5, 14), M.brass, .45, 1.0, z); P(st, cyl(.11, .11, .05, 14), M.chrome, .45, 1.27, z); P(st, cyl(.07, .07, .05, 12), M.pearl, .45, 1.38, z); });
    TB([[.45, .78, .3], [.3, .7, .55], [.1, .95, .6], [0, 1.25, .35], [0, 1.3, .15]], .05, M.brass, st, 20); P(st, mouthG, M.chrome, 0, 1.3, .15, -PI / 2);   // gooseneck + mouthpiece
    lamp(st, -.52, CY + .7, CZ + 1.7, .12); lamp(st, .52, CY + .7, CZ + 1.7, .12);                                    // lamps in the bell rim
    wheels(g, U, { r: .7, w: .6, x: 1.25, zf: 1.35, zr: -1.45, spokes: 6, spokeW: .14, rimMat: M.chrome, hub: basic(0x40e0ff), lip: M.brass });
    axle(st, 1.35, .7, 1.25, [[-.12, CY - .3, CZ + .92], [.12, CY - .3, CZ + .92]]); axle(st, -1.45, .7, 1.25, [[-.12, CY - .3, CZ - .92], [.12, CY - .3, CZ - .92]]);
    driver(st, 0, 1.38, -.3, paint(0xff8a20), basic(0x40e0ff));
    return finish(g, st, U, [1.7, 2.9]);
  },
  clarinet() { // long black clarinet dragster with silver keys; driver near the barrel
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), Y = .85;
    alongZ(st, .08, .2, .55, M.black, 0, Y, 2.88, 16); P(st, box(.14, .02, .5), paint(0xe8d8a0), 0, Y - .16, 2.85, .2); P(st, tor(.19, .03, PI * 2, 6, 16), M.silver, 0, Y, 2.72);
    alongZ(st, .27, .27, .5, M.black, 0, Y, 2.35, 18); for (const z of [2.6, 2.1]) P(st, tor(.27, .03, PI * 2, 6, 20), M.silver, 0, Y, z);     // barrel
    alongZ(st, .24, .24, 2.0, M.black, 0, Y, 1.1, 18); alongZ(st, .25, .25, 2.0, M.black, 0, Y, -.9, 18); for (const z of [.1, -1.9]) P(st, tor(.255, .03, PI * 2, 6, 20), M.silver, 0, Y, z);
    P(st, flare(.25, .58, .85, 2.5), M.blackDS, 0, Y, -1.9, -PI / 2); P(st, tor(.58, .03, PI * 2, 6, 22), M.silver, 0, Y, -2.75);
    glowDisc(g, U, 0x9ff4ff, .45, [0, Y, -2.62]);
    for (const z of [1.9, 1.62, 1.34, -.45, -.72, -1.0]) { P(st, tor(.075, .022, PI * 2, 6, 12), M.silver, 0, Y + .245, z, PI / 2); P(st, cyl(.045, .045, .02, 8), basic(0x050505), 0, Y + .25, z); }
    for (const z of [.9, .6, -1.3, -1.55]) P(st, cyl(.06, .06, .03, 10), M.silver, .17, Y + .17, z, 0, 0, -.8);
    rod(st, [.14, Y + .2, 2.0], [.14, Y + .2, .2], .022, M.silver); rod(st, [.2, Y + .12, 1.6], [.2, Y + .12, .4], .02, M.silver); rod(st, [.15, Y + .2, -.1], [.15, Y + .2, -1.6], .022, M.silver);
    rod(st, [-.16, Y + .18, 1.0], [-.16, Y + .18, -.3], .02, M.silver); P(st, box(.05, .1, .12), M.silver, 0, Y - .27, 1.0); // side keys + thumb rest
    lamp(st, -.3, Y, 2.66, .08); lamp(st, .3, Y, 2.66, .08);
    wheels(g, U, { r: .72, rf: .42, w: .5, wf: .3, x: 1.12, xf: .72, zf: 2.25, zr: -1.45, spokes: 10, spokeW: .035, spokeMat: M.silver, rimMat: M.black, lip: M.silver, hub: basic(0x9ff4ff) });
    axle(st, 2.25, .42, .72, [[0, Y - .2, 2.25]]); axle(st, -1.45, .72, 1.12, [[0, Y - .1, -1.45]]);
    driver(st, 0, 1.85, 1.55, M.silver, basic(0x3080ff));
    return finish(g, st, U, [1.3, 3.1]);
  },
  snare() { // a snare drum lying flat is the body; drumhead wheels; driver sits on the head drumming with sticks
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), red = paint(0xd02030), R = 1.05;
    P(st, cyl(R, R, .5, 32), red, 0, .8, 0); P(st, cyl(R - .01, R - .01, .02, 32), M.pearl, 0, 1.06, 0); P(st, cyl(R - .01, R - .01, .02, 32), M.pearl, 0, .54, 0);
    for (const y of [1.07, .53]) P(st, tor(R + .02, .045, PI * 2, 6, 36), M.chrome, 0, y, 0, PI / 2);
    for (let k = 0; k < 10; k++) { const a = k * PI / 5 + PI / 10, cx = Math.cos(a), cz = Math.sin(a); P(st, box(.09, .22, .09), M.chrome, cx * (R + .04), .8, cz * (R + .04), 0, -a);
      for (const [y0, y1] of [[.92, 1.07], [.53, .68]]) rod(st, [cx * (R + .05), y0, cz * (R + .05)], [cx * (R + .05), y1, cz * (R + .05)], .015, M.chrome, 6); }
    P(st, box(.08, .2, .22), M.chrome, R + .07, .8, 0); P(st, box(.06, .08, .08), M.black, R + .12, .88, 0);           // strainer + throw-off
    for (let k = -3; k <= 3; k++) P(st, box(.015, .015, 1.7), M.silver, k * .07, .52, 0);                                // snare wires
    P(st, circ(.07), basic(0xffd040), 0, .8, R + .01);                                                                   // badge
    lamp(st, -.42, .8, .97, .1); lamp(st, .42, .8, .97, .1);
    wheels(g, U, { r: .46, w: .42, x: 1.32, zf: .85, zr: -.85, rim: 'drum', hub: basic(0xff3040) });
    alongX(st, .05, 2.64, M.chrome, 0, .46, .85, 8); alongX(st, .05, 2.64, M.chrome, 0, .46, -.85, 8);
    driver(st, 0, 1.83, -.45, red, basic(0xffffff));
    const sticks = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .26, 1.31, .0); g.add(p); const ps = new THREE.Group();
      P(ps, cyl(.022, .035, .75, 8), M.stick, 0, 0, .37, PI / 2); P(ps, sph(.045, 8, 6), M.stick, 0, 0, .75); p.add(bake(ps)); return p; });
    U.tick = (c, dt, pow, t) => { const k = Math.min(1, c.v / 25) + pow; sticks.forEach((p, i) => { p.rotation.x = .25 + Math.abs(Math.sin(t * (4 + 12 * k) + i * PI / 2)) * -.45 * Math.min(1, k + .3) + .2; }); };
    return finish(g, st, U, [1.6, 1.6]);
  },
  horn() { // French horn: round coiled body (nearly flat), rotary valves in the middle, big bell flaring back
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), CY = .95, CZ = .1;
    const coil = new THREE.Group(); coil.position.set(0, CY, CZ); coil.rotation.x = .18; st.add(coil);
    [.95, .82, .69].forEach((R, i) => P(coil, tor(R, .07, PI * 2, 8, 40), M.brass, 0, i * .05, 0, PI / 2));
    [.0, .2, -.2].forEach((x, i) => { P(coil, cyl(.12, .12, .22, 14), M.brass, x, .2, -.1); P(coil, cyl(.13, .13, .03, 14), M.chrome, x, .32, -.1); });
    for (let k = 0; k < 4; k++) { const a = k * PI / 2 + .4; rod(coil, [0, .2, -.1], [Math.cos(a) * .69, .1, Math.sin(a) * .69], .04, M.brass); }
    TB([[-.25, 1.0, 1.55], [-.4, 1.02, 1.0], [-.3, 1.08, .55], [-.1, 1.12, .1]], .045, M.brass, st, 20); P(st, mouthG, M.chrome, -.25, 1.0, 1.55, PI / 2, 0, 0, 1.0, 1.0, 1.0);
    const lev = [-1, 0, 1].map(i => { const p = new THREE.Group(); p.position.set(.35 + i * .02, 1.2, .35 - i * .14); g.add(p); P(p, box(.05, .03, .22), M.pearl, 0, 0, .08); return p; });
    TB([[.95, CY + .05, CZ - .1], [.85, CY + .05, CZ - .6], [.55, CY + .1, -.8]], .1, M.brass, st, 16);
    glowDisc(g, U, 0xc080ff, .62, bellBack(st, M.brassDS, .55, CY + .1, -.8, .1, .8, 1.6, 4));
    lamp(st, -.42, CY + .12, CZ + .9, .1); lamp(st, .42, CY + .12, CZ + .9, .1);
    wheels(g, U, { r: .5, w: .45, x: 1.18, zf: 1.4, zr: -1.4, spokes: 5, spokeW: .2, spokeMat: M.chrome, rimMat: M.brass, hub: basic(0xb070ff) });
    axle(st, 1.4, .5, 1.18, [[-.3, CY + .05, CZ + .95 * .9], [.3, CY + .05, CZ + .95 * .9]]); axle(st, -1.4, .5, 1.18, [[-.3, CY - .05, CZ - .9], [.3, CY - .05, CZ - .9]]);
    driver(st, 0, 1.95, -.05, M.pearl, basic(0xffc030));
    U.tick = (c, dt, pow, t) => { lev.forEach((p, i) => { p.rotation.x = Math.max(0, Math.sin(t * 5 + i * 2)) * .3 * Math.min(1, c.v / 20 + .2); }); };
    return finish(g, st, U, [1.4, 2.9]);
  },
  xylo() { // xylophone: trapezoid rosewood frame, graduated rainbow bars, resonator tubes, driver at the low end with mallets
    const g = new THREE.Group(), st = new THREE.Group(), U = newU(), NB = 11, Y = 1.0;
    for (let k = 0; k < NB; k++) { const z = 2.0 - k * .34, L = 1.0 + k * .1, c = new THREE.Color().setHSL(k / NB * .85, .85, .55).getHex();
      P(st, box(L, .09, .26), std(c, .15, .3, { emissive: c, emissiveIntensity: .15 }), 0, Y, z); const h = .22 + k * .03;
      P(st, cyl(.08, .08, h, 12), M.silver, 0, Y - .06 - h / 2, z); for (const s of [-1, 1]) P(st, cyl(.012, .012, .1, 6), M.chrome, s * (L / 2 - .1), Y + .02, z + .17); }
    for (const s of [-1, 1]) { rod(st, [s * .58, Y - .08, 2.25], [s * 1.08, Y - .08, -1.6], .06, M.wood); rod(st, [s * .5, Y - .02, 2.2], [s * 1.0, Y - .02, -1.55], .012, basic(0x301a10), 4);
      rod(st, [s * .58, Y - .08, 2.25], [s * .58, .55, 2.25], .05, M.wood); }
    rod(st, [-.58, Y - .08, 2.25], [.58, Y - .08, 2.25], .06, M.wood); rod(st, [-1.08, Y - .08, -1.6], [1.08, Y - .08, -1.6], .07, M.wood);
    P(st, box(.7, .1, .45), M.wood, 0, Y - .05, -1.85);                                                                  // frame end-board the driver sits on
    lamp(st, -.42, Y - .08, 2.32, .1); lamp(st, .42, Y - .08, 2.32, .1);
    const hub = new THREE.MeshBasicMaterial({ color: 0xff4040 });
    wheels(g, U, { r: .5, w: .45, x: 1.22, zf: 1.6, zr: -1.45, spokes: 6, spokeMat: M.wood, rimMat: M.chrome, hub });
    axle(st, 1.6, .5, 1.22, [[-.66, Y - .08, 1.6], [.66, Y - .08, 1.6]]); axle(st, -1.45, .5, 1.22, [[-1.06, Y - .08, -1.45], [1.06, Y - .08, -1.45]]);
    driver(st, 0, 1.73, -1.95, paint(0x3ad06a), basic(0xffd040));
    const mallets = [-1, 1].map((s, i) => { const p = new THREE.Group(); p.position.set(s * .26, 1.21, -1.49); g.add(p); const ms = new THREE.Group();
      P(ms, cyl(.02, .02, .9, 6), M.stick, 0, 0, .45, PI / 2); P(ms, sph(.09, 10, 8), paint(i ? 0xff50b0 : 0x40e0d0), 0, 0, .92); p.add(bake(ms)); p.rotation.x = .12; return p; });
    U.tick = (c, dt, pow, t) => { hub.color.setHSL((t * .25) % 1, 1, .55); mallets.forEach((m, i) => { m.rotation.x = .12 - Math.max(0, Math.sin(t * (5 + c.v * .15) + i * PI)) * .25; m.rotation.y = (i ? -1 : 1) * (.1 + .08 * Math.sin(t * 1.3 + i)); }); };
    return finish(g, st, U, [1.5, 2.9]);
  },
};
export function buildCar(type) { curLook = LOOKS[type] || LOOKS.trombone; return BUILD[type](); }
export const CAR_TYPES = Object.keys(BUILD);
