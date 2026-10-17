// v23: offline-render a track theme to WAV (stereo). node musicrender.mjs bayou 75 shots/v23-music-bayou.wav
import { chromium } from 'playwright'; import fs from 'fs';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push('' + e)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
const [id = 'bayou', len = '75', outF = 'shots/v23-music-' + id + '.wav'] = process.argv.slice(2);
await p.goto('http://127.0.0.1:8787/tracks.js');
const r = await p.evaluate(async ([id, len]) => { const M = await import('/music.js?r' + Date.now()); const SR = 44100, AC = new OfflineAudioContext(2, SR * len, SR);
  const master = AC.createGain(); master.gain.value = .55; master.connect(AC.destination); const mg = AC.createGain(); mg.gain.value = .5; mg.connect(master);
  const mus = M.createMusic(AC, mg); mus.setTheme(id); mus.resync(.1); let steps = 0;
  // band meter builds like a race: rhythm -> piano -> heads -> trombone -> full band; last ~14 s = final-lap tempo
  for (let t = 0; t < len - .5; t += .05) { const sec = t < 5 ? 2 : t < 10 ? 3 : t < 18 ? 4 : 5; steps += mus.tick(t, sec, t > len - 15 ? 1.07 : 1); }
  const buf = await AC.startRendering(); const L = buf.getChannelData(0), R = buf.getChannelData(1); let pk = 0, nan = 0, ss = 0;
  for (let i = 0; i < L.length; i++) { for (const v of [L[i], R[i]]) { if (!isFinite(v)) nan++; else { pk = Math.max(pk, Math.abs(v)); ss += v * v; } } }
  const g = Math.min(2.2, .89 / pk); // normalise the preview file
  const pcm = new Int16Array(L.length * 2); for (let i = 0; i < L.length; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i] * g)) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i] * g)) * 32767; }
  return { steps, peak: +pk.toFixed(3), rms: +Math.sqrt(ss / (L.length * 2)).toFixed(3), nan, name: mus.theme.name, wav: Array.from(new Uint8Array(pcm.buffer)) }; }, [id, +len]);
const pcm = Buffer.from(r.wav); delete r.wav; const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(44100, 24); h.writeUInt32LE(176400, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(outF, Buffer.concat([h, pcm])); console.log(JSON.stringify(r), 'errs', errs); await b.close();
