// Each pattern: { id, name, tags, params:[{k,l,min,max,step,d}], draw(env) }
// env = { ctx, W, H, p, rng, noise, ink, accent }  — ctx is translated to the art area origin & clipped.
const TAU = Math.PI * 2;
const pick = (rng, p, ink, accent) => (rng() < (p.accent ?? 0) ? accent : ink);

export const PATTERNS = [
  {
    id: 'flow-lines', name: 'Flow Lines', tags: 'FLOW',
    params: [
      { k: 'lines', l: 'Lines', min: 50, max: 1200, step: 10, d: 400 },
      { k: 'length', l: 'Length', min: 20, max: 400, step: 5, d: 120 },
      { k: 'turb', l: 'Turbulence', min: 0.2, max: 4, step: 0.1, d: 1.5 },
      { k: 'scale', l: 'Scale', min: 0.5, max: 8, step: 0.1, d: 2 },
      { k: 'weight', l: 'Weight', min: 0.3, max: 4, step: 0.1, d: 0.8 },
    ],
    draw({ ctx, W, H, p, rng, noise }) {
      const sc = p.scale / 1000;
      ctx.lineWidth = p.weight; ctx.lineCap = 'round';
      for (let i = 0; i < p.lines; i++) {
        let x = rng() * W, y = rng() * H;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < p.length; s++) {
          const a = noise(x * sc, y * sc) * Math.PI * p.turb;
          x += Math.cos(a) * 3; y += Math.sin(a) * 3;
          if (x < 0 || y < 0 || x > W || y > H) break;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: 'flow-dots', name: 'Flow Dots', tags: 'FLOW / GRID',
    params: [
      { k: 'strands', l: 'Strands', min: 8, max: 120, step: 1, d: 46 },
      { k: 'spacing', l: 'Dot Spacing', min: 4, max: 30, step: 1, d: 10 },
      { k: 'turb', l: 'Turbulence', min: 0, max: 3, step: 0.05, d: 1.2 },
      { k: 'scale', l: 'Wavelength', min: 0.5, max: 6, step: 0.1, d: 2 },
      { k: 'dot', l: 'Dot Size', min: 0.5, max: 5, step: 0.1, d: 1.4 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.3, step: 0.01, d: 0.03 },
    ],
    draw({ ctx, W, H, p, rng, noise, ink, accent }) {
      const sc = p.scale / 1000;
      for (let i = 0; i < p.strands; i++) {
        let x = (i + 0.5) * W / p.strands, y = 0;
        while (y < H) {
          ctx.fillStyle = pick(rng, p, ink, accent);
          ctx.beginPath(); ctx.arc(x, y, p.dot, 0, TAU); ctx.fill();
          const a = noise(x * sc, y * sc) * p.turb * (y / H); // top stays straight, bends further down
          x += Math.sin(a) * p.spacing; y += Math.cos(a) * p.spacing;
        }
      }
    },
  },
  {
    id: 'truchet', name: 'Arc Truchet', tags: 'GRID',
    params: [
      { k: 'cells', l: 'Cells', min: 4, max: 40, step: 1, d: 14 },
      { k: 'weight', l: 'Weight', min: 0.5, max: 12, step: 0.5, d: 2 },
      { k: 'blank', l: 'Blank', min: 0, max: 0.8, step: 0.05, d: 0.1 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.5, step: 0.01, d: 0.06 },
    ],
    draw({ ctx, W, H, p, rng, ink, accent }) {
      const s = W / p.cells, rows = Math.ceil(H / s);
      ctx.lineWidth = p.weight; ctx.lineCap = 'butt';
      for (let j = 0; j < rows; j++) for (let i = 0; i < p.cells; i++) {
        if (rng() < p.blank) continue;
        const x = i * s, y = j * s, v = rng() < 0.5;
        ctx.strokeStyle = pick(rng, p, ink, accent);
        ctx.beginPath();
        if (v) { ctx.arc(x, y, s / 2, 0, Math.PI / 2); ctx.moveTo(x + s, y + s / 2); ctx.arc(x + s, y + s, s / 2, Math.PI, Math.PI * 1.5); }
        else { ctx.arc(x + s, y, s / 2, Math.PI / 2, Math.PI); ctx.moveTo(x + s / 2, y + s); ctx.arc(x, y + s, s / 2, Math.PI * 1.5, TAU); }
        ctx.stroke();
      }
    },
  },
  {
    id: 'interference', name: 'Wave Interference', tags: 'NOISE',
    params: [
      { k: 'lines', l: 'Lines', min: 10, max: 200, step: 1, d: 70 },
      { k: 'sources', l: 'Sources', min: 1, max: 8, step: 1, d: 3 },
      { k: 'amp', l: 'Amplitude', min: 1, max: 60, step: 1, d: 14 },
      { k: 'freq', l: 'Frequency', min: 0.5, max: 8, step: 0.1, d: 2.5 },
      { k: 'weight', l: 'Weight', min: 0.3, max: 4, step: 0.1, d: 0.9 },
    ],
    draw({ ctx, W, H, p, rng }) {
      const src = Array.from({ length: p.sources }, () => [rng() * W, rng() * H]);
      const f = p.freq / 100;
      ctx.lineWidth = p.weight;
      for (let j = 0; j < p.lines; j++) {
        const y0 = (j + 0.5) * H / p.lines;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          let y = y0;
          for (const [sx, sy] of src) y += p.amp * Math.sin(Math.hypot(x - sx, y0 - sy) * f);
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: 'node-garden', name: 'Node Garden', tags: 'ORGANIC',
    params: [
      { k: 'nodes', l: 'Nodes', min: 20, max: 600, step: 5, d: 220 },
      { k: 'radius', l: 'Link Radius', min: 20, max: 300, step: 5, d: 110 },
      { k: 'dot', l: 'Dot Size', min: 0, max: 8, step: 0.5, d: 2.5 },
      { k: 'weight', l: 'Weight', min: 0.2, max: 3, step: 0.1, d: 0.6 },
    ],
    draw({ ctx, W, H, p, rng }) {
      const n = Array.from({ length: p.nodes }, () => [rng() * W, rng() * H]);
      ctx.lineWidth = p.weight;
      for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) {
        const d = Math.hypot(n[i][0] - n[j][0], n[i][1] - n[j][1]);
        if (d > p.radius) continue;
        ctx.globalAlpha = 1 - d / p.radius;
        ctx.beginPath(); ctx.moveTo(...n[i]); ctx.lineTo(...n[j]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (const [x, y] of n) { ctx.beginPath(); ctx.arc(x, y, p.dot, 0, TAU); ctx.fill(); }
    },
  },
  {
    id: 'rings', name: 'Wobbly Rings', tags: 'RADIAL',
    params: [
      { k: 'rings', l: 'Rings', min: 5, max: 120, step: 1, d: 40 },
      { k: 'wobble', l: 'Wobble', min: 0, max: 0.6, step: 0.01, d: 0.18 },
      { k: 'freq', l: 'Frequency', min: 0.5, max: 6, step: 0.1, d: 1.8 },
      { k: 'drift', l: 'Drift', min: 0, max: 1, step: 0.05, d: 0.3 },
      { k: 'weight', l: 'Weight', min: 0.3, max: 4, step: 0.1, d: 1 },
    ],
    draw({ ctx, W, H, p, rng, noise }) {
      const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2, ox = rng() * 10, oy = rng() * 10;
      ctx.lineWidth = p.weight;
      for (let i = 1; i <= p.rings; i++) {
        const r0 = i * R / p.rings;
        ctx.beginPath();
        for (let k = 0; k <= 240; k++) {
          const a = k / 240 * TAU, c = Math.cos(a), s = Math.sin(a);
          const r = r0 * (1 + p.wobble * noise(c * p.freq + ox + i * p.drift * 0.2, s * p.freq + oy));
          k ? ctx.lineTo(cx + c * r, cy + s * r) : ctx.moveTo(cx + c * r, cy + s * r);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: 'iso-cubes', name: 'Iso Cubes', tags: 'ISOMETRIC',
    params: [
      { k: 'cols', l: 'Columns', min: 4, max: 30, step: 1, d: 12 },
      { k: 'density', l: 'Density', min: 0.05, max: 1, step: 0.05, d: 0.3 },
      { k: 'height', l: 'Height', min: 0.2, max: 4, step: 0.1, d: 1 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.5, step: 0.01, d: 0.08 },
    ],
    draw({ ctx, W, H, p, rng, ink, accent }) {
      const w = W / p.cols, hw = w / 2, hh = w / 4, rows = Math.ceil(H / hh) + 4;
      const cubes = [];
      for (let j = 0; j < rows; j++) for (let i = -1; i <= p.cols; i++) {
        if (rng() > p.density) continue;
        cubes.push([i * w + (j % 2 ? hw : 0), j * hh, rng() * p.height * w, pick(rng, p, ink, accent)]);
      }
      ctx.lineWidth = 0.8; ctx.lineJoin = 'round';
      for (const [x, y, h, col] of cubes) {
        const face = (pts, a) => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.stroke(); };
        face([[x, y - h], [x + hw, y + hh - h], [x, y + 2 * hh - h], [x - hw, y + hh - h]], 0.15);
        face([[x - hw, y + hh - h], [x, y + 2 * hh - h], [x, y + 2 * hh], [x - hw, y + hh]], 0.55);
        face([[x + hw, y + hh - h], [x, y + 2 * hh - h], [x, y + 2 * hh], [x + hw, y + hh]], 0.3);
      }
    },
  },
  {
    id: 'packing', name: 'Circle Packing', tags: 'PHYSICS',
    params: [
      { k: 'tries', l: 'Attempts', min: 200, max: 6000, step: 100, d: 2500 },
      { k: 'minR', l: 'Min Radius', min: 1, max: 30, step: 1, d: 3 },
      { k: 'maxR', l: 'Max Radius', min: 10, max: 200, step: 5, d: 80 },
      { k: 'weight', l: 'Weight', min: 0.3, max: 4, step: 0.1, d: 1 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.5, step: 0.01, d: 0.05 },
    ],
    draw({ ctx, W, H, p, rng, ink, accent }) {
      const cs = [];
      // ponytail: O(n²) overlap scan, fine under ~6000 attempts; grid-hash if it lags
      for (let t = 0; t < p.tries; t++) {
        const x = rng() * W, y = rng() * H;
        let r = Math.min(p.maxR, x, y, W - x, H - y);
        for (const c of cs) r = Math.min(r, Math.hypot(x - c[0], y - c[1]) - c[2]);
        if (r < p.minR) continue;
        cs.push([x, y, r - 1]);
      }
      ctx.lineWidth = p.weight;
      for (const [x, y, r] of cs) {
        const col = pick(rng, p, ink, accent);
        ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
        col === accent ? ctx.fill() : ctx.stroke();
      }
    },
  },
  {
    id: 'chevron', name: 'Chevron Blocks', tags: 'GRID',
    params: [
      { k: 'cols', l: 'Columns', min: 3, max: 40, step: 1, d: 10 },
      { k: 'fill', l: 'Fill', min: 0.1, max: 1, step: 0.05, d: 0.6 },
      { k: 'gap', l: 'Gap', min: 0, max: 0.4, step: 0.02, d: 0.06 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.5, step: 0.01, d: 0.1 },
    ],
    draw({ ctx, W, H, p, rng, ink, accent }) {
      const s = W / p.cols, rows = Math.ceil(H / s), g = s * p.gap / 2;
      for (let j = 0; j < rows; j++) for (let i = 0; i < p.cols; i++) {
        if (rng() > p.fill) continue;
        const x = i * s + g, y = j * s + g, e = s - 2 * g, v = Math.floor(rng() * 4);
        const c = [[x, y], [x + e, y], [x + e, y + e], [x, y + e]];
        ctx.fillStyle = pick(rng, p, ink, accent);
        ctx.beginPath(); ctx.moveTo(...c[v]); ctx.lineTo(...c[(v + 1) % 4]); ctx.lineTo(...c[(v + 2) % 4]); ctx.closePath(); ctx.fill();
      }
    },
  },
];
