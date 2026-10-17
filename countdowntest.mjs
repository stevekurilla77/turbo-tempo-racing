// v23: offline-render every track's countdown (ambience + jingle + 3-2-1 beeps + GO, handing off into the track theme) -> levels + WAV
import { chromium } from 'playwright'; import fs from 'fs';
const b = await chromium.launch({ executablePath: '/home/box/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push('' + e)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://127.0.0.1:8787/tracks.js'); const wavId = process.argv[2] || 'stadium';
for (const id of ['brass', 'ghost', 'stadium', 'water', 'bayou', 'reed']) {
  const r = await p.evaluate(async ([id]) => { const M = await import('/music.js?v23'), X = await import('/sfx.js?v23'); const len = 10, AC = new OfflineAudioContext(1, 44100 * len, 44100);
    const master = AC.createGain(); master.gain.value = .55; master.connect(AC.destination); const mg = AC.createGain(); mg.gain.value = .5; mg.connect(master); const sb = AC.createGain(); sb.gain.value = .6; sb.connect(master);
    const R = X.createRaceSfx(AC, sb, id), t0 = .2; R.ambientStart(t0); const ev = R.countdown(t0); R.rev(0); R.ambientGo(t0 + X.GO_AT);
    const mus = M.createMusic(AC, mg); mus.setTheme(id); mus.resync(t0 + X.GO_AT); let steps = 0; for (let t = 0; t < len - .3; t += .05) steps += mus.tick(t, 2, 1);
    const buf = await AC.startRendering(), d = buf.getChannelData(0); let pk = 0, nan = 0; const seg = (a, z) => { let ss = 0; for (let i = a * 44100 | 0; i < z * 44100; i++) ss += d[i] * d[i]; return +Math.sqrt(ss / ((z - a) * 44100)).toFixed(3); };
    for (let i = 0; i < d.length; i++) { const v = d[i]; if (!isFinite(v)) nan++; else pk = Math.max(pk, Math.abs(v)); }
    const out = { events: ev, steps, peak: +pk.toFixed(3), nan, rmsIntro: seg(.2, 1.2), rmsCount: seg(1.2, 4.2), rmsGo: seg(4.2, 5.2), rmsMusic: seg(6.5, 9.5) };
    const pcm = new Int16Array(d.length); for (let i = 0; i < d.length; i++) pcm[i] = Math.max(-1, Math.min(1, d[i] * 1.4)) * 32767; out.wav = Array.from(new Uint8Array(pcm.buffer)); return out; }, [id]);
  const pcm = Buffer.from(r.wav); delete r.wav;
  if (id === wavId) { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(44100, 24); h.writeUInt32LE(88200, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); fs.writeFileSync('shots/v23-countdown.wav', Buffer.concat([h, pcm])); }
  console.log(id, JSON.stringify(r));
}
console.log('errs', errs); await b.close();
