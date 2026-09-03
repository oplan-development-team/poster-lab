// node starmap/check.mjs — Polaris must sit near north at altitude ≈ latitude.
import { lst, altAz, localToUTC } from './astro.js';
const t = localToUTC('2026-09-03', '21:00', 139.69), L = lst(t, 139.69);
const p = altAz(37.95, 89.26, L, 35.68);
console.assert(Math.abs(p.alt - 35.68) < 1.5, 'Polaris alt', p);
console.assert(p.az < 2 || p.az > 358, 'Polaris az', p);
// Sun-ish sanity: RA=LST is on the meridian (az 0 or 180), alt = 90 - |lat - dec|
const m = altAz(L, 0, L, 35.68);
console.assert(Math.abs(m.alt - (90 - 35.68)) < 0.01 && Math.abs(m.az - 180) < 0.01, 'meridian', m);
console.log('ok', p, m);
