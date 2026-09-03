const rad = Math.PI / 180;
// Local sidereal time in degrees for a UTC Date and east longitude.
export function lst(date, lng) {
  const jd = date.getTime() / 86400000 + 2440587.5, T = (jd - 2451545) / 36525;
  const g = 280.46061837 + 360.98564736629 * (jd - 2451545) + T * T * 0.000387933;
  return ((g + lng) % 360 + 360) % 360;
}
// RA/Dec (deg) → { alt, az } in degrees; az from north, eastward.
export function altAz(ra, dec, lstDeg, lat) {
  const H = (lstDeg - ra) * rad, d = dec * rad, p = lat * rad;
  const alt = Math.asin(Math.sin(d) * Math.sin(p) + Math.cos(d) * Math.cos(p) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(p) - Math.tan(d) * Math.cos(p)) / rad + 180;
  return { alt: alt / rad, az: (az + 360) % 360 };
}
// Stereographic from zenith, horizon at radius R, north up, east on the LEFT (sky seen from below).
export function project(ra, dec, lstDeg, lat, R, minAlt = 0) {
  const { alt, az } = altAz(ra, dec, lstDeg, lat);
  if (alt < minAlt) return null;
  const r = R * Math.tan((90 - alt) / 2 * rad);
  return { x: -r * Math.sin(az * rad), y: -r * Math.cos(az * rad), alt };
}
// Local wall-clock at a longitude → UTC Date.
// ponytail: timezone ≈ round(lng/15)h — no tz database; off by ≤1h in odd zones, fine for a poster.
export function localToUTC(dateStr, timeStr, lng) {
  const [y, m, d] = dateStr.split('-').map(Number), [hh, mm] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - Math.round(lng / 15) * 3600000);
}
