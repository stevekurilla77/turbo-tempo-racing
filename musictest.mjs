// v21: offline-render every course theme (OfflineAudioContext) -> levels check + WAV previews in shots/
import { chromium } from 'playwright'; import fs from 'fs';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push('' + e)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://127.0.0.1:8787/tracks.js');
const ids = await p.evaluate(async () => Object.keys((await import('/music.js?' + Date.now())).THEMES));
for (const id of ids) {
  const r = await p.evaluate(async ([id]) => { const M = await import('/music.js'); const out = {};
    for (const [sec, fast, len] of [[1, 1, 8], [5, 1, 24], [5, 1.07, 8]]) { const AC = new OfflineAudioContext(1, 44100 * len, 44100), g = AC.createGain(); g.gain.value = .55 * .5; g.connect(AC.destination);
      const mus = M.createMusic(AC, g); mus.setTheme(id); mus.resync(0); let steps = 0; for (let t = 0; t < len - .3; t += .05) steps += mus.tick(t, sec, fast);
      const buf = await AC.startRendering(), d = buf.getChannelData(0); let pk = 0, ss = 0, nan = 0; for (let i = 0; i < d.length; i++) { const v = d[i]; if (!isFinite(v)) nan++; else { pk = Math.max(pk, Math.abs(v)); ss += v * v; } }
      out[`s${sec}${fast > 1 ? 'fast' : ''}`] = { peak: +pk.toFixed(3), rms: +Math.sqrt(ss / d.length).toFixed(3), steps, nan, name: mus.theme.name, bpm: +(mus.theme.bpm * fast).toFixed(1) };
      if (sec === 5 && fast === 1) { const pcm = new Int16Array(d.length); for (let i = 0; i < d.length; i++) pcm[i] = Math.max(-1, Math.min(1, d[i] * 1.6)) * 32767; out.wav = Array.from(new Uint8Array(pcm.buffer)); } }
    return out; }, [id]);
  const pcm = Buffer.from(r.wav); delete r.wav; const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(44100, 24); h.writeUInt32LE(88200, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(`shots/v21-music-${id}.wav`, Buffer.concat([h, pcm])); console.log(id, JSON.stringify(r));
}
console.log('errs', errs); await b.close();
