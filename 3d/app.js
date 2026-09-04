import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PATTERNS } from './patterns3d.js';
import { THEMES, mulberry32, drawSheet, fitCanvas, exportPNG, themeButtons, copyLink, cipher } from '../shared.js';
import { renderer, paint } from '../three-sheet.js';

const S = { pat: PATTERNS[0], seed: 0, theme: 0, title: '', sub: '', p: {}, mat: 'flat' };
const MATS = ['flat', 'glass', 'chrome'];
const $ = s => document.querySelector(s), canvas = $('#sheet');
const newSeed = () => Math.floor(Math.random() * 1e9);

function loadHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  S.pat = PATTERNS.find(x => x.id === h.get('p')) || PATTERNS[0];
  S.seed = +h.get('s') || newSeed();
  S.theme = Math.min(+h.get('t') || 0, THEMES.length - 1);
  S.title = h.get('title') || ''; S.sub = h.get('sub') || ''; S.mat = MATS.includes(h.get('m')) ? h.get('m') : 'flat';
  S.p = Object.fromEntries(S.pat.params.map(q => [q.k, h.has(q.k) ? +h.get(q.k) : q.d]));
}
function saveHash() {
  const h = new URLSearchParams({ p: S.pat.id, s: S.seed, t: S.theme, m: S.mat, ...S.p });
  if (S.title) h.set('title', S.title); if (S.sub) h.set('sub', S.sub);
  history.replaceState(null, '', '#' + h);
}
function draw(ctx, scale) {
  const th = THEMES[S.theme], rng = mulberry32(S.seed), seed = String(S.seed).padStart(9, '0');
  drawSheet(ctx, scale, th, {
    title: (S.title || S.pat.name).toUpperCase(), sub: S.sub.toUpperCase(),
    r1: `NO. ${seed.slice(0, 3)}-${seed.slice(3)}`, r2: S.pat.tags,
    fl: `${S.pat.name.toUpperCase()}  ·  ${th.n.toUpperCase()}  ·  3D`, fr: 'EDITION 01  ·  POSTER LAB',
  }, (ctx, W, H) => {
    const { scene, camera } = S.pat.build({ THREE, W, H, p: S.p, rng, ink: th.ink, accent: th.ac }), R = renderer(THREE, W * scale, H * scale);
    if (S.mat !== 'flat') restyle(scene, R, th);
    R.toneMapping = S.mat === 'flat' ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    paint(ctx, R, scene, camera, W, H);
  });
}
// Swap every solid (Lambert) surface for a physical one; points and wireframes stay as drawn.
let env;
function restyle(scene, R, th) {
  env ??= new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.background = new THREE.Color(th.bg); // transmission needs something behind it to refract; matches the sheet
  scene.traverse(o => {
    if (!o.isMesh || !o.material.isMeshLambertMaterial) return;
    const color = o.material.color;
    o.material = S.mat === 'glass'
      ? new THREE.MeshPhysicalMaterial({ color, metalness: 0.1, roughness: 0.12, transmission: 0.55, thickness: 60, ior: 1.45, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.6, iridescenceIOR: 1.35, envMap: env, envMapIntensity: 1.6 })
      : new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.14, clearcoat: 0.6, iridescence: 0.5, iridescenceIOR: 1.3, envMap: env, envMapIntensity: 1.8 });
  });
}
function render() { fitCanvas(canvas, draw); saveHash(); $('#seed').textContent = 'seed ' + S.seed; }

function buildPatterns() { $('#patterns').innerHTML = PATTERNS.map(x => `<button data-id="${x.id}" class="${x === S.pat ? 'on' : ''}">${x.name}</button>`).join(''); }
function buildParams() {
  $('#params').innerHTML = S.pat.params.map(q => `
    <label><span>${q.l}</span><input type="range" data-k="${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${S.p[q.k]}"><output>${S.p[q.k]}</output></label>`).join('');
}
function buildMats() { $('#mats').innerHTML = MATS.map(k => `<button data-k="${k}" class="${k === S.mat ? 'on' : ''}">${k}</button>`).join(''); $('#mats').onclick = e => { if (e.target.dataset.k) { S.mat = e.target.dataset.k; buildMats(); render(); } }; }
function buildThemes() { themeButtons($('#themes'), S.theme, t => { S.theme = t; buildThemes(); render(); }); }
$('#patterns').onclick = e => {
  const id = e.target.dataset.id; if (!id) return;
  S.pat = PATTERNS.find(x => x.id === id); S.p = Object.fromEntries(S.pat.params.map(q => [q.k, q.d]));
  buildPatterns(); buildParams(); render();
};
$('#params').oninput = e => { S.p[e.target.dataset.k] = +e.target.value; e.target.nextElementSibling.value = e.target.value; render(); };
$('#title').oninput = e => { S.title = e.target.value; render(); };
$('#sub').oninput = e => { S.sub = e.target.value; render(); };
$('#roll').onclick = () => { S.seed = newSeed(); render(); };
$('#name').onchange = e => { // Name Cipher: the same name always lands on the same pattern, seed and palette
  const v = e.target.value.trim(); if (!v) return;
  const h = cipher(v);
  S.pat = PATTERNS[h % PATTERNS.length]; S.p = Object.fromEntries(S.pat.params.map(q => [q.k, q.d]));
  S.seed = h % 1e9; S.theme = (h >>> 8) % THEMES.length; S.title = v; $('#title').value = v;
  buildPatterns(); buildParams(); buildMats(); buildThemes(); render();
};
$('#prev').onclick = () => { S.seed = (S.seed - 1 + 1e9) % 1e9; render(); };
$('#next').onclick = () => { S.seed = (S.seed + 1) % 1e9; render(); };
$('#recolour').onclick = () => { S.theme = (S.theme + 1 + Math.floor(Math.random() * (THEMES.length - 1))) % THEMES.length; buildThemes(); render(); };
$('#random').onclick = () => { S.p = Object.fromEntries(S.pat.params.map(q => [q.k, +(q.min + Math.random() * (q.max - q.min)).toFixed(2)])); S.seed = newSeed(); buildParams(); render(); };
$('#copy').onclick = e => copyLink(e.target);
$('#download').onclick = () => exportPNG(+$('#size').value, `3d-${S.pat.id}-${S.seed}.png`, draw);
addEventListener('resize', render);
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.key === ' ') { e.preventDefault(); $('#roll').click(); } if (e.key === 'ArrowLeft') $('#prev').click(); if (e.key === 'ArrowRight') $('#next').click(); });

loadHash(); $('#title').value = S.title; $('#sub').value = S.sub;
buildPatterns(); buildParams(); buildMats(); buildThemes(); render();
