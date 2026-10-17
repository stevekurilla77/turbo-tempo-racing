// v19 sky: gradient shader dome (sun glow, moon, twinkling stars), layered clouds, distant skyline ring. One draw call per layer.
import * as THREE from 'three';
import { canvasTex, bakeChunks } from './deco.js';
export function buildSky(scene, o) {
  const grp = new THREE.Group(); scene.add(grp);
  const U = { uTime: { value: 0 }, top: { value: new THREE.Color(o.top) }, mid: { value: new THREE.Color(o.mid) }, hor: { value: new THREE.Color(o.horizon) }, low: { value: new THREE.Color(o.low || o.horizon) },
    sunDir: { value: new THREE.Vector3(...o.sunDir).normalize() }, sunCol: { value: new THREE.Color(o.sunCol) }, moonDir: { value: new THREE.Vector3(...(o.moonDir || [0, -1, 0])).normalize() }, stars: { value: o.stars || 0 }, sunSize: { value: o.sunSize || .9992 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime, stars, sunSize; uniform vec3 top, mid, hor, low, sunDir, sunCol, moonDir; varying vec3 vP;
      float h1(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      void main(){ vec3 d = normalize(vP); float h = d.y; vec3 c;
        if (h < 0.0) c = mix(hor, low, clamp(-h * 6.0, 0.0, 1.0)); else c = mix(hor, mid, smoothstep(0.0, 0.22, h)); c = mix(c, top, smoothstep(0.18, 0.75, h));
        float s = max(dot(d, sunDir), 0.0); c += sunCol * (pow(s, 10.0) * 0.35 + pow(s, 90.0) * 0.5); if (s > sunSize) c = mix(c, vec3(1.0, 0.95, 0.75), 0.92);
        float m = dot(d, moonDir); if (m > 0.9993) { float cr = h1(floor(d * 900.0)); c = mix(c, vec3(0.96, 0.94, 0.86) - cr * 0.12, 0.95); } c += vec3(0.8, 0.8, 1.0) * pow(max(m, 0.0), 300.0) * 0.25;
        if (stars > 0.0) { vec3 q = floor(d * 260.0); float r = h1(q); if (r > 0.996) { float tw = 0.6 + 0.4 * sin(uTime * (2.0 + r * 9.0) + r * 50.0); c += vec3(1.0) * tw * stars * smoothstep(0.12, 0.5, h) * (r - 0.996) * 250.0; } }
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>

      }` });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 20), mat); dome.renderOrder = -10; grp.add(dome);
  // distant skyline silhouette ring
  if (o.skyline) { const sk = o.skyline; const t = canvasTex(1024, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = sk.col; let x = 0;
      while (x < w) { const bw = 10 + Math.random() * 34, bh = 18 + Math.random() * 80, kind = Math.random(); g.fillRect(x, h - bh, bw, bh);
        if (sk.city) { if (kind < .15) { g.beginPath(); g.ellipse(x + bw / 2, h - bh, bw / 2, bw * .45, 0, Math.PI, 0); g.fill(); } else if (kind < .27) { g.beginPath(); g.moveTo(x + bw / 2 - 1.5, h - bh); g.lineTo(x + bw / 2, h - bh - 22); g.lineTo(x + bw / 2 + 1.5, h - bh); g.fill(); }
          else if (kind < .37) { g.beginPath(); g.moveTo(x - 6, h - bh - 8); g.quadraticCurveTo(x + bw / 2, h - bh + 6, x + bw + 6, h - bh - 8); g.lineTo(x + bw, h - bh); g.lineTo(x, h - bh); g.fill(); } // bell top
          g.fillStyle = sk.win; for (let wy = h - bh + 4; wy < h - 3; wy += 5) for (let wx = x + 2; wx < x + bw - 2; wx += 4) if (Math.random() < .18) g.fillRect(wx, wy, 1.5, 2); g.fillStyle = sk.col; }
        else if (sk.mesa) { /* mesas drawn below */ }
        x += bw + Math.random() * 6; }
      if (sk.draw) { g.clearRect(0, 0, w, h); sk.draw(g, w, h); }
      if (sk.mesa) { g.clearRect(0, 0, w, h); g.fillStyle = sk.col; g.beginPath(); g.moveTo(0, h); let y = h - 30; for (let px = 0; px <= w; px += 16) { if (Math.random() < .12) y = h - 20 - Math.random() * 90; g.lineTo(px, y); g.lineTo(px + 16, y); } g.lineTo(w, h); g.fill(); } }, true);
    t.repeat.set(4, 1); const ring = new THREE.Mesh(new THREE.CylinderGeometry(760, 760, sk.height || 150, 64, 1, true), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    ring.position.y = (sk.height || 150) / 2 - 12; ring.renderOrder = -8; grp.add(ring); }
  // layered clouds: soft canvas puffs on big planes facing the centre
  const clouds = new THREE.Group(); grp.add(clouds);
  if (o.clouds) { const ct = canvasTex(256, 128, (g, w, h) => { for (let k = 0; k < 22; k++) { const x = 30 + Math.random() * (w - 60), y = 50 + Math.random() * 40, r = 18 + Math.random() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } });
    const stage = new THREE.Group();
    o.clouds.forEach(([col, n, R, y0, y1], li) => { const m = new THREE.MeshBasicMaterial({ map: ct, color: col, transparent: true, fog: false, depthWrite: false, opacity: .85 });
      for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = R + Math.random() * 60, y = y0 + Math.random() * (y1 - y0), s = 140 + Math.random() * 160;
        const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s * .42), m); p.position.set(Math.cos(a) * r, y, Math.sin(a) * r); p.lookAt(0, y, 0); stage.add(p); } });
    bakeChunks(stage, clouds, 1e7).forEach((m, i) => { m.renderOrder = -6 + i; }); }
  return { uniforms: U, update(dt, t) { U.uTime.value = t; clouds.rotation.y += dt * .004; } };
}
