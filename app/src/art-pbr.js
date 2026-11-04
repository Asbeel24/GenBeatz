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
    const camera = new THREE.OrthographicCamera(-4, 4, 2.2, -2.2, .1, 40);
    camera.position.set(0, 0, 16);
    const group = new THREE.Group(); scene.add(group);
    const key = new THREE.DirectionalLight(0xe7fff3, 2.4); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8b9fc9, 2.4); rim.position.set(3, -1, -2); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xc4d7d0, .7); fill.position.set(2, 1, 3); scene.add(fill);
    const cols = 168, rows = 10, points = new Float32Array((cols + 1) * (rows + 1) * 3), indices = [];
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
      if (i % 12 === 0) for (let j = 0; j < rows; j++) edgeIndices.push(i * (rows + 1) + j, i * (rows + 1) + j + 1);
    }
    const edges = new THREE.BufferGeometry(); edges.setAttribute('position', geometry.attributes.position); edges.setIndex(edgeIndices);
    const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color:0xd2eee0, transparent:true, opacity:.25}));
    lines.frustumCulled = false; group.add(lines);
    let lost = false, ratio = 1, lowQuality = false, hover = 0;
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; canvas.hidden = true; host.dataset.renderer = 'fallback'; host.dispatchEvent(new Event('art-renderer-lost')); });
    // After context restoration use the lightweight fallback for the remainder of the session.
    host.prepend(canvas);
    host.dataset.renderer = 'pbr';
    return {
      resize(w, h) {
        ratio = w / h; camera.left = -2.2 * ratio; camera.right = 2.2 * ratio; camera.updateProjectionMatrix();
        // Oversized on purpose: the form bleeds past the top and bottom of the stage and is cropped like a poster.
        const narrow = w < 760;
        group.scale.setScalar(narrow ? 1.3 : 2.35);
        group.position.set((narrow ? .66 : .4) * 2.2 * ratio, narrow ? -.1 : -.18, 0);
        renderer.setSize(w, h, false);
      },
      lowerQuality() { if (!lowQuality) { lowQuality = true; renderer.setPixelRatio(1); } },
      render(time, beat, drift, burst, pointer) {
        if (lost) { host.dataset.renderer = 'fallback'; return false; }
        host.dataset.artFrame = String((Number(host.dataset.artFrame) || 0) + 1);
        hover += ((pointer?.active ? 1 : 0) - hover) * .075;
        const cursorU = ((pointer?.x || 0) + .5) * Math.PI * 2;
        for (let i = 0; i <= cols; i++) {
          const u = i / cols * Math.PI * 2;
          const wave = 3 * u + time * .58;
          const tension = Math.tanh(Math.sin(wave) * 2.45);
          let delta = Math.atan2(Math.sin(u - cursorU), Math.cos(u - cursorU));
          const pull = hover * Math.exp(-delta * delta * 2.1);
          const twist = u * 1.5 + 1.05 * Math.sin(u * 2 - time * .72) + pull * (pointer?.x || 0) * 2.2;
          const radius = 1.12 + .3 * tension + .14 * Math.sin(7 * u - time * .38) + pull * (.28 + Math.abs(pointer?.y || 0) * .38);
          const lift = .48 * Math.sin(wave - .72) + .15 * Math.sin(5 * u + time * .33) + pull * (pointer?.y || 0) * 1.35;
          const width = .43 + .2 * Math.sin(2 * u + time * .9) - .08 * tension + pull * .24 + beat * .045 + burst * .09;
          for (let j = 0; j <= rows; j++) {
            const v = (j / rows * 2 - 1) * width;
            const edge = Math.abs(v / width);
            const fold = edge * (.035 + pull * .06) * Math.sin(u * 14 + time * .55);
            const r = radius + v * Math.cos(twist);
            const k = (i * (rows + 1) + j) * 3;
            const shear = pull * delta * .32;
            points[k] = r * Math.cos(u) - shear * Math.sin(u);
            points[k + 1] = r * Math.sin(u) + shear * Math.cos(u);
            points[k + 2] = v * Math.sin(twist) + lift + fold + pull * Math.sin(delta * 2) * .24;
          }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        group.rotation.set(.38 + Math.sin(time * .3) * .52 + drift.y * 1.05, .32 + Math.sin(time * .23) * .68 + drift.x * 1.2, time * .18 + drift.x * .22);
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
