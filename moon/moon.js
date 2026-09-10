import { THEMES, MONO, drawSheet, fitCanvas, exportPNG, themeButtons, copyLink, withOrient, isLandscape } from '../shared.js';

const $ = s => document.querySelector(s), canvas = $('#sheet');
const S = { year: new Date().getFullYear(), name: '', mark: '', theme: 1 };
const SYN = 29.530588853, NEW0 = Date.UTC(2000, 0, 6, 18, 14); // a known new moon; good to ~½ day for a century either side
export const phase = t => (((t - NEW0) / 86400000 / SYN) % 1 + 1) % 1; // 0 new · 0.5 full · 1 new
const MONTHS = 'JFMAMJJASOND';

function loadHash() { const h = new URLSearchParams(location.hash.slice(1)); for (const k in S) if (h.has(k)) S[k] = typeof S[k] === 'number' ? +h.get(k) : h.get(k); }
const saveHash = () => history.replaceState(null, '', '#' + withOrient(new URLSearchParams(S)));

// Lit side on the right while waxing (as seen from the northern hemisphere).
function drawMoon(ctx, x, y, r, ph, ink, bg) {
  const waxing = ph < 0.5, k = Math.cos(ph * 2 * Math.PI); // 1 at new … -1 at full
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing); ctx.fill();
  ctx.fillStyle = k > 0 ? bg : ink; ctx.beginPath(); ctx.ellipse(x, y, r * Math.abs(k), r, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = ink; ctx.globalAlpha = 0.3; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
}

function draw(ctx, scale) {
  const th = THEMES[S.theme], y = S.year, days = [];
  for (let m = 0; m < 12; m++) for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) days.push([m, d, phase(Date.UTC(y, m, d, 12))]);
  const fulls = days.filter(([, , p]) => Math.abs(p - 0.5) < 0.5 / SYN).length;
  drawSheet(ctx, scale, th, {
    title: (S.name || String(y)).toUpperCase(), spaced: true,
    sub: `${days.length} NIGHTS  ·  ${fulls} FULL MOONS`,
    r1: 'MOON PHASES', r2: 'NORTHERN SKY',
    fl: `ONE ${isLandscape() ? 'ROW' : 'COLUMN'} IS ONE MONTH  ·  ${th.n.toUpperCase()}`,
  }, (ctx, W, H) => {
    // portrait: 12 month columns × 31 day rows; landscape: 31 day columns × 12 month rows
    const land = W > H, C = land ? 31 : 12, Rw = land ? 12 : 31, top = 26, left = land ? 30 : 0;
    const cell = Math.min((W - left) / C, (H - top) / Rw), r = cell * 0.36, x0 = left + (W - left - cell * C) / 2, y0 = top + (H - top - cell * Rw) / 2;
    ctx.font = `500 10px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = th.ink; ctx.globalAlpha = 0.55;
    for (let m = 0; m < 12; m++) land ? ctx.fillText(MONTHS[m], x0 - 16, y0 + m * cell + cell / 2) : ctx.fillText(MONTHS[m], x0 + m * cell + cell / 2, y0 - 16);
    ctx.globalAlpha = 1;
    const cellXY = (m, d) => land ? [x0 + (d - 1) * cell + cell / 2, y0 + m * cell + cell / 2] : [x0 + m * cell + cell / 2, y0 + (d - 1) * cell + cell / 2];
    const mark = S.mark && S.mark.startsWith(y + '-') ? S.mark.split('-').map(Number) : null;
    for (const [m, d, p] of days) {
      const [x, yy] = cellXY(m, d), full = Math.abs(p - 0.5) < 0.5 / SYN;
      drawMoon(ctx, x, yy, r, p, full ? th.ac : th.ink, th.bg);
      if (mark && mark[1] === m + 1 && mark[2] === d) { ctx.strokeStyle = th.ac; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, yy, r * 1.55, 0, 7); ctx.stroke(); }
    }
  });
}
function render() { fitCanvas(canvas, draw); saveHash(); }
const buildThemes = () => themeButtons($('#themes'), S.theme, t => { S.theme = t; buildThemes(); render(); });
$('#year').oninput = e => { const v = +e.target.value; if (v > 1900 && v < 2200) { S.year = v; render(); } };
$('#name').oninput = e => { S.name = e.target.value; render(); };
$('#mark').oninput = e => { S.mark = e.target.value; render(); };
$('#download').onclick = () => exportPNG(+$('#size').value, `moon-${S.year}.png`, draw);
$('#copy').onclick = e => copyLink(e.target);
addEventListener('resize', render);
loadHash(); $('#year').value = S.year; $('#name').value = S.name; $('#mark').value = S.mark;
buildThemes(); render();
