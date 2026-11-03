const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const page=await b.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
 const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route('https://cdnjs.cloudflare.com/**', r => { const u=r.request().url(); r.fulfill({ body: fs.readFileSync(u.includes('jszip')?'../node_modules/jszip/dist/jszip.min.js':'../node_modules/lamejs/lame.min.js'), contentType:'application/javascript' }); });
 await page.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(400);
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300); await page.click('#genBtn'); await page.waitForTimeout(100);
 await page.click('#viewSeg button[data-v="arrange"]'); await page.waitForTimeout(200);
 console.log('len', await page.evaluate(()=>window.__gb.P.len), 'meta', await page.textContent('#ws .meta'));
 console.log('secs', await page.locator('.arr-grid .sec').allTextContents());
 console.log('labs', await page.locator('.arr-grid .lab').allTextContents());
 const intros = await page.evaluate(()=>window.__gb.demos().map(d=>d.song.intro)); console.log('intros', intros.join(','));
 const evinfo = await page.evaluate(()=>{const d=window.__gb.current(); const r=window.__gb.buildEvents(d); const bar=240/d.bpm; const per={}; for(const e of r.ev){const b=Math.floor(e.t/bar); per[b]=(per[b]||0)+1;} return {dur:r.dur.toFixed(1), ranges:r.ranges.map(x=>x.map(v=>(v/bar).toFixed(0)).join('-')), bars:[0,7,8,24,104].map(b=>b+':'+(per[b]||0)).join(' ')};}); console.log('events', JSON.stringify(evinfo));
 // toggle kick off in first Hook
 const kickRow = (await page.locator('.arr-grid .lab').allTextContents()).indexOf('Kick');
 const before = await page.evaluate(()=>window.__gb.buildEvents(window.__gb.current()).ev.filter(e=>e.slot==='kick').length);
 const nsec = await page.locator('.arr-grid .sec').count();
 await page.locator('.arr-grid .blk').nth((kickRow-1)*nsec + 1).click(); await page.waitForTimeout(150);
 console.log('kick events', before, '->', await page.evaluate(()=>window.__gb.buildEvents(window.__gb.current()).ev.filter(e=>e.slot==='kick').length));
 // play from Verse
 await page.locator('.arr-grid .sec').nth(2).click(); await page.waitForTimeout(800);
 console.log('ph x', await page.locator('.arr-ph').evaluate(e=>getComputedStyle(e).getPropertyValue('--x')), 'display', await page.locator('.arr-ph').evaluate(e=>getComputedStyle(e).display));
 await page.screenshot({path:'shot7.png'});
 await page.click('#viewSeg button[data-v="pattern"]'); await page.waitForTimeout(500);
 console.log('pattern ph', await page.locator('.steps .c.ph').first().getAttribute('data-c').catch(()=>null));
 await page.selectOption('#genreSel','boombap'); await page.click('#genBtn'); await page.click('#viewSeg button[data-v="arrange"]');
 await page.selectOption('.gridbar select >> nth=0','short'); await page.waitForTimeout(150);
 console.log('short secs', await page.locator('.arr-grid .sec').allTextContents(), await page.textContent('.gridbar .gstat'));
 await page.click('#playBtn'); await page.waitForTimeout(50); if (await page.textContent('#playBtn')==='■') await page.click('#playBtn');
 // export one full song (render)
 const t=Date.now(); const ok = await page.evaluate(async()=>{ const d=window.__gb.current(); const r=await window.__gb.renderDemo(d); let pk=0; const x=r.getChannelData(0); for(let i=0;i<x.length;i+=7) pk=Math.max(pk,Math.abs(x[i])); return [r.duration.toFixed(1), pk.toFixed(2)]; }); console.log('render', ok, (Date.now()-t)+'ms');
 console.log(await page.evaluate(()=>window.__gb.notes(window.__gb.current())));
 await page.click('#lenSeg button[data-v="loop"]'); await page.waitForTimeout(150); console.log('back to loop', await page.textContent('#ws .meta'), await page.locator('#viewSeg button[aria-pressed="true"]').textContent());
 console.log('errors', errs); await b.close(); })();
