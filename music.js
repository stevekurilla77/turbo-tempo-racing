// v21 procedural soundtrack: one ORIGINAL theme per course, built from layered patterns (drums, bass, comping, arps, melodies).
// Layers fade in with the "band" meter (sections 1..5). All melodies/progressions written for this game.
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const nm = s => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(s); if (!m) throw new Error('bad note ' + s); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6, 9], '6': [0, 4, 7, 9], m6: [0, 3, 7, 9], sus: [0, 5, 7], '9': [0, 4, 7, 10, 14] };
const chord = s => { const m = /^([A-G])(#|b)?(.*)$/.exec(s); const r = 48 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return { root: r > 53 ? r - 12 : r, tones: QUAL[m[3]].map(i => (r > 53 ? r - 12 : r) + i), q: m[3] }; };
// melody: space-separated tokens, each `res` 16th-steps long. NOTE = new note, '.' = hold, '-' = rest, '|' ignored
function mel(str, res = 2) { const ev = []; let st = 0, cur = null; for (const t of str.split(/\s+/).filter(x => x && x !== '|')) { if (t === '.') { if (cur) cur.len += res; } else if (t === '-') cur = null; else { cur = { st, n: nm(t), len: res }; ev.push(cur); } st += res; } const map = new Map(); ev.forEach(e => map.set(e.st, e)); return { map, len: st }; }

export const THEMES = {
  // Brass City: upbeat brass funk in E minor. Slap bass, tight horn stabs, trumpet hook, sax answers.
  brass: { name: 'Brass City Funk', bpm: 120, swing16: .04, chords: ['Em7', 'Em7', 'A7', 'A7', 'Cmaj7', 'Bm7', 'Am7', 'B7'], layers: [
    { k: 'drum', v: 'kick', p: 'x.....x...x..x..', sec: 1 }, { k: 'drum', v: 'snare', p: '....x..o.o..x...', fill: '....x..o.o..rrrr', sec: 1 }, { k: 'drum', v: 'hat', p: 'xoxoxoxoxoxoxo.o', sec: 1 }, { k: 'drum', v: 'ohat', p: '..............x.', sec: 2 },
    { k: 'bass', v: 'slap', p: 'R.8..R.b..R.5.8.', vol: .2, sec: 1 },
    { k: 'chord', v: 'stab', p: '..x...x.....x.x.', oct: 12, dur: 1, vol: .045, sec: 2 },
    { k: 'mel', v: 'trumpet', vol: .085, sec: 3, m: 'E5 . G5 A5 B5 - A5 G5 | A5 B5 . D6 B5 . - - | C#6 . B5 A5 G5 . A5 - | E5 . G5 . A5 . - - | B5 . G5 E5 G5 B5 C6 . | D6 . B5 . A5 F#5 . - | E5 G5 A5 C6 B5 . A5 G5 | F#5 . D#5 F#5 A5 . B5 .' },
    { k: 'mel', v: 'sax', vol: .06, sec: 4, m: '- - - - - - E4 G4 | B4 . . . - - - - | - - - - - - E4 G4 | C#5 . . . - - - - | - - - - - - E4 G4 | D5 . . . - - - - | C5 . B4 . A4 . G4 . | F#4 . . . D#4 . . .' },
    { k: 'mel', v: 'trombone', vol: .045, sec: 5, oct: -12, same: 1 } ] },
  // Ghost Town Gulch: swung saloon stride piano + oom-pah tuba + banjo plinks in G (ragtime circle progression).
  ghost: { name: 'Saloon Stomp', bpm: 124, swing16: .16, chords: ['G', 'E7', 'A7', 'D7', 'G', 'G7', 'C', 'D7'], layers: [
    { k: 'drum', v: 'kick', p: 'x.......x.......', sec: 1 }, { k: 'drum', v: 'brush', p: '....x.......x...', sec: 1 }, { k: 'drum', v: 'shaker', p: 'x.x.x.x.x.x.x.x.', sec: 1 },
    { k: 'bass', v: 'tuba', p: 'R.......5.......', vol: .2, sec: 1 }, { k: 'bass', v: 'piano', p: 'R.......5.......', oct: 12, vol: .12, sec: 1 },
    { k: 'chord', v: 'piano', p: '....x.......x...', oct: 12, dur: 2, vol: .045, sec: 2 },
    { k: 'mel', v: 'piano', vol: .08, sec: 3, m: 'B4 D5 G5 . F#5 G5 A5 . | G#5 . E5 . D5 E5 B4 . | C#5 E5 A5 . G5 . E5 C#5 | D5 . F#5 A5 C6 . A5 . | B5 . G5 D5 B4 D5 G5 . | F5 . D5 B4 G4 B4 D5 F5 | E5 G5 C6 . B5 A5 G5 E5 | F#5 . A5 . D5 . - -' },
    { k: 'arp', v: 'banjo', p: '.0.1.2.1.0.1.2.3', oct: 24, vol: .022, sec: 4 },
    { k: 'mel', v: 'piano', vol: .04, sec: 5, oct: -12, same: 1 } ] },
  // Marching Band Stadium: drumline cadence + brass fight song in Bb, oom-pah tubas, glockenspiel sparkle.
  stadium: { name: 'Fight Song Fever', bpm: 138, chords: ['Bb', 'Bb', 'F7', 'Bb', 'Eb', 'Bb', 'F7', 'Bb'], layers: [
    { k: 'drum', v: 'bassdrum', p: 'x...x...x...x...', sec: 1 }, { k: 'drum', v: 'snare', p: 'x.oox.o.x.oox.oo', fill: 'rrrrrrrrx.x.x...', sec: 1 }, { k: 'drum', v: 'tom', p: '..x...x...x.x.x.', sec: 2 },
    { k: 'drum', v: 'crash', p: 'x...............', bars: [0, 4], sec: 3 },
    { k: 'bass', v: 'tuba', p: 'R...5...R...5...', vol: .22, sec: 1 },
    { k: 'chord', v: 'horn', p: '..x...x...x...x.', oct: 12, dur: 1, vol: .04, sec: 2 },
    { k: 'mel', v: 'trumpet', vol: .09, sec: 3, m: 'F4 . Bb4 . D5 . F5 . | G5 F5 D5 Bb4 C5 . D5 . | Eb5 . C5 . A4 . F4 . | Bb4 C5 D5 Eb5 F5 . - - | G5 . Eb5 . Bb4 . Eb5 G5 | F5 . D5 Bb4 D5 . F5 . | A5 . G5 F5 Eb5 . C5 A4 | Bb4 . D5 . Bb4 . - -' },
    { k: 'arp', v: 'bells', p: '0...1...2...1...', oct: 36, vol: .03, sec: 4 },
    { k: 'mel', v: 'trombone', vol: .05, sec: 5, oct: -12, same: 1 } ] },
  // Splash Tempo Water Park: bright calypso in F — steel-drum lead, flute counter, congas, clave, bouncing bass.
  water: { name: 'Steel Pan Splash', bpm: 128, swing16: .05, chords: ['F', 'Bb', 'C7', 'F', 'Dm', 'Gm', 'C7', 'F'], layers: [
    { k: 'drum', v: 'kick', p: 'x...x...x...x...', sec: 1 }, { k: 'drum', v: 'rim', p: 'x..x..x...x.x...', sec: 1 }, { k: 'drum', v: 'shaker', p: 'xoxoxoxoxoxoxoxo', sec: 1 },
    { k: 'drum', v: 'congaH', p: '..x..x.x..x..x.x', sec: 2 }, { k: 'drum', v: 'congaL', p: 'x.......x..x....', sec: 2 },
    { k: 'bass', v: 'pluckbass', p: 'R..5..R.R..5..8.', vol: .2, sec: 1 },
    { k: 'chord', v: 'marimba', p: '..x...x...x...x.', oct: 12, dur: 1, vol: .04, sec: 2 },
    { k: 'mel', v: 'steel', vol: .1, sec: 3, m: 'A5 . C6 A5 . F5 G5 A5 | Bb5 . D6 Bb5 . F5 . - | G5 A5 Bb5 . E5 . G5 . | F5 . A5 . C6 . - - | D6 . A5 F5 . A5 D6 . | Bb5 . G5 D5 . G5 Bb5 . | C6 Bb5 A5 G5 E5 . C5 E5 | F5 . . A5 C6 . - -' },
    { k: 'mel', v: 'flute', vol: .05, sec: 4, m: 'F6 . . . E6 . . . | D6 . . . F6 . . . | E6 . . . G6 . . . | F6 . . . . . . . | F6 . . . D6 . . . | D6 . . . Bb5 . . . | C6 . . . E6 . . . | F6 . . . . . . .' },
    { k: 'mel', v: 'steel', vol: .05, sec: 5, oct: -12, same: 1 } ] },
  // Bayou Jazz Swamp: swung New Orleans second-line in F — clarinet lead, tenor-sax riffs, tuba bounce, piano comps.
  bayou: { name: 'Second Line Swamp Stomp', bpm: 130, swing8: .3, chords: ['F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'C7'], layers: [
    { k: 'drum', v: 'kick', p: 'x.....x...x.....', sec: 1 }, { k: 'drum', v: 'snare', p: 'x..o.ox.o.x..o.o', fill: 'x.ox.ox.rrrrx.x.', sec: 1 }, { k: 'drum', v: 'ride', p: 'x...x.x.x...x.x.', sec: 1 },
    { k: 'bass', v: 'tuba', p: 'R...5..8R...b.5.', vol: .21, sec: 1 },
    { k: 'chord', v: 'piano', p: '..x....x..x.....', oct: 12, dur: 1, vol: .04, sec: 2 },
    { k: 'mel', v: 'clarinet', vol: .075, sec: 3, m: 'C6 A5 F5 A5 C6 . Eb6 . | D6 . Bb5 . Ab5 . F5 . | A5 C6 A5 F5 Eb5 . F5 . | G5 A5 C6 . F6 . - - | F6 . D6 Bb5 Ab5 . F5 Ab5 | Bb5 . D6 . F6 . D6 . | C6 . A5 . F5 G5 A5 C6 | Bb5 . G5 . E5 . C5 .' },
    { k: 'mel', v: 'sax', vol: .06, sec: 4, m: '- - F4 A4 C5 . A4 . | Bb4 . . . D5 . F4 . | - - A4 C5 Eb5 . C5 . | F4 . . . - - - - | - - Bb4 D5 F5 . D5 . | Ab4 . . . F4 . Ab4 . | A4 . C5 . F4 . A4 . | G4 . . . E4 . . .' },
    { k: 'mel', v: 'trombone', vol: .045, sec: 5, m: 'F3 . . . . . Eb3 . | D3 . . . . . F3 . | A3 . . . . . C4 . | F3 . . . - - - - | Bb3 . . . . . Ab3 . | D3 . . . F3 . . . | C4 . . . A3 . . . | Bb3 . . . G3 . . .' } ] },
  // Reed Forest: airy woodland adventure in D — flute lead, oboe counter-line, staccato bassoon, harp arpeggios, frame drum.
  reed: { name: 'Whispering Reeds', bpm: 136, chords: ['D', 'G', 'Em', 'A', 'Bm', 'G', 'A', 'D'], layers: [
    { k: 'drum', v: 'frame', p: 'x.......x.....x.', sec: 1 }, { k: 'drum', v: 'tamb', p: 'x.o.x.o.x.o.x.oo', sec: 1 }, { k: 'drum', v: 'rim', p: '....x.......x...', sec: 2 }, { k: 'drum', v: 'kick', p: 'x.....x.x.......', sec: 2 },
    { k: 'bass', v: 'bassoon', p: 'R.5.8.5.R.5.8.5.', vol: .16, sec: 1 },
    { k: 'arp', v: 'harp', p: '0123210101232101', oct: 12, vol: .035, sec: 2 },
    { k: 'mel', v: 'flute', vol: .085, sec: 3, m: 'F#5 . A5 . D6 . E6 F#6 | G6 . F#6 E6 D6 . B5 . | E6 . G5 . B5 . E6 D6 | C#6 . A5 . E5 . - - | D6 . F#6 . B6 . A6 F#6 | G6 . E6 . D6 B5 G5 B5 | A5 B5 C#6 E6 G#6 . A6 . | F#6 . D6 . A5 . - -' },
    { k: 'mel', v: 'oboe', vol: .06, sec: 4, m: 'D5 . . . C#5 . . . | B4 . . . D5 . . . | G4 . . . B4 . . . | A4 . C#5 . E5 . . . | F#5 . . . D5 . . . | B4 . . . G4 . . . | E5 . . . C#5 . . . | D5 . . . . . . .' },
    { k: 'mel', v: 'clarinet', vol: .035, sec: 5, oct: -12, same: 1 } ] },
};
for (const th of Object.values(THEMES)) { th.ch = th.chords.map(chord); th.layers.forEach((L, i) => { if (L.k === 'mel') L.ev = L.same ? th.layers.find(x => x.k === 'mel' && x.m).ev : mel(L.m); }); }

export function createMusic(AC, out) {
  let noiseBuf = null; const noise = () => { if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * .5, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; };
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const env = (t, a, peak, d, end = .0005) => { const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(end, 1e-4), t + a + d); g.connect(out); return g; };
  const osc = (type, f, t, stop, dest, detune = 0) => { const o = AC.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.connect(dest); o.start(t); o.stop(stop); return o; };
  const filt = (type, f, q, dest) => { const b = AC.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; b.connect(dest); return b; };
  const vib = (o, t, rate, cents, delay) => { const l = AC.createOscillator(), g = AC.createGain(); l.frequency.value = rate; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(cents, t + delay); l.connect(g); g.connect(o.detune); l.start(t); l.stop(t + 4); };
  const sustain = (t, dur, vol, att) => { const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.setValueAtTime(vol * .85, t + Math.max(att, dur * .75)); g.gain.linearRampToValueAtTime(0, t + dur + .04); g.connect(out); return g; };
  const V = {
    brassy(f, t, dur, vol, bright, att = .03) { const g = sustain(t, dur, vol, att), fl = filt('lowpass', 400, 0, g); fl.frequency.setValueAtTime(400, t); fl.frequency.linearRampToValueAtTime(bright, t + .05); fl.frequency.linearRampToValueAtTime(bright * .55, t + dur);
      osc('sawtooth', f, t, t + dur + .08, fl); osc('sawtooth', f, t, t + dur + .08, fl, 7); },
    trumpet(f, t, d, v) { V.brassy(f, t, d, v, 3400); }, trombone(f, t, d, v) { V.brassy(f, t, d, v, 1500, .045); }, horn(f, t, d, v) { V.brassy(f, t, d, v, 1100, .04); }, tuba(f, t, d, v) { V.brassy(f, t, d, v, 700, .02); },
    stab(f, t, d, v) { V.brassy(f, t, Math.min(d, .12), v * 1.2, 3000, .01); },
    sax(f, t, d, v) { const g = sustain(t, d, v, .025), bp = filt('bandpass', 1300, .8, g); const o = osc('sawtooth', f, t, t + d + .08, bp); vib(o, t, 5.2, 14, .15); osc('square', f, t, t + d + .08, filt('lowpass', 1600, 0, g)).detune.value = 3; },
    clarinet(f, t, d, v) { const g = sustain(t, d, v, .03), lp = filt('lowpass', 2200, 1, g); const o = osc('square', f, t, t + d + .08, lp); vib(o, t, 5.5, 10, .18); },
    flute(f, t, d, v) { const g = sustain(t, d, v, .05); const o = osc('sine', f, t, t + d + .08, g); vib(o, t, 5.6, 16, .12); const g2 = AC.createGain(); g2.gain.value = .25; g2.connect(g); osc('triangle', f * 2, t, t + d + .08, g2);
      const n = AC.createBufferSource(); n.buffer = noise(); n.connect(filt('bandpass', f * 2, 2, env(t, .01, v * .5, .08))); n.start(t); n.stop(t + .12); },
    oboe(f, t, d, v) { const g = sustain(t, d, v, .03), pk = AC.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1400; pk.Q.value = 2; pk.gain.value = 10; const hp = filt('highpass', 500, 0, g); pk.connect(hp); const o = osc('sawtooth', f, t, t + d + .08, pk); vib(o, t, 5, 12, .15); },
    bassoon(f, t, d, v) { const g = env(t, .015, v, Math.max(.12, d * .8)), lp = filt('lowpass', 900, 2, g); osc('sawtooth', f, t, t + d + .2, lp); },
    piano(f, t, d, v) { const g = env(t, .005, v, d * 1.6), lp = filt('lowpass', 3000, 0, g); osc('triangle', f, t, t + d * 1.7, lp); const g2 = AC.createGain(); g2.gain.value = .35; g2.connect(lp); osc('square', f * 1.009, t, t + d * 1.7, g2); },
    banjo(f, t, d, v) { const g = env(t, .002, v, .22), hp = filt('highpass', 700, 0, g); osc('square', f, t, t + .26, hp); osc('triangle', f * 2, t, t + .26, hp); },
    harp(f, t, d, v) { const g = env(t, .003, v, .6); osc('triangle', f, t, t + .65, g); osc('sine', f * 2, t, t + .65, g); },
    bells(f, t, d, v) { const g = env(t, .002, v, .7); osc('sine', f, t, t + .75, g); osc('sine', f * 4.01, t, t + .3, env(t, .002, v * .4, .25)); },
    marimba(f, t, d, v) { const g = env(t, .002, v, .2); osc('sine', f, t, t + .25, g); osc('sine', f * 4, t, t + .1, env(t, .001, v * .3, .06)); },
    steel(f, t, d, v) { const g = env(t, .004, v, .55); osc('sine', f, t, t + .6, g); osc('sine', f * 2.005, t, t + .45, env(t, .004, v * .5, .35)); osc('sine', f * 3.98, t, t + .25, env(t, .002, v * .22, .18)); },
    slap(f, t, d, v) { const g = env(t, .004, v, Math.max(.12, d)), lp = filt('lowpass', 2400, 4, g); lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(260, t + .12); osc('sawtooth', f, t, t + d + .15, lp); osc('sine', f, t, t + d + .15, g); },
    pluckbass(f, t, d, v) { const g = env(t, .006, v, Math.max(.15, d)); osc('triangle', f, t, t + d + .2, g); osc('sine', f / 2, t, t + d + .2, g); },
  };
  const D = (t, kind, vel = 1) => {
    if (kind === 'kick' || kind === 'bassdrum' || kind === 'frame' || kind === 'tom' || kind === 'congaH' || kind === 'congaL') {
      const P = { kick: [140, 42, .2, .9], bassdrum: [110, 45, .32, 1], frame: [180, 80, .22, .55], tom: [200, 120, .18, .45], congaH: [380, 330, .14, .32], congaL: [260, 210, .18, .36] }[kind];
      const g = env(t, .002, P[3] * vel, P[2]); const o = osc('sine', P[0], t, t + P[2] + .05, g); o.frequency.setValueAtTime(P[0], t); o.frequency.exponentialRampToValueAtTime(P[1], t + P[2] * .7); return; }
    if (kind === 'crash') { const g = env(t, .002, .22 * vel, 1.1); const s = AC.createBufferSource(); s.buffer = noise(); s.connect(filt('highpass', 5000, 0, g)); s.start(t); s.stop(t + .5); return; }
    const P = { snare: ['bandpass', 1800, .5, .14], brush: ['bandpass', 2600, .2, .18], hat: ['highpass', 7000, .12, .04], ohat: ['highpass', 6500, .12, .22], rim: ['bandpass', 3200, .35, .03], shaker: ['highpass', 6000, .07, .06], tamb: ['bandpass', 8500, .14, .09], ride: ['bandpass', 6000, .1, .25] }[kind];
    if (!P) return; const g = env(t, .001, P[2] * vel, P[3]); const s = AC.createBufferSource(); s.buffer = noise(); s.connect(filt(P[0], P[1], kind === 'rim' ? 6 : 1, g)); s.start(t, Math.random() * .2); s.stop(t + P[3] + .05);
    if (kind === 'snare') osc('triangle', 190, t, t + .08, env(t, .001, .2 * vel, .06));
  };
  let theme = THEMES.brass, step = 0, nextT = 0;
  const chordAt = (bar) => theme.ch[bar % theme.ch.length];
  function bassNote(c, ch, nextCh) { switch (ch) { case 'R': return c.root; case '3': return c.tones[1]; case '5': return c.root + 7; case '7': return c.tones[3] != null ? c.tones[3] : c.root + 10; case 'b': return c.root + 10; case '8': return c.root + 12; case 'a': return nextCh.root - 1; default: return null; } }
  function stepDur(s, base) { if (theme.swing8) { const k = theme.swing8; return base * ((s % 4) < 2 ? 1 + k : 1 - k); } if (theme.swing16) { const k = theme.swing16; return base * (s % 2 ? 1 - k : 1 + k); } return base; }
  return {
    THEMES, get theme() { return theme; },
    setTheme(id) { theme = THEMES[id] || THEMES.brass; step = 0; },
    resync(t) { nextT = t; },
    // schedule everything up to `ahead` seconds; sections = 1..5 band layers; fast = tempo multiplier (final lap)
    tick(now, sections, fast = 1) { let n = 0; // returns 16th-steps scheduled
      if (nextT < now - .2) nextT = now + .05;
      const base = 60 / (theme.bpm * fast) / 4;
      while (nextT < now + .15) { const bars = theme.ch.length, bar = Math.floor(step / 16) % bars, s = step % 16, c = chordAt(bar), nc = chordAt(bar + 1), t = nextT, fillBar = bar === bars - 1;
        for (const L of theme.layers) { if (sections < L.sec) continue; if (L.bars && !L.bars.includes(bar)) continue; const vol = L.vol || 1, oct = L.oct || 0;
          if (L.k === 'drum') { const ch = ((fillBar && L.fill) || L.p)[s]; if (ch === 'x') D(t, L.v, 1); else if (ch === 'o') D(t, L.v, .4); else if (ch === 'r') { D(t, L.v, .7); D(t + base / 2, L.v, .55); } }
          else if (L.k === 'bass') { const m = bassNote(c, L.p[s], nc); if (m != null) V[L.v](mf(m - 12 + oct), t, base * 1.8, vol); }
          else if (L.k === 'chord') { const ch = L.p[s]; if (ch === 'x' || ch === 'o') for (const m of c.tones.slice(0, 4)) V[L.v](mf(m + oct), t, base * (L.dur || 1) * 1.6, vol * (ch === 'o' ? .5 : 1)); }
          else if (L.k === 'arp') { const ch = L.p[s]; if (ch >= '0' && ch <= '9') { const i = +ch, tn = c.tones, m = tn[i % tn.length] + 12 * Math.floor(i / tn.length); V[L.v](mf(m + oct), t, base * 1.5, vol); } }
          else if (L.k === 'mel') { const e = L.ev.map.get(step % L.ev.len); if (e) V[L.v](mf(e.n + oct), t, base * e.len * .92, vol); } }
        nextT += stepDur(s, base); step++; n++; }
      return n; },
  };
}
