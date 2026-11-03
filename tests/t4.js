const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const page=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route('https://cdnjs.cloudflare.com/**', r => { const u=r.request().url(); r.fulfill({ body: fs.readFileSync(u.includes('jszip')?'../node_modules/jszip/dist/jszip.min.js':'../node_modules/lamejs/lame.min.js'), contentType:'application/javascript' }); });
 await page.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(400);
 console.log('tabs', await page.locator('#tabs button').count(), 'strips', await page.locator('.strip').count());
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300);
 await page.click('#genBtn'); await page.waitForTimeout(200);
 await page.locator('#tabs button').nth(2).click();
 console.log('title', await page.textContent('#ws .title'));
 await page.click('#playBtn'); await page.waitForTimeout(1200);
 console.log('meters', await page.evaluate(()=>[...document.querySelectorAll('.meter i')].map(e=>e.style.width).join(' ')));console.log('play', await page.textContent('#playBtn'), 'prog', await page.locator('#ws .progress i').evaluate(e=>e.style.width), 'meter kick', await page.locator('.strip[data-sl="kick"] .meter i').evaluate(e=>e.style.width));
 // mixer live: mute kick, change EQ
 await page.locator('.strip[data-sl="kick"] .ms.m').click();
 await page.locator('.strip[data-sl="hat"] .nm').click();
 await page.locator('#eq input[type=range]').nth(1).fill('6');
 await page.waitForTimeout(400);
 console.log('kick meter after mute', await page.locator('.strip[data-sl="kick"] .meter i').evaluate(e=>e.style.width), 'eq sel', await page.textContent('#eq .nm'));
 // bpm wheel
 await page.locator('#bpmInput').hover(); await page.mouse.wheel(0,-100); await page.mouse.wheel(0,-100); await page.waitForTimeout(500);
 console.log('bpm', await page.inputValue('#bpmInput'), 'demo bpm', await page.evaluate(()=>window.__gb.current().bpm), 'play', await page.textContent('#playBtn'));
 await page.keyboard.press('Space'); await page.waitForTimeout(200); console.log('after space', await page.textContent('#playBtn'));
 // export with mixer (kick muted)
 const dlp = page.waitForEvent('download', { timeout: 90000 }); await page.click('#exportOne'); const d = await dlp; console.log('download', d.suggestedFilename());
 // render check mute effect
 const rms = await page.evaluate(async()=>{ const G=window.__gb; const d=G.current(); const b=await G.renderDemo(d,'kick'); const m=await G.renderDemo(d); const r=x=>{let s=0;const c=x.getChannelData(0);for(let i=0;i<c.length;i++)s+=c[i]*c[i];return Math.sqrt(s/c.length).toFixed(3)}; return [r(b), r(m)]; });
 console.log('kick stem rms / mix rms', rms);
 await page.screenshot({path:'shot2.png'});
 for (const w of [1100, 400]) { await page.setViewportSize({width:w,height:900}); console.log(w,'scrollW', await page.evaluate(()=>document.documentElement.scrollWidth)); }
 await page.screenshot({path:'shot2m.png', fullPage:true});
 console.log('errors', errs); await b.close(); })();
