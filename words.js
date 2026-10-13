// Melody + content-safety word check. Note letters (A–G) must never spell inappropriate words.
export const MELODY = 'CEGECDFDCEGC'.split('');
// words spellable (or nearly) with A–G that we never want to show, forward or backward
export const BLOCK = ['FAG', 'FAGG', 'GAG', 'BAD', 'DAB', 'DAG', 'CAD', 'BEG', 'DEAD', 'ABED', 'BADE', 'GAGE', 'FAGE', 'ABBA', 'DAFT', 'BABE', 'DEF', 'FED', 'EGG', 'BED'];
const BLOCK_SET = BLOCK.map(w => w.toUpperCase());
export function hasBlocked(str) { const s = str.toUpperCase(), r = [...s].reverse().join(''); return BLOCK_SET.some(w => s.includes(w) || r.includes(w)); }
// cumulative melody across 4 laps-worth of wraparound
export function melodySafe(m = MELODY) { return !hasBlocked(m.join('').repeat(4)); }
