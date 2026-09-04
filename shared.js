// Shared sheet frame: palettes, header/footer typography, canvas sizing, PNG export.
export const SHEET = { W: 1000, H: 1414, M: 80, TOP: 150, BOT: 100 }; // A-series ratio
// Palettes: bg / ink / accent. Most are popular ColorHunt palettes (colorhunt.co) reduced to two flat colours + one accent.
export const THEMES = [
  { n: 'Paper', bg: '#f3efe6', ink: '#171717', ac: '#c8412b' },
  { n: 'Midnight', bg: '#0b0d12', ink: '#e8e6df', ac: '#f0b429' },
  { n: 'Harbor', bg: '#f2efe7', ink: '#3368a0', ac: '#66a3bf' },
  { n: 'Blush', bg: '#fff5f5', ink: '#4a4a4a', ac: '#e2b4bd' },
  { n: 'Pine', bg: '#1d4533', ink: '#f7eae0', ac: '#f9d2ba' },
  { n: 'Pop', bg: '#fff1d1', ink: '#df301c', ac: '#00b7cd' },
  { n: 'Plum', bg: '#ffebb8', ink: '#601d49', ac: '#bd5579' },
  { n: 'Candy', bg: '#fff4bf', ink: '#8c56d4', ac: '#ffbefb' },
  { n: 'Navy', bg: '#091540', ink: '#abd2fa', ac: '#7692ff' },
  { n: 'Moss', bg: '#092328', ink: '#8bbb92', ac: '#2a835f' },
  { n: 'Sky', bg: '#fff4f4', ink: '#3a86ff', ac: '#bdb2ff' },
  { n: 'Lime', bg: '#f5fbda', ink: '#450c3f', ac: '#b9d175' },
  { n: 'Wine', bg: '#2c2c2c', ink: '#f3f4f4', ac: '#853953' },
  { n: 'Teal', bg: '#ffe2af', ink: '#007979', ac: '#e37434' },
  { n: 'Harvest', bg: '#f1e5a1', ink: '#8b2626', ac: '#ef6905' },
  { n: 'Rose', bg: '#fff2f2', ink: '#165823', ac: '#ff788d' },
  { n: 'Olive', bg: '#ebe3a7', ink: '#2e2910', ac: '#eb7d00' },
  { n: 'Violet', bg: '#eeeeee', ink: '#3e0f8d', ac: '#e4da72' },
  { n: 'Coral', bg: '#ffd166', ink: '#118ab2', ac: '#ff7f50' },
  { n: 'Garden', bg: '#f2f2f2', ink: '#689d4b', ac: '#d96868' },
];
export const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; };

