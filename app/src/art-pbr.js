import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Locally bundled; no textures, external assets, shadows or post-processing passes.
window.createBeatSculpture = host => {
  const canvas = document.createElement('canvas');
  canvas.className = 'pbr-art';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer, environment;
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) { host.dataset.renderer = 'fallback'; return null; }
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .7;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, .06);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    const camera = new THREE.OrthographicCamera(-4, 4, 2.2, -2.2, .1, 30);
    camera.position.set(0, 0, 10);
    const group = new THREE.Group(); scene.add(group);
    const key = new THREE.DirectionalLight(0xe7fff3, 2.4); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8b9fc9, 2.4); rim.position.set(3, -1, -2); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xc4d7d0, .7); fill.position.set(2, 1, 3); scene.add(fill);
    const cols = 96, rows = 6, points = new Float32Array((cols + 1) * (rows + 1) * 3), indices = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const a = i * (rows + 1) + j, b = a + rows + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setIndex(indices);
    const material = new THREE.MeshStandardMaterial({
      color: 0x65786e, metalness: .86, roughness: .34, envMapIntensity: .8,
      side: THREE.DoubleSide, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
    const sculpture = new THREE.Mesh(geometry, material); sculpture.frustumCulled = false; group.add(sculpture);
    // Only boundaries and sparse structural ribs: keep the surface legible.
    const edgeIndices = [];
    for (let i = 0; i < cols; i++) {
      for (const j of [0, rows]) edgeIndices.push(i * (rows + 1) + j, (i + 1) * (rows + 1) + j);
      if (i % 7 === 0) for (let j = 0; j < rows; j++) edgeIndices.push(i * (rows + 1) + j, i * (rows + 1) + j + 1);
    }
    const edges = new THREE.BufferGeometry(); edges.setAttribute('position', geometry.attributes.position); edges.setIndex(edgeIndices);
    const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color:0xd2eee0, transparent:true, opacity:.25}));
    lines.frustumCulled = false; group.add(lines);
    let lost = false, ratio = 1, lowQuality = false;
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; canvas.hidden = true; host.dataset.renderer = 'fallback'; host.dispatchEvent(new Event('art-renderer-lost')); });
    // After context restoration use the lightweight fallback for the remainder of the session.
    host.prepend(canvas);
    host.dataset.renderer = 'pbr';
    return {
      resize(w, h) {
        ratio = w / h; camera.left = -2.2 * ratio; camera.right = 2.2 * ratio; camera.updateProjectionMatrix();
        group.position.x = (w < 760 ? .64 : .36) * 2.2 * ratio;
        renderer.setSize(w, h, false);
      },
      lowerQuality() { if (!lowQuality) { lowQuality = true; renderer.setPixelRatio(1); } },
      render(time, beat, drift, burst) {
        if (lost) { host.dataset.renderer = 'fallback'; return false; }
        for (let i = 0; i <= cols; i++) {
          const u = i / cols * Math.PI * 2;
          const twist = u * 1.5 + .65 * Math.sin(u * 2 - time * .65);
          const radius = 1.12 + .2 * Math.cos(3 * u + time * .5) + .09 * Math.sin(5 * u - time * .3);
          const lift = .3 * Math.sin(3 * u - time * .45);
          const width = .45 + .12 * Math.sin(2 * u + time * .8) + beat * .025 + burst * .045;
          for (let j = 0; j <= rows; j++) {
            const v = (j / rows * 2 - 1) * width;
            const fold = Math.abs(v / width) * .022 * Math.sin(u * 14 + time * .4);
            const r = radius + v * Math.cos(twist);
            const k = (i * (rows + 1) + j) * 3;
            points[k] = r * Math.cos(u);
            points[k + 1] = r * Math.sin(u);
            points[k + 2] = v * Math.sin(twist) + lift + fold;
          }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        group.rotation.set(.38 + Math.sin(time * .27) * .42 + drift.y * .4, .32 + Math.sin(time * .21) * .5 + drift.x * .45, time * .14);
        renderer.render(scene, camera);
        return true;
      }
    };
  } catch (error) {
    environment?.dispose(); renderer?.dispose(); canvas.remove();
    host.dataset.renderer = 'fallback';
    return null;
  }
};
