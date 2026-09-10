import { THEMES, MONO, drawSheet, fitCanvas, exportPNG, themeButtons, copyLink, withOrient } from '../shared.js';
import { lst, project, localToUTC } from './astro.js';

const [STARS, LINES] = await Promise.all(['../data/stars.json', '../data/lines.json'].map(u => fetch(u).then(r => r.json())));
const $ = s => document.querySelector(s), canvas = $('#sheet');
const today = new Date().toISOString().slice(0, 10);
const S = { place: 'Tokyo', lat: 35.6762, lng: 139.6503, date: today, time: '21:00', theme: 1, lines: 1, title: '' };

function loadHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  for (const k in S) if (h.has(k)) S[k] = typeof S[k] === 'number' ? +h.get(k) : h.get(k);
}
function saveHash() { history.replaceState(null, '', '#' + withOrient(new URLSearchParams(S))); }
const fmtCoord = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
const fmtDate = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

function draw(ctx, scale) {
  const th = THEMES[S.theme], L = lst(localToUTC(S.date, S.time, S.lng), S.lng);
  drawSheet(ctx, scale, th, {
    title: (S.title || S.place).toUpperCase(), spaced: true,
    sub: `${fmtDate(S.date)}  ·  ${S.time}`,
    r1: `${fmtCoord(S.lat, 'N', 'S')} / ${fmtCoord(S.lng, 'E', 'W')}`, r2: 'THE NIGHT SKY',
    fl: `${S.place.toUpperCase()}  ·  ${th.n.toUpperCase()}`,
  }, (ctx, W, H) => {
    const R = Math.min(W, H) / 2 - 24, cx = W / 2, cy = H / 2;
    ctx.lineWidth = 1; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.12; ctx.lineWidth = 0.6;
    for (const a of [30, 60]) { ctx.beginPath(); ctx.arc(cx, cy, R * Math.tan((90 - a) / 2 * Math.PI / 180), 0, 7); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    if (S.lines) {
      ctx.lineWidth = 0.7; ctx.globalAlpha = 0.45;
      for (const line of LINES) {
        ctx.beginPath(); let pen = false;
        for (const [ra, dec] of line) {
          const p = project(ra, dec, L, S.lat, R, -8);
          if (!p) { pen = false; continue; }
          pen ? ctx.lineTo(cx + p.x, cy + p.y) : ctx.moveTo(cx + p.x, cy + p.y); pen = true;
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    for (const [ra, dec, mag] of STARS) {
      const p = project(ra, dec, L, S.lat, R);
      if (!p) continue;
      ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, Math.max(0.35, (6.3 - mag) * 0.55), 0, 7); ctx.fill();
    }
    ctx.restore();
    ctx.font = `500 12px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [l, dx, dy] of [['N', 0, -1], ['S', 0, 1], ['E', -1, 0], ['W', 1, 0]]) ctx.fillText(l, cx + dx * (R + 14), cy + dy * (R + 14));
  });
}
function render() { fitCanvas(canvas, draw); saveHash(); }
function fill() { for (const k of ['place', 'lat', 'lng', 'date', 'time', 'title']) $('#' + k).value = S[k]; $('#lines').checked = !!S.lines; }

async function geocode(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`).then(r => r.json()).catch(() => []);
  if (!r[0]) { $('#place').classList.add('err'); return; }
  $('#place').classList.remove('err');
  S.lat = +(+r[0].lat).toFixed(4); S.lng = +(+r[0].lon).toFixed(4); S.place = r[0].display_name.split(',')[0];
  fill(); render();
}
$('#search').onclick = () => geocode($('#place').value);
$('#place').onkeydown = e => { if (e.key === 'Enter') geocode(e.target.value); };
$('#locate').onclick = () => navigator.geolocation.getCurrentPosition(async ({ coords }) => {
  S.lat = +coords.latitude.toFixed(4); S.lng = +coords.longitude.toFixed(4);
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${S.lat}&lon=${S.lng}&zoom=10`).then(r => r.json()).catch(() => null);
  S.place = r?.address?.city || r?.address?.town || r?.address?.state || 'HERE';
  fill(); render();
});
for (const k of ['lat', 'lng']) $('#' + k).onchange = e => { S[k] = +e.target.value; render(); };
for (const k of ['date', 'time', 'title']) $('#' + k).oninput = e => { S[k] = e.target.value; render(); };
$('#lines').onchange = e => { S.lines = +e.target.checked; render(); };
$('#download').onclick = () => exportPNG(+$('#size').value, `starmap-${S.place.toLowerCase()}-${S.date}.png`, draw);
$('#copy').onclick = e => copyLink(e.target);
addEventListener('resize', render);

loadHash(); fill();
const buildThemes = () => themeButtons($('#themes'), S.theme, t => { S.theme = t; buildThemes(); render(); });
buildThemes();
render();
