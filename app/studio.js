/* Visual presentation only. Audio scheduling and synthesis stay in the engine. */
(() => {
  const byId = id => document.getElementById(id);
  const stage = byId('artStage'), canvas = byId('particles'), ctx = canvas.getContext('2d');
  const sculpture = window.createBeatSculpture?.(stage);
  let slowFrames = 0, frameInterval = 32, lastGlow = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduce.matches, visible = true, raf = 0, last = 0, phase = 0, burst = 0;
  let width = 0, height = 0, pointer = { x: 0, y: 0, active: false }, drift = { x: 0, y: 0 };
  // Fixed neighbouring vertices keep the wire mesh linear in size (no all-pairs search).
  const columns = 100, rows = 18;
  const vertices = Array.from({ length: columns * rows }, (_, i) => ({
    u: Math.floor(i / rows) / columns * Math.PI * 2,
    v: (i % rows) / rows * Math.PI * 2
  }));
  const projected = vertices.map(() => ({ x: 0, y: 0, z: 0, light: 0, hue: 0 }));
  function draw(time) {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const running = !!playing;
    const beat = running ? Math.pow((1 + Math.cos((playing.ctx.currentTime - playing.t0) * current().bpm / 60 * Math.PI * 2)) / 2, 6) : 0;
    // The grid behind the form lights up on the beat (and on a click); CSS reads --beat.
    const glow = Math.min(1, beat + burst * .45);
    if (Math.abs(glow - lastGlow) > .01) { lastGlow = glow; stage.style.setProperty('--beat', glow.toFixed(3)); }
    if (sculpture?.render(time, beat, drift, burst, pointer)) return;
    const cx = width * (width < 760 ? .83 : .68) + drift.x * 16, cy = height * .51 + drift.y * 10;
    const radius = Math.min(height * .7, width * .26);
    // Perspective-projected toroidal mesh. Colour lives on the object, not a backlight.
    const tilt = .72 + Math.sin(time * .16) * .12 + drift.y * .18;
    const spin = time * .12 + drift.x * .12;
    for (let i = 0; i < vertices.length; i++) {
      const { u, v } = vertices[i];
      const a = u + spin;
      const tube = v + Math.sin(u * 3 + time * .35) * .42;
      const major = radius * (.72 + Math.sin(u * 3 + time * .28) * .04);
      const minor = radius * (.14 + beat * .012 + burst * .022);
      const ring = major + Math.cos(tube) * minor;
      const x = Math.cos(a) * ring;
      const y = Math.sin(a) * ring;
      const z = Math.sin(tube) * minor;
      const rotatedY = y * Math.cos(tilt) - z * Math.sin(tilt);
      const depth = y * Math.sin(tilt) + z * Math.cos(tilt);
      const perspective = 1 / (1 - depth / (radius * 4));
      const light = .5 + .5 * Math.cos(a - .8) * Math.cos(tube - .4);
      Object.assign(projected[i], {
        x: cx + x * perspective, y: cy + rotatedY * perspective,
        z: depth / radius, light, hue: 162 + (Math.cos(a + .6) + 1) * 39
      });
    }
    ctx.lineWidth = .55;
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      const col = Math.floor(i / rows), row = i % rows;
      const right = projected[((col + 1) % columns) * rows + row];
      const across = projected[col * rows + (row + 1) % rows];
      const alpha = .12 + (p.z + 1) * .085 + p.light * .15;
      ctx.strokeStyle = `hsla(${p.hue},55%,${60 + p.light * 22}%,${alpha})`;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(right.x, right.y);
      ctx.moveTo(p.x, p.y); ctx.lineTo(across.x, across.y); ctx.stroke();
    }
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      const highlight = Math.pow(p.light, 7);
      const size = .55 + (p.z + 1) * .2 + highlight * .4;
      ctx.fillStyle = `hsla(${p.hue},${40 - highlight * 20}%,${72 + highlight * 24}%,${.5 + (p.z + 1) * .17})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
      if (highlight > .65 && i % 3 === 0) {
        ctx.fillStyle = `rgba(204,246,232,${highlight * .08})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    // A small constellation drifts outside the central form.
    for (let i = 0; i < 80; i++) {
      const x = width * .4 + ((i * 97.3 + time * (i % 3 + 1)) % (width * .6));
      const y = (i * 59.7 + Math.sin(time + i) * 4 + height) % height;
      ctx.fillStyle = i % 2 ? '#bdc8c51c' : '#a2d3c326'; ctx.fillRect(x, y, 1, 1);
    }
  }

  function tick(now) {
    raf = 0;
    if (!motion || stage.hidden || !visible || document.hidden) return;
    if (now - last >= frameInterval) { phase += Math.min((now - last) / 1000, .05); last = now; burst *= .93; drift.x += (pointer.x - drift.x) * .055; drift.y += (pointer.y - drift.y) * .055; const start = performance.now(); draw(phase);
      slowFrames = performance.now() - start > 24 ? slowFrames + 1 : 0;
      if (slowFrames >= 20) { sculpture?.lowerQuality(); frameInterval = 50; }
    }
    raf = requestAnimationFrame(tick);
  }
  function sync() { cancelAnimationFrame(raf); raf = 0; last = performance.now(); draw(phase); if (motion && visible && !stage.hidden && !document.hidden) raf = requestAnimationFrame(tick); }
  function resize() { const box = stage.getBoundingClientRect(); if (!box.width || !box.height) return; width = box.width; height = box.height; const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx?.setTransform(dpr, 0, 0, dpr, 0, 0); sculpture?.resize(width, height); draw(phase); }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(stage);
  stage.addEventListener('pointermove', e => { const b = stage.getBoundingClientRect(); pointer = { x: (e.clientX - b.left) / b.width - .5, y: (e.clientY - b.top) / b.height - .5, active: true }; });
  stage.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; pointer.active = true; burst = 1.45; });
  stage.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0, active: false }; });
  function motionUI() { byId('motionToggle').textContent = '动效 / ' + (motion ? 'ON' : 'OFF'); byId('motionToggle').setAttribute('aria-pressed', String(motion)); sync(); }
  byId('motionToggle').addEventListener('click', () => { motion = !motion; motionUI(); });
  reduce.addEventListener('change', () => { motion = !reduce.matches; motionUI(); });
  // Panels animate in and out; animateOut (index.html) is instant under reduced motion.
  const playIn = (node, cls) => { if (reduce.matches) return; node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); node.addEventListener('animationend', () => node.classList.remove(cls), { once: true }); };
  function setArt(open) {
    byId('artToggle').setAttribute('aria-expanded', String(open)); byId('artToggle').textContent = '视觉 / ' + (open ? 'ON' : 'OFF');
    if (open) {
      stage.hidden = false; resize();
      if (!reduce.matches) { stage.classList.add('is-collapsed'); void stage.offsetHeight; }
      stage.classList.remove('is-collapsed'); sync();
    } else if (reduce.matches) { stage.hidden = true; sync(); }
    else {
      stage.classList.add('is-collapsed');
      const done = () => { if (stage.classList.contains('is-collapsed')) { stage.hidden = true; sync(); } };
      stage.addEventListener('transitionend', e => { if (e.target === stage && e.propertyName === 'height') done(); }, { once: true }); setTimeout(done, 400);
    }
  }
  byId('artToggle').addEventListener('click', () => setArt(stage.hidden || stage.classList.contains('is-collapsed')));
  byId('libraryToggle').addEventListener('click', () => {
    const panel = byId('libraryPanel'), open = panel.hidden || panel.classList.contains('is-closing');
    byId('libraryToggle').setAttribute('aria-expanded', String(open));
    if (open) { panel.classList.remove('is-closing'); panel.hidden = false; byId('studioGrid').classList.remove('library-hidden'); playIn(panel, 'is-opening'); }
    else animateOut(panel, 'is-closing', () => { panel.hidden = true; byId('studioGrid').classList.add('library-hidden'); });
  });
  function setMixer(open) {
    const panel = byId('mixerPanel'); byId('mixToggle').setAttribute('aria-expanded', String(open));
    if (open) { panel.classList.remove('is-closing'); panel.hidden = false; playIn(panel, 'is-opening'); panel.scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth', block:'start' }); byId('mixClose').focus({ preventScroll:true }); }
    else { animateOut(panel, 'is-closing', () => { panel.hidden = true; }); byId('mixToggle').focus({ preventScroll:true }); }
  }
  byId('mixToggle').addEventListener('click', () => setMixer(byId('mixerPanel').hidden || byId('mixerPanel').classList.contains('is-closing')));
  byId('mixClose').addEventListener('click', () => setMixer(false));
  byId('genBtn').addEventListener('click', () => { burst = 1; phase += .4; draw(phase); });
  stage.addEventListener('art-renderer-lost', sync);
  document.addEventListener('visibilitychange', sync);
  motionUI();
})();
