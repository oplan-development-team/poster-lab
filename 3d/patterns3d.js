// Each pattern: { id, name, tags, params, build(env) → { scene, camera } }
// env = { THREE, W, H, p, rng, ink, accent }
const fib = (n, i) => { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = i * 2.399963; return [Math.cos(t) * r, y, Math.sin(t) * r]; };
const lights = (THREE, scene, ac) => { scene.add(new THREE.AmbientLight(0xffffff, 0.45)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(1, 2, 0.6); scene.add(d); const a = new THREE.DirectionalLight(ac, 0.8); a.position.set(-1, 0.5, -1); scene.add(a); };
const ortho = (THREE, W, H, span) => { const c = new THREE.OrthographicCamera(-span * W / H, span * W / H, span, -span, -5000, 5000); c.position.set(1, 1, 1).multiplyScalar(1000); c.lookAt(0, 0, 0); return c; };

export const PATTERNS = [
  {
    id: 'iso-blocks', name: 'Iso Blocks', tags: 'ISOMETRIC',
    params: [
      { k: 'cols', l: 'Columns', min: 3, max: 24, step: 1, d: 10 },
      { k: 'density', l: 'Density', min: 0.1, max: 1, step: 0.05, d: 0.75 },
      { k: 'height', l: 'Height', min: 0.2, max: 6, step: 0.1, d: 2.5 },
      { k: 'gap', l: 'Gap', min: 0, max: 0.6, step: 0.02, d: 0.08 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.5, step: 0.01, d: 0.08 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), n = p.cols, cell = 100, half = n * cell / 2;
      const mat = new THREE.MeshLambertMaterial({ color: ink }), acc = new THREE.MeshLambertMaterial({ color: accent });
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (rng() > p.density) continue;
        const h = cell * (0.2 + rng() * p.height), s = cell * (1 - p.gap);
        const m = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), rng() < p.accent ? acc : mat);
        m.position.set(i * cell - half + cell / 2, h / 2, j * cell - half + cell / 2); scene.add(m);
      }
      lights(THREE, scene, accent);
      return { scene, camera: ortho(THREE, W, H, half * 1.35) };
    },
  },
  {
    id: 'dot-sphere', name: 'Dot Sphere', tags: 'RADIAL',
    params: [
      { k: 'points', l: 'Points', min: 200, max: 8000, step: 100, d: 2500 },
      { k: 'dot', l: 'Dot Size', min: 1, max: 20, step: 0.5, d: 5 },
      { k: 'radius', l: 'Radius', min: 0.3, max: 1.4, step: 0.05, d: 0.9 },
      { k: 'tilt', l: 'Tilt', min: 0, max: 1.5, step: 0.05, d: 0.4 },
      { k: 'rings', l: 'Rings', min: 0, max: 24, step: 1, d: 6 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), R = W / 2 * p.radius, N = p.points, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { const [x, y, z] = fib(N, i); pos.set([x * R, y * R, z * R], i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: ink, size: p.dot, sizeAttenuation: false }));
      const grp = new THREE.Group(); grp.add(pts);
      for (let i = 0; i < p.rings; i++) {
        const y = -R + (i + 0.5) * 2 * R / p.rings, r = Math.sqrt(R * R - y * y);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 1.2, 4, 96), new THREE.MeshBasicMaterial({ color: i === Math.floor(p.rings / 2) ? accent : ink }));
        ring.rotation.x = Math.PI / 2; ring.position.y = y; grp.add(ring);
      }
      grp.rotation.set(p.tilt, rng() * 6.28, 0); scene.add(grp);
      const camera = new THREE.PerspectiveCamera(35, W / H, 1, 20000); camera.position.z = (H / 2) / Math.tan(17.5 * Math.PI / 180);
      return { scene, camera };
    },
  },
  {
    id: 'wave-terrain', name: 'Wave Terrain', tags: 'NOISE',
    params: [
      { k: 'segs', l: 'Resolution', min: 10, max: 120, step: 2, d: 48 },
      { k: 'amp', l: 'Amplitude', min: 0, max: 300, step: 5, d: 120 },
      { k: 'freq', l: 'Frequency', min: 0.5, max: 6, step: 0.1, d: 2 },
      { k: 'pitch', l: 'Camera Pitch', min: 0.2, max: 1.4, step: 0.05, d: 0.9 },
      { k: 'solid', l: 'Solid Faces', min: 0, max: 1, step: 1, d: 0 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), size = W * 2.2, geo = new THREE.PlaneGeometry(size, size, p.segs, p.segs), v = geo.attributes.position;
      const waves = Array.from({ length: 4 }, () => [rng() * 6.28, (0.5 + rng()) * p.freq / size * 6.28, rng() * 6.28]);
      for (let i = 0; i < v.count; i++) {
        const x = v.getX(i), y = v.getY(i); let z = 0;
        for (const [a, f, ph] of waves) z += Math.sin((x * Math.cos(a) + y * Math.sin(a)) * f + ph);
        v.setZ(i, z * p.amp / 2);
      }
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: ink, wireframe: true }));
      mesh.rotation.x = -Math.PI / 2; scene.add(mesh);
      if (p.solid) { const s = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: accent, polygonOffset: true, polygonOffsetFactor: 1 })); s.rotation.x = -Math.PI / 2; scene.add(s); lights(THREE, scene, ink); }
      const camera = new THREE.PerspectiveCamera(45, W / H, 1, 20000);
      camera.position.set(0, Math.sin(p.pitch) * W * 1.4, Math.cos(p.pitch) * W * 1.4); camera.lookAt(0, 0, 0);
      return { scene, camera };
    },
  },
  {
    id: 'ring-stack', name: 'Ring Stack', tags: 'ORGANIC',
    params: [
      { k: 'rings', l: 'Rings', min: 3, max: 60, step: 1, d: 24 },
      { k: 'radius', l: 'Radius', min: 0.2, max: 1, step: 0.05, d: 0.6 },
      { k: 'tube', l: 'Tube', min: 1, max: 40, step: 1, d: 8 },
      { k: 'twist', l: 'Twist', min: 0, max: 1, step: 0.02, d: 0.3 },
      { k: 'spread', l: 'Spread', min: 0.2, max: 2, step: 0.05, d: 1 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), R = W / 2 * p.radius, step = H * 0.8 * p.spread / p.rings, hit = Math.floor(rng() * p.rings);
      const mat = new THREE.MeshLambertMaterial({ color: ink }), acc = new THREE.MeshLambertMaterial({ color: accent });
      for (let i = 0; i < p.rings; i++) {
        const m = new THREE.Mesh(new THREE.TorusGeometry(R * (0.6 + 0.4 * Math.sin(i / p.rings * Math.PI)), p.tube, 12, 96), i === hit ? acc : mat);
        m.position.y = (i - p.rings / 2) * step; m.rotation.set(Math.PI / 2 + Math.sin(i * p.twist) * 0.6, 0, Math.cos(i * p.twist * 0.7) * 0.6); scene.add(m);
      }
      lights(THREE, scene, accent);
      const camera = new THREE.PerspectiveCamera(35, W / H, 1, 20000); camera.position.set(0, H * 0.15, (H / 2) / Math.tan(17.5 * Math.PI / 180) * 1.05); camera.lookAt(0, 0, 0);
      return { scene, camera };
    },
  },
  {
    id: 'cube-cloud', name: 'Cube Cloud', tags: 'PHYSICS',
    params: [
      { k: 'count', l: 'Cubes', min: 10, max: 600, step: 10, d: 160 },
      { k: 'size', l: 'Size', min: 10, max: 200, step: 5, d: 60 },
      { k: 'vary', l: 'Size Vary', min: 0, max: 1, step: 0.05, d: 0.6 },
      { k: 'depth', l: 'Depth', min: 0.2, max: 3, step: 0.1, d: 1.2 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.5, step: 0.01, d: 0.1 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), mat = new THREE.MeshLambertMaterial({ color: ink }), acc = new THREE.MeshLambertMaterial({ color: accent });
      for (let i = 0; i < p.count; i++) {
        const s = p.size * (1 - p.vary * rng()), m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), rng() < p.accent ? acc : mat);
        m.position.set((rng() - 0.5) * W * 1.2, (rng() - 0.5) * H * 1.2, (rng() - 0.5) * W * p.depth);
        m.rotation.set(rng() * 6.28, rng() * 6.28, rng() * 6.28); scene.add(m);
      }
      lights(THREE, scene, accent);
      const camera = new THREE.PerspectiveCamera(40, W / H, 1, 20000); camera.position.z = (H / 2) / Math.tan(20 * Math.PI / 180) + W * p.depth / 2;
      return { scene, camera };
    },
  },
  {
    id: 'pillars', name: 'Pillars', tags: 'ISOMETRIC',
    params: [
      { k: 'cols', l: 'Columns', min: 3, max: 30, step: 1, d: 14 },
      { k: 'height', l: 'Height', min: 0.2, max: 8, step: 0.1, d: 3 },
      { k: 'radius', l: 'Radius', min: 0.1, max: 0.5, step: 0.02, d: 0.3 },
      { k: 'wave', l: 'Wave', min: 0, max: 1, step: 0.05, d: 0.6 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.5, step: 0.01, d: 0.06 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), n = p.cols, cell = 100, half = n * cell / 2, ph = rng() * 6.28, f = 0.5 + rng();
      const mat = new THREE.MeshLambertMaterial({ color: ink }), acc = new THREE.MeshLambertMaterial({ color: accent });
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const w = 0.5 + 0.5 * Math.sin((i + j) / n * 6.28 * f + ph), h = cell * (0.3 + p.height * (p.wave * w + (1 - p.wave) * rng()));
        const m = new THREE.Mesh(new THREE.CylinderGeometry(cell * p.radius, cell * p.radius, h, 24), rng() < p.accent ? acc : mat);
        m.position.set(i * cell - half + cell / 2, h / 2, j * cell - half + cell / 2); scene.add(m);
      }
      lights(THREE, scene, accent);
      return { scene, camera: ortho(THREE, W, H, half * 1.35) };
    },
  },
  {
    id: 'tunnel', name: 'Tunnel', tags: 'RADIAL',
    params: [
      { k: 'rings', l: 'Rings', min: 5, max: 80, step: 1, d: 30 },
      { k: 'sides', l: 'Sides', min: 3, max: 64, step: 1, d: 6 },
      { k: 'twist', l: 'Twist', min: 0, max: 0.5, step: 0.01, d: 0.08 },
      { k: 'tube', l: 'Tube', min: 1, max: 30, step: 1, d: 6 },
      { k: 'drift', l: 'Drift', min: 0, max: 1, step: 0.05, d: 0.3 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), R = W * 0.7, dx = (rng() - 0.5) * p.drift, dy = (rng() - 0.5) * p.drift, hit = Math.floor(rng() * p.rings);
      for (let i = 0; i < p.rings; i++) {
        const z = -i * R * 0.35, m = new THREE.Mesh(new THREE.TorusGeometry(R, p.tube, 6, p.sides), new THREE.MeshBasicMaterial({ color: i === hit ? accent : ink }));
        m.position.set(dx * i * 40, dy * i * 40, z); m.rotation.z = i * p.twist; scene.add(m);
      }
      const camera = new THREE.PerspectiveCamera(70, W / H, 1, 50000); camera.position.z = R * 0.6;
      return { scene, camera };
    },
  },
  {
    id: 'knot', name: 'Torus Knot', tags: 'ORGANIC',
    params: [
      { k: 'twists', l: 'Twists', min: 1, max: 9, step: 1, d: 2 }, // keys p/s/t are taken by the URL hash (pattern/seed/theme)
      { k: 'loops', l: 'Loops', min: 1, max: 12, step: 1, d: 3 },
      { k: 'tube', l: 'Tube', min: 0.02, max: 0.5, step: 0.01, d: 0.12 },
      { k: 'wire', l: 'Wireframe', min: 0, max: 1, step: 1, d: 1 },
      { k: 'segs', l: 'Detail', min: 16, max: 400, step: 8, d: 200 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), R = W * 0.3;
      const geo = new THREE.TorusKnotGeometry(R, R * p.tube, p.segs, p.wire ? 8 : 24, p.twists, p.loops);
      const m = new THREE.Mesh(geo, p.wire ? new THREE.MeshBasicMaterial({ color: ink, wireframe: true }) : new THREE.MeshLambertMaterial({ color: ink }));
      m.rotation.set(rng() * 6.28, rng() * 6.28, 0); scene.add(m);
      if (!p.wire) lights(THREE, scene, accent);
      const camera = new THREE.PerspectiveCamera(35, W / H, 1, 20000); camera.position.z = (H / 2) / Math.tan(17.5 * Math.PI / 180);
      return { scene, camera };
    },
  },
  {
    id: 'louvers', name: 'Louvers', tags: 'GRID',
    params: [
      { k: 'slats', l: 'Slats', min: 5, max: 80, step: 1, d: 28 },
      { k: 'thick', l: 'Thickness', min: 0.1, max: 1, step: 0.05, d: 0.45 },
      { k: 'wave', l: 'Wave', min: 0, max: 400, step: 10, d: 160 },
      { k: 'freq', l: 'Frequency', min: 0.5, max: 4, step: 0.1, d: 1.5 },
      { k: 'tilt', l: 'Tilt', min: 0, max: 1.2, step: 0.05, d: 0.5 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), step = H * 0.9 / p.slats, ph = rng() * 6.28, hit = Math.floor(rng() * p.slats);
      const mat = new THREE.MeshLambertMaterial({ color: ink }), acc = new THREE.MeshLambertMaterial({ color: accent });
      for (let i = 0; i < p.slats; i++) {
        const t = i / p.slats, m = new THREE.Mesh(new THREE.BoxGeometry(W * 1.3, step * p.thick, W * 0.3), i === hit ? acc : mat);
        m.position.set(Math.sin(t * 6.28 * p.freq + ph) * p.wave, (t - 0.5) * H * 0.9, 0); m.rotation.x = Math.sin(t * 6.28 * p.freq + ph) * p.tilt; scene.add(m);
      }
      lights(THREE, scene, accent);
      const camera = new THREE.PerspectiveCamera(35, W / H, 1, 20000); camera.position.set(0, H * 0.1, (H / 2) / Math.tan(17.5 * Math.PI / 180)); camera.lookAt(0, 0, 0);
      return { scene, camera };
    },
  },
  {
    id: 'sphere-grid', name: 'Sphere Grid', tags: 'GRID',
    params: [
      { k: 'cols', l: 'Columns', min: 3, max: 24, step: 1, d: 9 },
      { k: 'min', l: 'Min Size', min: 0.05, max: 0.5, step: 0.01, d: 0.1 },
      { k: 'max', l: 'Max Size', min: 0.1, max: 0.6, step: 0.01, d: 0.45 },
      { k: 'freq', l: 'Frequency', min: 0.5, max: 4, step: 0.1, d: 1.2 },
      { k: 'accent', l: 'Accent', min: 0, max: 0.5, step: 0.01, d: 0.06 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), n = p.cols, cell = 100, half = n * cell / 2, ax = rng() * 6.28, ph = rng() * 6.28;
      const mat = new THREE.MeshLambertMaterial({ color: ink }), acc = new THREE.MeshLambertMaterial({ color: accent }), rows = Math.round(n * H / W);
      for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
        const w = 0.5 + 0.5 * Math.sin((i * Math.cos(ax) + j * Math.sin(ax)) / n * 6.28 * p.freq + ph), r = cell * (p.min + (p.max - p.min) * w);
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), rng() < p.accent ? acc : mat);
        m.position.set(i * cell - half + cell / 2, (j - rows / 2 + 0.5) * cell, 0); scene.add(m);
      }
      lights(THREE, scene, accent);
      const camera = new THREE.OrthographicCamera(-half * 1.05, half * 1.05, half * 1.05 * H / W, -half * 1.05 * H / W, -5000, 5000); camera.position.z = 1000;
      return { scene, camera };
    },
  },
  {
    id: 'lego', name: 'Lego Bricks', tags: 'ISOMETRIC',
    params: [
      { k: 'cols', l: 'Baseplate', min: 4, max: 20, step: 1, d: 10 },
      { k: 'layers', l: 'Layers', min: 1, max: 12, step: 1, d: 5 },
      { k: 'density', l: 'Density', min: 0.2, max: 1, step: 0.05, d: 0.7 },
      { k: 'big', l: 'Big Bricks', min: 0, max: 1, step: 0.05, d: 0.5 },
      { k: 'accent', l: 'Accent', min: 0, max: 1, step: 0.05, d: 0.35 },
    ],
    build({ THREE, W, H, p, rng, ink, accent }) {
      const scene = new THREE.Scene(), n = p.cols, u = 60, h = u * 1.2, half = n * u / 2;
      const base = new THREE.Color(ink), acc = new THREE.Color(accent), mid = base.clone().lerp(acc, 0.5);
      const mats = [base, acc, mid].map(c => new THREE.MeshLambertMaterial({ color: c }));
      const studGeo = new THREE.CylinderGeometry(u * 0.3, u * 0.3, u * 0.21, 20);
      const sizes = [[1, 1], [1, 2], [2, 1], [2, 2], [2, 4], [4, 2], [1, 4], [4, 1]];
      for (let L = 0; L < p.layers; L++) {
        const used = Array.from({ length: n }, () => new Array(n).fill(false));
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (used[i][j] || rng() > p.density * (1 - L / (p.layers + 2))) continue;
          const pick = rng() < p.big ? sizes[3 + Math.floor(rng() * 5)] : sizes[Math.floor(rng() * 3)], [sx, sz] = pick;
          if (i + sx > n || j + sz > n) continue;
          let free = true; for (let a = 0; a < sx; a++) for (let b = 0; b < sz; b++) if (used[i + a][j + b]) free = false;
          if (!free) continue;
          for (let a = 0; a < sx; a++) for (let b = 0; b < sz; b++) used[i + a][j + b] = true;
          const mat = mats[rng() < p.accent ? (rng() < 0.6 ? 1 : 2) : 0];
          const brick = new THREE.Mesh(new THREE.BoxGeometry(sx * u - 2, h, sz * u - 2), mat);
          const x = (i + sx / 2) * u - half, z = (j + sz / 2) * u - half, y = L * h + h / 2;
          brick.position.set(x, y, z); scene.add(brick);
          for (let a = 0; a < sx; a++) for (let b = 0; b < sz; b++) {
            const stud = new THREE.Mesh(studGeo, mat); stud.position.set((i + a + 0.5) * u - half, L * h + h + u * 0.105, (j + b + 0.5) * u - half); scene.add(stud);
          }
        }
      }
      const plate = new THREE.Mesh(new THREE.BoxGeometry(n * u + u, u * 0.3, n * u + u), new THREE.MeshLambertMaterial({ color: base, transparent: true, opacity: 0.12 }));
      plate.position.y = -u * 0.15; scene.add(plate);
      lights(THREE, scene, accent);
      return { scene, camera: ortho(THREE, W, H, half * 1.45) };
    },
  },
];
