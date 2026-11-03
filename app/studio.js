/* Visual presentation only. Audio scheduling and synthesis stay in the engine. */
(() => {
  const byId = id => document.getElementById(id);
  const stage = byId('artStage'), canvas = byId('particles'), ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduce.matches, petals = false, visible = true, raf = 0, last = 0, phase = 0, burst = 0;
  let width = 0, height = 0, pointer = { x: 0, y: 0 };
  const dots = Array.from({ length: 2600 }, (_, i) => ({
    a: i * 2.399963, ring: Math.sqrt((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) / Math.sqrt(2), z: Math.sin(i * 17.13), size: .45 + (i % 7) * .15
  }));
  function draw(time) {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const running = !!playing;
    const beat = running ? Math.pow((1 + Math.cos((playing.ctx.currentTime - playing.t0) * current().bpm / 60 * Math.PI * 2)) / 2, 6) : 0;
    const cx = width * (width < 760 ? .83 : .68) + pointer.x * 16, cy = height * .51 + pointer.y * 10;
    const radius = Math.min(height * .7, width * .26);
    const glow = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius * 1.5);
    glow.addColorStop(0, '#62607b20'); glow.addColorStop(.55, '#7c4da91c'); glow.addColorStop(1, '#14171900');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    for (const p of dots) {
      const a = p.a + time * .13 + p.z * .1;
      const r = radius * (.53 + p.ring * .43 + Math.sin(a * 3 + time) * .05 + beat * .035 + burst * .05);
      const x = cx + Math.cos(a) * r + Math.cos(p.a * 5 + time) * 9 * p.ring;
      const y = cy + Math.sin(a) * r * .62 + Math.cos(p.a * 3 + time * .7) * 21 * p.ring;
      const hue = 155 + (Math.sin(a + .8) + 1) * 58;
      ctx.fillStyle = `hsla(${hue},55%,${64 + p.z * 15}%,${.28 + p.ring * .5})`;
      ctx.beginPath(); ctx.arc(x, y, p.size * (1 + beat * .25), 0, Math.PI * 2); ctx.fill();
    }
    // A small constellation drifts outside the central form.
    for (let i = 0; i < 80; i++) {
      const x = width * .4 + ((i * 97.3 + time * (i % 3 + 1)) % (width * .6));
      const y = (i * 59.7 + Math.sin(time + i) * 4 + height) % height;
      ctx.fillStyle = i % 2 ? '#c6a3e34a' : '#a2d3c34a'; ctx.fillRect(x, y, 1, 1);
    }
    if (petals) for (let i = 0; i < 28; i++) {
      const x = (i * 139.1 + time * (10 + i % 6) + pointer.x * 20) % (width + 40) - 20;
      const y = (i * 67.3 + time * (9 + i % 4)) % (height + 30) - 15;
      ctx.save(); ctx.translate(x, y); ctx.rotate(i + time * .35); ctx.scale(1, .45 + Math.abs(Math.sin(time + i)) * .5);
      ctx.fillStyle = '#dba9c88c'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.bezierCurveTo(8, -3, 6, 4, 0, 6); ctx.bezierCurveTo(-5, 2, -5, -3, 0, -5); ctx.fill(); ctx.restore();
    }
  }
  function tick(now) {
    raf = 0;
    if (!motion || stage.hidden || !visible || document.hidden) return;
    if (now - last >= 32) { phase += Math.min((now - last) / 1000, .05); last = now; burst *= .93; draw(phase); }
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
  byId('petalToggle').addEventListener('click', () => { petals = !petals; byId('petalToggle').textContent = '樱花 / ' + (petals ? 'ON' : 'OFF'); byId('petalToggle').setAttribute('aria-pressed', String(petals)); draw(phase); });
  byId('artToggle').addEventListener('click', () => { stage.hidden = !stage.hidden; byId('artToggle').setAttribute('aria-expanded', String(!stage.hidden)); byId('artToggle').textContent = '视觉 / ' + (stage.hidden ? 'OFF' : 'ON'); resize(); sync(); });
  byId('libraryToggle').addEventListener('click', () => { const panel = byId('libraryPanel'); panel.hidden = !panel.hidden; byId('libraryToggle').setAttribute('aria-expanded', String(!panel.hidden)); byId('studioGrid').classList.toggle('library-hidden', panel.hidden); });
  function setMixer(open) { byId('mixerPanel').hidden = !open; byId('mixToggle').setAttribute('aria-expanded', String(open)); if (open) { byId('mixerPanel').scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth', block:'start' }); byId('mixClose').focus({ preventScroll:true }); } else byId('mixToggle').focus({ preventScroll:true }); }
  byId('mixToggle').addEventListener('click', () => setMixer(byId('mixerPanel').hidden));
  byId('mixClose').addEventListener('click', () => setMixer(false));
  byId('genBtn').addEventListener('click', () => { burst = 1; phase += .4; draw(phase); });
  document.addEventListener('visibilitychange', sync);
  motionUI();
})();
