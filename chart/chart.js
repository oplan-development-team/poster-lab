import { THEMES, MONO, drawSheet, fitCanvas, exportPNG, themeButtons, copyLink } from '../shared.js';
import { lst, localToUTC } from '../starmap/astro.js';
import { positions, angles, sign, SIGN_GLYPH, PLANETS, ASPECTS } from './ephem.js';

const $ = s => document.querySelector(s), canvas = $('#sheet');
const S = { name: '', place: 'Tokyo', lat: 35.6762, lng: 139.6503, date: '1990-06-15', time: '09:30', theme: 0, aspects: 1 };
const SYM = '"Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Sans Symbols", sans-serif';
const rad = Math.PI / 180, norm = x => ((x % 360) + 360) % 360;

function loadHash() { const h = new URLSearchParams(location.hash.slice(1)); for (const k in S) if (h.has(k)) S[k] = typeof S[k] === 'number' ? +h.get(k) : h.get(k); }
const saveHash = () => history.replaceState(null, '', '#' + new URLSearchParams(S));
const fmtCoord = (v, pos, neg) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;
const fmtDate = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

function draw(ctx, scale) {
  const th = THEMES[S.theme], utc = localToUTC(S.date, S.time, S.lng), pos = positions(utc), { asc, mc } = angles(lst(utc, S.lng), S.lat, utc);
  drawSheet(ctx, scale, th, {
    title: (S.name || 'BIRTH CHART').toUpperCase(), spaced: !!S.name,
    sub: `${fmtDate(S.date)}  ·  ${S.time}  ·  ${S.place.toUpperCase()}`,
    r1: `${fmtCoord(S.lat, 'N', 'S')} / ${fmtCoord(S.lng, 'E', 'W')}`,
    r2: `SUN ${sign(pos.sun).toUpperCase()}  ·  MOON ${sign(pos.moon).toUpperCase()}  ·  ASC ${sign(asc).toUpperCase()}`,
    fl: `TROPICAL  ·  EQUAL HOUSES  ·  ${th.n.toUpperCase()}`,
  }, (ctx, W, H) => {
    const R = W / 2 - 14, cx = W / 2, cy = R + 20;
    const at = (lon, r) => { const t = Math.PI + (lon - asc) * rad; return [cx + Math.cos(t) * r, cy - Math.sin(t) * r]; };
    const line = (lon, r1, r2) => { const [x1, y1] = at(lon, r1), [x2, y2] = at(lon, r2); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    ctx.strokeStyle = th.ink; ctx.fillStyle = th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [r, a] of [[R, 0.9], [R * 0.87, 0.4], [R * 0.80, 0.4], [R * 0.42, 0.9]]) { ctx.globalAlpha = a; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }
    // zodiac ring
    ctx.font = `${R * 0.075}px ${SYM}`;
    for (let i = 0; i < 12; i++) { ctx.globalAlpha = 0.6; line(i * 30, R, R * 0.87); ctx.globalAlpha = 1; const [x, y] = at(i * 30 + 15, R * 0.935); ctx.fillText(SIGN_GLYPH[i], x, y); }
    for (let d = 0; d < 360; d += 5) { ctx.globalAlpha = 0.5; ctx.lineWidth = d % 10 ? 0.6 : 1; line(d, R * 0.87, R * (0.87 - (d % 30 ? d % 10 ? 0.025 : 0.045 : 0.07))); }
    // houses (equal from the ascendant)
    ctx.font = `500 ${R * 0.035}px ${MONO}`;
    for (let h = 0; h < 12; h++) { const main = h % 3 === 0; ctx.lineWidth = main ? 1.6 : 0.6; ctx.globalAlpha = main ? 1 : 0.35; line(asc + h * 30, R * 0.80, R * 0.42); const [x, y] = at(asc + h * 30 + 15, R * 0.46); ctx.globalAlpha = 0.55; ctx.fillText(String(h + 1), x, y); }
    ctx.globalAlpha = 1; ctx.strokeStyle = th.ac; ctx.lineWidth = 1.4; line(mc, R * 0.80, R * 0.42); line(mc + 180, R * 0.80, R * 0.42);
    ctx.font = `600 ${R * 0.038}px ${MONO}`; ctx.fillStyle = th.ac;
    for (const [lon, l] of [[asc, 'ASC'], [mc, 'MC']]) { const [x, y] = at(lon, R * 0.83 + 0); ctx.save(); ctx.translate(x, y); ctx.rotate(-(Math.PI + (lon - asc) * rad) + Math.PI / 2); ctx.fillText(l, 0, 0); ctx.restore(); }
    // planets, spread so glyphs never overlap
    const list = PLANETS.map(([k, g]) => ({ k, g, d: norm(pos[k]) })).sort((a, b) => a.d - b.d), disp = list.map(p => p.d);
    for (let i = 1; i < disp.length; i++) if (disp[i] - disp[i - 1] < 7.5) disp[i] = disp[i - 1] + 7.5;
    list.forEach((p, i) => {
      ctx.strokeStyle = th.ac; ctx.lineWidth = 1.5; ctx.globalAlpha = 1; line(p.d, R * 0.80, R * 0.775);
      const [gx, gy] = at(disp[i], R * 0.665), [dx, dy] = at(disp[i], R * 0.565);
      ctx.fillStyle = p.k === 'sun' || p.k === 'moon' ? th.ac : th.ink; ctx.font = `${R * 0.085}px ${SYM}`; ctx.fillText(p.g, gx, gy);
      ctx.fillStyle = th.ink; ctx.font = `500 ${R * 0.03}px ${MONO}`; ctx.globalAlpha = 0.7; ctx.fillText(`${Math.floor(p.d % 30)}°`, dx, dy); ctx.globalAlpha = 1;
    });
    if (S.aspects) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      let diff = Math.abs(list[i].d - list[j].d); if (diff > 180) diff = 360 - diff;
      for (const [ang, orb, kind] of ASPECTS) if (kind !== 'conj' && Math.abs(diff - ang) <= orb) {
        const [x1, y1] = at(list[i].d, R * 0.42), [x2, y2] = at(list[j].d, R * 0.42);
        ctx.strokeStyle = kind === 'hard' ? th.ac : th.ink; ctx.globalAlpha = kind === 'hard' ? 0.9 : 0.45; ctx.lineWidth = kind === 'hard' ? 1.2 : 0.8;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }
    // legend
    ctx.globalAlpha = 1; ctx.fillStyle = th.ink; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    const y0 = cy + R + 44, rows = [...PLANETS.map(([k, g]) => [g, k, pos[k]]), ['↑', 'ascendant', asc], ['⊤', 'midheaven', mc]];
    rows.forEach(([g, k, lon], i) => {
      const col = i % 2, row = Math.floor(i / 2), x = col ? W / 2 + 10 : 0, y = y0 + row * 19;
      if (y > H - 14) return;
      ctx.font = `${R * 0.045}px ${SYM}`; ctx.fillText(g, x, y - 2);
      ctx.font = `500 11px ${MONO}`; ctx.fillText(`${k.toUpperCase().padEnd(10)} ${String(Math.floor(lon % 30)).padStart(2)}° ${sign(lon).toUpperCase()}`, x + 26, y + 2);
    });
  });
}
function render() { fitCanvas(canvas, draw); saveHash(); }
function fill() { for (const k of ['name', 'place', 'lat', 'lng', 'date', 'time']) $('#' + k).value = S[k]; $('#aspects').checked = !!S.aspects; }
async function geocode(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`).then(r => r.json()).catch(() => []);
  $('#place').classList.toggle('err', !r[0]); if (!r[0]) return;
  S.lat = +(+r[0].lat).toFixed(4); S.lng = +(+r[0].lon).toFixed(4); S.place = r[0].display_name.split(',')[0]; fill(); render();
}
$('#search').onclick = () => geocode($('#place').value);
$('#place').onkeydown = e => { if (e.key === 'Enter') geocode(e.target.value); };
for (const k of ['lat', 'lng']) $('#' + k).onchange = e => { S[k] = +e.target.value; render(); };
for (const k of ['date', 'time', 'name']) $('#' + k).oninput = e => { if (e.target.value || k === 'name') { S[k] = e.target.value; render(); } };
$('#aspects').onchange = e => { S.aspects = +e.target.checked; render(); };
$('#download').onclick = () => exportPNG(+$('#size').value, `birth-chart-${S.date}.png`, draw);
$('#copy').onclick = e => copyLink(e.target);
addEventListener('resize', render);
loadHash(); fill();
const buildThemes = () => themeButtons($('#themes'), S.theme, t => { S.theme = t; buildThemes(); render(); });
buildThemes(); render();
