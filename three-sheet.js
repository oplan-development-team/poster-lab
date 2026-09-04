// Paint a three.js scene into the 2D sheet: one shared WebGLRenderer, copied in with drawImage.
export const IMPORTMAP = { three: 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js', 'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/' };
let R;
export function renderer(THREE, w, h) {
  if (!R) R = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  R.setPixelRatio(1); R.setSize(w, h, false); R.setClearColor(0, 0);
  return R;
}
export function paint(ctx, R, scene, camera, W, H) {
  R.render(scene, camera);
  ctx.drawImage(R.domElement, 0, 0, W, H);
  scene.traverse(o => { o.geometry?.dispose?.(); });
}
