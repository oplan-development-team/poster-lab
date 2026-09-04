// node moon/check.mjs — known full moon 2024-01-25 17:54 UTC, new moon 2024-01-11 11:57 UTC
const SYN = 29.530588853, NEW0 = Date.UTC(2000, 0, 6, 18, 14);
const phase = t => (((t - NEW0) / 86400000 / SYN) % 1 + 1) % 1;
const full = phase(Date.UTC(2024, 0, 25, 17, 54)), nw = phase(Date.UTC(2024, 0, 11, 11, 57));
console.assert(Math.abs(full - 0.5) < 0.02, 'full', full);
console.assert(nw < 0.02 || nw > 0.98, 'new', nw);
console.log('ok', full.toFixed(3), nw.toFixed(3));
