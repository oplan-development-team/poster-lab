// Shared sheet frame: palettes, header/footer typography, canvas sizing, PNG export.
export const SHEET = { W: 1000, H: 1414, M: 80, TOP: 150, BOT: 100 }; // A-series ratio
export const THEMES = [
  { n: 'Paper', bg: '#f3efe6', ink: '#171717', ac: '#c8412b' },
  { n: 'Midnight', bg: '#0b0d12', ink: '#e8e6df', ac: '#f0b429' },
  { n: 'Terracotta', bg: '#c4532f', ink: '#f7ecd9', ac: '#20150f' },
  { n: 'Forest', bg: '#13291f', ink: '#dfe8d8', ac: '#e5a93a' },
  { n: 'Sky', bg: '#dfe9f2', ink: '#1a2a3a', ac: '#d64545' },
  { n: 'Blueprint', bg: '#1c3c8f', ink: '#e8eefb', ac: '#ffd166' },
  { n: 'Rose', bg: '#f2d9d5', ink: '#3a1f24', ac: '#1f5f5b' },
  { n: 'Ink', bg: '#111', ink: '#fff', ac: '#ff3b30' },
];
export const MONO = 'ui-monospace, Menlo, Consolas, monospace';
export const SANS = '-apple-system, "Helvetica Neue", Inter, Arial, sans-serif';
export const mulberry32 = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// Draw bg + header/footer text, then call drawArt(ctx, artW, artH) clipped to the art area.
// t = { title, sub, r1, r2, fl, fr, spaced }
export function drawSheet(ctx, scale, th, t, drawArt) {
  const { W, H, M, TOP, BOT } = SHEET;
  ctx.save(); ctx.scale(scale, scale);
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = th.ink; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.font = `600 34px ${SANS}`; ctx.letterSpacing = t.spaced ? '8px' : '-0.5px'; ctx.fillText(t.title, M, M);
  ctx.font = `400 13px ${MONO}`; ctx.letterSpacing = '1px';
  if (t.sub) ctx.fillText(t.sub, M, M + 46);
  ctx.textAlign = 'right';
  if (t.r1) ctx.fillText(t.r1, W - M, M + 2);
  if (t.r2) ctx.fillText(t.r2, W - M, M + 22);
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(t.fl || '', M, H - M + 6);
  ctx.textAlign = 'right'; ctx.fillText(t.fr || 'POSTER LAB', W - M, H - M + 6);
  ctx.fillStyle = th.ac; ctx.beginPath(); ctx.arc(M + 4, H - M - 20, 4, 0, 7); ctx.fill();
  const aw = W - 2 * M, ah = H - TOP - BOT;
  ctx.save(); ctx.translate(M, TOP); ctx.beginPath(); ctx.rect(0, 0, aw, ah); ctx.clip();
  ctx.strokeStyle = th.ink; ctx.fillStyle = th.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = '0px';
  drawArt(ctx, aw, ah);
  ctx.restore(); ctx.restore();
}
// Size the on-screen canvas to its CSS width and draw. draw(ctx, scale)
export function fitCanvas(canvas, draw) {
  const dpr = Math.min(devicePixelRatio || 1, 2), sc = canvas.clientWidth / SHEET.W;
  canvas.width = SHEET.W * sc * dpr; canvas.height = SHEET.H * sc * dpr;
  draw(canvas.getContext('2d'), sc * dpr);
}
export function exportPNG(px, name, draw) {
  const off = document.createElement('canvas');
  off.width = SHEET.W * px; off.height = SHEET.H * px;
  draw(off.getContext('2d'), px);
  off.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); }, 'image/png');
}
export function themeButtons(el, cur, onPick) {
  el.innerHTML = THEMES.map((t, i) => `<button data-t="${i}" title="${t.n}" class="${i === cur ? 'on' : ''}" style="background:${t.bg};color:${t.ink}"><i style="background:${t.ac}"></i></button>`).join('');
  el.onclick = e => { const b = e.target.closest('button'); if (b) onPick(+b.dataset.t); };
}
export function copyLink(btn) { navigator.clipboard.writeText(location.href); btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy link', 1200); }
