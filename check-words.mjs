import { MELODY, hasBlocked, melodySafe } from './words.js';
let fail = 0;
if (!melodySafe()) { console.error('FAIL: melody spells a blocked word:', MELODY.join('')); fail = 1; }
// simulate gate panel triples like the game generates (with its reroll guard)
const L = 'CDEFGAB'.split('');
function triple(target) { for (let t = 0; t < 50; t++) { const o = L.filter(n => n !== target).sort(() => Math.random() - .5); const slot = Math.floor(Math.random() * 3); const n = [0, 1, 2].map(k => k === slot ? target : o.pop()); if (!hasBlocked(n.join(''))) return n; } return null; }
for (let i = 0; i < 20000; i++) { const t = MELODY[i % MELODY.length]; const n = triple(t); if (!n || hasBlocked(n.join(''))) { console.error('FAIL: gate panels', n); fail = 1; break; } }
if (!hasBlocked('XFAGX') || !hasBlocked('DAB') || !hasBlocked('GAF')) { console.error('FAIL: checker self-test'); fail = 1; }
console.log(fail ? 'word check FAILED' : 'word check OK: melody ' + MELODY.join(' '));
process.exit(fail);
