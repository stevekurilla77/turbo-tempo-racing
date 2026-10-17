// v23 Bayou Jazz Swamp: "Gator Gumbo Strut", an ORIGINAL New Orleans / Dixieland small-band arrangement in F, medium-up swing.
// Real triplet swing (12 triplet steps per bar), walking upright bass, ride "ding ding-ga-ding" + hi-hat chick on 2 & 4, brushes,
// stride piano with 6th/7th/9th/13th voicings, clarinet lead with bends + trills, cup-muted cornet answers (wah), trombone tailgate slides,
// then a 12-bar blues chorus of improvised-sounding solos (seeded per pass so it changes each time round) and a shout riff.
// Form: A (8 bars, clarinet calls / cornet answers) + B (8 bars, cornet lead / clarinet answers) + blues (12 bars) = 28 bars.
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const nm = s => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(s); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
const Q = { '6': [0, 4, 7, 9], '7': [0, 4, 7, 10], '9': [0, 4, 7, 10, 14], '13': [0, 4, 10, 14, 21], m7: [0, 3, 7, 10], dim7: [0, 3, 6, 9] };
// piano right-hand voicings (intervals above root, placed around middle C): 3rd, 7th/6th + colour tone
const VOX = { '6': [4, 9, 14], '7': [4, 10, 14], '9': [4, 10, 14], '13': [4, 10, 21], m7: [3, 10, 14], dim7: [3, 6, 9] };
const CH = s => { const m = /^([A-G])(b|#)?(.*)$/.exec(s); const r = 36 + NOTE[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0); return { r: r < 39 ? r + 12 : r, q: m[3], tones: Q[m[3]], s }; };
const BLUES = [5, 7, 8, 9, 10, 0, 3]; // F blues-ish pitch classes: F G Ab A Bb C Eb (+ B as passing below)
const A = ['F6', 'D7', 'G9', 'C13', 'F7', 'Bb9 Bdim7', 'F6 D7', 'Gm7 C7'], B = ['Bb7', 'Bdim7', 'F6', 'D7', 'G9', 'C7', 'F6 D7', 'Gm7 C7'];
const BL = ['F7', 'Bb7', 'F7', 'Cm7 F7', 'Bb7', 'Bdim7', 'F7', 'D7', 'Gm7', 'C7', 'F7 D7', 'Gm7 C7'];
export const FORM = [...A, ...B, ...BL].map(b => b.split(' ').map(CH));
// heads: 8 swung eighths per bar. NOTE + mods: ^ bend up into it, ~ trill, / tailgate slide up into it, w wah (cornet plunger)
const HEADS = {
  clar: [
    'C5 D5 F5 A5^ . G5 F5 D5', 'F#5 . A5 C6~ . . A5 F#5', '- - - - - - - -', '- - - - - - - -',
    'Eb6^ . C6 A5 F5 A5 C6 Eb6', 'D6~ . . C6 Ab5 . B5 D6', '- - - - - - - -', '- - - - - - E5 G5',
    '- - - - - - - -', '- - - - - - - -', '- - - - - - - -', 'F#5 A5 C6 Eb6~ . D6 C6 A5',
    '- - - - - - - -', 'E6^ . C6 Bb5 G5 E5 . C5', 'C5 F5 F5 A5 . A5 . C6', 'D6 . Bb5 . G5 . E5 -'],
  cor: [
    '- - - - - - - -', '- - - - - - - -', '- - B4 D5 F5w . E5 D5', 'E5 . A4 . Bb4 . G4 -',
    '- - - - - - - -', '- - - - - - - -', 'C5 . A4 F4 F#4w . A4 C5', 'Bb4 . A4 G4 E4 . C4 .',
    'F5w . D5 . Ab4 . F4 Ab4', 'B4 . D5 F5 Ab5 . F5 D5', 'C5 . . A4 C5 D5 . -', '- - - - - - - -',
    'B4 . D5 . F5 A5w . G5', '- - - - - - - -', 'A4 C5 D5 F5 . F#5 . A5', 'Bb5 . G5 . E5 . C5 -'],
  bone: [ // tailgate: long slides into chord tones, pushes on the and-of-3
    'A3/ . . . - C4 . -', 'F#3/ . . . - A3 . -', 'B3/ . . . . . . -', 'Bb3/ . . . . . . -',
    'Eb4/ . . . - C4 . -', 'D4/ . . . B3/ . . -', 'A3/ . . . F#3/ . . -', 'F3/ . . . E3 . C3 -',
    'D4/ . . . . . Ab3 -', 'D4/ . . . F3 . . -', 'A3/ . . . . . C4 -', 'F#3/ . . . . . . -',
    'F3/ . . . . . . -', 'Bb3/ . . . . . E3 -', 'F3/ . . . D3/ . . .', 'G3 . . . C3/ . . .'],
};
const SHOUT = { // blues bars 11-12: all horns together
  clar: ['C6 F6 F6 A6 . A6 . C7', 'D7 . Bb6 . G6 . E6 -'], cor: ['A4 C5 D5 F5 . F#5 . A5', 'Bb5 . G5 . E5 . C5 -'], bone: ['F3/ . . . D3/ . . .', 'G3 . . . C3/ . . .'] };
const parseBar = str => { const ev = []; let cur = null; str.split(/\s+/).forEach((t, k) => { if (t === '.') { if (cur) cur.len++; return; } if (t === '-') { cur = null; return; } const m = /^([A-G][#b]?-?\d)([\^~\/w]*)$/.exec(t); cur = { k, n: nm(m[1]), mod: m[2], len: 1 }; ev.push(cur); }); return ev; };
const HEV = Object.fromEntries(Object.entries(HEADS).map(([i, bars]) => [i, bars.map(parseBar)]));
const SEV = Object.fromEntries(Object.entries(SHOUT).map(([i, bars]) => [i, bars.map(parseBar)]));
const kTrip = k => 3 * (k >> 1) + (k & 1 ? 2 : 0); // swung eighth index -> triplet step

export function createJazz(AC, out) {
  // light room reverb (generated impulse), horns + piano get a send
  const dry = AC.createGain(); dry.gain.value = 1.25; dry.connect(out); const send = AC.createGain(); send.gain.value = .28; const cv = AC.createConvolver();
  { const len = Math.floor(AC.sampleRate * 1.7), ir = AC.createBuffer(2, len, AC.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 200 ? i / 200 : 1); } cv.buffer = ir; }
  send.connect(cv); cv.connect(out);
  let noiseBuf = null; const noise = () => { if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; };
  let metalBuf = null; const metal = () => { if (!metalBuf) { const sr = AC.sampleRate, n = sr; metalBuf = AC.createBuffer(1, n, sr); const d = metalBuf.getChannelData(0), F = [205.3, 304.4, 369.6, 522.7, 540, 800].map(f => f * 1.72); for (let i = 0; i < n; i++) { let s = 0; for (const f of F) s += ((i * f / sr) % 1) < .5 ? 1 : -1; d[i] = s / 6; } } return metalBuf; };
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const gain = (dest, v) => { const g = AC.createGain(); g.gain.value = v; g.connect(dest); return g; };
  const bus = (wet) => { const g = AC.createGain(); g.connect(dry); if (wet) { const s = gain(send, wet); g.connect(s); } return g; };
  const hornBus = bus(1), pianoBus = bus(.7), rhythmBus = bus(.25), bassBus = bus(0);
  const envG = (dest, t, a, peak, d) => { const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(1e-4, t + a + d); g.connect(dest); return g; };
  const susG = (dest, t, dur, v, att, rel = .06) => { const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.setValueAtTime(v * .9, t + Math.max(att, dur * .6)); g.gain.linearRampToValueAtTime(v * .7, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + rel); g.connect(dest); return g; };
  const osc = (type, f, t, stop, dest, det = 0) => { const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det; o.connect(dest); o.start(t); o.stop(stop); return o; };
  const filt = (type, f, q, dest) => { const b = AC.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || .7; b.connect(dest); return b; };
  const vib = (o, t, rate, cents, delay, stop) => { const l = AC.createOscillator(), g = AC.createGain(); l.frequency.value = rate; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(cents, t + delay + .15); l.connect(g); g.connect(o.detune); l.start(t); l.stop(stop); };
  const pitchMods = (oscs, f, t, d, mod, slideSemi) => { for (const o of oscs) { const p = o.frequency;
    if (mod.includes('/')) { p.setValueAtTime(f * Math.pow(2, -slideSemi / 12), t); p.exponentialRampToValueAtTime(f, t + Math.min(.28, d * .6)); }
    else if (mod.includes('^')) { p.setValueAtTime(f * .944, t); p.exponentialRampToValueAtTime(f, t + Math.min(.12, d * .5)); }
    if (mod.includes('~')) { const up = f * 1.1225, st = .052; for (let x = t + .06, i = 0; x < t + d - .04; x += st, i++) p.setValueAtTime(i % 2 ? f : up, x); p.setValueAtTime(f, t + d - .04); } } };
  const I = {
    // upright bass: plucked, round, slight pitch settle on attack
    bass(f, t, d, v) { const g = envG(bassBus, t, .006, v, Math.max(.25, d * 1.4)), lp = filt('lowpass', 900, 1.2, g); lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(420, t + .2);
      for (const [ty, k, gv] of [['triangle', 1, 1], ['sine', 1, .8], ['sine', 2, .18]]) { const o = osc(ty, f * k * 1.015, t, t + d + .5, gain(lp, gv)); o.frequency.exponentialRampToValueAtTime(f * k, t + .035); }
      const n = AC.createBufferSource(); n.buffer = noise(); n.connect(filt('bandpass', 1100, 1.5, envG(bassBus, t, .001, v * .25, .03))); n.start(t, Math.random() * .5); n.stop(t + .05); },
    // piano: hammer + two detuned strings + octave partial, decaying brightness
    piano(f, t, d, v) { const g = envG(pianoBus, t, .004, v, Math.max(.35, d * 2.2)), lp = filt('lowpass', 3600, .5, g); lp.frequency.setValueAtTime(Math.min(5200, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.min(1800, f * 3), t + .4);
      osc('triangle', f, t, t + d * 2.4 + .3, lp, -4); osc('triangle', f, t, t + d * 2.4 + .3, lp, 5); osc('sine', f * 2, t, t + .5, gain(lp, .22)); osc('square', f, t, t + .15, gain(lp, .06)); },
    // clarinet: hollow square (odd harmonics) + body sine, breath, delayed vibrato; bends + trills
    clar(f, t, d, v, mod = '') { const g = susG(hornBus, t, d, v, .025), lp = filt('lowpass', Math.min(3200, f * 3.4), 1, g);
      const a = osc('square', f, t, t + d + .1, lp), b = osc('sine', f, t, t + d + .1, gain(g, .55)); vib(a, t, 5.4, 12, .18, t + d + .1); vib(b, t, 5.4, 12, .18, t + d + .1); pitchMods([a, b], f, t, d, mod, 2);
      const n = AC.createBufferSource(); n.buffer = noise(); n.connect(filt('bandpass', 2600, 1.2, envG(hornBus, t, .01, v * .22, .09))); n.start(t, Math.random() * .5); n.stop(t + .12); },
    // cup-muted cornet: nasal band-passed brass; 'w' = plunger wah opening
    cor(f, t, d, v, mod = '') { const g = susG(hornBus, t, d, v, .03), hp = filt('highpass', 520, .7, g), bp = filt('bandpass', 1500, 3.2, hp);
      if (mod.includes('w')) { bp.frequency.setValueAtTime(520, t); bp.frequency.exponentialRampToValueAtTime(2100, t + .18); bp.frequency.exponentialRampToValueAtTime(1300, t + d); }
      else { bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(1700, t + .05); }
      const a = osc('sawtooth', f, t, t + d + .1, bp), b = osc('sawtooth', f, t, t + d + .1, bp, 7); vib(a, t, 5.8, 9, .2, t + d + .1); pitchMods([a, b], f, t, d, mod.replace('/', '^'), 0); },
    // trombone: warm brass with real tailgate slide (glide up a 4th/5th into the note)
    bone(f, t, d, v, mod = '') { const g = susG(hornBus, t, d, v, .045, .09), lp = filt('lowpass', 700, 1.3, g); lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1500, t + .12); lp.frequency.linearRampToValueAtTime(900, t + d);
      const a = osc('sawtooth', f, t, t + d + .12, lp), b = osc('sawtooth', f, t, t + d + .12, lp, -6); vib(a, t, 4.8, 10, .3, t + d + .12); pitchMods([a, b], f, t, d, mod, 6); },
  };
  const DR = {
    ride(t, v) { const s = AC.createBufferSource(); s.buffer = metal(); const g = envG(rhythmBus, t, .001, .05 * v, .42); s.connect(filt('highpass', 6500, .7, filt('bandpass', 9000, .6, g))); s.start(t, Math.random() * .3); s.stop(t + .5);
      const n = AC.createBufferSource(); n.buffer = noise(); n.connect(filt('highpass', 8000, .7, envG(rhythmBus, t, .001, .02 * v, .25))); n.start(t, Math.random() * .5); n.stop(t + .3); },
    chick(t, v) { const s = AC.createBufferSource(); s.buffer = metal(); s.connect(filt('highpass', 7500, .7, envG(rhythmBus, t, .002, .045 * v, .045))); s.start(t, Math.random() * .3); s.stop(t + .07); },
    brush(t, d, v) { const n = AC.createBufferSource(); n.buffer = noise(); const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.022 * v, t + d * .45); g.gain.linearRampToValueAtTime(0, t + d); g.connect(rhythmBus); n.connect(filt('bandpass', 3200, .5, g)); n.start(t, Math.random() * .3); n.stop(t + d + .02); },
    snare(t, v) { const n = AC.createBufferSource(); n.buffer = noise(); n.connect(filt('bandpass', 2000, .6, envG(rhythmBus, t, .001, .1 * v, .13))); n.start(t, Math.random() * .5); n.stop(t + .17); osc('triangle', 185, t, t + .08, envG(rhythmBus, t, .001, .12 * v, .06)); },
    kick(t, v) { const g = envG(bassBus, t, .002, .35 * v, .14); const o = osc('sine', 95, t, t + .18, g); o.frequency.exponentialRampToValueAtTime(48, t + .1); },
    crash(t, v) { const s = AC.createBufferSource(); s.buffer = metal(); s.connect(filt('highpass', 5000, .7, envG(rhythmBus, t, .002, .07 * v, 1.2))); s.start(t); s.stop(t + 1.3); const n = AC.createBufferSource(); n.buffer = noise(); n.connect(filt('highpass', 6000, .7, envG(rhythmBus, t, .002, .06 * v, .9))); n.start(t); n.stop(t + 1); },
  };
  // deterministic RNG so each pass of the solo chorus is different but reproducible
  let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const near = (target, lo, hi, pcs) => { let best = null, bd = 99; for (let m = lo; m <= hi; m++) if (pcs.includes(m % 12) && Math.abs(m - target) < bd) { bd = Math.abs(m - target); best = m; } return best; };
  let barEv = [], step = 0, nextT = 0, prevBass = 41, soloNote = { clar: 74, cor: 67, bone: 53 };
  const chordAtBeat = (bar, beat) => { const c = FORM[bar % FORM.length]; return c.length > 1 && beat >= 2 ? c[1] : c[0]; };
  function walk(bar) { // 4 quarter notes: root, chord tone, chord tone/scale, chromatic approach into next chord
    const ev = []; for (let b = 0; b < 4; b++) { const c = chordAtBeat(bar, b), nx = chordAtBeat(b === 3 ? bar + 1 : bar, b === 3 ? 0 : b + 1), first = b === 0 || (FORM[bar % FORM.length].length > 1 && b === 2);
      let m; if (first) m = near(prevBass + (rnd() < .5 ? -3 : 3), 36, 52, [c.r % 12]);
      else if (nx.r % 12 !== c.r % 12 && (b === 3 || b === 1)) { const tgt = near(prevBass, 36, 52, [nx.r % 12]); m = tgt + (rnd() < .6 ? (tgt > prevBass ? -1 : 1) : (rnd() < .5 ? 7 : -5)); if (m > 53 || m < 34) m = tgt - 1; }
      else m = near(prevBass + pick([-4, -3, 2, 3, 4, 5]), 36, 52, c.tones.map(i => (c.r + i) % 12).concat(b === 3 ? [(c.r + 2) % 12] : []));
      prevBass = m; ev.push({ s: b * 3, f: () => ['bass', m, 2.6, .27 + (b === 0 ? .03 : 0)] });
      if (rnd() < .12 && b < 3) ev.push({ s: b * 3 + 2, f: () => ['bass', m + (rnd() < .5 ? 12 : 0), .8, .12] }); } // occasional swung skip note
    return ev; }
  function solo(inst, bar, lo, hi, density) { const ev = [], c0 = FORM[bar % FORM.length]; let n = soloNote[inst];
    const rhy = [[0, 2], [0, 1, 2], [2], [0], [0, 1, 2], [1, 2], []];
    for (let b = 0; b < 4; b++) { const c = chordAtBeat(bar, b), ct = c.tones.map(i => (c.r + i) % 12); if (b === 3 && rnd() < .4) continue; const r = rnd() < density ? pick(rhy) : [];
      for (const tp of r) { const step = pick([-3, -2, -1, 1, 2, 3, 4, -4]); const pcs = tp === 0 ? ct : BLUES.concat(ct); n = near(n + step, lo, hi, pcs) ?? n; if (n > hi - 2) n -= 5; if (n < lo + 2) n += 5;
        const mod = inst === 'clar' && rnd() < .14 ? '~' : inst !== 'bone' && rnd() < .2 ? '^' : inst === 'bone' && tp === 0 && rnd() < .4 ? '/' : inst === 'cor' && rnd() < .25 ? 'w' : '';
        const nn = n, dur = tp === 1 ? .9 : rnd() < .25 ? 3 : 1.5; ev.push({ s: b * 3 + tp, f: () => [inst, nn, mod === '~' ? 3 : dur, inst === 'clar' ? .07 : inst === 'cor' ? .085 : .07, mod] }); } }
    // phrase ending on a chord tone, held
    if (rnd() < .5) { const ct = c0[c0.length - 1].tones.map(i => (c0[c0.length - 1].r + i) % 12); const e = near(n, lo, hi, ct); ev.push({ s: 9, f: () => [inst, e, 3.2, .07, inst === 'clar' ? '' : '^'] }); n = e; }
    soloNote[inst] = n; return ev; }
  function heads(bar, sections) { const ev = [], b = bar % FORM.length; const add = (inst, list, vol, oct = 0) => list.forEach(e => ev.push({ s: kTrip(e.k), f: (T) => [inst, e.n + oct, kTrip(e.k + e.len) - kTrip(e.k) - .25, vol, e.mod] }));
    if (b < 16) { if (sections >= 3) { add('clar', HEV.clar[b], .07); add('cor', HEV.cor[b], .095); } if (sections >= 4) add('bone', HEV.bone[b], .075, 0);
      if (sections >= 5 && b >= 8 && !HEV.clar[b].length) { const c = FORM[b][0]; for (let k = 0; k < 4; k++) { const m = c.r + 36 + c.tones[k % c.tones.length] - (c.r + 36 > 84 ? 12 : 0); ev.push({ s: k * 3 + 2, f: () => ['clar', Math.min(88, m), .8, .03, ''] }); } } } // clarinet obbligato
    else { const sb = b - 16; seed = seed || 1; if (sections >= 3) { if (sb < 4) ev.push(...solo('clar', bar, 65, 86, .85)); else if (sb < 8) ev.push(...solo('cor', bar, 60, 77, .8)); else if (sb < 10) ev.push(...solo('bone', bar, 45, 62, .7)); else { add('cor', SEV.cor[sb - 10], .095); add('clar', SEV.clar[sb - 10], .06, -12); } }
      if (sections >= 4 && sb < 10) { const c = FORM[b][0]; ev.push({ s: 0, f: () => ['bone', c.r + 12 + c.tones[1] - (c.r + 12 + c.tones[1] > 58 ? 12 : 0), 5, .045, '/'] }); } // sustained 3rds behind the solos
      if (sections >= 4 && sb >= 10) add('bone', SEV.bone[sb - 10], .075); }
    return ev; }
  function piano(bar, sections) { const ev = [], chs = FORM[bar % FORM.length]; for (let b = 0; b < 4; b++) { const c = chordAtBeat(bar, b);
      if (b % 2 === 0) { const lo = c.r + 12 + (b === 2 && chs.length === 1 ? 7 : 0); ev.push({ s: b * 3, f: () => ['piano', lo - (lo > 55 ? 12 : 0), 1.6, .05] }); } // stride "oom" (left hand)
      else { const vx = VOX[c.q].map(i => { let m = c.r + i; while (m < 57) m += 12; while (m > 72) m -= 12; return m; }); vx.forEach(m => ev.push({ s: b * 3, f: () => ['piano', m, 1.2, .032] })); } // "pah" (right hand)
      if (sections >= 4 && rnd() < .18) { const vx = VOX[c.q].map(i => { let m = c.r + i + 12; while (m < 62) m += 12; while (m > 79) m -= 12; return m; }); vx.forEach(m => ev.push({ s: b * 3 + 2, f: () => ['piano', m, .7, .02] })); } } // anticipations
    if (sections >= 4 && bar % 4 === 3) { const c = chs[chs.length - 1]; const tn = c.tones.map(i => c.r + 24 + i); for (let k = 0; k < 6; k++) ev.push({ s: 6 + k, f: () => ['piano', tn[k % tn.length] + (k >= tn.length ? 12 : 0), .5, .024] }); } // triplet run fill
    return ev; }
  function drums(bar, sections) { const ev = [], b = bar % FORM.length, phraseEnd = b === 7 || b === 15 || b === 27;
    for (let bt = 0; bt < 4; bt++) { ev.push({ s: bt * 3, d: (t) => DR.ride(t, bt % 2 ? 1 : .8) }); if (bt % 2) ev.push({ s: bt * 3 + 2, d: (t) => DR.ride(t, .55) }); // ding, ding-ga-ding
      if (bt % 2) ev.push({ s: bt * 3, d: (t) => DR.chick(t, 1) }); ev.push({ s: bt * 3, d: (t) => DR.kick(t, .35) }); // hat on 2 & 4, feathered kick
      if (sections >= 2) ev.push({ s: bt * 3, d: (t, T) => DR.brush(t, T * 2.6, bt % 2 ? 1 : .6) }); }
    if (sections >= 2 && !phraseEnd) { if (rnd() < .5) ev.push({ s: 5, d: (t) => DR.snare(t, .25) }); if (rnd() < .4) ev.push({ s: 11, d: (t) => DR.snare(t, .3) }); }
    if (phraseEnd) { for (let k = 6; k < 12; k++) ev.push({ s: k, d: (t) => DR.snare(t, .3 + (k - 6) * .1) }); ev.push({ s: 11, d: (t) => DR.kick(t, .8) }); }
    if (b === 0 || b === 16) ev.push({ s: 0, d: (t) => DR.crash(t, .9) });
    return ev; }
  function buildBar(bar, sections) { const b = bar % FORM.length; if (b === 0 || b === 16) seed = 7919 * (Math.floor(bar / FORM.length) + 1) + b; return [...drums(bar, sections), ...walk(bar), ...(sections >= 2 ? piano(bar, sections) : []), ...heads(bar, sections)]; }
  return {
    get name() { return 'Gator Gumbo Strut'; },
    reset() { step = 0; barEv = []; prevBass = 41; },
    resync(t) { nextT = t; },
    tick(now, sections, fast = 1, bpm = 172) { let n = 0; if (nextT < now - .2) nextT = now + .05;
      const T = 60 / (bpm * fast) / 3; // one triplet eighth
      while (nextT < now + .15) { const bar = Math.floor(step / 12), s = step % 12; if (s === 0) barEv = buildBar(bar, sections);
        for (const e of barEv) { if (e.s !== s) continue; const hum = (Math.random() - .5) * .008, t = Math.max(nextT, nextT + hum);
          if (e.d) { e.d(t, T); continue; }
          const [inst, m, len, vol, mod] = e.f(T); I[inst](mf(m), t, Math.max(.06, len * T), vol * (.9 + Math.random() * .2), mod || ''); }
        nextT += T; step++; n++; }
      return n; },
    _DR: DR,
  };
}
