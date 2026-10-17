// v23 race sound design (all original WebAudio): per-track countdown jingles that land on GO and hand off into the track theme,
// musical 3-2-1 beeps, pre-race ambience (instrument-flavoured engines, crowd murmur, announcer whoosh) and in-race stings/whooshes.
import { createVoices } from './music.js';
export const BEAT = .5; // jingle grid: 8 beats = 4 s; digits 3-2-1 on beats 2, 4, 6; GO on beat 8
export const GO_AT = 8 * BEAT;
const KEY = { brass: 52, ghost: 55, stadium: 58, water: 53, bayou: 53, reed: 50, school: 48, canyon: 57, volcano: 50 }; // E, G, Bb, F, F, D, C, A, D
const LEAD = { brass: 'trumpet', ghost: 'piano', stadium: 'trumpet', water: 'steel', bayou: 'clarinet', reed: 'flute', school: 'xylo', canyon: 'marimba', volcano: 'trombone' };
// event helpers: n(beat, voice, semitone above key, length in beats, vol); d(beat, drum, vel)
const n = (b, v, s, l, vol) => ({ b, v, s, l, vol }), d = (b, k, vel = 1) => ({ b, k, vel });
const chordAt = (b, v, ss, l, vol) => ss.map(s => n(b, v, s, l, vol));
function jingle(id) {
  const E = [];
  if (id === 'brass') { // funk horn-section build: slap bass pickup, rising stabs, trumpet run, big E9 hit
    [[0, -12], [.75, -12], [1.5, -5], [2, -12], [2.75, -2], [3.5, -12], [4, -12], [4.75, -9], [5.5, -7], [6, -12], [6.75, -2], [7.25, -1]].forEach(([b, s]) => E.push(n(b, 'slap', s, .4, .2)));
    [[1, [12, 15, 19]], [3, [14, 17, 21]], [5, [15, 19, 22]], [7, [17, 20, 24]]].forEach(([b, ss]) => E.push(...chordAt(b, 'stab', ss, .3, .07)));
    [24, 26, 27, 29].forEach((s, k) => E.push(n(7.5 + k * .125, 'trumpet', s, .14, .07)));
    for (let b = 0; b < 8; b += .5) E.push(d(b, 'hat', b % 1 ? .5 : .8)); [0, 2, 4, 6].forEach(b => E.push(d(b, 'kick'))); [7, 7.25, 7.5, 7.75].forEach((b, k) => E.push(d(b, 'snare', .5 + k * .15)));
    E.push(...chordAt(8, 'trumpet', [24, 31, 34, 38], 2.2, .055), ...chordAt(8, 'trombone', [12, 16, 19], 2.2, .06), n(8, 'tuba', -12, 2, .1), d(8, 'crash', 1.2), d(8, 'kick', 1.1)); }
  else if (id === 'ghost') { // saloon: climbing stride-piano tremolo over tuba oom-pah, banjo pickups, G6 hit
    const prog = [[0, 4, 7], [4, 8, 11, 14], [2, 6, 9, 12], [7, 11, 14, 17]]; // G, E7 (rel), A7, D7 (relative to G)
    for (let k = 0; k < 16; k++) { const b = k * .5, c = prog[Math.floor(k / 4)]; E.push(n(b, 'piano', 12 + c[k % c.length] + Math.floor(k / 8) * 12, .5, .12)); if (k % 2) E.push(n(b + .25, 'banjo', 24 + c[(k + 1) % c.length], .25, .08)); }
    for (let b = 0; b < 8; b++) { const c = prog[Math.floor(b / 2)]; E.push(n(b, 'tuba', -12 + c[0] - (c[0] > 6 ? 12 : 0), .45, .12)); E.push(d(b + .5, 'brush', .6)); }
    E.push(...chordAt(8, 'piano', [12, 16, 19, 21, 24], 2.5, .1), n(8, 'tuba', -12, 2, .13), ...chordAt(8, 'horn', [16, 19, 24], 2, .05), d(8, 'crash'), d(8, 'kick')); }
  else if (id === 'stadium') { // drumline roll crescendo, bass-drum hits on the digits, trumpet fanfare, Bb hit
    for (let k = 0; k < 64; k++) E.push(d(k * .125, 'snare', .12 + .55 * (k / 64) * (k / 64) + (k % 4 === 0 ? .15 : 0)));
    [0, 2, 4, 6].forEach(b => E.push(d(b, 'bassdrum', 1))); [1, 1.5, 3, 3.5, 5, 5.25, 5.5, 7, 7.25, 7.5, 7.75].forEach((b, k) => E.push(d(b, 'tom', .6 + (k % 3) * .1)));
    E.push(n(3, 'trumpet', 12, .5, .06), n(3.5, 'trumpet', 16, .5, .06), n(4, 'trumpet', 19, 1, .07), n(5, 'trumpet', 19, .5, .06), n(5.5, 'trumpet', 24, .5, .07), n(6, 'trumpet', 28, 1, .07), n(7.5, 'trumpet', 26, .25, .06), n(7.75, 'trumpet', 28, .25, .06));
    E.push(...chordAt(8, 'trumpet', [24, 28, 31], 2.2, .06), ...chordAt(8, 'trombone', [12, 16, 19], 2.2, .06), n(8, 'tuba', -12, 2.2, .12), n(8, 'bells', 36, 1, .09), d(8, 'crash', 1.2), d(8, 'bassdrum', 1.2)); }
  else if (id === 'water') { // calypso: steel-pan arpeggio climbing F-Bb-C7, congas + shaker, flute trill, sunny F6/9 hit
    const prog = [[0, 4, 7, 12], [5, 9, 12, 17], [7, 10, 16, 19], [7, 11, 14, 19]];
    for (let k = 0; k < 16; k++) { const c = prog[Math.floor(k / 4)]; E.push(n(k * .5, 'steel', 12 + c[k % 4] + (k >= 12 ? 12 : 0), .5, .13)); }
    for (let b = 0; b < 8; b += .25) E.push(d(b, 'shaker', (b * 4) % 2 ? .4 : .7)); [0, .75, 1.5, 2, 2.75, 3.5, 4, 4.75, 5.5, 6, 6.75, 7.5].forEach((b, k) => E.push(d(b, k % 3 ? 'congaH' : 'congaL', .8)));
    for (let k = 0; k < 8; k++) E.push(n(6 + k * .25, 'flute', 28 + (k % 2 ? 2 : 0) + (k >= 6 ? 3 : 0), .25, .06));
    E.push(...chordAt(8, 'steel', [12, 16, 19, 21, 26], 1.5, .1), ...chordAt(8, 'flute', [28, 31], 2, .05), n(8, 'marimba', 0, 1, .15), d(8, 'crash'), d(8, 'congaL', 1)); }
  else if (id === 'bayou') { // New Orleans: swung clarinet climb over walking tuba, press roll, F9 hit
    const run = [12, 15, 16, 19, 21, 22, 24, 27, 28, 31, 33, 34, 36, 34, 36, 39];
    run.forEach((s, k) => E.push(n(k * .5 + (k % 2 ? .1 : 0), 'clarinet', s, .4, .07)));
    [-12, -8, -5, -2, -7, -3, 0, -1].forEach((s, b) => { E.push(n(b, 'tuba', s, .8, .12)); E.push(d(b + .6, 'brush', .5)); E.push(d(b, 'kick', .5)); });
    for (let k = 0; k < 16; k++) E.push(d(7 + k / 16, 'snare', .2 + k * .03));
    E.push(...chordAt(8, 'clarinet', [28, 31, 34], 2.2, .06), ...chordAt(8, 'sax', [16, 22], 2.2, .06), ...chordAt(8, 'trombone', [4, 10], 2.2, .06), n(8, 'tuba', -12, 2, .13), d(8, 'crash'), d(8, 'kick')); }
  else if (id === 'school') { // pep band: school bell, xylophone climb over tuba + claps, high-snare cadence, C6 fight-song hit
    for (let k = 0; k < 12; k++) E.push(n(k * .125, 'bells', 31 + (k % 2) * 4, .12, .05));
    const arp = [0, 4, 7, 12, 4, 7, 12, 16, 5, 9, 12, 17, 7, 11, 14, 19]; arp.forEach((s, k) => E.push(n(1.5 + k * .375, 'xylo', 12 + s, .3, .12)));
    [0, 0, 5, 7, 0, 5, 7, 7].forEach((s, b) => { E.push(n(b, 'tuba', -12 + s, .45, .12)); if (b % 2) E.push(d(b, 'clap', .8)); E.push(d(b, 'kick', b % 2 ? .5 : .8)); });
    for (let b = 2; b < 8; b += .25) E.push(d(b, 'snareHi', ((b * 4) % 4 === 0 ? .7 : .35) + (b > 7 ? .3 : 0)));
    E.push(...chordAt(8, 'trumpet', [24, 28, 31, 33], 2.2, .05), ...chordAt(8, 'xylo', [24, 28, 31, 36], 1, .12), n(8, 'tuba', -12, 2, .13), d(8, 'crash', 1.1), d(8, 'kick', 1.1), d(8, 'clap', 1)); }
  else if (id === 'canyon') { // drumline cadence: quad sweeps, split bass-drum melody, marimba call + canyon echo, snare roll into an Am(add9) hit
    [[0, 'q1'], [.25, 'q2'], [.5, 'q3'], [.75, 'q4'], [2, 'q4'], [2.25, 'q3'], [2.5, 'q2'], [2.75, 'q1'], [4, 'q1'], [4.125, 'q2'], [4.25, 'q3'], [4.375, 'q4'], [6, 'q4'], [6.125, 'q3'], [6.25, 'q2'], [6.375, 'q1']].forEach(([b, k]) => E.push(d(b, k, .8)));
    [[1, 'bd1'], [1.25, 'bd2'], [1.5, 'bd3'], [3, 'bd3'], [3.25, 'bd2'], [3.5, 'bd1'], [5, 'bd1'], [5.5, 'bd3'], [5.75, 'bd2']].forEach(([b, k]) => E.push(d(b, k, 1)));
    for (let b = 0; b < 7; b += .5) E.push(d(b, 'click', .4)); for (let k = 0; k < 24; k++) E.push(d(7 + k / 24, 'snare', .15 + k * .03));
    const call = [12, 15, 19, 17, 15, 12]; call.forEach((s, k) => { E.push(n(.5 + k * .5, 'marimba', s + 12, .4, .14)); E.push(n(1.25 + k * .5, 'marimba', s + 12, .4, .05)); });
    E.push(n(4.5, 'trombone', 0, .5, .07), n(5, 'trombone', 3, .5, .07), n(5.5, 'trombone', 7, 1, .08));
    E.push(...chordAt(8, 'marimba', [12, 15, 19, 26], 1, .14), ...chordAt(8, 'trombone', [0, 7, 12], 2.2, .06), ...chordAt(8, 'horn', [15, 19], 2, .05), d(8, 'crash', 1.1), d(8, 'bd3', 1.2), d(8, 'q4', 1)); }
  else if (id === 'volcano') { // thunder drums: distant thunder, taiko booms on every beat, rising timpani roll, low trombone riff, Dm hit + rumble
    E.push(d(0, 'thunder', 1)); for (let b = 0; b < 8; b++) { E.push(d(b, 'taiko', b % 2 ? .7 : 1)); if (b % 2) E.push(d(b + .5, 'taiko', .5)); }
    for (let k = 0; k < 32; k++) E.push(n(4 + k * .125, 'timpani', k < 16 ? -12 : -5, .15, .05 + k * .004));
    [[1, 0], [1.5, 3], [2, 5], [2.5, 6], [3, 7], [5, 0], [5.5, 3], [6, 5], [6.5, 8], [7, 7], [7.5, 10]].forEach(([b, s]) => E.push(n(b, 'trombone', s - 12, .45, .09)));
    E.push(d(6, 'swell', .9)); for (let k = 0; k < 8; k++) E.push(d(7 + k / 8, 'tom', .5 + k * .06));
    E.push(...chordAt(8, 'trombone', [-12, -5, 0, 3], 2.4, .065), ...chordAt(8, 'trumpet', [12, 15, 19], 2, .05), n(8, 'timpani', -12, 1.5, .2), n(8, 'tuba', -24, 2.2, .12), d(8, 'thunder', .9), d(8, 'crash', 1.2), d(8, 'taiko', 1.3)); }
  else { // reed: airy flute scale runs, bassoon pulses, oboe call, harp glissando, Dadd9 hit
    const sc = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
    for (let k = 0; k < 8; k++) E.push(n(k * .25, 'flute', 24 + sc[k], .25, .06)); for (let k = 0; k < 8; k++) E.push(n(2.5 + k * .25, 'flute', 24 + sc[k + 3], .25, .06));
    for (let b = 0; b < 8; b++) { E.push(n(b, 'bassoon', [-12, -12, -5, -5, -7, -7, -3, -5][b], .4, .14)); E.push(d(b, 'frame', b % 2 ? .5 : .8)); }
    E.push(n(4.5, 'oboe', 19, .5, .06), n(5, 'oboe', 21, .5, .06), n(5.5, 'oboe', 24, 1, .07));
    for (let k = 0; k < 12; k++) E.push(n(7 + k / 12, 'harp', 12 + sc[k], .4, .07));
    E.push(...chordAt(8, 'flute', [26, 31], 2.2, .06), ...chordAt(8, 'oboe', [16, 19], 2.2, .045), n(8, 'bassoon', -12, 1.5, .15), ...chordAt(8, 'harp', [12, 19, 24, 28], 1, .08), d(8, 'crash', .8), d(8, 'frame', 1)); }
  return E;
}
export function createRaceSfx(AC, out, trackId) {
  const id = KEY[trackId] != null ? trackId : 'brass', key = KEY[id], lead = LEAD[id];
  const { V, D, env, osc, filt, noise, mf } = createVoices(AC, out);
  let ambient = null; const cool = {};
  const ok = k => { const t = AC.currentTime; if (cool[k] && t < cool[k]) return false; return true; };
  const hold = (k, s) => { cool[k] = AC.currentTime + s; };
  const whoosh = (t, vol = .12, dur = .5, f0 = 300, f1 = 3200) => { const g = env(t, dur * .35, vol, dur * .65), bp = filt('bandpass', f0, 1.4, g); bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur * .8);
    const s = AC.createBufferSource(); s.buffer = noise(); s.loop = true; s.connect(bp); s.start(t); s.stop(t + dur + .1); };
  const api = {
    id, key, lead, events: jingle(id),
    // the whole countdown, scheduled once on the audio clock. t0 = moment the countdown started (digits at t0+1/2/3, GO at t0+4)
    countdown(t0) { const now = AC.currentTime; let k = 0;
      for (const e of api.events) { const t = t0 + e.b * BEAT; if (t < now - .02) continue; k++; if (e.k) D(t, e.k, e.vel * (e.b >= 8 ? .7 : .85)); else V[e.v](mf(key + e.s), t, e.l * BEAT, e.vol * (e.b >= 8 ? .65 : .8)); }
      for (const [i, b] of [[3, 2], [2, 4], [1, 6]].entries()) { const t = t0 + b[1] * BEAT; if (t < now - .02) continue; api.beep(t, false); k++; }
      if (t0 + GO_AT >= now - .02) { api.beep(t0 + GO_AT, true); k++; }
      return k; },
    beep(t, go) { const f = mf(key + (go ? 36 : 31)); V.bells(f, t, .3, go ? .11 : .12); const g = env(t, .003, go ? .04 : .045, go ? .35 : .14), lp = filt('lowpass', 2600, 0, g); osc('square', f, t, t + .4, lp); if (go) { osc('square', f * 1.5, t, t + .4, lp); osc('square', f * 2, t, t + .4, lp); } },
    // pre-race: crowd murmur, idling engines with an instrument flavour, revs/blats, announcer whoosh
    ambientStart(t0) { if (ambient) return; const A = ambient = { nodes: [], g: AC.createGain() }; A.g.gain.setValueAtTime(0, t0); A.g.gain.linearRampToValueAtTime(1, t0 + .6); A.g.connect(out);
      const crowd = AC.createGain(); crowd.gain.value = .05; crowd.connect(A.g); A.crowd = crowd;
      for (const [f, q] of [[650, .8], [1400, 1.2]]) { const s = AC.createBufferSource(); s.buffer = noise(); s.loop = true; s.playbackRate.value = .9 + Math.random() * .2; const b = AC.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; s.connect(b); b.connect(crowd); s.start(t0); A.nodes.push(s); }
      const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = .35; lg.gain.value = .02; lfo.connect(lg); lg.connect(crowd.gain); lfo.start(t0); A.nodes.push(lfo);
      // engines: a tuba-ish low rumble (pack) + the player's engine, both chugging through a lowpass; brass blats on top
      const eng = (f, vol, chug) => { const g = AC.createGain(); g.gain.value = vol; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 3; lp.connect(g); g.connect(A.g);
        const o1 = AC.createOscillator(), o2 = AC.createOscillator(); o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = f; o2.frequency.value = f * 1.51; const g2 = AC.createGain(); g2.gain.value = .35; o1.connect(lp); o2.connect(g2); g2.connect(lp);
        const am = AC.createOscillator(), ag = AC.createGain(); am.frequency.value = chug; ag.gain.value = vol * .6; am.connect(ag); ag.connect(g.gain); [o1, o2, am].forEach(o => { o.start(t0); A.nodes.push(o); }); return { o1, o2, lp, g, am }; };
      A.pack = eng(41, .05, 7.5); A.me = eng(55, .045, 9.5);
      for (let k = 0; k < 5; k++) { const t = t0 + .6 + k * .62 + Math.random() * .25; if (k % 2) api.blat(t, 'trumpet'); else api.blat(t, 'tuba'); }
      // announcer-style synth whoosh + a two-note "ready?" call through vowel formants
      whoosh(t0, .1, 1.1, 180, 4200); const call = (t, m, l) => { const g = env(t, .04, .05, l); for (const fm of [700, 1150, 2600]) { const b = filt('bandpass', fm, 6, g); osc('sawtooth', mf(m), t, t + l + .1, b); osc('sawtooth', mf(m) * 1.005, t, t + l + .1, b); } };
      call(t0 + .15, key + 19, .28); call(t0 + .5, key + 24, .42); },
    blat(t, kind) { if (kind === 'trumpet') { const g = env(t, .01, .045, .22), lp = filt('lowpass', 2200, 2, g); const o = osc('sawtooth', mf(key + 19), t, t + .3, lp); o.frequency.setValueAtTime(mf(key + 15), t); o.frequency.exponentialRampToValueAtTime(mf(key + 22), t + .18); }
      else { const g = env(t, .02, .09, .4), lp = filt('lowpass', 500, 4, g); const o = osc('sawtooth', mf(key - 24), t, t + .5, lp); o.frequency.setValueAtTime(mf(key - 26), t); o.frequency.exponentialRampToValueAtTime(mf(key - 19), t + .3); } },
    rev(throttle) { const A = ambient; if (!A || A.ending) return; const t = AC.currentTime, f = 55 * (1 + throttle * 1.1); A.me.o1.frequency.setTargetAtTime(f, t, .12); A.me.o2.frequency.setTargetAtTime(f * 1.51, t, .12); A.me.lp.frequency.setTargetAtTime(420 + throttle * 900, t, .12); A.me.am.frequency.setTargetAtTime(9.5 + throttle * 14, t, .12); },
    // GO: crowd cheers, everybody revs, then the ambience fades under the music
    ambientGo(t) { const A = ambient; if (!A || A.ending) return; A.ending = true; A.crowd.gain.cancelScheduledValues(t); A.crowd.gain.setValueAtTime(.05, t); A.crowd.gain.linearRampToValueAtTime(.16, t + .3); A.crowd.gain.linearRampToValueAtTime(.03, t + 2.5);
      for (const e of [A.pack, A.me]) { e.o1.frequency.setTargetAtTime(e.o1.frequency.value * 2.4, t, .25); e.o2.frequency.setTargetAtTime(e.o2.frequency.value * 2.4, t, .25); e.lp.frequency.setTargetAtTime(1600, t, .2); }
      A.g.gain.cancelScheduledValues(t); A.g.gain.setValueAtTime(1, t); A.g.gain.linearRampToValueAtTime(.8, t + .6); A.g.gain.linearRampToValueAtTime(0, t + 3); A.nodes.forEach(o => { try { o.stop(t + 3.1); } catch (_) {} }); setTimeout(() => { if (ambient === A) ambient = null; }, 3600); },
    ambientStop() { const A = ambient; if (!A) return; const t = AC.currentTime; A.g.gain.cancelScheduledValues(t); A.g.gain.setValueAtTime(A.g.gain.value, t); A.g.gain.linearRampToValueAtTime(0, t + .15); A.nodes.forEach(o => { try { o.stop(t + .2); } catch (_) {} }); ambient = null; },
    get ambientOn() { return !!ambient; },
    // in-race
    whoosh(vol = .1, dur = .5) { if (!ok('wh')) return; hold('wh', .12); whoosh(AC.currentTime, vol, dur); },
    boost(big) { if (!ok('boost')) return; hold('boost', .15); whoosh(AC.currentTime, big ? .12 : .08, big ? .7 : .45, 250, big ? 5000 : 3000); },
    warp() { const t = AC.currentTime; whoosh(t, .13, .9, 150, 6000); const g = env(t, .01, .05, .6), o = osc('sine', 300, t, t + .7, g); o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(1800, t + .5); },
    land(hard) { if (!ok('land')) return; hold('land', .15); const t = AC.currentTime, g = env(t, .003, hard ? .32 : .22, .22), o = osc('sine', 120, t, t + .3, g); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + .18); D(t, 'tom', .3); },
    bump() { if (!ok('bump')) return; hold('bump', .35); const t = AC.currentTime; D(t, 'tom', .6); const g = env(t, .005, .06, .18), lp = filt('lowpass', 900, 3, g); const o = osc('sawtooth', mf(key - 5), t, t + .25, lp); o.frequency.setValueAtTime(mf(key - 2), t); o.frequency.exponentialRampToValueAtTime(mf(key - 10), t + .18); },
    shortcut() { if (!ok('sc')) return; hold('sc', 2); const t = AC.currentTime; whoosh(t, .1, .6, 200, 3500); [0, 4, 7, 12].forEach((s, k) => V[lead](mf(key + 24 + s), t + .05 + k * .07, .14, .07)); },
    place(p) { if (!ok('place')) return; hold('place', 1.1); const t = AC.currentTime, ss = p === 1 ? [7, 12, 16, 19] : [7, 12]; ss.forEach((s, k) => V[lead](mf(key + 24 + s), t + k * .08, k === ss.length - 1 ? .25 : .1, .07)); if (p === 1) V.bells(mf(key + 43), t + .25, .4, .06); },
    // Instrument Blasts: an instrument-flavoured sound for each car's sound-wave special (vol scales with distance to the listener)
    blast(type, v = 1) { const t = AC.currentTime, k = v;
      if (type === 'tuba') { V.tuba(mf(28), t, .45, .2 * k); V.tuba(mf(35), t + .02, .4, .12 * k); D(t, 'bassdrum', .9 * k); }
      else if (type === 'trumpet') { [0, 4, 7, 12].forEach((s, i) => V.trumpet(mf(70 + s), t + i * .06, i === 3 ? .3 : .08, .09 * k)); }
      else if (type === 'snare') { for (let i = 0; i < 12; i++) D(t + i * .035, 'snare', (.35 + i * .04) * k); }
      else if (type === 'trombone') { const g = env(t, .02, .1 * k, .5), lp = filt('lowpass', 1500, 2, g); const o = osc('sawtooth', mf(46), t, t + .6, lp); o.frequency.setValueAtTime(mf(46), t); o.frequency.exponentialRampToValueAtTime(mf(58), t + .4); }
      else if (type === 'sax') { [0, 3, 5, 7].forEach((s, i) => V.sax(mf(61 + s), t + i * .07, .12, .08 * k)); }
      else if (type === 'clarinet') { for (let i = 0; i < 8; i++) V.clarinet(mf(76 + (i % 2) * 2), t + i * .045, .05, .07 * k); }
      else if (type === 'horn') { V.horn(mf(55), t, .25, .1 * k); V.horn(mf(62), t + .2, .4, .1 * k); }
      else { [0, 2, 4, 7, 9, 12, 14, 16].forEach((s, i) => V.marimba(mf(72 + s), t + i * .04, .1, .1 * k)); } },
    gate(k) { if (!ok('gate')) return; hold('gate', .25); const t = AC.currentTime, ss = [[12, 19, 24], [14, 19, 26], [16, 21, 28], [19, 24, 31]][k % 4]; ss.forEach((s, i) => V.bells(mf(key + 12 + s), t + i * .05, .3, .06)); V[lead](mf(key + 24 + ss[2]), t + .12, .18, .05); },
    lap() { const t = AC.currentTime; [[0, 12], [1, 16], [2, 19], [3, 24]].forEach(([k, s]) => { V[lead](mf(key + 12 + s), t + k * .09, k === 3 ? .35 : .1, .07); }); V.bells(mf(key + 36), t + .27, .5, .07); D(t + .27, 'crash', .35); },
  };
  return api;
}
