/* Visual presentation only. Audio scheduling and synthesis stay in the engine. */
(() => {
  const byId = id => document.getElementById(id);
  const stage = byId('artStage'), canvas = byId('particles'), ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduce.matches, visible = true, raf = 0, last = 0, phase = 0, burst = 0;
  let width = 0, height = 0, pointer = { x: 0, y: 0 }, drift = { x: 0, y: 0 };
  const dots = Array.from({ length: 2600 }, (_, i) => ({
    a: i * 2.399963, ring: Math.sqrt((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) / Math.sqrt(2), z: Math.sin(i * 17.13), size: .45 + (i % 7) * .15
  }));
  function draw(time) {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const running = !!playing;
    const beat = running ? Math.pow((1 + Math.cos((playing.ctx.currentTime - playing.t0) * current().bpm / 60 * Math.PI * 2)) / 2, 6) : 0;
    const cx = width * (width < 760 ? .83 : .68) + drift.x * 16, cy = height * .51 + drift.y * 10;
    const radius = Math.min(height * .7, width * .26);
    // Directional lighting on a slowly turning particle ribbon; no coloured backdrop.
    const tilt = .35 + Math.sin(time * .16) * .12;
    for (const p of dots) {
      const a = p.a + time * .11;
      const tube = p.z * Math.PI + time * .19;
      const r = radius * (.72 + Math.cos(tube) * .16 * p.ring + Math.sin(a * 3 + time * .3) * .035 + beat * .018 + burst * .025);
      const depth = Math.sin(a) * Math.sin(tilt) + Math.sin(tube) * .32;
      const perspective = 1 + depth * .15;
      const x = cx + Math.cos(a) * r * perspective;
      const y = cy + (Math.sin(a) * r * .61 + Math.sin(tube) * radius * .14) * perspective;
      const light = Math.max(0, Math.cos(a + 2.1 + drift.x * .5) * .65 + Math.sin(tube + .6) * .35);
      const specular = Math.pow(light, 9);
      const alpha = .14 + (depth + .7) * .2 + light * .34;
      const size = p.size * (.65 + (depth + .7) * .3 + specular * .3);
      ctx.fillStyle = `hsla(${164 + p.z * 10},${24 + light * 14}%,${38 + light * 38 + specular * 20}%,${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, Math.max(.3, size), 0, Math.PI * 2); ctx.fill();
      if (specular > .38) {
        ctx.fillStyle = `rgba(185,235,218,${specular * .075})`;
        ctx.beginPath(); ctx.arc(x, y, size * 3.5, 0, Math.PI * 2); ctx.fill();
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
    if (now - last >= 32) { phase += Math.min((now - last) / 1000, .05); last = now; burst *= .93; drift.x += (pointer.x - drift.x) * .055; drift.y += (pointer.y - drift.y) * .055; draw(phase); }
    raf = requestAnimationFrame(tick);
  }
  function sync() { cancelAnimationFrame(raf); raf = 0; last = performance.now(); draw(phase); if (motion && visible && !stage.hidden && !document.hidden) raf = requestAnimationFrame(tick); }
  function resize() { const box = stage.getBoundingClientRect(); if (!box.width || !box.height) return; width = box.width; height = box.height; const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx?.setTransform(dpr, 0, 0, dpr, 0, 0); draw(phase); }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(stage);
  stage.addEventListener('pointermove', e => { const b = stage.getBoundingClientRect(); pointer = { x: (e.clientX - b.left) / b.width - .5, y: (e.clientY - b.top) / b.height - .5 }; });
  stage.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; });
  function motionUI() { byId('motionToggle').textContent = '动效 / ' + (motion ? 'ON' : 'OFF'); byId('motionToggle').setAttribute('aria-pressed', String(motion)); sync(); }
  byId('motionToggle').addEventListener('click', () => { motion = !motion; motionUI(); });
  reduce.addEventListener('change', () => { motion = !reduce.matches; motionUI(); });
  byId('artToggle').addEventListener('click', () => { stage.hidden = !stage.hidden; byId('artToggle').setAttribute('aria-expanded', String(!stage.hidden)); byId('artToggle').textContent = '视觉 / ' + (stage.hidden ? 'OFF' : 'ON'); resize(); sync(); });
  byId('libraryToggle').addEventListener('click', () => { const panel = byId('libraryPanel'); panel.hidden = !panel.hidden; byId('libraryToggle').setAttribute('aria-expanded', String(!panel.hidden)); byId('studioGrid').classList.toggle('library-hidden', panel.hidden); });
  function setMixer(open) { byId('mixerPanel').hidden = !open; byId('mixToggle').setAttribute('aria-expanded', String(open)); if (open) { byId('mixerPanel').scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth', block:'start' }); byId('mixClose').focus({ preventScroll:true }); } else byId('mixToggle').focus({ preventScroll:true }); }
  byId('mixToggle').addEventListener('click', () => setMixer(byId('mixerPanel').hidden));
  byId('mixClose').addEventListener('click', () => setMixer(false));
  byId('genBtn').addEventListener('click', () => { burst = 1; phase += .4; draw(phase); });
  document.addEventListener('visibilitychange', sync);
  motionUI();
})();
