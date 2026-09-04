// Geocentric ecliptic longitudes, good to ~1° for 1800–2050. Enough for a wheel, not for an almanac.
const rad = Math.PI / 180, norm = x => ((x % 360) + 360) % 360;
// JPL approximate elements (Standish): [a, e, I, L, ϖ, Ω] at J2000 + per-century rates
const EL = {
  mercury: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
  venus: [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255], [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
  earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]],
  mars: [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
  jupiter: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
  saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
  uranus: [[19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503], [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]],
  neptune: [[30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]],
  pluto: [[39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 110.30393684], [-0.00031596, 0.00005170, 0.00004818, 145.20780515, -0.04062942, -0.01183482]],
};
export const jd = date => date.getTime() / 86400000 + 2440587.5;

function helio(name, T) {
  const [b, r] = EL[name], [a, e, I, L, w_, O] = b.map((v, i) => v + r[i] * T);
  const w = w_ - O; let M = norm(L - w_); if (M > 180) M -= 360;
  let E = M + e / rad * Math.sin(M * rad);
  for (let i = 0; i < 8; i++) { const dM = M - (E - e / rad * Math.sin(E * rad)); E += dM / (1 - e * Math.cos(E * rad)); }
  const x1 = a * (Math.cos(E * rad) - e), y1 = a * Math.sqrt(1 - e * e) * Math.sin(E * rad);
  const cw = Math.cos(w * rad), sw = Math.sin(w * rad), cO = Math.cos(O * rad), sO = Math.sin(O * rad), cI = Math.cos(I * rad);
  return [(cw * cO - sw * sO * cI) * x1 + (-sw * cO - cw * sO * cI) * y1, (cw * sO + sw * cO * cI) * x1 + (-sw * sO + cw * cO * cI) * y1];
}
function moon(d) { // Meeus, truncated: ~0.3°
  const s = x => Math.sin(x * rad);
  const L = 218.316 + 13.176396 * d, M = 134.963 + 13.064993 * d, Ms = 357.529 + 0.98560028 * d, D = 297.850 + 12.190749 * d;
  return norm(L + 6.289 * s(M) + 1.274 * s(2 * D - M) + 0.658 * s(2 * D) - 0.186 * s(Ms) - 0.059 * s(2 * M - 2 * D) - 0.057 * s(M - 2 * D + Ms) + 0.053 * s(M + 2 * D) + 0.046 * s(2 * D - Ms) + 0.041 * s(M - Ms) - 0.035 * s(D) - 0.031 * s(M + Ms));
}
// → { sun, moon, mercury, … pluto } longitudes in degrees
export function positions(date) {
  const J = jd(date), T = (J - 2451545) / 36525, [ex, ey] = helio('earth', T), out = { sun: norm(Math.atan2(-ey, -ex) / rad), moon: moon(J - 2451545) };
  for (const n of Object.keys(EL)) if (n !== 'earth') { const [x, y] = helio(n, T); out[n] = norm(Math.atan2(y - ey, x - ex) / rad); }
  return out;
}
// Ascendant and MC from local sidereal time (deg) and latitude (deg); equal houses follow.
export function angles(lstDeg, lat, date) {
  const T = (jd(date) - 2451545) / 36525, eps = (23.4393 - 0.013 * T) * rad, R = lstDeg * rad, p = lat * rad;
  const asc = norm(Math.atan2(Math.cos(R), -(Math.sin(R) * Math.cos(eps) + Math.tan(p) * Math.sin(eps))) / rad);
  const mc = norm(Math.atan2(Math.sin(R), Math.cos(R) * Math.cos(eps)) / rad);
  return { asc, mc };
}
export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
export const SIGN_GLYPH = '♈♉♊♋♌♍♎♏♐♑♒♓';
export const PLANETS = [['sun', '☉'], ['moon', '☽'], ['mercury', '☿'], ['venus', '♀'], ['mars', '♂'], ['jupiter', '♃'], ['saturn', '♄'], ['uranus', '♅'], ['neptune', '♆'], ['pluto', '♇']];
export const ASPECTS = [[0, 8, 'conj'], [60, 5, 'soft'], [90, 6, 'hard'], [120, 7, 'soft'], [180, 8, 'hard']];
export const sign = lon => SIGNS[Math.floor(norm(lon) / 30)];
