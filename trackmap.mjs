// v26: top-down preview PNGs of track layouts (road width, shortcut chord, features). node trackmap.mjs out.png id1 id2 ...
import { chromium } from 'playwright'; import { geo } from './trackgeo.mjs'; import { TRACKS } from './tracks.js';
const [out, ...ids] = process.argv.slice(2);
const svgs = ids.map(id => { const T = TRACKS[id], g = geo(T), P = g.P; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; P.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); });
  const pad = 40, vb = `${x0 - pad} ${z0 - pad} ${x1 - x0 + 2 * pad} ${z1 - z0 + 2 * pad}`, d = 'M' + P.map(p => `${p.x.toFixed(1)},${p.z.toFixed(1)}`).join('L') + 'Z';
  const dot = (i, c, r = 5) => `<circle cx="${P[i % 600].x}" cy="${P[i % 600].z}" r="${r}" fill="${c}"/>`;
  const A = P[T.alley.A], B = P[T.alley.B];
  return `<div style="display:inline-block;margin:6px;font:14px sans-serif;color:#fff"><b>${id}</b> len ${g.len} clear ${g.minClear} minR ${g.minR}@${g.atR} chord ${g.chord}/${g.road} saved ${g.saved}<br><svg width="420" height="420" viewBox="${vb}" style="background:#234">
  <path d="${d}" fill="none" stroke="#666" stroke-width="44"/><path d="${d}" fill="none" stroke="#bbb" stroke-width="28"/>
  <line x1="${A.x}" y1="${A.z}" x2="${B.x}" y2="${B.z}" stroke="#4ff" stroke-width="13" opacity=".7"/>
  ${T.warps.map(i => dot(i, '#f4d', 7)).join('')}${T.pads.map(([i]) => dot(i, '#f33', 5)).join('')}${(T.gates || []).map(i => dot(i, '#ff0', 6)).join('')}${dot(T.ramp, '#fff', 6)}${dot(T.hill[0], '#0a0', 9)}${dot(0, '#000', 8)}${dot(15, '#0f0', 4)}
  ${[...Array(12)].map((_, k) => `<text x="${P[k * 50].x + 16}" y="${P[k * 50].z}" font-size="14" fill="#ff8">${k * 50}</text>`).join('')}</svg></div>`; });
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
const p = await b.newPage({ viewport: { width: 1320, height: 960 } }); await p.setContent(`<body style="background:#111;margin:0">${svgs.join('')}</body>`); await p.screenshot({ path: out, fullPage: true }); await b.close();
