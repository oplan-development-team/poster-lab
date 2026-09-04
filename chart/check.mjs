// node chart/check.mjs
import { positions, angles, sign } from './ephem.js';
import { lst } from '../starmap/astro.js';
const j2000 = positions(new Date(Date.UTC(2000, 0, 1, 12)));
console.assert(Math.abs(j2000.sun - 280.4) < 0.6, 'sun J2000', j2000.sun);           // Sun ≈ 280.4° at J2000
const full = positions(new Date(Date.UTC(2024, 0, 25, 17, 54)));                       // known full moon: Moon opposite Sun
const opp = ((full.moon - full.sun) % 360 + 360) % 360;
console.assert(Math.abs(opp - 180) < 2, 'full moon opposition', opp);
console.assert(sign(j2000.sun) === 'Capricorn' && sign(j2000.jupiter) === 'Aries', 'signs', sign(j2000.sun), sign(j2000.jupiter)); // Jupiter was in Aries, Jan 2000
const d = new Date(Date.UTC(2000, 0, 1, 12)), a = angles(lst(d, 0), 0, d);
console.assert(Math.abs(((a.asc - a.mc + 360) % 360) - 90) < 3, 'asc-mc at equator ≈ 90° (±ecliptic tilt)', a);
console.log('ok', j2000.sun.toFixed(2), sign(j2000.jupiter), a);