export const MONO = 'ui-monospace, Menlo, Consolas, monospace';
export const SANS = '-apple-system, "Helvetica Neue", Inter, Arial, sans-serif';
// FNV-1a: a name or a date → one stable 32-bit number (seed / palette / pattern choice)
export const cipher = str => { let h = 0x811c9dc5; for (const c of str.trim().toLowerCase()) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
export const mulberry32 = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// Draw bg + header/footer text, then call drawArt(ctx, artW, artH) clipped to the art area.
// t = { title, sub, r1, r2, fl, fr, spaced, bleed }  — bleed: art may run to the sheet edge
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
  ctx.save(); ctx.translate(M, TOP); ctx.beginPath(); t.bleed ? ctx.rect(-M, -TOP, W, H) : ctx.rect(0, 0, aw, ah); ctx.clip();
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

// Book-of-Shapes-style composition: the same seed also decides how the sheet is set —
// band top / band bottom / number / full bleed / framed — plus title case, inverted art, crop.
// drawArt(ctx, w, h, { ink, bg, accent }) draws into a w×h box using those colours.
export const LAYOUTS = ['frame', 'band', 'bottom', 'number', 'bleed'];
export function composeSheet(ctx, scale, th, t, rng, drawArt, force) {
  const { W, H, M } = SHEET;
  const layout = force && LAYOUTS.includes(force) ? force : ['frame', 'band', 'band', 'bottom', 'number', 'bleed'][Math.floor(rng() * 6)];
  const caps = rng() < 0.5, invert = rng() < 0.4, bandInk = rng() < 0.5, zoom = 1 + rng() * 0.5, ox = rng(), oy = rng();
  const title = caps ? t.title.toUpperCase() : t.title.toLowerCase();
  const artBg = invert ? th.ink : th.bg, artInk = invert ? th.bg : th.ink;
  const art = (x, y, w, h) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = artBg; ctx.fillRect(x, y, w, h);
    ctx.translate(x + w / 2 + (ox - 0.5) * w * (zoom - 1), y + h / 2 + (oy - 0.5) * h * (zoom - 1)); ctx.scale(zoom, zoom); ctx.translate(-w / 2, -h / 2);
    ctx.strokeStyle = artInk; ctx.fillStyle = artInk; ctx.letterSpacing = '0px';
    drawArt(ctx, w, h, { ink: artInk, bg: artBg, accent: th.ac }); ctx.restore();
  };
  // big title: stacked words when caps, one line when lowercase; shrinks to fit maxW
  const big = (x, y, maxW, maxH, col, baseline = 'top') => {
    const lines = caps && title.includes(' ') ? title.split(' ').slice(0, 3) : [title];
    let size = Math.min(170, maxH / lines.length / 0.92);
    ctx.font = `800 ${size}px ${SANS}`; ctx.letterSpacing = `${-size * 0.035}px`;
    const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
    if (widest > maxW) { size *= maxW / widest; ctx.font = `800 ${size}px ${SANS}`; ctx.letterSpacing = `${-size * 0.035}px`; }
    ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = baseline;
    const y0 = baseline === 'bottom' ? y - (lines.length - 1) * size * 0.92 : y;
    lines.forEach((l, i) => ctx.fillText(l, x, y0 + i * size * 0.92));
    return size * lines.length * 0.92;
  };
  const meta = (x, y, col, align = 'left') => { ctx.fillStyle = col; ctx.font = `400 12px ${MONO}`; ctx.letterSpacing = '1px'; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText([t.r1, t.r2].filter(Boolean).join('   ·   '), x, y); };
  ctx.save(); ctx.scale(scale, scale);
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  if (layout === 'frame') {
    drawSheet(ctx, 1, th, { ...t, title }, (c, w, h) => art(0, 0, w, h));
  } else if (layout === 'band' || layout === 'bottom') {
    const hb = 320 + rng() * 150, bc = bandInk ? th.ink : th.ac, tc = bandInk ? th.bg : (lum(th.ac) > 0.55 ? th.ink : th.bg), y = layout === 'band' ? 0 : H - hb;
    ctx.fillStyle = bc; ctx.fillRect(0, y, W, hb);
    big(M, y + M * 0.8, W - 2 * M, hb - M * 1.8 - 30, tc);
    meta(M, y + hb - 34, tc); ctx.textAlign = 'right'; ctx.fillText(t.fl || '', W - M, y + hb - 34);
    layout === 'band' ? art(0, hb, W, H - hb) : art(0, 0, W, H - hb);
  } else if (layout === 'number') {
    const hb = 210, num = (t.r1 || '').replace(/\D/g, '').slice(-3) || '001';
    ctx.fillStyle = th.ink; ctx.font = `800 120px ${SANS}`; ctx.letterSpacing = '-4px'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(num, M, hb - 60);
    ctx.font = `600 16px ${SANS}`; ctx.letterSpacing = '0px'; ctx.textAlign = 'right'; ctx.fillText(title, W - M, hb - 88);
    meta(W - M, hb - 62, th.ink, 'right');
    ctx.strokeStyle = th.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M, hb - 30); ctx.lineTo(W - M, hb - 30); ctx.stroke();
    art(0, hb, W, H - hb);
  } else { // bleed
    art(0, 0, W, H);
    const col = artInk;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    big(M, H - M, W - 2 * M, 420, col, 'bottom');
    meta(M, M + 10, col); ctx.textAlign = 'right'; ctx.fillText(t.fl || '', W - M, M + 10);
    ctx.restore();
  }
  ctx.restore();
}
